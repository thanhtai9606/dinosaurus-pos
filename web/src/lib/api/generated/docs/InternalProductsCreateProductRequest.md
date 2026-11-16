# InternalProductsCreateProductRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**barcode** | **string** |  | [optional] [default to undefined]
**category_ids** | **Array&lt;number&gt;** |  | [optional] [default to undefined]
**cost_price** | **number** |  | [default to undefined]
**default_supplier_id** | **string** |  | [optional] [default to undefined]
**min_stock** | **number** |  | [optional] [default to undefined]
**name** | **string** |  | [default to undefined]
**_options** | [**Array&lt;InternalProductsCreateProductOptionRequest&gt;**](InternalProductsCreateProductOptionRequest.md) |  | [optional] [default to undefined]
**price** | **number** |  | [default to undefined]
**sku** | **string** |  | [optional] [default to undefined]
**stock** | **number** |  | [default to undefined]
**unit** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalProductsCreateProductRequest } from 'dinosaurus-pos-api';

const instance: InternalProductsCreateProductRequest = {
    barcode,
    category_ids,
    cost_price,
    default_supplier_id,
    min_stock,
    name,
    _options,
    price,
    sku,
    stock,
    unit,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
