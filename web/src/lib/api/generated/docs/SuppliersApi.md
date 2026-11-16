# SuppliersApi

All URIs are relative to *http://localhost:8080/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**suppliersGet**](#suppliersget) | **GET** /suppliers | List suppliers|
|[**suppliersIdDelete**](#suppliersiddelete) | **DELETE** /suppliers/{id} | Delete a supplier|
|[**suppliersIdGet**](#suppliersidget) | **GET** /suppliers/{id} | Get a supplier|
|[**suppliersIdPut**](#suppliersidput) | **PUT** /suppliers/{id} | Update a supplier|
|[**suppliersPost**](#supplierspost) | **POST** /suppliers | Create a supplier|

# **suppliersGet**
> SuppliersGet200Response suppliersGet()


### Example

```typescript
import {
    SuppliersApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SuppliersApi(configuration);

let page: number; //Page (optional) (default to undefined)
let limit: number; //Limit (optional) (default to undefined)
let search: string; //Search (optional) (default to undefined)

const { status, data } = await apiInstance.suppliersGet(
    page,
    limit,
    search
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] | Page | (optional) defaults to undefined|
| **limit** | [**number**] | Limit | (optional) defaults to undefined|
| **search** | [**string**] | Search | (optional) defaults to undefined|


### Return type

**SuppliersGet200Response**

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

# **suppliersIdDelete**
> DinosaurusPosInternalCommonSuccessResponse suppliersIdDelete()


### Example

```typescript
import {
    SuppliersApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SuppliersApi(configuration);

let id: string; //Supplier ID (default to undefined)

const { status, data } = await apiInstance.suppliersIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Supplier ID | defaults to undefined|


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

# **suppliersIdGet**
> SuppliersPost201Response suppliersIdGet()


### Example

```typescript
import {
    SuppliersApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SuppliersApi(configuration);

let id: string; //Supplier ID (default to undefined)

const { status, data } = await apiInstance.suppliersIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Supplier ID | defaults to undefined|


### Return type

**SuppliersPost201Response**

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

# **suppliersIdPut**
> SuppliersPost201Response suppliersIdPut(request)


### Example

```typescript
import {
    SuppliersApi,
    Configuration,
    InternalSuppliersUpdateSupplierRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SuppliersApi(configuration);

let id: string; //Supplier ID (default to undefined)
let request: InternalSuppliersUpdateSupplierRequest; //Supplier details

const { status, data } = await apiInstance.suppliersIdPut(
    id,
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSuppliersUpdateSupplierRequest**| Supplier details | |
| **id** | [**string**] | Supplier ID | defaults to undefined|


### Return type

**SuppliersPost201Response**

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

# **suppliersPost**
> SuppliersPost201Response suppliersPost(request)


### Example

```typescript
import {
    SuppliersApi,
    Configuration,
    InternalSuppliersCreateSupplierRequest
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new SuppliersApi(configuration);

let request: InternalSuppliersCreateSupplierRequest; //Supplier details

const { status, data } = await apiInstance.suppliersPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **InternalSuppliersCreateSupplierRequest**| Supplier details | |


### Return type

**SuppliersPost201Response**

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

