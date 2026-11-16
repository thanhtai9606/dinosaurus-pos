/**
 * Stable UI-facing names for OpenAPI types (module `dinosaurus-pos`).
 * Prefer importing enums/errors/pagination from here instead of long generated names.
 */

/** Type-only shapes from OpenAPI (no runtime export in generated client). */
export type {
    DinosaurusPosInternalCommonErrorResponse as ApiErrorBody,
    DinosaurusPosInternalCommonPaginationPagination as ApiPagination,
    DinosaurusPosInternalCommonSuccessResponse as ApiSuccessBody,
} from './generated'

/** Runtime enums / const objects from generated client. */
export {
    DinosaurusPosInternalUserRepositoryUserRole as UserRole,
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