package shift

import (
	"dinosaurus-pos/internal/common"
	repository "dinosaurus-pos/internal/shift/repository"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/utils"
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *service) computeExpectedCashEnd(ctx context.Context, shift repository.Shift) (int64, error) {
	cashIn, err := s.repo.GetCashTotalByShiftIDAndType(ctx, repository.GetCashTotalByShiftIDAndTypeParams{
		ShiftID: shift.ID,
		Type:    repository.CashTransactionTypeCashIn,
	})
	if err != nil {
		return 0, err
	}
	cashOut, err := s.repo.GetCashTotalByShiftIDAndType(ctx, repository.GetCashTotalByShiftIDAndTypeParams{
		ShiftID: shift.ID,
		Type:    repository.CashTransactionTypeCashOut,
	})
	if err != nil {
		return 0, err
	}
	cashSales, err := s.repo.SumShiftCashSales(ctx, pgtype.UUID{Bytes: shift.ID, Valid: true})
	if err != nil {
		return 0, err
	}
	return shift.StartCash + cashIn - cashOut + cashSales, nil
}

type Service interface {
	StartShift(ctx context.Context, userID uuid.UUID, req StartShiftRequest) (*ShiftResponse, error)
	EndShift(ctx context.Context, userID uuid.UUID, req EndShiftRequest) (*ShiftResponse, error)
	GetOpenShift(ctx context.Context, userID uuid.UUID) (*ShiftResponse, error)
	CreateCashTransaction(ctx context.Context, userID uuid.UUID, req CashTransactionRequest) (*CashTransactionResponse, error)
	AutoCloseShifts(ctx context.Context) error
}

type service struct {
	repo  repository.Querier
	log   logger.ILogger
	cache *Cache
}

func NewService(repo repository.Querier, log logger.ILogger, cache *Cache) Service {
	return &service{
		repo:  repo,
		log:   log,
		cache: cache,
	}
}

func (s *service) StartShift(ctx context.Context, userID uuid.UUID, req StartShiftRequest) (*ShiftResponse, error) {
	// Verify user password
	passwordHash, err := s.repo.GetUserPasswordHash(ctx, userID)
	if err != nil {
		s.log.Errorf("StartShift | User not found or hash missing: %v", userID)
		return nil, common.ErrNotFound
	}

	if !utils.CheckPassword(passwordHash, req.Password) {
		s.log.Errorf("StartShift | Invalid password for user: %v", userID)
		return nil, common.ErrInvalidCredentials
	}

	// Check if user already has an open shift
	_, err = s.repo.GetOpenShiftByUserID(ctx, userID)
	if err == nil {
		s.log.Warnf("StartShift | User already has an open shift: userID=%v", userID)
		return nil, errors.New("user already has an open shift")
	}

	shift, err := s.repo.CreateShift(ctx, repository.CreateShiftParams{
		UserID:    userID,
		StartCash: req.StartCash,
	})
	if err != nil {
		s.log.Errorf("StartShift | Failed to create shift: %v, userID=%v", err, userID)
		return nil, err
	}

	// Update cache to reflect an open shift
	if s.cache != nil {
		s.cache.SetOpen(userID, true)
	}

	return s.mapShiftToResponse(shift), nil
}

func (s *service) EndShift(ctx context.Context, userID uuid.UUID, req EndShiftRequest) (*ShiftResponse, error) {
	// Verify user password
	passwordHash, err := s.repo.GetUserPasswordHash(ctx, userID)
	if err != nil {
		s.log.Errorf("EndShift | User not found or hash missing: %v", userID)
		return nil, common.ErrNotFound
	}

	if !utils.CheckPassword(passwordHash, req.Password) {
		s.log.Errorf("EndShift | Invalid password for user: %v", userID)
		return nil, common.ErrInvalidCredentials
	}

	// Get current open shift
	shift, err := s.repo.GetOpenShiftByUserID(ctx, userID)
	if err != nil {
		s.log.Warnf("EndShift | No open shift found: userID=%v", userID)
		return nil, errors.New("no open shift found")
	}

	expectedCashEnd, err := s.computeExpectedCashEnd(ctx, shift)
	if err != nil {
		s.log.Errorf("EndShift | Failed to compute expected cash: %v", err)
		return nil, err
	}

	updatedShift, err := s.repo.EndShift(ctx, repository.EndShiftParams{
		ID:              shift.ID,
		ExpectedCashEnd: &expectedCashEnd,
		ActualCashEnd:   &req.ActualCashEnd,
	})
	if err != nil {
		s.log.Errorf("EndShift | Failed to update shift: %v", err)
		return nil, err
	}

	res := s.mapShiftToResponse(updatedShift)

	diff := req.ActualCashEnd - expectedCashEnd
	res.Difference = &diff

	// Update cache (Clear)
	s.cache.Clear(userID)

	return res, nil
}

