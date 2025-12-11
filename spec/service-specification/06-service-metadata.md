# Service Metadata (`spas.json`)

Defines the service manifest schema and required fields. Extended to include endpoint and event contract granularity, idempotency and consistency declarations, and network egress specifics.

## Overview

- Single source of truth for service identity, contracts, runtime, and security
- Design-time: metadata decomposed into separate JSON files (see Design-Time Structure below)
- Runtime: merged into single `spas.json` + schemas during publication
- Storage: SPAS repository links to metadata + container image digest

## Design-Time Structure (Service Project Layout)

```text
./
  /metadata
    inbound.endpoints.json      (service endpoints — Production: gRPC methods, PoC: HTTP routes)
    outbound.events.json        (published events)
    outbound.endpoints.json     (external dependencies — Production: gRPC clients, PoC: HTTP clients)
    runtime.json                (image reference)
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

Services MAY expose endpoints (development-only) to retrieve metadata:

- `GET /_spas/metadata` — merged spas.json + all referenced schemas (archive or JSON)
- Enabled only in development environment (e.g., `.IsDevelopment()` in .NET)
- Used by CLI command `spas-service metadata get` to generate published metadata

## Required Fields (Structured)

- `id`: Unique service identifier (kebab-case)
- `name`: Human-readable name
- `version`: SemVer string
- `boundedContext`: Single bounded context name
- `capabilities[]`: Predefined capability enum values (PoC: curated list; Future: extensible)
- `domainContext` (optional): Informational default domain context
- `endpoints[]`:
  - `name`: Logical name
  - `grpcMethod`: Fully qualified gRPC method (e.g. `orders.v1.OrderService/CreateOrder`)
  - `category`: `command | query`
  - `idempotencyKeyField` (optional): Field name used for idempotency
  - `description` (optional)
- `eventsPublished[]`:
  - `type`: CloudEvents `type` (e.g. `orders.order-created.v1`)
  - `version`: Major version (redundant helper; derived from type)
  - `schemaRef`: Reference to schema in registry
- `eventsSubscribed[]`:
  - `type`: CloudEvents `type`
  - `handler`: Production: gRPC method, PoC: HTTP routes to invoke
  - `schemaRef` (optional if inbound mapping resolves internal schema)
- `schemas[]`: Internal schema refs used pre/post transformation
- `runtime`:
  - `image`: OCI image reference (`repository:tag` or digest)
  - `resources` (optional): cpu/memory guidance
  - `env[]`: Environment variable names (no secret values)
- `idempotency`:
  - `strategy`: `NONE | KEY | NATURAL | CUSTOM`
- `consistency`:
  - `commands`: MUST be `ACID`
  - `queries`: `STRONG | EVENTUAL`
- `network`:
  - `enclosure`: `strict | moderate | open`
  - `allowedEgress[]`: host:port patterns (e.g. `api.stripe.com:443`)
- `security`:
  - `dataClassification[]`: `public | internal | confidential | pii`
  - `level`: `high | medium | low`
- `license`: SPDX identifier

## JSON Schema (outline)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spas.dev/schemas/spas.json",
  "type": "object",
  "required": ["id", "version", "boundedContext", "capabilities", "endpoints", "runtime", "security", "network"],
  "properties": {
    "id": {"type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"},
    "name": {"type": "string"},
    "version": {"type": "string"},
    "boundedContext": {"type": "string"},
    "capabilities": {"type": "array", "items": {"type": "string"}},
    "domainContext": {"type": "string"},
    "endpoints": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "grpcMethod", "category"],
        "properties": {
          "name": {"type": "string"},
          "grpcMethod": {"type": "string"},
          "category": {"enum": ["command", "query"]},
          "idempotencyKeyField": {"type": "string"},
          "description": {"type": "string"}
        }
      }
    },
    "eventsPublished": {
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
    "eventsSubscribed": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "handler"],
        "properties": {
          "type": {"type": "string"},
          "handler": {"type": "string"},
          "schemaRef": {"type": "string"}
        }
      }
    },
    "schemas": {"type": "array"},
    "mappings": {"type": "array", "items": {"type": "string"}},
    "runtime": {
      "type": "object",
      "properties": {
        "image": {"type": "string"},
        "resources": {"type": "object"},
        "env": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["image"]
    },
    "idempotency": {
      "type": "object",
      "properties": {
        "strategy": {"enum": ["NONE", "KEY", "NATURAL", "CUSTOM"]}
      },
      "required": ["strategy"]
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
        "enclosure": {"enum": ["strict", "moderate", "open"]},
        "allowedEgress": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["enclosure"]
    },
    "security": {
      "type": "object",
      "properties": {
        "level": {"enum": ["high", "medium", "low"]},
        "dataClassification": {"type": "array", "items": {"enum": ["public", "internal", "confidential", "pii"]}}
      }
    },
    "license": {"type": "string"}
  }
}
```

## Example (PoC Simplified)

```jsonc
{
  "id": "payment-service",
  "name": "Payment Service",
  "version": "1.2.0",
  "boundedContext": "payments",
  "capabilities": ["process-payment", "refund-payment"],
  "endpoints": [
    {
      "name": "CompletePayment",
      "grpcMethod": "payments.v1.PaymentService/CompletePayment",
      "category": "command",
      "idempotencyKeyField": "paymentId"
    }
  ],
  "eventsPublished": [
    {"type": "payments.payment-completed.v1", "schemaRef": "schemas/payment_completed_v1.json"}
  ],
  "eventsSubscribed": [
    {"type": "orders.order-created.v1", "handler": "payments.v1.PaymentService/HandleOrderCreated"}
  ],
  "schemas": ["schemas/payment_completed_v1.json", "schemas/order_created_v1.json"],
  "mappings": ["mappings/order_created_to_internal.yaml"],
  "runtime": {"image": "acme/payment-service:1.2.0", "env": ["STRIPE_API_KEY"]},
  "idempotency": {"strategy": "KEY"},
  "consistency": {"commands": "ACID", "queries": "EVENTUAL"},
  "network": {"enclosure": "strict", "allowedEgress": ["api.stripe.com:443"]},
  "security": {"level": "high", "dataClassification": ["pii"]},
  "license": "Apache-2.0"
}
```

## Related Documents

- [Repository Specification](../component-specification/12-repository-spec.md)
- [Schema Registry](../infrastructure/16-schema-registry.md)
- [Compliance Checklist](../governance/24-compliance-checklist.md)
