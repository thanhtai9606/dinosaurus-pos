package notifications

import (
	"context"
	"fmt"
	"strings"
	"time"

	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/report"
	notif_repo "dinosaurus-pos/internal/notifications/repository"
	"dinosaurus-pos/internal/tenant"

	"github.com/jackc/pgx/v5"
)

func (s *Service) buildReportEmail(ctx context.Context, period notif_repo.NotificationReportPeriod, loc *time.Location) (eventType, subject, body string, periodKey string, err error) {
	now := time.Now().In(loc)
	var start, end time.Time
	switch period {
	case notif_repo.NotificationReportPeriodDaily:
		eventType = EventReportDaily
		end = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		start = end.Add(-24 * time.Hour)
		periodKey = start.Format("2006-01-02")
		subject = fmt.Sprintf("Báo cáo ngày %s", periodKey)
	case notif_repo.NotificationReportPeriodMonthly:
		eventType = EventReportMonthly
		firstThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		end = firstThisMonth
		start = firstThisMonth.AddDate(0, -1, 0)
		periodKey = start.Format("2006-01")
		subject = fmt.Sprintf("Báo cáo tháng %s", periodKey)
	case notif_repo.NotificationReportPeriodYearly:
		eventType = EventReportYearly
		firstThisYear := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, loc)
		end = firstThisYear
		start = firstThisYear.AddDate(-1, 0, 0)
		periodKey = start.Format("2006")
		subject = fmt.Sprintf("Báo cáo năm %s", periodKey)
	default:
		return "", "", "", "", fmt.Errorf("unknown period")
	}

	if s.reportService == nil {
		body = fmt.Sprintf("Kỳ báo cáo: %s — %s\n(Dịch vụ báo cáo chưa khả dụng)", start.Format("02/01/2006"), end.Add(-time.Second).Format("02/01/2006"))
		return eventType, subject, body, periodKey, nil
	}

	req := &report.SalesReportServiceRequest{
		PaginationRequest: pagination.PaginationRequest{Page: 1, Limit: 1},
		StartDate:         start,
		EndDate:           end.Add(-time.Second),
	}
	summary, err := s.reportService.GetDashboardSummary(ctx, req)
	if err != nil {
		return "", "", "", "", err
	}
	sales, _ := s.reportService.GetSalesReports(ctx, req)
	var lines []string
	lines = append(lines, subject)
	lines = append(lines, fmt.Sprintf("Từ %s đến %s", start.Format("02/01/2006"), end.Add(-time.Second).Format("02/01/2006")))
	lines = append(lines, "")
	lines = append(lines, fmt.Sprintf("Tổng doanh thu: %.0f", summary.TotalSales))
	lines = append(lines, fmt.Sprintf("Số đơn: %d", summary.TotalOrders))
	lines = append(lines, fmt.Sprintf("Thu ngân hoạt động: %d", summary.UniqueCashier))
	if sales != nil {
		for _, row := range *sales {
			lines = append(lines, fmt.Sprintf("- %s: %d đơn, %.0f", row.Date.Format("02/01/2006"), row.OrderCount, row.TotalSales))
		}
	}
	body = strings.Join(lines, "\n")
	return eventType, subject, body, periodKey, nil
}

func (s *Service) trySendTenantReport(ctx context.Context, period notif_repo.NotificationReportPeriod, slot ReportScheduleSlot, loc *time.Location) {
	cfg, err := s.loadTenantConfigStruct(ctx)
	if err != nil {
		return
	}
	if !slot.Enabled {
		return
	}
	now := time.Now().In(loc)
	if !reportSlotMatches(now, period, slot) {
		return
	}

	eventType, subject, body, periodKey, err := s.buildReportEmail(ctx, period, loc)
	if err != nil {
		s.log.Warnf("notifications: report build failed: %v", err)
		return
	}
	_, err = s.repo.InsertNotificationReportRun(ctx, notif_repo.InsertNotificationReportRunParams{
		Period:    period,
		PeriodKey: periodKey,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			return
		}
		s.log.Warnf("notifications: report idempotency: %v", err)
		return
	}

	channels, err := s.repo.ListEnabledEmailChannels(ctx)
	if err != nil || len(channels) == 0 {
		tid, _ := tenant.IDFromContext(ctx)
		s.log.Warnf("notifications: no email channel for report tenant=%v", tid)
		return
	}
	emailCh := channels[0]
	recipients := cfg.ReportRecipientEmails
	for _, em := range recipients {
		em = strings.TrimSpace(em)
		if em == "" {
			continue
		}
		if sendErr := s.dispatcher.SendDirectEmail(ctx, emailCh, em, subject, body); sendErr != nil {
			s.log.Warnf("notifications: report email to %s failed: %v", em, sendErr)
		}
	}
	s.dispatcher.Publish(ctx, DispatchEvent{EventType: eventType, Subject: subject, Body: body})
}

