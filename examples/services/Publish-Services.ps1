Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:ceebfead61644354e079c9ec8175854cc6501b2f5dd1d6090ade8a5470758936

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:8f7b50b4d6abfd2205d733ae0d4a7684744ea1d9bb415062a21eb72d3832c6cc

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:adf6953b7e7a50e8fd71a554e1daa4d7b45df25106059ae3f07276bd5f7f36ab

Write-Host "Published Product Service"

spas-service publish --archive ./subscription-service-1.0.0.zip `
--image-repository spas-examples/subscription-service `
--image-tag 1.0.0 `
--image-digest sha256:e62dabd339a26d373dfa133ebf5fb9832b6a69d5019376500365a70e75f5b899

Write-Host "Published Subscription Service"