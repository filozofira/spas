Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:c45c924de1ed9d31633e495430b9a4bd0525babe4703f445694789e803e751a2

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:b2216d668e9130721dd0ab291e97a39f3de4b56e7b3451895e2422642dd80d33

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:7a572302b2a4cc48e5e01abb523ff21a54122f7c31f3057e3f48ae9c9f0f2c127a572302b2a4cc48e5e01abb523ff21a54122f7c31f3057e3f48ae9c9f0f2c12

Write-Host "Published Product Service"

spas-service publish --archive ./subscription-service-1.0.0.zip `
--image-repository spas-examples/subscription-service `
--image-tag 1.0.0 `
--image-digest sha256:98ed8036c20440548030630b7a99d5372871f49e3bbb40d428b64404090105bb

Write-Host "Published Subscription Service"