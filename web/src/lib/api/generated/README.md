## dinosaurus-pos-api@1.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install dinosaurus-pos-api@1.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *http://localhost:8080/api/v1*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ActivityLogsApi* | [**activityLogsGet**](docs/ActivityLogsApi.md#activitylogsget) | **GET** /activity-logs | Get activity logs
*AuthApi* | [**authAddPost**](docs/AuthApi.md#authaddpost) | **POST** /auth/add | Add new user
*AuthApi* | [**authLoginPost**](docs/AuthApi.md#authloginpost) | **POST** /auth/login | Login
*AuthApi* | [**authLogoutPost**](docs/AuthApi.md#authlogoutpost) | **POST** /auth/logout | Logout
*AuthApi* | [**authMeAvatarPut**](docs/AuthApi.md#authmeavatarput) | **PUT** /auth/me/avatar | Update avatar
*AuthApi* | [**authMeGet**](docs/AuthApi.md#authmeget) | **GET** /auth/me | Get current profile
*AuthApi* | [**authMePasswordPut**](docs/AuthApi.md#authmepasswordput) | **PUT** /auth/me/password | Update password
*AuthApi* | [**authRefreshPost**](docs/AuthApi.md#authrefreshpost) | **POST** /auth/refresh | Refresh token
*AuthApi* | [**authSwitchTenantPost**](docs/AuthApi.md#authswitchtenantpost) | **POST** /auth/switch-tenant | Switch tenant
*CancellationReasonsApi* | [**cancellationReasonsGet**](docs/CancellationReasonsApi.md#cancellationreasonsget) | **GET** /cancellation-reasons | List cancellation reasons
*CategoriesApi* | [**categoriesCountGet**](docs/CategoriesApi.md#categoriescountget) | **GET** /categories/count | Get total number of categories
*CategoriesApi* | [**categoriesGet**](docs/CategoriesApi.md#categoriesget) | **GET** /categories | Get all categories
*CategoriesApi* | [**categoriesIdDelete**](docs/CategoriesApi.md#categoriesiddelete) | **DELETE** /categories/{id} | Delete category by ID
*CategoriesApi* | [**categoriesIdGet**](docs/CategoriesApi.md#categoriesidget) | **GET** /categories/{id} | Get category by ID
*CategoriesApi* | [**categoriesIdPut**](docs/CategoriesApi.md#categoriesidput) | **PUT** /categories/{id} | Update category by ID
*CategoriesApi* | [**categoriesPost**](docs/CategoriesApi.md#categoriespost) | **POST** /categories | Create a new category
*CustomerGroupsApi* | [**customerGroupsGet**](docs/CustomerGroupsApi.md#customergroupsget) | **GET** /customer-groups | List customer groups
*CustomerGroupsApi* | [**customerGroupsIdDelete**](docs/CustomerGroupsApi.md#customergroupsiddelete) | **DELETE** /customer-groups/{id} | Delete customer group
*CustomerGroupsApi* | [**customerGroupsIdGet**](docs/CustomerGroupsApi.md#customergroupsidget) | **GET** /customer-groups/{id} | Get customer group
*CustomerGroupsApi* | [**customerGroupsIdPut**](docs/CustomerGroupsApi.md#customergroupsidput) | **PUT** /customer-groups/{id} | Update customer group
*CustomerGroupsApi* | [**customerGroupsPost**](docs/CustomerGroupsApi.md#customergroupspost) | **POST** /customer-groups | Create customer group
*CustomersApi* | [**customersGet**](docs/CustomersApi.md#customersget) | **GET** /customers | List customers
*CustomersApi* | [**customersIdDelete**](docs/CustomersApi.md#customersiddelete) | **DELETE** /customers/{id} | Delete a customer
*CustomersApi* | [**customersIdGet**](docs/CustomersApi.md#customersidget) | **GET** /customers/{id} | Get a customer
*CustomersApi* | [**customersIdPut**](docs/CustomersApi.md#customersidput) | **PUT** /customers/{id} | Update a customer
*CustomersApi* | [**customersPost**](docs/CustomersApi.md#customerspost) | **POST** /customers | Create a customer
*DefaultApi* | [**productsSearchReindexPost**](docs/DefaultApi.md#productssearchreindexpost) | **POST** /products/search/reindex | 
*MeasurementUnitsApi* | [**measurementUnitsGet**](docs/MeasurementUnitsApi.md#measurementunitsget) | **GET** /measurement-units | List measurement units
*MeasurementUnitsApi* | [**measurementUnitsIdDelete**](docs/MeasurementUnitsApi.md#measurementunitsiddelete) | **DELETE** /measurement-units/{id} | Delete measurement unit
*MeasurementUnitsApi* | [**measurementUnitsIdGet**](docs/MeasurementUnitsApi.md#measurementunitsidget) | **GET** /measurement-units/{id} | Get measurement unit
*MeasurementUnitsApi* | [**measurementUnitsIdPut**](docs/MeasurementUnitsApi.md#measurementunitsidput) | **PUT** /measurement-units/{id} | Update measurement unit
*MeasurementUnitsApi* | [**measurementUnitsPost**](docs/MeasurementUnitsApi.md#measurementunitspost) | **POST** /measurement-units | Create measurement unit
*NotificationsApi* | [**notificationChannelsGet**](docs/NotificationsApi.md#notificationchannelsget) | **GET** /notification-channels | List notification channels
*NotificationsApi* | [**notificationChannelsIdDelete**](docs/NotificationsApi.md#notificationchannelsiddelete) | **DELETE** /notification-channels/{id} | Delete notification channel
*NotificationsApi* | [**notificationChannelsIdPut**](docs/NotificationsApi.md#notificationchannelsidput) | **PUT** /notification-channels/{id} | Update notification channel
*NotificationsApi* | [**notificationChannelsIdTestPost**](docs/NotificationsApi.md#notificationchannelsidtestpost) | **POST** /notification-channels/{id}/test | Send test notification
*NotificationsApi* | [**notificationChannelsPost**](docs/NotificationsApi.md#notificationchannelspost) | **POST** /notification-channels | Create notification channel
*NotificationsApi* | [**notificationDeliveriesGet**](docs/NotificationsApi.md#notificationdeliveriesget) | **GET** /notification-deliveries | Notification delivery log
*NotificationsApi* | [**notificationDevicesDelete**](docs/NotificationsApi.md#notificationdevicesdelete) | **DELETE** /notification-devices | Unregister FCM device token
*NotificationsApi* | [**notificationDevicesRegisterPost**](docs/NotificationsApi.md#notificationdevicesregisterpost) | **POST** /notification-devices/register | Register FCM device token
*NotificationsApi* | [**notificationEventTypesGet**](docs/NotificationsApi.md#notificationeventtypesget) | **GET** /notification-event-types | List notification event types
*NotificationsApi* | [**notificationSubscriptionsMeGet**](docs/NotificationsApi.md#notificationsubscriptionsmeget) | **GET** /notification-subscriptions/me | My notification subscriptions
*NotificationsApi* | [**notificationSubscriptionsMePut**](docs/NotificationsApi.md#notificationsubscriptionsmeput) | **PUT** /notification-subscriptions/me | Update my notification subscriptions
*NotificationsApi* | [**notificationsConfigGet**](docs/NotificationsApi.md#notificationsconfigget) | **GET** /notifications/config | Notification tenant settings
*NotificationsApi* | [**notificationsConfigPut**](docs/NotificationsApi.md#notificationsconfigput) | **PUT** /notifications/config | Update notification tenant settings
*NotificationsApi* | [**notificationsReportsTestPost**](docs/NotificationsApi.md#notificationsreportstestpost) | **POST** /notifications/reports/test | Send test scheduled report email
*OrdersApi* | [**ordersGet**](docs/OrdersApi.md#ordersget) | **GET** /orders | List orders
*OrdersApi* | [**ordersIdApplyPromotionPost**](docs/OrdersApi.md#ordersidapplypromotionpost) | **POST** /orders/{id}/apply-promotion | Apply promotion to an order
*OrdersApi* | [**ordersIdCancelPost**](docs/OrdersApi.md#ordersidcancelpost) | **POST** /orders/{id}/cancel | Cancel an order
*OrdersApi* | [**ordersIdGet**](docs/OrdersApi.md#ordersidget) | **GET** /orders/{id} | Get an order by ID
*OrdersApi* | [**ordersIdItemsPatch**](docs/OrdersApi.md#ordersiditemspatch) | **PATCH** /orders/{id}/items | Update items in an order
*OrdersApi* | [**ordersIdPayManualPost**](docs/OrdersApi.md#ordersidpaymanualpost) | **POST** /orders/{id}/pay/manual | Confirm manual payment for an order
*OrdersApi* | [**ordersIdPayMidtransPost**](docs/OrdersApi.md#ordersidpaymidtranspost) | **POST** /orders/{id}/pay/midtrans | Initiate Midtrans payment for an order
*OrdersApi* | [**ordersIdRefundPost**](docs/OrdersApi.md#ordersidrefundpost) | **POST** /orders/{id}/refund | Refund a paid order
*OrdersApi* | [**ordersIdUpdateStatusPost**](docs/OrdersApi.md#ordersidupdatestatuspost) | **POST** /orders/{id}/update-status | Update order operational status
*OrdersApi* | [**ordersPost**](docs/OrdersApi.md#orderspost) | **POST** /orders | Create an order
*OrdersApi* | [**ordersWebhookMidtransPost**](docs/OrdersApi.md#orderswebhookmidtranspost) | **POST** /orders/webhook/midtrans | Midtrans Payment Notification Callback
*PaymentMethodsApi* | [**paymentMethodsGet**](docs/PaymentMethodsApi.md#paymentmethodsget) | **GET** /payment-methods | List payment methods
*PrinterApi* | [**ordersIdPrintDataGet**](docs/PrinterApi.md#ordersidprintdataget) | **GET** /orders/{id}/print-data | Get invoice print data
*PrinterApi* | [**ordersIdPrintPost**](docs/PrinterApi.md#ordersidprintpost) | **POST** /orders/{id}/print | Print invoice for an order
*PrinterApi* | [**settingsPrinterDiscoverGet**](docs/PrinterApi.md#settingsprinterdiscoverget) | **GET** /settings/printer/discover | Discover network printers
*PrinterApi* | [**settingsPrinterTestPost**](docs/PrinterApi.md#settingsprintertestpost) | **POST** /settings/printer/test | Test printer connection
*ProductsApi* | [**productsExportPricesGet**](docs/ProductsApi.md#productsexportpricesget) | **GET** /products/export-prices | Export product prices
*ProductsApi* | [**productsGet**](docs/ProductsApi.md#productsget) | **GET** /products | List products
*ProductsApi* | [**productsIdDelete**](docs/ProductsApi.md#productsiddelete) | **DELETE** /products/{id} | Delete a product
*ProductsApi* | [**productsIdGet**](docs/ProductsApi.md#productsidget) | **GET** /products/{id} | Get a product by ID
*ProductsApi* | [**productsIdImagePost**](docs/ProductsApi.md#productsidimagepost) | **POST** /products/{id}/image | Upload an image for a product
*ProductsApi* | [**productsIdPatch**](docs/ProductsApi.md#productsidpatch) | **PATCH** /products/{id} | Update a product
*ProductsApi* | [**productsIdSaleUnitsPut**](docs/ProductsApi.md#productsidsaleunitsput) | **PUT** /products/{id}/sale-units | Replace product sale units
*ProductsApi* | [**productsIdStockHistoryGet**](docs/ProductsApi.md#productsidstockhistoryget) | **GET** /products/{id}/stock-history | Get stock history for a product
*ProductsApi* | [**productsImportPricesPost**](docs/ProductsApi.md#productsimportpricespost) | **POST** /products/import-prices | Import product prices
*ProductsApi* | [**productsImportPricesTemplateGet**](docs/ProductsApi.md#productsimportpricestemplateget) | **GET** /products/import-prices/template | Download import prices template
*ProductsApi* | [**productsLookupGet**](docs/ProductsApi.md#productslookupget) | **GET** /products/lookup | Lookup product by barcode or SKU
*ProductsApi* | [**productsPost**](docs/ProductsApi.md#productspost) | **POST** /products | Create a new product
*ProductsApi* | [**productsProductIdOptionsOptionIdImagePost**](docs/ProductsApi.md#productsproductidoptionsoptionidimagepost) | **POST** /products/{product_id}/options/{option_id}/image | Upload product option image
*ProductsApi* | [**productsProductIdOptionsOptionIdPatch**](docs/ProductsApi.md#productsproductidoptionsoptionidpatch) | **PATCH** /products/{product_id}/options/{option_id} | Update a product option
*ProductsApi* | [**productsProductIdOptionsPost**](docs/ProductsApi.md#productsproductidoptionspost) | **POST** /products/{product_id}/options | Create a product option
*ProductsApi* | [**productsSearchGet**](docs/ProductsApi.md#productssearchget) | **GET** /products/search | Export product prices
*ProductsApi* | [**productsTrashGet**](docs/ProductsApi.md#productstrashget) | **GET** /products/trash | List deleted products
*ProductsApi* | [**productsTrashIdGet**](docs/ProductsApi.md#productstrashidget) | **GET** /products/trash/{id} | Get a deleted product
*ProductsApi* | [**productsTrashIdRestorePost**](docs/ProductsApi.md#productstrashidrestorepost) | **POST** /products/trash/{id}/restore | Restore a deleted product
*ProductsApi* | [**productsTrashRestoreBulkPost**](docs/ProductsApi.md#productstrashrestorebulkpost) | **POST** /products/trash/restore-bulk | Bulk restore deleted products
*PromotionsApi* | [**promotionsGet**](docs/PromotionsApi.md#promotionsget) | **GET** /promotions | List all promotions
*PromotionsApi* | [**promotionsIdDelete**](docs/PromotionsApi.md#promotionsiddelete) | **DELETE** /promotions/{id} | Delete (deactivate) a promotion
*PromotionsApi* | [**promotionsIdGet**](docs/PromotionsApi.md#promotionsidget) | **GET** /promotions/{id} | Get a promotion by ID
*PromotionsApi* | [**promotionsIdPut**](docs/PromotionsApi.md#promotionsidput) | **PUT** /promotions/{id} | Update a promotion
*PromotionsApi* | [**promotionsIdRestorePost**](docs/PromotionsApi.md#promotionsidrestorepost) | **POST** /promotions/{id}/restore | Restore a deleted promotion
*PromotionsApi* | [**promotionsPost**](docs/PromotionsApi.md#promotionspost) | **POST** /promotions | Create a new promotion
*ReportsApi* | [**reportsCancellationsGet**](docs/ReportsApi.md#reportscancellationsget) | **GET** /reports/cancellations | Get cancellation reports
*ReportsApi* | [**reportsCashierPerformanceGet**](docs/ReportsApi.md#reportscashierperformanceget) | **GET** /reports/cashier-performance | Get cashier performance
*ReportsApi* | [**reportsDashboardSummaryGet**](docs/ReportsApi.md#reportsdashboardsummaryget) | **GET** /reports/dashboard-summary | Get dashboard summary
*ReportsApi* | [**reportsLowStockGet**](docs/ReportsApi.md#reportslowstockget) | **GET** /reports/low-stock | Get low stock products
*ReportsApi* | [**reportsPaymentMethodsGet**](docs/ReportsApi.md#reportspaymentmethodsget) | **GET** /reports/payment-methods | Get payment method performance
*ReportsApi* | [**reportsProductsGet**](docs/ReportsApi.md#reportsproductsget) | **GET** /reports/products | Get product performance
*ReportsApi* | [**reportsProfitProductsGet**](docs/ReportsApi.md#reportsprofitproductsget) | **GET** /reports/profit-products | Get product profit reports
*ReportsApi* | [**reportsProfitSummaryGet**](docs/ReportsApi.md#reportsprofitsummaryget) | **GET** /reports/profit-summary | Get profit summary
*ReportsApi* | [**reportsPromotionsGet**](docs/ReportsApi.md#reportspromotionsget) | **GET** /reports/promotions | Get promotion performance
*ReportsApi* | [**reportsSalesGet**](docs/ReportsApi.md#reportssalesget) | **GET** /reports/sales | Get sales reports
*ReportsApi* | [**reportsShiftSummaryGet**](docs/ReportsApi.md#reportsshiftsummaryget) | **GET** /reports/shift-summary | Get shift summary records
*SettingsApi* | [**settingsBrandingGet**](docs/SettingsApi.md#settingsbrandingget) | **GET** /settings/branding | Get branding settings
*SettingsApi* | [**settingsBrandingLogoPost**](docs/SettingsApi.md#settingsbrandinglogopost) | **POST** /settings/branding/logo | Update app logo
*SettingsApi* | [**settingsBrandingPut**](docs/SettingsApi.md#settingsbrandingput) | **PUT** /settings/branding | Update branding settings
*SettingsApi* | [**settingsFinancialCurrenciesPut**](docs/SettingsApi.md#settingsfinancialcurrenciesput) | **PUT** /settings/financial/currencies | Update supported currencies
*SettingsApi* | [**settingsFinancialGet**](docs/SettingsApi.md#settingsfinancialget) | **GET** /settings/financial | Get financial settings
*SettingsApi* | [**settingsFinancialPut**](docs/SettingsApi.md#settingsfinancialput) | **PUT** /settings/financial | Update financial settings
*SettingsApi* | [**settingsInvoiceGet**](docs/SettingsApi.md#settingsinvoiceget) | **GET** /settings/invoice | Get invoice settings
*SettingsApi* | [**settingsInvoicePut**](docs/SettingsApi.md#settingsinvoiceput) | **PUT** /settings/invoice | Update invoice settings
*SettingsApi* | [**settingsMenuAccessGet**](docs/SettingsApi.md#settingsmenuaccessget) | **GET** /settings/menu-access | Get menu role access
*SettingsApi* | [**settingsMenuAccessPut**](docs/SettingsApi.md#settingsmenuaccessput) | **PUT** /settings/menu-access | Update menu role access
*SettingsApi* | [**settingsPrinterGet**](docs/SettingsApi.md#settingsprinterget) | **GET** /settings/printer | Get printer settings
*SettingsApi* | [**settingsPrinterPut**](docs/SettingsApi.md#settingsprinterput) | **PUT** /settings/printer | Update printer settings
*ShiftsApi* | [**shiftsCashTransactionPost**](docs/ShiftsApi.md#shiftscashtransactionpost) | **POST** /shifts/cash-transaction | Create a cash transaction (Drop/Expense/In)
*ShiftsApi* | [**shiftsCurrentGet**](docs/ShiftsApi.md#shiftscurrentget) | **GET** /shifts/current | Get current open shift
*ShiftsApi* | [**shiftsEndPost**](docs/ShiftsApi.md#shiftsendpost) | **POST** /shifts/end | End current shift
*ShiftsApi* | [**shiftsStartPost**](docs/ShiftsApi.md#shiftsstartpost) | **POST** /shifts/start | Start a new shift
*StockOpsApi* | [**stockAdjustmentsGet**](docs/StockOpsApi.md#stockadjustmentsget) | **GET** /stock-adjustments | List stock adjustments
*StockOpsApi* | [**stockAdjustmentsIdCompletePost**](docs/StockOpsApi.md#stockadjustmentsidcompletepost) | **POST** /stock-adjustments/{id}/complete | Complete stock adjustment
*StockOpsApi* | [**stockAdjustmentsIdGet**](docs/StockOpsApi.md#stockadjustmentsidget) | **GET** /stock-adjustments/{id} | Get stock adjustment
*StockOpsApi* | [**stockAdjustmentsIdPut**](docs/StockOpsApi.md#stockadjustmentsidput) | **PUT** /stock-adjustments/{id} | Update stock adjustment draft
*StockOpsApi* | [**stockAdjustmentsPost**](docs/StockOpsApi.md#stockadjustmentspost) | **POST** /stock-adjustments | Create stock adjustment
*StockOpsApi* | [**stockMovementsGet**](docs/StockOpsApi.md#stockmovementsget) | **GET** /stock-movements | List stock movements
*StockOpsApi* | [**stockTakesGet**](docs/StockOpsApi.md#stocktakesget) | **GET** /stock-takes | List stock takes
*StockOpsApi* | [**stockTakesIdGet**](docs/StockOpsApi.md#stocktakesidget) | **GET** /stock-takes/{id} | Get stock take
*StockOpsApi* | [**stockTakesIdPostPost**](docs/StockOpsApi.md#stocktakesidpostpost) | **POST** /stock-takes/{id}/post | Post stock take
*StockOpsApi* | [**stockTakesIdPut**](docs/StockOpsApi.md#stocktakesidput) | **PUT** /stock-takes/{id} | Update stock take draft
*StockOpsApi* | [**stockTakesPost**](docs/StockOpsApi.md#stocktakespost) | **POST** /stock-takes | Create stock take
*StockOpsApi* | [**stockTransfersGet**](docs/StockOpsApi.md#stocktransfersget) | **GET** /stock-transfers | List stock transfers
*StockOpsApi* | [**stockTransfersIdCompletePost**](docs/StockOpsApi.md#stocktransfersidcompletepost) | **POST** /stock-transfers/{id}/complete | Complete stock transfer
*StockOpsApi* | [**stockTransfersIdGet**](docs/StockOpsApi.md#stocktransfersidget) | **GET** /stock-transfers/{id} | Get stock transfer
*StockOpsApi* | [**stockTransfersIdPut**](docs/StockOpsApi.md#stocktransfersidput) | **PUT** /stock-transfers/{id} | Update stock transfer draft
*StockOpsApi* | [**stockTransfersPost**](docs/StockOpsApi.md#stocktransferspost) | **POST** /stock-transfers | Create stock transfer
*StockReceiptsApi* | [**stockReceiptsGet**](docs/StockReceiptsApi.md#stockreceiptsget) | **GET** /stock-receipts | List stock receipts
*StockReceiptsApi* | [**stockReceiptsIdCancelPost**](docs/StockReceiptsApi.md#stockreceiptsidcancelpost) | **POST** /stock-receipts/{id}/cancel | Cancel draft stock receipt
*StockReceiptsApi* | [**stockReceiptsIdCompletePost**](docs/StockReceiptsApi.md#stockreceiptsidcompletepost) | **POST** /stock-receipts/{id}/complete | Complete stock receipt
*StockReceiptsApi* | [**stockReceiptsIdDelete**](docs/StockReceiptsApi.md#stockreceiptsiddelete) | **DELETE** /stock-receipts/{id} | Delete draft or cancelled stock receipt
*StockReceiptsApi* | [**stockReceiptsIdGet**](docs/StockReceiptsApi.md#stockreceiptsidget) | **GET** /stock-receipts/{id} | Get stock receipt
*StockReceiptsApi* | [**stockReceiptsIdPut**](docs/StockReceiptsApi.md#stockreceiptsidput) | **PUT** /stock-receipts/{id} | Update draft stock receipt
*StockReceiptsApi* | [**stockReceiptsPost**](docs/StockReceiptsApi.md#stockreceiptspost) | **POST** /stock-receipts | Create stock receipt draft
*SuppliersApi* | [**suppliersGet**](docs/SuppliersApi.md#suppliersget) | **GET** /suppliers | List suppliers
*SuppliersApi* | [**suppliersIdDelete**](docs/SuppliersApi.md#suppliersiddelete) | **DELETE** /suppliers/{id} | Delete a supplier
*SuppliersApi* | [**suppliersIdGet**](docs/SuppliersApi.md#suppliersidget) | **GET** /suppliers/{id} | Get a supplier
*SuppliersApi* | [**suppliersIdPut**](docs/SuppliersApi.md#suppliersidput) | **PUT** /suppliers/{id} | Update a supplier
*SuppliersApi* | [**suppliersPost**](docs/SuppliersApi.md#supplierspost) | **POST** /suppliers | Create a supplier
*UsersApi* | [**usersGet**](docs/UsersApi.md#usersget) | **GET** /users | Get all users
*UsersApi* | [**usersIdDelete**](docs/UsersApi.md#usersiddelete) | **DELETE** /users/{id} | Delete user
*UsersApi* | [**usersIdGet**](docs/UsersApi.md#usersidget) | **GET** /users/{id} | Get user by ID
*UsersApi* | [**usersIdPut**](docs/UsersApi.md#usersidput) | **PUT** /users/{id} | Update user
*UsersApi* | [**usersIdToggleStatusPost**](docs/UsersApi.md#usersidtogglestatuspost) | **POST** /users/{id}/toggle-status | Toggle user status
*UsersApi* | [**usersPost**](docs/UsersApi.md#userspost) | **POST** /users | Create user
*WarehousesApi* | [**warehousesGet**](docs/WarehousesApi.md#warehousesget) | **GET** /warehouses | List warehouses
*WarehousesApi* | [**warehousesIdDelete**](docs/WarehousesApi.md#warehousesiddelete) | **DELETE** /warehouses/{id} | Delete warehouse
*WarehousesApi* | [**warehousesIdGet**](docs/WarehousesApi.md#warehousesidget) | **GET** /warehouses/{id} | Get warehouse
*WarehousesApi* | [**warehousesIdPut**](docs/WarehousesApi.md#warehousesidput) | **PUT** /warehouses/{id} | Update warehouse
*WarehousesApi* | [**warehousesIdStockGet**](docs/WarehousesApi.md#warehousesidstockget) | **GET** /warehouses/{id}/stock | List stock by warehouse
*WarehousesApi* | [**warehousesPost**](docs/WarehousesApi.md#warehousespost) | **POST** /warehouses | Create warehouse


### Documentation For Models

 - [ActivityLogsGet200Response](docs/ActivityLogsGet200Response.md)
 - [AuthAddPost200Response](docs/AuthAddPost200Response.md)
 - [AuthLoginPost200Response](docs/AuthLoginPost200Response.md)
 - [AuthRefreshPost200Response](docs/AuthRefreshPost200Response.md)
 - [CancellationReasonsGet200Response](docs/CancellationReasonsGet200Response.md)
 - [CategoriesGet200Response](docs/CategoriesGet200Response.md)
 - [CategoriesPost201Response](docs/CategoriesPost201Response.md)
 - [CustomersGet200Response](docs/CustomersGet200Response.md)
 - [CustomersPost201Response](docs/CustomersPost201Response.md)
 - [DinosaurusPosInternalActivityLogRepositoryLogActionType](docs/DinosaurusPosInternalActivityLogRepositoryLogActionType.md)
 - [DinosaurusPosInternalActivityLogRepositoryLogEntityType](docs/DinosaurusPosInternalActivityLogRepositoryLogEntityType.md)
 - [DinosaurusPosInternalCommonErrorResponse](docs/DinosaurusPosInternalCommonErrorResponse.md)
 - [DinosaurusPosInternalCommonPaginationPagination](docs/DinosaurusPosInternalCommonPaginationPagination.md)
 - [DinosaurusPosInternalCommonSuccessResponse](docs/DinosaurusPosInternalCommonSuccessResponse.md)
 - [DinosaurusPosInternalOrdersRepositoryOrderStatus](docs/DinosaurusPosInternalOrdersRepositoryOrderStatus.md)
 - [DinosaurusPosInternalOrdersRepositoryOrderType](docs/DinosaurusPosInternalOrdersRepositoryOrderType.md)
 - [DinosaurusPosInternalPromotionsRepositoryDiscountType](docs/DinosaurusPosInternalPromotionsRepositoryDiscountType.md)
 - [DinosaurusPosInternalPromotionsRepositoryPromotionRuleType](docs/DinosaurusPosInternalPromotionsRepositoryPromotionRuleType.md)
 - [DinosaurusPosInternalPromotionsRepositoryPromotionScope](docs/DinosaurusPosInternalPromotionsRepositoryPromotionScope.md)
 - [DinosaurusPosInternalPromotionsRepositoryPromotionTargetType](docs/DinosaurusPosInternalPromotionsRepositoryPromotionTargetType.md)
 - [DinosaurusPosInternalShiftRepositoryCashTransactionType](docs/DinosaurusPosInternalShiftRepositoryCashTransactionType.md)
 - [DinosaurusPosInternalShiftRepositoryShiftStatus](docs/DinosaurusPosInternalShiftRepositoryShiftStatus.md)
 - [DinosaurusPosInternalUserRepositoryUserRole](docs/DinosaurusPosInternalUserRepositoryUserRole.md)
 - [DinosaurusPosPkgPaymentMidtransNotificationPayload](docs/DinosaurusPosPkgPaymentMidtransNotificationPayload.md)
 - [InternalActivityLogActivityLogListResponse](docs/InternalActivityLogActivityLogListResponse.md)
 - [InternalActivityLogActivityLogResponse](docs/InternalActivityLogActivityLogResponse.md)
 - [InternalCancellationReasonsCancellationReasonResponse](docs/InternalCancellationReasonsCancellationReasonResponse.md)
 - [InternalCategoriesCategoryResponse](docs/InternalCategoriesCategoryResponse.md)
 - [InternalCategoriesCategoryWithCountResponse](docs/InternalCategoriesCategoryWithCountResponse.md)
 - [InternalCategoriesCreateCategoryRequest](docs/InternalCategoriesCreateCategoryRequest.md)
 - [InternalCustomersCreateCustomerRequest](docs/InternalCustomersCreateCustomerRequest.md)
 - [InternalCustomersCustomerResponse](docs/InternalCustomersCustomerResponse.md)
 - [InternalCustomersPagedCustomerResponse](docs/InternalCustomersPagedCustomerResponse.md)
 - [InternalCustomersUpdateCustomerRequest](docs/InternalCustomersUpdateCustomerRequest.md)
 - [InternalNotificationsCreateChannelRequest](docs/InternalNotificationsCreateChannelRequest.md)
 - [InternalNotificationsReportScheduleSlot](docs/InternalNotificationsReportScheduleSlot.md)
 - [InternalNotificationsReportSchedulesConfig](docs/InternalNotificationsReportSchedulesConfig.md)
 - [InternalNotificationsSubscriptionItem](docs/InternalNotificationsSubscriptionItem.md)
 - [InternalNotificationsUpdateChannelRequest](docs/InternalNotificationsUpdateChannelRequest.md)
 - [InternalNotificationsUpdateSubscriptionsRequest](docs/InternalNotificationsUpdateSubscriptionsRequest.md)
 - [InternalNotificationsUpdateTenantConfigRequest](docs/InternalNotificationsUpdateTenantConfigRequest.md)
 - [InternalOrdersApplyPromotionRequest](docs/InternalOrdersApplyPromotionRequest.md)
 - [InternalOrdersCancelOrderRequest](docs/InternalOrdersCancelOrderRequest.md)
 - [InternalOrdersConfirmManualPaymentRequest](docs/InternalOrdersConfirmManualPaymentRequest.md)
 - [InternalOrdersCreateOrderItemOptionRequest](docs/InternalOrdersCreateOrderItemOptionRequest.md)
 - [InternalOrdersCreateOrderItemRequest](docs/InternalOrdersCreateOrderItemRequest.md)
 - [InternalOrdersCreateOrderRequest](docs/InternalOrdersCreateOrderRequest.md)
 - [InternalOrdersMidtransPaymentResponse](docs/InternalOrdersMidtransPaymentResponse.md)
 - [InternalOrdersOrderDetailResponse](docs/InternalOrdersOrderDetailResponse.md)
 - [InternalOrdersOrderItemOptionResponse](docs/InternalOrdersOrderItemOptionResponse.md)
 - [InternalOrdersOrderItemResponse](docs/InternalOrdersOrderItemResponse.md)
 - [InternalOrdersOrderListResponse](docs/InternalOrdersOrderListResponse.md)
 - [InternalOrdersPagedOrderResponse](docs/InternalOrdersPagedOrderResponse.md)
 - [InternalOrdersPaymentAction](docs/InternalOrdersPaymentAction.md)
 - [InternalOrdersRefundOrderRequest](docs/InternalOrdersRefundOrderRequest.md)
 - [InternalOrdersUpdateOrderItemRequest](docs/InternalOrdersUpdateOrderItemRequest.md)
 - [InternalOrdersUpdateOrderItemsRequest](docs/InternalOrdersUpdateOrderItemsRequest.md)
 - [InternalOrdersUpdateOrderStatusRequest](docs/InternalOrdersUpdateOrderStatusRequest.md)
 - [InternalPaymentMethodsPaymentMethodResponse](docs/InternalPaymentMethodsPaymentMethodResponse.md)
 - [InternalProductsCreateProductOptionRequest](docs/InternalProductsCreateProductOptionRequest.md)
 - [InternalProductsCreateProductOptionRequestStandalone](docs/InternalProductsCreateProductOptionRequestStandalone.md)
 - [InternalProductsCreateProductRequest](docs/InternalProductsCreateProductRequest.md)
 - [InternalProductsImportPriceFailure](docs/InternalProductsImportPriceFailure.md)
 - [InternalProductsImportPricesResult](docs/InternalProductsImportPricesResult.md)
 - [InternalProductsListProductsResponse](docs/InternalProductsListProductsResponse.md)
 - [InternalProductsPagedStockHistoryResponse](docs/InternalProductsPagedStockHistoryResponse.md)
 - [InternalProductsProductCategoryResponse](docs/InternalProductsProductCategoryResponse.md)
 - [InternalProductsProductListResponse](docs/InternalProductsProductListResponse.md)
 - [InternalProductsProductOptionResponse](docs/InternalProductsProductOptionResponse.md)
 - [InternalProductsProductResponse](docs/InternalProductsProductResponse.md)
 - [InternalProductsProductSaleUnitResponse](docs/InternalProductsProductSaleUnitResponse.md)
 - [InternalProductsReplaceSaleUnitsRequest](docs/InternalProductsReplaceSaleUnitsRequest.md)
 - [InternalProductsRestoreBulkRequest](docs/InternalProductsRestoreBulkRequest.md)
 - [InternalProductsSaleUnitInput](docs/InternalProductsSaleUnitInput.md)
 - [InternalProductsStockHistoryResponse](docs/InternalProductsStockHistoryResponse.md)
 - [InternalProductsUpdateProductOptionRequest](docs/InternalProductsUpdateProductOptionRequest.md)
 - [InternalProductsUpdateProductRequest](docs/InternalProductsUpdateProductRequest.md)
 - [InternalPromotionsCreatePromotionRequest](docs/InternalPromotionsCreatePromotionRequest.md)
 - [InternalPromotionsCreatePromotionRuleRequest](docs/InternalPromotionsCreatePromotionRuleRequest.md)
 - [InternalPromotionsCreatePromotionTargetRequest](docs/InternalPromotionsCreatePromotionTargetRequest.md)
 - [InternalPromotionsPagedPromotionResponse](docs/InternalPromotionsPagedPromotionResponse.md)
 - [InternalPromotionsPromotionResponse](docs/InternalPromotionsPromotionResponse.md)
 - [InternalPromotionsPromotionRuleResponse](docs/InternalPromotionsPromotionRuleResponse.md)
 - [InternalPromotionsPromotionTargetResponse](docs/InternalPromotionsPromotionTargetResponse.md)
 - [InternalPromotionsUpdatePromotionRequest](docs/InternalPromotionsUpdatePromotionRequest.md)
 - [InternalReportCancellationReportResponse](docs/InternalReportCancellationReportResponse.md)
 - [InternalReportCashierPerformanceResponse](docs/InternalReportCashierPerformanceResponse.md)
 - [InternalReportDashboardSummaryResponse](docs/InternalReportDashboardSummaryResponse.md)
 - [InternalReportLowStockProductResponse](docs/InternalReportLowStockProductResponse.md)
 - [InternalReportPaymentMethodPerformanceResponse](docs/InternalReportPaymentMethodPerformanceResponse.md)
 - [InternalReportProductPerformanceResponse](docs/InternalReportProductPerformanceResponse.md)
 - [InternalReportProductPerformanceRow](docs/InternalReportProductPerformanceRow.md)
 - [InternalReportProductProfitResponse](docs/InternalReportProductProfitResponse.md)
 - [InternalReportProductProfitRow](docs/InternalReportProductProfitRow.md)
 - [InternalReportProfitSummaryResponse](docs/InternalReportProfitSummaryResponse.md)
 - [InternalReportPromotionPerformanceResponse](docs/InternalReportPromotionPerformanceResponse.md)
 - [InternalReportSalesReport](docs/InternalReportSalesReport.md)
 - [InternalReportShiftSummaryResponse](docs/InternalReportShiftSummaryResponse.md)
 - [InternalSettingsBrandingSettingsResponse](docs/InternalSettingsBrandingSettingsResponse.md)
 - [InternalSettingsCurrencyOption](docs/InternalSettingsCurrencyOption.md)
 - [InternalSettingsFinancialSettingsResponse](docs/InternalSettingsFinancialSettingsResponse.md)
 - [InternalSettingsInvoiceSettingsResponse](docs/InternalSettingsInvoiceSettingsResponse.md)
 - [InternalSettingsMenuCatalogEntry](docs/InternalSettingsMenuCatalogEntry.md)
 - [InternalSettingsMenuRoleAccessResponse](docs/InternalSettingsMenuRoleAccessResponse.md)
 - [InternalSettingsPrinterSettingsResponse](docs/InternalSettingsPrinterSettingsResponse.md)
 - [InternalSettingsQuickCashSettings](docs/InternalSettingsQuickCashSettings.md)
 - [InternalSettingsUpdateBrandingRequest](docs/InternalSettingsUpdateBrandingRequest.md)
 - [InternalSettingsUpdateFinancialSettingsRequest](docs/InternalSettingsUpdateFinancialSettingsRequest.md)
 - [InternalSettingsUpdateInvoiceSettingsRequest](docs/InternalSettingsUpdateInvoiceSettingsRequest.md)
 - [InternalSettingsUpdateMenuRoleAccessRequest](docs/InternalSettingsUpdateMenuRoleAccessRequest.md)
 - [InternalSettingsUpdatePrinterSettingsRequest](docs/InternalSettingsUpdatePrinterSettingsRequest.md)
 - [InternalSettingsUpdateSupportedCurrenciesRequest](docs/InternalSettingsUpdateSupportedCurrenciesRequest.md)
 - [InternalShiftCashTransactionRequest](docs/InternalShiftCashTransactionRequest.md)
 - [InternalShiftCashTransactionResponse](docs/InternalShiftCashTransactionResponse.md)
 - [InternalShiftEndShiftRequest](docs/InternalShiftEndShiftRequest.md)
 - [InternalShiftShiftResponse](docs/InternalShiftShiftResponse.md)
 - [InternalShiftStartShiftRequest](docs/InternalShiftStartShiftRequest.md)
 - [InternalStockReceiptsCreateStockReceiptRequest](docs/InternalStockReceiptsCreateStockReceiptRequest.md)
 - [InternalStockReceiptsPagedStockReceiptResponse](docs/InternalStockReceiptsPagedStockReceiptResponse.md)
 - [InternalStockReceiptsReceiptItemInput](docs/InternalStockReceiptsReceiptItemInput.md)
 - [InternalStockReceiptsStockReceiptItemResponse](docs/InternalStockReceiptsStockReceiptItemResponse.md)
 - [InternalStockReceiptsStockReceiptListItem](docs/InternalStockReceiptsStockReceiptListItem.md)
 - [InternalStockReceiptsStockReceiptResponse](docs/InternalStockReceiptsStockReceiptResponse.md)
 - [InternalSuppliersCreateSupplierRequest](docs/InternalSuppliersCreateSupplierRequest.md)
 - [InternalSuppliersPagedSupplierResponse](docs/InternalSuppliersPagedSupplierResponse.md)
 - [InternalSuppliersSupplierResponse](docs/InternalSuppliersSupplierResponse.md)
 - [InternalSuppliersUpdateSupplierRequest](docs/InternalSuppliersUpdateSupplierRequest.md)
 - [InternalUserCreateUserRequest](docs/InternalUserCreateUserRequest.md)
 - [InternalUserLoginRequest](docs/InternalUserLoginRequest.md)
 - [InternalUserLoginResponse](docs/InternalUserLoginResponse.md)
 - [InternalUserProfileResponse](docs/InternalUserProfileResponse.md)
 - [InternalUserRegisterRequest](docs/InternalUserRegisterRequest.md)
 - [InternalUserSwitchTenantRequest](docs/InternalUserSwitchTenantRequest.md)
 - [InternalUserTenantSummary](docs/InternalUserTenantSummary.md)
 - [InternalUserUpdatePasswordRequest](docs/InternalUserUpdatePasswordRequest.md)
 - [InternalUserUpdateUserRequest](docs/InternalUserUpdateUserRequest.md)
 - [InternalUserUsersResponse](docs/InternalUserUsersResponse.md)
 - [OrdersGet200Response](docs/OrdersGet200Response.md)
 - [OrdersIdPayMidtransPost200Response](docs/OrdersIdPayMidtransPost200Response.md)
 - [OrdersPost201Response](docs/OrdersPost201Response.md)
 - [PaymentMethodsGet200Response](docs/PaymentMethodsGet200Response.md)
 - [ProductsGet200Response](docs/ProductsGet200Response.md)
 - [ProductsIdStockHistoryGet200Response](docs/ProductsIdStockHistoryGet200Response.md)
 - [ProductsImportPricesPost200Response](docs/ProductsImportPricesPost200Response.md)
 - [ProductsImportPricesPostRequest](docs/ProductsImportPricesPostRequest.md)
 - [ProductsPost201Response](docs/ProductsPost201Response.md)
 - [ProductsProductIdOptionsPost201Response](docs/ProductsProductIdOptionsPost201Response.md)
 - [PromotionsGet200Response](docs/PromotionsGet200Response.md)
 - [PromotionsPost201Response](docs/PromotionsPost201Response.md)
 - [ReportsCancellationsGet200Response](docs/ReportsCancellationsGet200Response.md)
 - [ReportsCashierPerformanceGet200Response](docs/ReportsCashierPerformanceGet200Response.md)
 - [ReportsDashboardSummaryGet200Response](docs/ReportsDashboardSummaryGet200Response.md)
 - [ReportsLowStockGet200Response](docs/ReportsLowStockGet200Response.md)
 - [ReportsPaymentMethodsGet200Response](docs/ReportsPaymentMethodsGet200Response.md)
 - [ReportsProductsGet200Response](docs/ReportsProductsGet200Response.md)
 - [ReportsProfitProductsGet200Response](docs/ReportsProfitProductsGet200Response.md)
 - [ReportsProfitSummaryGet200Response](docs/ReportsProfitSummaryGet200Response.md)
 - [ReportsPromotionsGet200Response](docs/ReportsPromotionsGet200Response.md)
 - [ReportsSalesGet200Response](docs/ReportsSalesGet200Response.md)
 - [ReportsShiftSummaryGet200Response](docs/ReportsShiftSummaryGet200Response.md)
 - [SettingsBrandingGet200Response](docs/SettingsBrandingGet200Response.md)
 - [SettingsBrandingLogoPost200Response](docs/SettingsBrandingLogoPost200Response.md)
 - [SettingsFinancialGet200Response](docs/SettingsFinancialGet200Response.md)
 - [SettingsInvoiceGet200Response](docs/SettingsInvoiceGet200Response.md)
 - [SettingsMenuAccessGet200Response](docs/SettingsMenuAccessGet200Response.md)
 - [SettingsPrinterGet200Response](docs/SettingsPrinterGet200Response.md)
 - [ShiftsCashTransactionPost201Response](docs/ShiftsCashTransactionPost201Response.md)
 - [ShiftsCurrentGet200Response](docs/ShiftsCurrentGet200Response.md)
 - [StockReceiptsGet200Response](docs/StockReceiptsGet200Response.md)
 - [StockReceiptsPost201Response](docs/StockReceiptsPost201Response.md)
 - [SuppliersGet200Response](docs/SuppliersGet200Response.md)
 - [SuppliersPost201Response](docs/SuppliersPost201Response.md)
 - [UsersGet200Response](docs/UsersGet200Response.md)


<a id="documentation-for-authorization"></a>
## Documentation For Authorization

Endpoints do not require authorization.

