Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:a4cee00f0b7477f730ea9dad7f1404d2570d4ce99bb92ac853397b6e89e14b08

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:04837fe89384aea85eaeba0fa8ca00de620bf6e93777ae90797558d126d5fff4

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:99502dbc88bdba6acffb175ea9b13ccd9fa2de7544c822a8e2479a8306078624

Write-Host "Published Product Service"

spas-service publish --archive ./subscription-service-1.0.0.zip `
--image-repository spas-examples/subscription-service `
--image-tag 1.0.0 `
--image-digest sha256:7bab4e9cf2482f1dea73bb9698f1e96c1fb629ebc6d2ad50caf67a6a07643063

Write-Host "Published Subscription Service"