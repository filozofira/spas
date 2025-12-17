Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:5997af4858cefbb6944ac1f2ba78e66abd7d6b585dbe0ed80154a0df4f71eab5

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:432416a457a4fba25c1f692f41cc40472fbd5b587bed4963c8d4bb11c93474e3

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:af61b06f67c05f59ac1f91dc62fe601ee56281e974f0e6df7027fd7d777239f2

Write-Host "Published Product Service"

spas-service publish --archive ./subscription-service-1.0.0.zip `
--image-repository spas-examples/subscription-service `
--image-tag 1.0.0 `
--image-digest sha256:7f7416d9d6d6c4fd89109c53fdd04dca6028858059e7705ebc2d42a9bec84d53

Write-Host "Published Subscription Service"