package user

import (
	"POS-kasir/internal/activitylog"
	activitylog_repo "POS-kasir/internal/activitylog/repository"
	"POS-kasir/internal/common"
	"POS-kasir/internal/tenant"
	"POS-kasir/internal/tenants"
	user_repo "POS-kasir/internal/user/repository"
	"POS-kasir/pkg/logger"
	"POS-kasir/pkg/utils"
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AthService struct {
	UserRepo       user_repo.Querier
	Tenants        *tenants.Repository
	Log            logger.ILogger
	Token          utils.Manager
	AvatarRepo     IAthRepo
	ActivityLogger activitylog.IActivityService
}

func NewAuthService(userRepo user_repo.Querier, tenantsRepo *tenants.Repository, log logger.ILogger, tokenManager utils.Manager, avaRepo IAthRepo, actLog activitylog.IActivityService) IAuthService {
	return &AthService{
		UserRepo:       userRepo,
		Tenants:        tenantsRepo,
		Log:            log,
		Token:          tokenManager,
		AvatarRepo:     avaRepo,
		ActivityLogger: actLog,
	}
}

type IAuthService interface {
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	Register(ctx context.Context, req RegisterRequest) (*ProfileResponse, error)
	Profile(ctx context.Context, userID uuid.UUID) (*ProfileResponse, error)
	UploadAvatar(ctx context.Context, userID uuid.UUID, data []byte) (*ProfileResponse, error)
	UpdatePassword(ctx context.Context, userID uuid.UUID, req UpdatePasswordRequest) error
	RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error)
	SwitchTenant(ctx context.Context, userID uuid.UUID, tenantID uuid.UUID) (*LoginResponse, error)
}

func tenantSummaries(rows []tenants.Row) []TenantSummary {
	out := make([]TenantSummary, 0, len(rows))
	for _, r := range rows {
		out = append(out, TenantSummary{ID: r.ID, Code: r.Code, Name: r.Name})
	}
	return out
}

func defaultTenantRow() tenants.Row {
	return tenants.Row{
		ID:       tenant.DefaultTenantID,
		Code:     "default",
		Name:     "Default Store",
		IsActive: true,
	}
}

func (s *AthService) jwtRole(ctx context.Context, user user_repo.User, tenantID uuid.UUID) (string, error) {
	if user.Role == user_repo.UserRoleSuperAdmin {
		return string(user_repo.UserRoleSuperAdmin), nil
	}
	if s.Tenants == nil {
		return string(user.Role), nil
	}
	return s.Tenants.EffectiveRole(ctx, tenantID, user.ID)
}

func (s *AthService) resolveLoginTenant(ctx context.Context, user user_repo.User, tenantCode string) (tenants.Row, []TenantSummary, error) {
	code, err := tenant.NormalizeCode(tenantCode)
	if err != nil {
		return tenants.Row{}, nil, common.ErrInvalidInput
	}
	if s.Tenants == nil {
		def := defaultTenantRow()
		if code != def.Code {
			return tenants.Row{}, nil, common.ErrForbidden
		}
		return def, tenantSummaries([]tenants.Row{def}), nil
	}
	if user.Role == user_repo.UserRoleSuperAdmin {
		t, err := s.Tenants.GetByCode(ctx, code)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return tenants.Row{}, nil, tenants.ErrTenantNotFound
			}
			return tenants.Row{}, nil, err
		}
		all, err := s.Tenants.ListAll(ctx)
		if err != nil {
			return tenants.Row{}, nil, err
		}
		return t, tenantSummaries(all), nil
	}
	list, err := s.Tenants.ListForUser(ctx, user.ID)
	if err != nil {
		return tenants.Row{}, nil, err
	}
	summaries := tenantSummaries(list)
	t, err := s.Tenants.GetByCode(ctx, code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return tenants.Row{}, summaries, tenants.ErrTenantNotFound
		}
		return tenants.Row{}, summaries, err
	}
	ok, err := s.Tenants.UserHasTenant(ctx, user.ID, t.ID)
	if err != nil || !ok {
		return tenants.Row{}, summaries, common.ErrForbidden
	}
	return t, summaries, nil
}

