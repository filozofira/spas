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
  --image-digest sha256:133bc66b92a17ea98876c510b25e7f51ff36efa854a5a1ead9cc1489a0754c51
  ```

- Publish inventory-service

  ```powershell
  spas-service publish --archive ./inventory-service-1.0.0.zip `  --image-repository spas-examples/inventory-service`
  --image-tag 1.0.0 `
  --image-digest sha256:25d207d85da46149b900bf529027412f2cfffb7874ba70803ee61b89233c9c2c
  ```

- Publish product-service

  ```powershell
  spas-service publish --archive ./product-service-1.0.0.zip `  --image-repository spas-examples/product-service`
  --image-tag 1.0.0 `
  --image-digest sha256:e702d86306dadeb503acd46cc8684d01f229ea44ae5625ce762be58685ffde35
  ```
