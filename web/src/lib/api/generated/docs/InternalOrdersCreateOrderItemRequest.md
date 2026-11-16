# InternalOrdersCreateOrderItemRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**_options** | [**Array&lt;InternalOrdersCreateOrderItemOptionRequest&gt;**](InternalOrdersCreateOrderItemOptionRequest.md) |  | [optional] [default to undefined]
**product_id** | **string** |  | [default to undefined]
**product_unit_id** | **string** |  | [optional] [default to undefined]
**quantity** | **number** |  | [default to undefined]
**unit_price** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalOrdersCreateOrderItemRequest } from 'dinosaurus-pos-api';

const instance: InternalOrdersCreateOrderItemRequest = {
    _options,
    product_id,
    product_unit_id,
    quantity,
    unit_price,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