func (s *AthService) buildLoginResponse(ctx context.Context, user user_repo.User, tenantRow tenants.Row, tenantList []TenantSummary, refreshToken string) (*LoginResponse, error) {
	jwtRole, err := s.jwtRole(ctx, user, tenantRow.ID)
	if err != nil {
		return nil, err
	}
	token, expiredAt, err := s.Token.GenerateToken(user.Username, user.Email, user.ID, jwtRole, tenantRow.ID)
	if err != nil {
		return nil, err
	}
	if refreshToken == "" {
		refreshToken, _, err = s.Token.GenerateRefreshToken(user.Username, user.Email, user.ID, jwtRole, tenantRow.ID)
		if err != nil {
			return nil, err
		}
		if err := s.UserRepo.UpdateRefreshToken(ctx, user_repo.UpdateRefreshTokenParams{
			ID:           user.ID,
			RefreshToken: &refreshToken,
		}); err != nil {
			return nil, err
		}
	}
	return &LoginResponse{
		ExpiredAt:    expiredAt,
		Token:        token,
		RefreshToken: refreshToken,
		Tenant:       TenantSummary{ID: tenantRow.ID, Code: tenantRow.Code, Name: tenantRow.Name},
		Tenants:      tenantList,
		Profile: ProfileResponse{
			ID:        user.ID,
			IsActive:  user.IsActive,
			Username:  user.Username,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Time,
			UpdatedAt: user.UpdatedAt.Time,
			Avatar:    user.Avatar,
			Role:      user_repo.UserRole(jwtRole),
			Tenant:    &TenantSummary{ID: tenantRow.ID, Code: tenantRow.Code, Name: tenantRow.Name},
			Tenants:   tenantList,
		},
	}, nil
}

func (s *AthService) Profile(ctx context.Context, userID uuid.UUID) (*ProfileResponse, error) {
	user, err := s.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, common.ErrNotFound
	}

	if user.Avatar != nil {
		avatarURL, err := s.AvatarRepo.AvatarLink(ctx, user.ID, *user.Avatar)
		if err != nil {
			switch {
			case errors.Is(err, common.ErrAvatarNotFound):
				s.Log.Errorf("Profile | Avatar not found for user: %v", userID)
				avatarURL = ""
			case errors.Is(err, common.ErrAvatarLink):
				s.Log.Errorf("Profile | Failed to generate avatar link for user: %v", userID)
				return nil, common.ErrAvatarLink
			default:
				s.Log.Errorf("Profile | Unexpected error while generating avatar link for user: %v: %v", userID, err)
			}
		}
		user.Avatar = &avatarURL
	} else {
		user.Avatar = nil
	}

	response := ProfileResponse{
		ID:        user.ID,
		IsActive:  user.IsActive,
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Time,
		UpdatedAt: user.UpdatedAt.Time,
		Avatar:    user.Avatar,
		Role:      user.Role,
	}

	if s.Tenants != nil {
		if rows, err := s.Tenants.ListForUser(ctx, userID); err == nil {
			response.Tenants = tenantSummaries(rows)
		}
	}
	if tid, ok := tenant.IDFromContext(ctx); ok {
		for _, t := range response.Tenants {
			if t.ID == tid {
				tc := t
				response.Tenant = &tc
				break
			}
		}
	}

	return &response, nil

}