func reportSlotMatches(now time.Time, period notif_repo.NotificationReportPeriod, slot ReportScheduleSlot) bool {
	if now.Hour() != slot.Hour || now.Minute() < slot.Minute || now.Minute() >= slot.Minute+15 {
		return false
	}
	switch period {
	case notif_repo.NotificationReportPeriodDaily:
		return true
	case notif_repo.NotificationReportPeriodMonthly:
		day := slot.Day
		if day <= 0 {
			day = 1
		}
		return now.Day() == day
	case notif_repo.NotificationReportPeriodYearly:
		month := slot.Month
		day := slot.Day
		if month <= 0 {
			month = 1
		}
		if day <= 0 {
			day = 1
		}
		return int(now.Month()) == month && now.Day() == day
	}
	return false
}

func (s *Service) RunScheduledReports(ctx context.Context) {
	if s.tenantLister == nil {
		return
	}
	tenantIDs, err := s.tenantLister.ListActiveTenantIDs(ctx)
	if err != nil {
		s.log.Warnf("notifications: list tenants for reports: %v", err)
		return
	}
	for _, tid := range tenantIDs {
		tctx := tenant.WithID(ctx, tid)
		cfg, err := s.loadTenantConfigStruct(tctx)
		if err != nil {
			cfg = DefaultTenantNotificationConfig()
		}
		cfg.Normalize()
		loc, err := time.LoadLocation(cfg.Timezone)
		if err != nil {
			loc = time.FixedZone("VN", 7*3600)
		}
		s.trySendTenantReport(tctx, notif_repo.NotificationReportPeriodDaily, cfg.ReportSchedules.Daily, loc)
		s.trySendTenantReport(tctx, notif_repo.NotificationReportPeriodMonthly, cfg.ReportSchedules.Monthly, loc)
		s.trySendTenantReport(tctx, notif_repo.NotificationReportPeriodYearly, cfg.ReportSchedules.Yearly, loc)
	}
}

func (s *Service) TestReportEmail(ctx context.Context, period string) error {
	cfg, err := s.loadTenantConfigStruct(ctx)
	if err != nil {
		cfg = DefaultTenantNotificationConfig()
	}
	cfg.Normalize()
	loc, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		loc = time.FixedZone("VN", 7*3600)
	}
	var rp notif_repo.NotificationReportPeriod
	switch period {
	case "daily":
		rp = notif_repo.NotificationReportPeriodDaily
	case "monthly":
		rp = notif_repo.NotificationReportPeriodMonthly
	case "yearly":
		rp = notif_repo.NotificationReportPeriodYearly
	default:
		return fmt.Errorf("invalid period")
	}
	_, subject, body, _, err := s.buildReportEmail(ctx, rp, loc)
	if err != nil {
		return err
	}
	channels, err := s.repo.ListEnabledEmailChannels(ctx)
	if err != nil || len(channels) == 0 {
		return fmt.Errorf("no enabled email channel")
	}
	sent := false
	for _, em := range cfg.ReportRecipientEmails {
		em = strings.TrimSpace(em)
		if em == "" {
			continue
		}
		if err := s.dispatcher.SendDirectEmail(ctx, channels[0], em, subject, body); err != nil {
			return err
		}
		sent = true
	}
	if !sent {
		return fmt.Errorf("no report_recipient_emails configured")
	}
	return nil
}