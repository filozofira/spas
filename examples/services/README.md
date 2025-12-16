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
  --image-digest sha256:a8045ddbf45f8f8f71afea8003a428d191499d0f2a97c65b13020ab550f2f3c7
  ```

- Publish inventory-service

  ```powershell
  spas-service publish --archive ./inventory-service-1.0.0.zip `  --image-repository spas-examples/inventory-service`
  --image-tag 1.0.0 `
  --image-digest sha256:999d034e18ce205d99d78431039c2a583f2480408b1c9f9d784a8c5b56b693d7
  ```

- Publish product-service

  ```powershell
  spas-service publish --archive ./product-service-1.0.0.zip `  --image-repository spas-examples/product-service`
  --image-tag 1.0.0 `
  --image-digest sha256:71998525c7bbcce72e2e463ac1f0d67b18a2fc6938eee5a35a9d02a09558eb8d
  ```
