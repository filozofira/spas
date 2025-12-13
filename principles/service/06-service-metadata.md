# Service Metadata (`spas.json`)

Defines the service manifest schema and required fields. Extended to include endpoint and event contract granularity, consistency declarations, and network egress specifics. The service emits **design-time** metadata only; the SPAS Repository emits **runtime** metadata.

## Overview

- Single source of truth for service identity, contracts, runtime, and security
- Design-time: metadata decomposed into separate JSON files (see Design-Time Structure below)
- Runtime: produced by Repository during publish, using design-time metadata plus deployment runtime fields
- Storage: SPAS repository links to metadata + container image digest

## Design-Time Structure (Service Project Layout)

```text
./
  /metadata
    inbound.endpoints.json      (service endpoints — Production: gRPC methods, PoC: HTTP routes)
    outbound.events.json        (published events)
    outbound.endpoints.json     (external dependencies — Production: gRPC clients, PoC: HTTP clients)
    security.data.json          (data classification)
    {schema1}.json              (message schemas)
    {schema2}.json
    license.txt
  /config
    (application-specific configuration)
  /src
    (service implementation)
```

## Design-Time Metadata Endpoints

Services MAY expose endpoints (development-only) to retrieve design-time metadata:

- `GET /_spas/metadata` — merged spas.json + all referenced schemas (archive or JSON)
- Enabled only in development environment (e.g., `.IsDevelopment()` in .NET)
- Used by CLI command `spas-service metadata get` to generate published metadata

## Required Fields (Design-Time)

- `schemaVersion`: e.g., `design-time-metadata-v1`
- `id`: Unique service identifier (kebab-case)
- `name`: Human-readable name
- `description`: Optional service description
- `version`: SemVer string
- `boundedContext`: Single bounded context name
- `capabilities[]`: Predefined capability enum values (PoC: curated list; Future: extensible)
- `endpoints[]` (commands and queries):
  - `name`: Logical name
  - `type`: `Command | Query`
  - `protocol`: `Http | gRPC`
  - `methodPath`: HTTP route or gRPC method path
  - `version`: Contract version
  - `schemaRef`: Reference to schema in repository or local file
- `events[]` (outbound only):
  - `type`: CloudEvents `type` (e.g., `orders.order-created.v1`)
  - `version`: Event version
  - `schemaRef`: Reference to schema in registry or local file
- `consistency`:
  - `commands`: MUST be `ACID`
  - `queries`: `STRONG | EVENTUAL`
- `network`:
  - `requiredEgress[]`: host:port patterns the service requires (e.g., `api.stripe.com:443`)
- `security`:
  - `authentication` (optional): e.g., `type: jwt`, `requiredScopes[]`
  - `dataClassification[]`: `public | internal | confidential | pii`
- `license`: SPDX identifier

> Idempotency is deferred in PoC; fields MAY be omitted in v1.

## Runtime Fields (Produced by Repository)

Runtime metadata (`runtime-metadata-v1`) is produced by the Repository at publish time, adding deployment details such as:

- `runtime`:
  - `image`: OCI image reference (`repository:tag` or digest)
  - `resources` (optional): cpu/memory guidance
  - `env[]`: Environment variable names (no secret values)

Design-time metadata does not include `runtime`.

## JSON Schema (outline, design-time v1)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spas.dev/schemas/design-time-metadata-v1.json",
  "type": "object",
  "required": ["schemaVersion", "id", "version", "boundedContext", "capabilities", "endpoints", "events", "consistency", "network", "security", "license"],
  "properties": {
    "schemaVersion": {"const": "design-time-metadata-v1"},
    "id": {"type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"},
    "name": {"type": "string"},
    "description": {"type": "string"},
    "version": {"type": "string"},
    "boundedContext": {"type": "string"},
    "capabilities": {"type": "array", "items": {"type": "string"}},
    "endpoints": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "type", "protocol", "methodPath", "version", "schemaRef"],
        "properties": {
          "name": {"type": "string"},
          "type": {"enum": ["Command", "Query"]},
          "protocol": {"enum": ["Http", "gRPC"]},
          "methodPath": {"type": "string"},
          "version": {"type": "string"},
          "schemaRef": {"type": "string"},
          "description": {"type": "string"}
        }
      }
    },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "schemaRef"],
        "properties": {
          "type": {"type": "string"},
          "version": {"type": "string"},
          "schemaRef": {"type": "string"}
        }
      }
    },
    "consistency": {
      "type": "object",
      "properties": {
        "commands": {"enum": ["ACID"]},
        "queries": {"enum": ["STRONG", "EVENTUAL"]}
      },
      "required": ["commands", "queries"]
    },
    "network": {
      "type": "object",
      "properties": {
        "requiredEgress": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["requiredEgress"]
    },
    "security": {
      "type": "object",
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "type": {"type": "string"},
            "requiredScopes": {"type": "array", "items": {"type": "string"}}
          }
        },
        "dataClassification": {"type": "array", "items": {"enum": ["public", "internal", "confidential", "pii"]}}
      },
      "required": ["dataClassification"]
    },
    "license": {"type": "string"}
  }
}
```

## Example (Design-Time, PoC Simplified)

```jsonc
{
  "schemaVersion": "design-time-metadata-v1",
  "id": "payment-service",
  "name": "Payment Service",
  "description": "Sample SPAS service demonstrating SDK usage",
  "version": "1.2.0",
  "boundedContext": "payments",
  "capabilities": ["process-payment", "refund-payment"],
  "endpoints": [
    {
      "name": "CompletePayment",
      "type": "Command",
      "protocol": "Http",
      "methodPath": "/commands/complete-payment",
      "version": "1.0",
      "schemaRef": "schemas/complete-payment.schema.json"
    },
    {
      "name": "GetPayment",
      "type": "Query",
      "protocol": "Http",
      "methodPath": "/queries/get-payment/{id}",
      "version": "1.0",
      "schemaRef": "schemas/get-payment.schema.json"
    }
  ],
  "events": [
    {"type": "payments.payment-completed.v1", "version": "1.0", "schemaRef": "schemas/payment_completed_v1.json"}
  ],
  "consistency": {"commands": "ACID", "queries": "EVENTUAL"},
  "network": {"requiredEgress": ["api.stripe.com:443"]},
  "security": {
    "authentication": {
      "type": "jwt",
      "requiredScopes": ["payments.read", "payments.write"]
    },
    "dataClassification": ["pii"]
  },
  "license": "Apache-2.0"
}
```

## Related Documents

- [Repository](../component/11-repository.md)
- [Schema Registry](../infrastructure/16-schema-registry.md)
- [Compliance Checklist](../governance/24-compliance-checklist.md)
