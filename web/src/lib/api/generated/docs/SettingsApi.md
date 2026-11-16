# SettingsApi

All URIs are relative to *http://localhost:8080/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**settingsBrandingGet**](#settingsbrandingget) | **GET** /settings/branding | Get branding settings|
|[**settingsBrandingLogoPost**](#settingsbrandinglogopost) | **POST** /settings/branding/logo | Update app logo|
|[**settingsBrandingPut**](#settingsbrandingput) | **PUT** /settings/branding | Update branding settings|
|[**settingsFinancialCurrenciesPut**](#settingsfinancialcurrenciesput) | **PUT** /settings/financial/currencies | Update supported currencies|
|[**settingsFinancialGet**](#settingsfinancialget) | **GET** /settings/financial | Get financial settings|
|[**settingsFinancialPut**](#settingsfinancialput) | **PUT** /settings/financial | Update financial settings|
|[**settingsInvoiceGet**](#settingsinvoiceget) | **GET** /settings/invoice | Get invoice settings|
|[**settingsInvoicePut**](#settingsinvoiceput) | **PUT** /settings/invoice | Update invoice settings|
|[**settingsMenuAccessGet**](#settingsmenuaccessget) | **GET** /settings/menu-access | Get menu role access|
|[**settingsMenuAccessPut**](#settingsmenuaccessput) | **PUT** /settings/menu-access | Update menu role access|
|[**settingsPrinterGet**](#settingsprinterget) | **GET** /settings/printer | Get printer settings|
|[**settingsPrinterPut**](#settingsprinterput) | **PUT** /settings/printer | Update printer settings|

# **settingsBrandingGet**
> SettingsBrandingGet200Response settingsBrandingGet()

Retrieve branding settings (app name, logo, footer text, theme colors) for the application (Roles: authenticated)

### Example

```typescript
import {
    SettingsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

const { status, data } = await apiInstance.settingsBrandingGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SettingsBrandingGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Branding settings fetched successfully |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **settingsBrandingLogoPost**
> SettingsBrandingLogoPost200Response settingsBrandingLogoPost()

Upload and update the application logo image (Roles: admin)

### Example

```typescript
import {
    SettingsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let logo: File; //Logo image file (default to undefined)

const { status, data } = await apiInstance.settingsBrandingLogoPost(
    logo
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **logo** | [**File**] | Logo image file | defaults to undefined|


### Return type

**SettingsBrandingLogoPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Logo updated successfully |  -  |
|**400** | Logo file is required or file size exceeds limit |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **settingsBrandingPut**
> SettingsBrandingGet200Response settingsBrandingPut(request)

Update application branding settings (Roles: admin)

### Example

```typescript
import {
    SettingsApi,
    Configuration,
    InternalSettingsUpdateBrandingRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let request: InternalSettingsUpdateBrandingRequest; //Branding update request

const { status, data } = await apiInstance.settingsBrandingPut(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSettingsUpdateBrandingRequest**| Branding update request | |


### Return type

**SettingsBrandingGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Branding settings updated successfully |  -  |
|**400** | Invalid request body or validation failure |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **settingsFinancialCurrenciesPut**
> SettingsFinancialGet200Response settingsFinancialCurrenciesPut(request)

JSON list of currencies for multi-region deployments (Roles: admin)

### Example

```typescript
import {
    SettingsApi,
    Configuration,
    InternalSettingsUpdateSupportedCurrenciesRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let request: InternalSettingsUpdateSupportedCurrenciesRequest; //Currency list

const { status, data } = await apiInstance.settingsFinancialCurrenciesPut(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSettingsUpdateSupportedCurrenciesRequest**| Currency list | |


### Return type

**SettingsFinancialGet200Response**

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

# **settingsFinancialGet**
> SettingsFinancialGet200Response settingsFinancialGet()

Currency, tax rate, and service charge (Roles: authenticated)

### Example

```typescript
import {
    SettingsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

const { status, data } = await apiInstance.settingsFinancialGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SettingsFinancialGet200Response**

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

# **settingsFinancialPut**
> SettingsFinancialGet200Response settingsFinancialPut(request)

Update currency, tax, and service charge (Roles: admin)

### Example

```typescript
import {
    SettingsApi,
    Configuration,
    InternalSettingsUpdateFinancialSettingsRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let request: InternalSettingsUpdateFinancialSettingsRequest; //Financial settings

const { status, data } = await apiInstance.settingsFinancialPut(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSettingsUpdateFinancialSettingsRequest**| Financial settings | |


### Return type

**SettingsFinancialGet200Response**

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

# **settingsInvoiceGet**
> SettingsInvoiceGet200Response settingsInvoiceGet()

Receipt headers, footers, and legal text (Roles: authenticated)

### Example

```typescript
import {
    SettingsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

const { status, data } = await apiInstance.settingsInvoiceGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SettingsInvoiceGet200Response**

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

# **settingsInvoicePut**
> SettingsInvoiceGet200Response settingsInvoicePut(request)

Customize printed invoices (Roles: admin)

### Example

```typescript
import {
    SettingsApi,
    Configuration,
    InternalSettingsUpdateInvoiceSettingsRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let request: InternalSettingsUpdateInvoiceSettingsRequest; //Invoice settings

const { status, data } = await apiInstance.settingsInvoicePut(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSettingsUpdateInvoiceSettingsRequest**| Invoice settings | |


### Return type

**SettingsInvoiceGet200Response**

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

# **settingsMenuAccessGet**
> SettingsMenuAccessGet200Response settingsMenuAccessGet()


### Example

```typescript
import {
    SettingsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

const { status, data } = await apiInstance.settingsMenuAccessGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SettingsMenuAccessGet200Response**

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

# **settingsMenuAccessPut**
> SettingsMenuAccessGet200Response settingsMenuAccessPut(request)


### Example

```typescript
import {
    SettingsApi,
    Configuration,
    InternalSettingsUpdateMenuRoleAccessRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let request: InternalSettingsUpdateMenuRoleAccessRequest; //Menu overrides

const { status, data } = await apiInstance.settingsMenuAccessPut(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSettingsUpdateMenuRoleAccessRequest**| Menu overrides | |


### Return type

**SettingsMenuAccessGet200Response**

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

# **settingsPrinterGet**
> SettingsPrinterGet200Response settingsPrinterGet()

Retrieve printer settings like connection string and paper width (Roles: authenticated)

### Example

```typescript
import {
    SettingsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

const { status, data } = await apiInstance.settingsPrinterGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SettingsPrinterGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Printer settings fetched successfully |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **settingsPrinterPut**
> SettingsPrinterGet200Response settingsPrinterPut(request)

Update global printer configuration (Roles: admin)

### Example

```typescript
import {
    SettingsApi,
    Configuration,
    InternalSettingsUpdatePrinterSettingsRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SettingsApi(configuration);

let request: InternalSettingsUpdatePrinterSettingsRequest; //Printer settings update request

const { status, data } = await apiInstance.settingsPrinterPut(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSettingsUpdatePrinterSettingsRequest**| Printer settings update request | |


### Return type

**SettingsPrinterGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Printer settings updated successfully |  -  |
|**400** | Invalid request body or validation failure |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

