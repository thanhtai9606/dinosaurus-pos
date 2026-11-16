# NotificationsApi

All URIs are relative to *http://localhost:8080/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**notificationChannelsGet**](#notificationchannelsget) | **GET** /notification-channels | List notification channels|
|[**notificationChannelsIdDelete**](#notificationchannelsiddelete) | **DELETE** /notification-channels/{id} | Delete notification channel|
|[**notificationChannelsIdPut**](#notificationchannelsidput) | **PUT** /notification-channels/{id} | Update notification channel|
|[**notificationChannelsIdTestPost**](#notificationchannelsidtestpost) | **POST** /notification-channels/{id}/test | Send test notification|
|[**notificationChannelsPost**](#notificationchannelspost) | **POST** /notification-channels | Create notification channel|
|[**notificationDeliveriesGet**](#notificationdeliveriesget) | **GET** /notification-deliveries | Notification delivery log|
|[**notificationDevicesDelete**](#notificationdevicesdelete) | **DELETE** /notification-devices | Unregister FCM device token|
|[**notificationDevicesRegisterPost**](#notificationdevicesregisterpost) | **POST** /notification-devices/register | Register FCM device token|
|[**notificationEventTypesGet**](#notificationeventtypesget) | **GET** /notification-event-types | List notification event types|
|[**notificationSubscriptionsMeGet**](#notificationsubscriptionsmeget) | **GET** /notification-subscriptions/me | My notification subscriptions|
|[**notificationSubscriptionsMePut**](#notificationsubscriptionsmeput) | **PUT** /notification-subscriptions/me | Update my notification subscriptions|
|[**notificationsConfigGet**](#notificationsconfigget) | **GET** /notifications/config | Notification tenant settings|
|[**notificationsConfigPut**](#notificationsconfigput) | **PUT** /notifications/config | Update notification tenant settings|
|[**notificationsReportsTestPost**](#notificationsreportstestpost) | **POST** /notifications/reports/test | Send test scheduled report email|

# **notificationChannelsGet**
> DinosaurusPosInternalCommonSuccessResponse notificationChannelsGet()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationChannelsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationChannelsIdDelete**
> DinosaurusPosInternalCommonSuccessResponse notificationChannelsIdDelete()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let id: string; //channel ID (default to undefined)

const { status, data } = await apiInstance.notificationChannelsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | channel ID | defaults to undefined|


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationChannelsIdPut**
> DinosaurusPosInternalCommonSuccessResponse notificationChannelsIdPut(body)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    InternalNotificationsUpdateChannelRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let id: string; //channel ID (default to undefined)
let body: InternalNotificationsUpdateChannelRequest; //channel

const { status, data } = await apiInstance.notificationChannelsIdPut(
    id,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **InternalNotificationsUpdateChannelRequest**| channel | |
| **id** | [**string**] | channel ID | defaults to undefined|


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationChannelsIdTestPost**
> DinosaurusPosInternalCommonSuccessResponse notificationChannelsIdTestPost()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let id: string; //channel ID (default to undefined)

const { status, data } = await apiInstance.notificationChannelsIdTestPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | channel ID | defaults to undefined|


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationChannelsPost**
> DinosaurusPosInternalCommonSuccessResponse notificationChannelsPost(body)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    InternalNotificationsCreateChannelRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let body: InternalNotificationsCreateChannelRequest; //channel

const { status, data } = await apiInstance.notificationChannelsPost(
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **InternalNotificationsCreateChannelRequest**| channel | |


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationDeliveriesGet**
> DinosaurusPosInternalCommonSuccessResponse notificationDeliveriesGet()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationDeliveriesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationDevicesDelete**
> DinosaurusPosInternalCommonSuccessResponse notificationDevicesDelete()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationDevicesDelete();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationDevicesRegisterPost**
> DinosaurusPosInternalCommonSuccessResponse notificationDevicesRegisterPost()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationDevicesRegisterPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationEventTypesGet**
> DinosaurusPosInternalCommonSuccessResponse notificationEventTypesGet()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationEventTypesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationSubscriptionsMeGet**
> DinosaurusPosInternalCommonSuccessResponse notificationSubscriptionsMeGet()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationSubscriptionsMeGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationSubscriptionsMePut**
> DinosaurusPosInternalCommonSuccessResponse notificationSubscriptionsMePut(body)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    InternalNotificationsUpdateSubscriptionsRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let body: InternalNotificationsUpdateSubscriptionsRequest; //items

const { status, data } = await apiInstance.notificationSubscriptionsMePut(
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **InternalNotificationsUpdateSubscriptionsRequest**| items | |


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationsConfigGet**
> DinosaurusPosInternalCommonSuccessResponse notificationsConfigGet()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.notificationsConfigGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationsConfigPut**
> DinosaurusPosInternalCommonSuccessResponse notificationsConfigPut(body)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    InternalNotificationsUpdateTenantConfigRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let body: InternalNotificationsUpdateTenantConfigRequest; //config

const { status, data } = await apiInstance.notificationsConfigPut(
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **InternalNotificationsUpdateTenantConfigRequest**| config | |


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **notificationsReportsTestPost**
> DinosaurusPosInternalCommonSuccessResponse notificationsReportsTestPost()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let period: string; //daily|monthly|yearly (default to undefined)

const { status, data } = await apiInstance.notificationsReportsTestPost(
    period
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **period** | [**string**] | daily|monthly|yearly | defaults to undefined|


### Return type

**DinosaurusPosInternalCommonSuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