func (s *AthService) UpdatePassword(ctx context.Context, userID uuid.UUID, req UpdatePasswordRequest) error {
	user, err := s.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		s.Log.Errorf("UpdatePassword | Failed to find user by ID: %v", userID)
		return common.ErrNotFound
	}

	if !utils.CheckPassword(user.PasswordHash, req.OldPassword) {
		s.Log.Errorf("UpdatePassword | Incorrect old password for user: %v", userID)
		return common.ErrInvalidCredentials
	}

	newPassHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		s.Log.Errorf("UpdatePassword | Failed to hash new password: %v", err)
		return common.ErrInvalidCredentials
	}

	params := user_repo.UpdateUserPasswordParams{
		ID:           userID,
		PasswordHash: newPassHash,
	}

	if err := s.UserRepo.UpdateUserPassword(ctx, params); err != nil {
		s.Log.Errorf("UpdatePassword | Failed to update user password: %v", err)
		return common.ErrInternal
	}

	actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID)
	if !ok {
		s.Log.Warnf("UpdatePassword | Actor user ID not found in context for activity logging")
	}

	logDetails := map[string]interface{}{
		"updated_username": user.Username,
		"updated_email":    user.Email,
		"updated_role":     user.Role,
	}

	s.ActivityLogger.Log(
		ctx,
		actorID,
		activitylog_repo.LogActionTypeUPDATEPASSWORD,
		activitylog_repo.LogEntityTypeUSER,
		user.ID.String(),
		logDetails,
	)

	return nil
}

func (s *AthService) UploadAvatar(ctx context.Context, userID uuid.UUID, data []byte) (*ProfileResponse, error) {

	const maxSize = 3 * 1024 * 1024
	if len(data) > maxSize {
		s.Log.Errorf("UploadAvatar | File size exceeds limit: %d bytes", len(data))
		return nil, common.ErrFileTooLarge
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		s.Log.Errorf("UploadAvatar | Failed to decode image: %v", err)
		return nil, common.ErrFileTypeNotSupported
	}
	bounds := img.Bounds()
	if bounds.Dx() != bounds.Dy() {
		s.Log.Errorf("UploadAvatar | Image is not square: %dx%d", bounds.Dx(), bounds.Dy())
		return nil, common.ErrImageNotSquare
	}

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 75})
	if err != nil {
		s.Log.Errorf("UploadAvatar | Failed to encode image: %v", err)
		return nil, common.ErrImageProcessingFailed
	}

	filename := "avatars/" + userID.String() + ".jpg"

	url, err := s.AvatarRepo.UploadAvatar(ctx, filename, buf.Bytes())
	if err != nil {
		s.Log.Errorf("UploadAvatar | Failed to upload avatar: %v", err)
		return nil, common.ErrUploadFailed
	}

	params := user_repo.UpdateUserParams{
		ID:     userID,
		Avatar: &filename,
	}
	profile, err := s.UserRepo.UpdateUser(ctx, params)
	if err != nil {
		s.Log.Errorf("UploadAvatar | Failed to update user avatar: %v", err)
		return nil, common.ErrUploadFailed
	}

	s.Log.Infof("UploadAvatar | profile updated successfully: %v", profile.Username)

	actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID)
	if !ok {
		s.Log.Warnf("UploadAvatar | Actor user ID not found in context for activity logging")
	}
	logDetails := map[string]interface{}{
		"updated_username": profile.Username,
		"updated_email":    profile.Email,
		"updated_role":     profile.Role,
		"updated_avatar":   url,
	}
	s.ActivityLogger.Log(
		ctx,
		actorID,
		activitylog_repo.LogActionTypeUPDATEAVATAR,
		activitylog_repo.LogEntityTypeUSER,
		profile.ID.String(),
		logDetails,
	)

	return &ProfileResponse{
		ID:        profile.ID,
		IsActive:  profile.IsActive,
		Username:  profile.Username,
		Email:     profile.Email,
		Avatar:    &url,
		CreatedAt: profile.CreatedAt.Time,
		UpdatedAt: profile.UpdatedAt.Time,
		Role:      profile.Role,
	}, nil
}

