# Quickstart: SDK Metadata Archive Extraction

This feature adds a supported way to generate a full SPAS metadata archive **without starting the HTTP server**.

## .NET services

From the service project directory:

- Generate metadata (default output):
  - `dotnet run -- --generate-metadata`

- Generate metadata to a specific directory:
  - `dotnet run -- --generate-metadata --output <path>`

**Expected output**:
- Archive written to `<path>/service.metadata.zip` (or `./metadata/service.metadata.zip` by default)
- Process exits successfully without listening on a port

## Java services

From the service project directory:

- Generate metadata (default output):
  - `mvn -Dspas.generate-metadata=true spring-boot:run`

- Generate metadata to a specific directory:
  - `mvn -Dspas.generate-metadata=true -Dspas.metadata.output=<path> spring-boot:run`

**Expected output**:
- Archive written to `<path>/service.metadata.zip` (or `./metadata/service.metadata.zip` by default)
- Process exits successfully without starting the embedded server

## Validating the archive

- The ZIP MUST contain `spas.json` plus schema files under:
  - `schemas/events/`
  - `schemas/endpoints/`

- For the order-service reference, the internal entry list should match `examples/services/metadata/order-service-1.0.0.zip`.
