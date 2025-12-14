# Data Model: Sidecar Config Generator

**Feature**: 006-sidecar-config-generator  
**Date**: 2025-12-14

## Entities

### SidecarConfig

Represents the configuration file for a single service's sidecar instance.

| Field    | Type            | Required | Description                              |
| -------- | --------------- | -------- | ---------------------------------------- |
| inbound  | InboundEntry[]  | Yes      | Event subscriptions and command handlers |
| outbound | OutboundEntry[] | Yes      | Event publication configurations         |

### InboundEntry

Configuration for receiving events or commands from the message broker.

| Field          | Type                 | Required    | Description                                                    |
| -------------- | -------------------- | ----------- | -------------------------------------------------------------- |
| kind           | "event" \| "command" | Yes         | Type of inbound message                                        |
| topic          | string               | Conditional | Topic name (required when kind="event")                        |
| command        | string               | Conditional | Command name (required when kind="command")                    |
| transform      | string               | No          | Path to JSONata transformation file, relative to sidecar mount |
| invokeEndpoint | string               | Yes         | HTTP endpoint path on the service to invoke                    |

**Validation Rules**:

- If `kind="event"`, `topic` is required
- If `kind="command"`, `command` is required
- `invokeEndpoint` must start with `/`

### OutboundEntry

Configuration for publishing events to the message broker.

| Field     | Type   | Required | Description                                                    |
| --------- | ------ | -------- | -------------------------------------------------------------- |
| topic     | string | Yes      | Topic name for published events                                |
| transform | string | No       | Path to JSONata transformation file, relative to sidecar mount |

### ConfigGeneratorResult

Result of the config generation process.

| Field   | Type                       | Description                         |
| ------- | -------------------------- | ----------------------------------- |
| success | boolean                    | Whether generation succeeded        |
| configs | Map<string, SidecarConfig> | Service name → config mapping       |
| errors  | ConfigError[]              | List of errors if generation failed |

### ConfigError

Error details for generation failures.

| Field   | Type                                  | Description                       |
| ------- | ------------------------------------- | --------------------------------- |
| service | string                                | Service name where error occurred |
| message | string                                | Human-readable error message      |
| type    | "MISSING_TRANSFORM" \| "INVALID_PATH" | Error category                    |

## Relationships

```
Choreography (input)
    └── flows: Flow[]
            └── events: EventRoute[]
                    ├── source → OutboundEntry (for source service)
                    └── targets: Target[]
                            └── Target → InboundEntry (for target service)

SidecarConfig (output, per service)
    ├── inbound: InboundEntry[]  (aggregated from all flows where service is target)
    └── outbound: OutboundEntry[] (aggregated from all flows where service is source)
```

## State Transitions

N/A — This feature generates static configuration files. No runtime state management.

## Transformation Mapping

### Choreography → SidecarConfig

| Choreography Field  | SidecarConfig Field                    | Transformation                            |
| ------------------- | -------------------------------------- | ----------------------------------------- |
| `eventRoute.source` | outbound entry for service             | Service name determines which config file |
| `eventRoute.topic`  | `inbound[].topic` / `outbound[].topic` | Direct copy                               |
| `target.transform`  | `inbound[].transform`                  | Resolve relative to sidecar mount         |
| N/A (default)       | `inbound[].invokeEndpoint`             | Default `/incoming`                       |
| N/A (default)       | `inbound[].kind`                       | Default `"event"`                         |

### Path Resolution Example

```
Choreography path: transformations/fulfillment-service/inbound-order-created.jsonata
Docker mount:      ./transformations/fulfillment-service:/app/transformations
Sidecar config:    transformations/inbound-order-created.jsonata
```

## Example

### Input: choreography.yaml

```yaml
flows:
  order-to-fulfillment:
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: order-created
        topic: orders-requested
        targets:
          - service: fulfillment-service
            transform: transformations/fulfillment-service/inbound-order-created.jsonata
```

### Output: config.order-service.json

```json
{
  "inbound": [],
  "outbound": [
    {
      "topic": "orders-requested"
    }
  ]
}
```

### Output: config.fulfillment-service.json

```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-requested",
      "transform": "transformations/inbound-order-created.jsonata",
      "invokeEndpoint": "/incoming"
    }
  ],
  "outbound": []
}
```
