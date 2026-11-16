# InternalNotificationsUpdateTenantConfigRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**report_recipient_emails** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**report_schedules** | [**InternalNotificationsReportSchedulesConfig**](InternalNotificationsReportSchedulesConfig.md) |  | [optional] [default to undefined]
**stock_low_threshold** | **number** |  | [optional] [default to undefined]
**timezone** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { InternalNotificationsUpdateTenantConfigRequest } from 'dinosaurus-pos-api';

const instance: InternalNotificationsUpdateTenantConfigRequest = {
    report_recipient_emails,
    report_schedules,
    stock_low_threshold,
    timezone,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
