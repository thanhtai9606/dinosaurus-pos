# InternalSettingsFinancialSettingsResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**available_currencies** | [**Array&lt;InternalSettingsCurrencyOption&gt;**](InternalSettingsCurrencyOption.md) |  | [optional] [default to undefined]
**currency** | **string** |  | [optional] [default to undefined]
**pos_quick_cash** | [**InternalSettingsQuickCashSettings**](InternalSettingsQuickCashSettings.md) |  | [optional] [default to undefined]
**service_charge_rate** | **number** |  | [optional] [default to undefined]
**tax_enabled** | **boolean** |  | [optional] [default to undefined]
**tax_rate** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalSettingsFinancialSettingsResponse } from 'dinosaurus-pos-api';

const instance: InternalSettingsFinancialSettingsResponse = {
    available_currencies,
    currency,
    pos_quick_cash,
    service_charge_rate,
    tax_enabled,
    tax_rate,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
