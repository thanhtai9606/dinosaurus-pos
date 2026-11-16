/**
 * Stable UI-facing names for OpenAPI types (module `dinosaurus-pos`).
 * Prefer importing enums/errors/pagination from here instead of long generated names.
 */
export {
    DinosaurusPosInternalCommonErrorResponse as ApiErrorBody,
    ApiPagination as ApiPagination,
    DinosaurusPosInternalCommonSuccessResponse as ApiSuccessBody,
    UserRole as UserRole,
    DinosaurusPosInternalOrdersRepositoryOrderType as OrderType,
    DinosaurusPosInternalOrdersRepositoryOrderStatus as OrderStatus,
    DinosaurusPosInternalPromotionsRepositoryDiscountType as DiscountType,
    DinosaurusPosInternalPromotionsRepositoryPromotionScope as PromotionScope,
    DinosaurusPosInternalPromotionsRepositoryPromotionRuleType as PromotionRuleType,
    DinosaurusPosInternalPromotionsRepositoryPromotionTargetType as PromotionTargetType,
    DinosaurusPosInternalShiftRepositoryShiftStatus as ShiftStatus,
    DinosaurusPosInternalShiftRepositoryCashTransactionType as CashTransactionType,
    DinosaurusPosInternalActivityLogRepositoryLogActionType as LogActionType,
    DinosaurusPosInternalActivityLogRepositoryLogEntityType as LogEntityType,
} from './generated'