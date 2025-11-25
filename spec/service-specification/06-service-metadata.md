# Service Metadata (`spas.json`)

Defines the service manifest schema and required fields.

## Overview

- Single source of truth for service identity, contracts, runtime, and security
- Stored in SPAS repository; links to container image digest

## Required Fields

- `id`: Unique service identifier (kebab-case)
- `name`: Human-readable name
- `version`: Semver string
- `boundedContext`: Name of bounded context
- `capabilities`: Array of predefined capability enums
- `domainContext`: Optional, informational default domain context
- `contracts`:
  - `grpc`: Path(s) to proto files or embedded schema reference
  - `events`:
    - `published[]`: name, version, schemaRef
    - `subscribed[]`: name, version, schemaRef
- `schemas`: Registry references to internal schemas
- `runtime`:
  - `image`: OCI image reference or digest
  - `resources`: cpu/memory guidance
  - `env`: environment variables (names only; no secrets)
- `security`:
  - `level`: high | medium | low
  - `dataClassification[]`: public | internal | confidential | pii
  - `enclosure`: strict | moderate | open (informative in PoC)
- `license`: SPDX identifier

## JSON Schema (outline)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spas.dev/schemas/spas.json",
  "type": "object",
  "required": ["id", "version", "boundedContext", "capabilities", "contracts", "runtime", "security"],
  "properties": {
    "id": {"type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"},
    "name": {"type": "string"},
    "version": {"type": "string"},
    "boundedContext": {"type": "string"},
    "capabilities": {"type": "array", "items": {"type": "string"}},
    "domainContext": {"type": "string"},
    "contracts": {
      "type": "object",
      "properties": {
        "grpc": {"type": ["string", "array"]},
        "events": {
          "type": "object",
          "properties": {
            "published": {"type": "array"},
            "subscribed": {"type": "array"}
          }
        }
      },
      "required": ["grpc", "events"]
    },
    "schemas": {"type": "array"},
    "runtime": {
      "type": "object",
      "properties": {
        "image": {"type": "string"},
        "resources": {"type": "object"},
        "env": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["image"]
    },
    "security": {
      "type": "object",
      "properties": {
        "level": {"enum": ["high", "medium", "low"]},
        "dataClassification": {"type": "array", "items": {"enum": ["public", "internal", "confidential", "pii"]}},
        "enclosure": {"enum": ["strict", "moderate", "open"]}
      }
    },
    "license": {"type": "string"}
  }
}
```

## Examples

- Basic example and advanced example to be added during repo implementation.

## Related Documents

- [Repository Specification](../infrastructure/13-repository-spec.md)
- [Schema Registry](../infrastructure/14-schema-registry.md)
- [Compliance Checklist](../governance/24-compliance-checklist.md)
