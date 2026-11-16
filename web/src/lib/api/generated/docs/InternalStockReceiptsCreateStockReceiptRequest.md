# InternalStockReceiptsCreateStockReceiptRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**amount_paid** | **number** |  | [optional] [default to undefined]
**items** | [**Array&lt;InternalStockReceiptsReceiptItemInput&gt;**](InternalStockReceiptsReceiptItemInput.md) |  | [default to undefined]
**note** | **string** |  | [optional] [default to undefined]
**payment_mode** | **string** |  | [optional] [default to undefined]
**received_at** | **string** |  | [optional] [default to undefined]
**supplier_id** | **string** |  | [optional] [default to undefined]
**warehouse_id** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalStockReceiptsCreateStockReceiptRequest } from 'dinosaurus-pos-api';

const instance: InternalStockReceiptsCreateStockReceiptRequest = {
    amount_paid,
    items,
    note,
    payment_mode,
    received_at,
    supplier_id,
    warehouse_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
