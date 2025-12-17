Write-Host "Publishing Services to SPAS Service Registry"

spas-service publish --archive ./order-service-1.0.0.zip `
--image-repository spas-examples/order-service `
--image-tag 1.0.0 `
--image-digest sha256:fc6d849a1aa9862168c191ae10f30a7a5eecfd75fcdb591f9e53854c9bf19fcc

Write-Host "Published Order Service"

spas-service publish --archive ./inventory-service-1.0.0.zip `
--image-repository spas-examples/inventory-service `
--image-tag 1.0.0 `
--image-digest sha256:c8264297160e092d1fbe9ed753a9563824aeea2b50b53d631ada65ec70da504c

Write-Host "Published Inventory Service"

spas-service publish --archive ./product-service-1.0.0.zip `
--image-repository spas-examples/product-service `
--image-tag 1.0.0 `
--image-digest sha256:097ff2aea3eb7484fa06dc282d74a35c7556d401e0769284334c575eedf2f8f4

Write-Host "Published Product Service"