# InternalUserProfileResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**avatar** | **string** |  | [optional] [default to undefined]
**created_at** | **string** |  | [optional] [default to undefined]
**deleted_at** | **string** |  | [optional] [default to undefined]
**email** | **string** |  | [optional] [default to undefined]
**id** | **string** |  | [optional] [default to undefined]
**is_active** | **boolean** |  | [optional] [default to undefined]
**role** | [**DinosaurusPosInternalUserRepositoryUserRole**](DinosaurusPosInternalUserRepositoryUserRole.md) |  | [optional] [default to undefined]
**tenant** | [**InternalUserTenantSummary**](InternalUserTenantSummary.md) |  | [optional] [default to undefined]
**tenants** | [**Array&lt;InternalUserTenantSummary&gt;**](InternalUserTenantSummary.md) |  | [optional] [default to undefined]
**updated_at** | **string** |  | [optional] [default to undefined]
**username** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalUserProfileResponse } from 'dinosaurus-pos-api';

const instance: InternalUserProfileResponse = {
    avatar,
    created_at,
    deleted_at,
    email,
    id,
    is_active,
    role,
    tenant,
    tenants,
    updated_at,
    username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
