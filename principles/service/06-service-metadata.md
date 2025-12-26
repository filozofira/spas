# Service Metadata (`spas.json`)

Defines the service manifest schema and required fields. Extended to include endpoint and event contract granularity, consistency declarations, and network egress specifics. The service emits **design-time** metadata only; the SPAS Repository emits **runtime** metadata.

## Overview

- Single source of truth for service identity, contracts, runtime, and security
- Design-time: generated offline as a metadata archive ZIP (see Design-Time Structure below)
- Runtime: produced by Repository during publish, using design-time metadata plus deployment runtime fields
- Storage: SPAS repository links to metadata + container image digest

## Design-Time Structure (Service Project Layout)

```text
./
  /metadata
    service.metadata.zip        (design-time metadata archive)
  /config
    (application-specific configuration)
  /src
    (service implementation)
```

The `service.metadata.zip` archive contains:

```text
spas.json
schemas/
  endpoints/
    *.schema.json
  events/
    *.schema.json
```

`spas.json` uses `schemaRef` to reference schemas inside the archive (for example: `schemas/endpoints/create-order.schema.json`).

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

### Command Produced Events Mapping (PoC)

To support choreography authors (and agents) without requiring source code inspection, services MAY include a `commands[]` section that declares which events a command produces when it succeeds.

- `commands[]`:
  - `name` (required): canonical command identifier, MUST be kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`).
  - `version` (optional): command contract version (semver recommended).
  - `produces[]` (optional): list of produced event references.
    - Each entry MUST be an object with:
      - `type` (required)
      - `version` (required)
      - `when` (required): for PoC, MUST be exactly `"success"`.

Rules:

- Each `(type, version)` pair in `commands[].produces[]` MUST reference an existing entry in `events[]`.
- Within a single command, `(type, version)` pairs in `produces[]` MUST be unique.

Notes:

- This section is additive and does not replace `endpoints[]`. `endpoints[]` describes how to invoke operations; `commands[]` describes canonical command identifiers and their produced event relationships.
- Do NOT manually update any `examples/**/spas.json` as part of this feature; examples will be regenerated during e2e testing.
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

> SPAS uses JSON Schema **draft-07** for all metadata and contract schemas (see ADR-039).

Canonical schema:

- [components/schemas/design-time-metadata-v1.schema.json](../../components/schemas/design-time-metadata-v1.schema.json)

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
