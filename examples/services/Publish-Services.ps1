Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:b3192ac329fcd33da6c4e480916680e69ffe2e3a7c884922eefe3e646060edf1

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:f644aa784b03d34a775339551fe423274de797601e3c8d37764d7a6f89b66b7c

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:26a4104f44e771acf8cd14f91d6323342b196370abc112a74e3f07e8a40ad5a1

Write-Host "Published Product Service"

spas-service publish --archive ./subscription-service-1.0.0.zip `
--image-repository spas-examples/subscription-service `
--image-tag 1.0.0 `
--image-digest sha256:b5e088cd30e2b2c7ad718620dc74db9e54876bfa7602c6736bba72b0ab4dcf95

Write-Host "Published Subscription Service"