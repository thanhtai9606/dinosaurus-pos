# InternalOrdersCreateOrderRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**customer_id** | **string** |  | [optional] [default to undefined]
**dining_table_id** | **string** |  | [optional] [default to undefined]
**discount_amount** | **number** |  | [optional] [default to undefined]
**items** | [**Array&lt;InternalOrdersCreateOrderItemRequest&gt;**](InternalOrdersCreateOrderItemRequest.md) |  | [default to undefined]
**type** | [**DinosaurusPosInternalOrdersRepositoryOrderType**](DinosaurusPosInternalOrdersRepositoryOrderType.md) |  | [default to undefined]

## Example

```typescript
import { InternalOrdersCreateOrderRequest } from 'dinosaurus-pos-api';

const instance: InternalOrdersCreateOrderRequest = {
    customer_id,
    dining_table_id,
    discount_amount,
    items,
    type,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
