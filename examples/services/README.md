# Services

These are few SPAS compliant services used to demonstrate usage of the framework through choreography.

## Publish to local SPAS repo

### Get metadata

- Run from examples root `docker compose up` command
- CD to `./examples/services`
- Download order-service metadata

  ```powershell
  spas-service publish http://localhost:5000 --dry-run --output .\examples\services\
  ```

- Download inventory-service metadata

  ```powershell
  spas-service publish http://localhost:5001 --dry-run --output .\examples\services\
  ```

- Download product-service metadata

  ```powershell
  spas-service publish http://localhost:5002 --dry-run --output .\examples\services\
  ```

- CD back to `./examples`
- Run `docker compose down`

### Publish

- CD to `./examples/services`
- Publish order-service

  ```powershell
  spas-service publish --archive ./order-service-1.0.0.zip `
  --image-repository spas-examples/order-service `
  --image-tag 1.0.0 `
  --image-digest sha256:fc6d849a1aa9862168c191ae10f30a7a5eecfd75fcdb591f9e53854c9bf19fcc
  ```

- Publish inventory-service

  ```powershell
  spas-service publish --archive ./inventory-service-1.0.0.zip `  --image-repository spas-examples/inventory-service`
  --image-tag 1.0.0 `
  --image-digest sha256:c8264297160e092d1fbe9ed753a9563824aeea2b50b53d631ada65ec70da504c
  ```

- Publish product-service

  ```powershell
  spas-service publish --archive ./product-service-1.0.0.zip `  --image-repository spas-examples/product-service`
  --image-tag 1.0.0 `
  --image-digest sha256:097ff2aea3eb7484fa06dc282d74a35c7556d401e0769284334c575eedf2f8f4
  ```
