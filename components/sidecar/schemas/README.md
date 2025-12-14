# Sidecar Configuration Schemas

This directory contains JSON Schema definitions for SPAS sidecar configuration files.

## Available Schemas

| Schema | Description |
|--------|-------------|
| [sidecar-config-v1.schema.json](./sidecar-config-v1.schema.json) | Configuration schema for `config.{serviceName}.json` files |

## Usage

### Validation

Use any JSON Schema validator to validate sidecar config files:

```bash
# Using ajv-cli
npx ajv validate -s sidecar-config-v1.schema.json -d config.order-service.json

# Using check-jsonschema
check-jsonschema --schemafile sidecar-config-v1.schema.json config.order-service.json
```

### IDE Support

Add schema reference to config files for IntelliSense:

```json
{
  "$schema": "https://spas.dev/schemas/sidecar-config-v1.schema.json",
  "inbound": [...],
  "outbound": [...]
}
```

### AI Agent Usage

The `/spas.compose` agent uses this schema to understand sidecar configuration structure when generating choreography. The mapping is:

| Choreography | Sidecar Config |
|--------------|----------------|
| `events[].targets[]` | `inbound[]` (kind: event) |
| `events[].source` | `outbound[]` |
| Command invocations | `inbound[]` (kind: command) |

## Schema Structure

```
SidecarConfig
├── inbound[]          # Event subscriptions and command handlers
│   ├── kind           # "event" or "command"
│   ├── topic          # Topic name (required for events)
│   ├── command        # Command name (required for commands)
│   ├── transform      # Optional JSONata transformation path
│   └── invokeEndpoint # Service HTTP endpoint to call
│
└── outbound[]         # Event publication configurations
    ├── topic          # Target topic name
    ├── eventType      # Event type for routing (optional)
    └── transform      # Optional JSONata transformation path
```

## Future Work

> **Note**: If runtime validation of sidecar config files is needed in `spas-compose choreography deploy`, 
> create a dedicated feature spec (e.g., `009-sidecar-config-validation`) to implement:
> - Config validation during deploy
> - Schema-based error messages
> - Config compatibility checks between sidecar versions

## Related Documents

- [Sidecar Contract](../../../principles/component/10-sidecar-contract.md)
- [Choreography Schema](../../../specs/005-spas-compose-cli/contracts/choreography-schema.yaml)
- [Agent Prompt Contract](../../../specs/005-spas-compose-cli/contracts/agent-prompt.md)
