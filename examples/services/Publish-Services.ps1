Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service/metadata/service.metadata.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:TODO_UPDATE_AFTER_BUILD

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service/metadata/service.metadata.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:TODO_UPDATE_AFTER_BUILD

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service/metadata/service.metadata.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:TODO_UPDATE_AFTER_BUILD

Write-Host "Published Product Service"

spas-service publish --archive ./subscription-service/metadata/service.metadata.zip `
--image-repository spas-examples/subscription-service `
--image-tag 1.0.0 `
--image-digest sha256:TODO_UPDATE_AFTER_BUILD

Write-Host "Published Subscription Service"

spas-service publish --archive ./fulfillment-service/metadata/service.metadata.zip `
--image-repository spas-examples/fulfillment-service `
--image-tag 1.0.0 `
--image-digest sha256:TODO_UPDATE_AFTER_BUILD

Write-Host "Published Fulfillment Service"

spas-service publish --archive ./basket-service/metadata/service.metadata.zip `
--image-repository spas-examples/basket-service `
--image-tag 1.0.0 `
--image-digest sha256:TODO_UPDATE_AFTER_BUILD

Write-Host "Published Basket Service"