func (s *AthService) Register(ctx context.Context, req RegisterRequest) (*ProfileResponse, error) {

	if _, err := s.UserRepo.GetUserByEmail(ctx, req.Email); err == nil {
		return nil, common.ErrEmailExists
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("failed check email existence: %w", err)
	}

	if _, err := s.UserRepo.GetUserByUsername(ctx, req.Username); err == nil {
		return nil, common.ErrUsernameExists
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("failed check username existence: %w", err)
	}

	userUUID, err := uuid.NewV7()
	if err != nil {
		s.Log.Errorf("Register | Failed to create user UUID: %v", err)
		return nil, err
	}

	passHash, err := utils.HashPassword(req.Password)
	if err != nil {
		s.Log.Errorf("Register | Failed to hash password: %v", err)
		return nil, common.ErrInvalidInput
	}

	params := user_repo.CreateUserParams{
		ID:           userUUID,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: passHash,
		Avatar:       nil,
		Role:         user_repo.UserRole(req.Role),
	}

	user, err := s.UserRepo.CreateUser(ctx, params)
	if err != nil {
		s.Log.Errorf("Register | Failed to create user: %v", err)
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			return nil, common.ErrNotFound
		case errors.Is(err, common.ErrUserExists):
			return nil, common.ErrUserExists
		default:
			return nil, common.ErrInternal
		}
	}

	if s.Tenants != nil {
		if err := s.Tenants.AddUserToDefaultTenant(ctx, user.ID); err != nil {
			s.Log.Errorf("Register | Failed to assign default tenant: %v", err)
			return nil, common.ErrInternal
		}
	}

	actorID, ok := ctx.Value(common.UserIDKey).(uuid.UUID)
	if !ok {
		s.Log.Warnf("Register | Actor user ID not found in context for activity logging")
	}

	logDetails := map[string]interface{}{
		"created_username": user.Username,
		"created_email":    user.Email,
		"created_role":     user.Role,
	}

	s.ActivityLogger.Log(
		ctx,
		actorID,
		activitylog_repo.LogActionTypeCREATE,
		activitylog_repo.LogEntityTypeUSER,
		user.ID.String(),
		logDetails,
	)

	return &ProfileResponse{
		ID:        user.ID,
		IsActive:  user.IsActive,
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Time,
		UpdatedAt: user.UpdatedAt.Time,
		Avatar:    user.Avatar,
		Role:      user.Role,
	}, nil
}

func (s *AthService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	normalizedCode, err := tenant.NormalizeCode(req.TenantCode)
	if err != nil {
		return nil, common.ErrInvalidInput
	}
	req.TenantCode = normalizedCode

	user, err := s.UserRepo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			s.Log.Errorf("Login | Failed to find user by email 1: %v", req.Email)
			return nil, common.ErrNotFound
		default:
			s.Log.Errorf("Login | Failed to find user by email 2: %v", req.Email)
			return nil, common.ErrInvalidCredentials
		}
	}

	logDetails := map[string]interface{}{
		"login_username": user.Username,
		"login_email":    user.Email,
		"login_role":     user.Role,
	}

	pass := utils.CheckPassword(user.PasswordHash, req.Password)
	if !pass {
		s.Log.Errorf("Login | Failed to find user by email: %v", req.Email)
		s.ActivityLogger.Log(
			ctx,
			user.ID,
			activitylog_repo.LogActionTypeLOGINFAILED,
			activitylog_repo.LogEntityTypeUSER,
			user.ID.String(),
			logDetails,
		)
		return nil, common.ErrInvalidCredentials
	}

	tenantRow, tenantList, err := s.resolveLoginTenant(ctx, user, req.TenantCode)
	if err != nil {
		s.Log.Errorf("Login | Tenant resolve failed: %v", err)
		return nil, err
	}

	logCtx := tenant.WithID(ctx, tenantRow.ID)
	s.ActivityLogger.Log(
		logCtx,
		user.ID,
		activitylog_repo.LogActionTypeLOGINSUCCESS,
		activitylog_repo.LogEntityTypeUSER,
		user.ID.String(),
		logDetails,
	)

	resp, err := s.buildLoginResponse(ctx, user, tenantRow, tenantList, "")
	if err != nil {
		s.Log.Errorf("Login | Failed to issue tokens: %v", err)
		return nil, common.ErrInternal
	}
	return resp, nil
}