func (s *service) GetOpenShift(ctx context.Context, userID uuid.UUID) (*ShiftResponse, error) {
	shift, err := s.repo.GetOpenShiftByUserID(ctx, userID)
	if err != nil {
		if s.cache != nil {
			s.cache.SetOpen(userID, false)
		}
		return nil, common.ErrNotFound
	}

	if s.cache != nil {
		s.cache.SetOpen(userID, true)
	}

	return s.mapShiftToResponse(shift), nil
}

func (s *service) CreateCashTransaction(ctx context.Context, userID uuid.UUID, req CashTransactionRequest) (*CashTransactionResponse, error) {
	// Get current open shift
	shift, err := s.repo.GetOpenShiftByUserID(ctx, userID)
	if err != nil {
		s.log.Warnf("CreateCashTransaction | No open shift found: userID=%v", userID)
		return nil, errors.New("no open shift found")
	}

	tx, err := s.repo.CreateCashTransaction(ctx, repository.CreateCashTransactionParams{
		ShiftID:     shift.ID,
		UserID:      userID,
		Amount:      req.Amount,
		Type:        req.Type,
		Category:    req.Category,
		Description: &req.Description,
	})
	if err != nil {
		s.log.Errorf("CreateCashTransaction | Failed to create transaction: %v", err)
		return nil, err
	}

	return &CashTransactionResponse{
		ID:          tx.ID,
		ShiftID:     tx.ShiftID,
		UserID:      tx.UserID,
		Amount:      tx.Amount,
		Type:        tx.Type,
		Category:    tx.Category,
		Description: tx.Description,
		CreatedAt:   tx.CreatedAt.Time,
	}, nil
}

func (s *service) AutoCloseShifts(ctx context.Context) error {
	shifts, err := s.repo.GetOpenShifts(ctx)
	if err != nil {
		s.log.Errorf("AutoCloseShifts | Failed to get open shifts: %v", err)
		return err
	}

	for _, shift := range shifts {
		s.log.Infof("AutoCloseShifts | Closing shift %v for user %v", shift.ID, shift.UserID)

		expectedCashEnd, err := s.computeExpectedCashEnd(ctx, shift)
		if err != nil {
			s.log.Errorf("AutoCloseShifts | compute expected cash shift=%v: %v", shift.ID, err)
			continue
		}

		// For auto-close, we assume Actual = Expected to avoid difference.
		// Or we can just leave actual as nil? The schema allows nil.
		// But EndShift in repo sets actual_cash_end.
		_, endErr := s.repo.EndShift(ctx, repository.EndShiftParams{
			ID:              shift.ID,
			ExpectedCashEnd: &expectedCashEnd,
			ActualCashEnd:   &expectedCashEnd,
		})
		if endErr != nil {
			s.log.Errorf("AutoCloseShifts | Failed to close shift %v: %v", shift.ID, endErr)
			continue
		}

		// Update cache
		s.cache.Clear(shift.UserID)
	}

	return nil
}

func (s *service) mapShiftToResponse(shift repository.Shift) *ShiftResponse {
	var endTime *time.Time
	if shift.EndTime.Valid {
		t := shift.EndTime.Time
		endTime = &t
	}

	var expected *int64
	if shift.ExpectedCashEnd != nil {
		expected = shift.ExpectedCashEnd
	}

	var actual *int64
	if shift.ActualCashEnd != nil {
		actual = shift.ActualCashEnd
	}

	return &ShiftResponse{
		ID:              shift.ID,
		UserID:          shift.UserID,
		StartTime:       shift.StartTime.Time,
		EndTime:         endTime,
		StartCash:       shift.StartCash,
		ExpectedCashEnd: expected,
		ActualCashEnd:   actual,
		Status:          shift.Status,
	}
}
