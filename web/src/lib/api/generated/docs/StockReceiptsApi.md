# StockReceiptsApi

All URIs are relative to *http://localhost:8080/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**stockReceiptsGet**](#stockreceiptsget) | **GET** /stock-receipts | List stock receipts|
|[**stockReceiptsIdCancelPost**](#stockreceiptsidcancelpost) | **POST** /stock-receipts/{id}/cancel | Cancel draft stock receipt|
|[**stockReceiptsIdCompletePost**](#stockreceiptsidcompletepost) | **POST** /stock-receipts/{id}/complete | Complete stock receipt|
|[**stockReceiptsIdDelete**](#stockreceiptsiddelete) | **DELETE** /stock-receipts/{id} | Delete draft or cancelled stock receipt|
|[**stockReceiptsIdGet**](#stockreceiptsidget) | **GET** /stock-receipts/{id} | Get stock receipt|
|[**stockReceiptsIdPut**](#stockreceiptsidput) | **PUT** /stock-receipts/{id} | Update draft stock receipt|
|[**stockReceiptsPost**](#stockreceiptspost) | **POST** /stock-receipts | Create stock receipt draft|

# **stockReceiptsGet**
> StockReceiptsGet200Response stockReceiptsGet()


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

const { status, data } = await apiInstance.stockReceiptsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**StockReceiptsGet200Response**

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

# **stockReceiptsIdCancelPost**
> StockReceiptsPost201Response stockReceiptsIdCancelPost()


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

let id: string; //Receipt ID (default to undefined)

const { status, data } = await apiInstance.stockReceiptsIdCancelPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Receipt ID | defaults to undefined|


### Return type

**StockReceiptsPost201Response**

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

# **stockReceiptsIdCompletePost**
> StockReceiptsPost201Response stockReceiptsIdCompletePost()


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

let id: string; //Receipt ID (default to undefined)

const { status, data } = await apiInstance.stockReceiptsIdCompletePost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Receipt ID | defaults to undefined|


### Return type

**StockReceiptsPost201Response**

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

# **stockReceiptsIdDelete**
> DinosaurusPosInternalCommonSuccessResponse stockReceiptsIdDelete()


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

let id: string; //Receipt ID (default to undefined)

const { status, data } = await apiInstance.stockReceiptsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Receipt ID | defaults to undefined|


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

# **stockReceiptsIdGet**
> StockReceiptsPost201Response stockReceiptsIdGet()


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

let id: string; //Receipt ID (default to undefined)

const { status, data } = await apiInstance.stockReceiptsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Receipt ID | defaults to undefined|


### Return type

**StockReceiptsPost201Response**

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

# **stockReceiptsIdPut**
> StockReceiptsPost201Response stockReceiptsIdPut()


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

let id: string; //Receipt ID (default to undefined)

const { status, data } = await apiInstance.stockReceiptsIdPut(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Receipt ID | defaults to undefined|


### Return type

**StockReceiptsPost201Response**

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

# **stockReceiptsPost**
> StockReceiptsPost201Response stockReceiptsPost(request)


### Example

```typescript
import {
    StockReceiptsApi,
    Configuration,
    InternalStockReceiptsCreateStockReceiptRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new StockReceiptsApi(configuration);

let request: InternalStockReceiptsCreateStockReceiptRequest; //Receipt

const { status, data } = await apiInstance.stockReceiptsPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalStockReceiptsCreateStockReceiptRequest**| Receipt | |


### Return type

**StockReceiptsPost201Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

