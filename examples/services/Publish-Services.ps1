Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:bab325ae683beacead69c21a845cac080be7b1f4447dffcd1125eb3ff6096cbb

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:4f6de5ba301c4da2570d659abca21189245e887abd539756063142007a6ce273

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:779b5e2393c0393db4a4f66eb84478d6ee467f669f14cfb875fc573c8a476e99

Write-Host "Published Product Service"