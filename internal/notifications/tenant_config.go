package notifications

type ReportScheduleSlot struct {
	Enabled bool `json:"enabled"`
	Hour    int  `json:"hour"`
	Minute  int  `json:"minute"`
	Day     int  `json:"day,omitempty"`
	Month   int  `json:"month,omitempty"`
}

type ReportSchedulesConfig struct {
	Daily   ReportScheduleSlot `json:"daily"`
	Monthly ReportScheduleSlot `json:"monthly"`
	Yearly  ReportScheduleSlot `json:"yearly"`
}

type TenantNotificationConfig struct {
	StockLowThreshold     int                   `json:"stock_low_threshold"`
	Timezone              string                `json:"timezone"`
	ReportSchedules       ReportSchedulesConfig `json:"report_schedules"`
	ReportRecipientEmails []string              `json:"report_recipient_emails"`
}

func DefaultTenantNotificationConfig() TenantNotificationConfig {
	return TenantNotificationConfig{
		StockLowThreshold: 5,
		Timezone:          "Asia/Ho_Chi_Minh",
		ReportSchedules: ReportSchedulesConfig{
			Daily:   ReportScheduleSlot{Enabled: false, Hour: 6, Minute: 0},
			Monthly: ReportScheduleSlot{Enabled: false, Day: 1, Hour: 7, Minute: 0},
			Yearly:  ReportScheduleSlot{Enabled: false, Month: 1, Day: 1, Hour: 8, Minute: 0},
		},
		ReportRecipientEmails: nil,
	}
}

func (c *TenantNotificationConfig) Normalize() {
	def := DefaultTenantNotificationConfig()
	if c.StockLowThreshold <= 0 {
		c.StockLowThreshold = def.StockLowThreshold
	}
	if c.Timezone == "" {
		c.Timezone = def.Timezone
	}
	if c.ReportSchedules.Daily.Hour == 0 && c.ReportSchedules.Daily.Minute == 0 && !c.ReportSchedules.Daily.Enabled {
		c.ReportSchedules.Daily.Hour = def.ReportSchedules.Daily.Hour
	}
	if c.ReportSchedules.Monthly.Day == 0 {
		c.ReportSchedules.Monthly.Day = def.ReportSchedules.Monthly.Day
	}
	if c.ReportSchedules.Monthly.Hour == 0 && c.ReportSchedules.Monthly.Minute == 0 {
		c.ReportSchedules.Monthly.Hour = def.ReportSchedules.Monthly.Hour
	}
	if c.ReportSchedules.Yearly.Month == 0 {
		c.ReportSchedules.Yearly.Month = def.ReportSchedules.Yearly.Month
		c.ReportSchedules.Yearly.Day = def.ReportSchedules.Yearly.Day
		c.ReportSchedules.Yearly.Hour = def.ReportSchedules.Yearly.Hour
	}
}