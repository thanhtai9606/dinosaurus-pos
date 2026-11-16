# InternalSettingsUpdateFinancialSettingsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**currency** | **string** |  | [default to undefined]
**pos_quick_cash** | [**InternalSettingsQuickCashSettings**](InternalSettingsQuickCashSettings.md) |  | [optional] [default to undefined]
**service_charge_rate** | **number** |  | [optional] [default to undefined]
**tax_enabled** | **boolean** |  | [default to undefined]
**tax_rate** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalSettingsUpdateFinancialSettingsRequest } from 'dinosaurus-pos-api';

const instance: InternalSettingsUpdateFinancialSettingsRequest = {
    currency,
    pos_quick_cash,
    service_charge_rate,
    tax_enabled,
    tax_rate,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
