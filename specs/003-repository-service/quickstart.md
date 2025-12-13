# Quickstart (PoC)

## Publish a service

- Endpoint: `POST /v1/services/{serviceName}:{version}`
- Content-Type: `multipart/form-data`
- Parts:
  - `archive`: ZIP containing `spas.json` at root and `schemas/` folder
  - `checksum` (optional in PoC): SHA-256 of the ZIP bytes
  - `imageDigest` (optional): Docker image digest (e.g., sha256:abc123...)
  - `imageRepository` (optional): Image repository (e.g., ghcr.io/org/service)
  - `imageTag` (optional): Image tag (e.g., 1.0.0, latest)

Example (curl on Linux/macOS):

```bash
curl -f -X POST \
  -F "archive=@./my-service-v1.0.0.zip" \
  -F "checksum=$(shasum -a 256 my-service-v1.0.0.zip | cut -d' ' -f1)" \
  -F "imageDigest=sha256:abc123def456..." \
  -F "imageRepository=ghcr.io/myorg/my-service" \
  -F "imageTag=1.0.0" \
  http://localhost:8080/v1/services/my-service:1.0.0
```

## Retrieve metadata

```bash
curl http://localhost:8080/v1/services/my-service
curl http://localhost:8080/v1/services/my-service/versions
curl http://localhost:8080/v1/services/my-service/versions/1.0.0
curl -O http://localhost:8080/v1/services/my-service/versions/1.0.0/download
```

## Search

```bash
curl "http://localhost:8080/v1/services?capability=payment-processing"
curl "http://localhost:8080/v1/services?boundedContext=order-management"
```