func (s *AthService) RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error) {
	claims, err := s.Token.VerifyToken(refreshToken)
	if err != nil {
		s.Log.Errorf("RefreshToken | Invalid token: %v", err)
		return nil, common.ErrUnauthorized
	}

	if claims.Type != "refresh" {
		s.Log.Errorf("RefreshToken | Invalid token type: %v", claims.Type)
		return nil, common.ErrUnauthorized
	}

	user, err := s.UserRepo.GetUserByID(ctx, claims.UserID)
	if err != nil {
		s.Log.Errorf("RefreshToken | User not found: %v", claims.UserID)
		return nil, common.ErrUnauthorized
	}

	if user.RefreshToken == nil || *user.RefreshToken != refreshToken {
		s.Log.Errorf("RefreshToken | Token mismatch or revoked for user: %v", claims.UserID)
		return nil, common.ErrUnauthorized
	}

	tenantID := claims.TenantID
	if tenantID == uuid.Nil {
		tenantID = tenant.DefaultTenantID
	}

	var tenantRow tenants.Row
	var list []tenants.Row
	if s.Tenants == nil {
		tenantRow = defaultTenantRow()
		list = []tenants.Row{tenantRow}
	} else if user.Role == user_repo.UserRoleSuperAdmin {
		var err error
		tenantRow, err = s.Tenants.GetByID(ctx, tenantID)
		if err != nil {
			return nil, common.ErrForbidden
		}
		list, err = s.Tenants.ListAll(ctx)
		if err != nil {
			return nil, common.ErrInternal
		}
	} else {
		ok, err := s.Tenants.UserHasTenant(ctx, user.ID, tenantID)
		if err != nil || !ok {
			return nil, common.ErrForbidden
		}
		list, err = s.Tenants.ListForUser(ctx, user.ID)
		if err != nil {
			return nil, common.ErrInternal
		}
		for _, r := range list {
			if r.ID == tenantID {
				tenantRow = r
				break
			}
		}
		if tenantRow.ID == uuid.Nil {
			return nil, common.ErrForbidden
		}
	}

	return s.buildLoginResponse(ctx, user, tenantRow, tenantSummaries(list), "")
}

func (s *AthService) SwitchTenant(ctx context.Context, userID, tenantID uuid.UUID) (*LoginResponse, error) {
	if s.Tenants == nil {
		return nil, common.ErrForbidden
	}
	user, err := s.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, common.ErrUnauthorized
	}
	var tenantRow tenants.Row
	var list []tenants.Row
	if user.Role == user_repo.UserRoleSuperAdmin {
		tenantRow, err = s.Tenants.GetByID(ctx, tenantID)
		if err != nil {
			return nil, common.ErrForbidden
		}
		list, err = s.Tenants.ListAll(ctx)
		if err != nil {
			return nil, common.ErrInternal
		}
	} else {
		ok, err := s.Tenants.UserHasTenant(ctx, userID, tenantID)
		if err != nil || !ok {
			return nil, common.ErrForbidden
		}
		list, err = s.Tenants.ListForUser(ctx, userID)
		if err != nil {
			return nil, common.ErrInternal
		}
		for _, r := range list {
			if r.ID == tenantID {
				tenantRow = r
				break
			}
		}
		if tenantRow.ID == uuid.Nil {
			return nil, common.ErrForbidden
		}
	}
	return s.buildLoginResponse(ctx, user, tenantRow, tenantSummaries(list), "")
}
