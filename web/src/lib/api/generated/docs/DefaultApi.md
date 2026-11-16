# DefaultApi

All URIs are relative to *http://localhost:8080/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**productsSearchReindexPost**](#productssearchreindexpost) | **POST** /products/search/reindex | |

# **productsSearchReindexPost**
> productsSearchReindexPost()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from 'dinosaurus-pos-api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.productsSearchReindexPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

