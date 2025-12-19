# Data Model: Java SPAS SDK

**Feature**: 016-java-spas-sdk  
**Date**: 2025-12-19  
**Phase**: 1 - Design & Contracts

## Entity Overview

The Java SDK data model mirrors the .NET SDK structure and aligns with the `design-time-metadata-v1.schema.json` schema.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ServiceMetadata                               │
│  (Root entity - serializes to spas.json)                            │
├─────────────────────────────────────────────────────────────────────┤
│  schemaVersion: "design-time-metadata-v1"                           │
│  id, name, description, version, boundedContext                     │
│  capabilities: List<String>                                         │
├──────────────┬───────────────┬──────────────┬──────────────────────┤
│  endpoints   │    events     │  consistency │  security   network  │
│  List<>      │    List<>     │              │                      │
└──────┬───────┴───────┬───────┴──────┬───────┴──────────────────────┘
       │               │              │
       ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Endpoint     │ │ Event        │ │ Consistency  │
│ Contract     │ │ Contract     │ │              │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ name         │ │ type         │ │ commands     │
│ type         │ │ version      │ │ queries      │
│ protocol     │ │ schemaRef    │ └──────────────┘
│ methodPath   │ └──────────────┘
│ version      │        ┌──────────────┐ ┌──────────────┐
│ schemaRef    │        │ Security     │ │ Network      │
└──────────────┘        ├──────────────┤ ├──────────────┤
                        │ authentication│ │ requiredEgress│
                        │ dataClassification│ └──────────────┘
                        └──────────────┘
```

## Core Entities

### ServiceMetadata

**Purpose**: Root entity representing complete service metadata; serializes to `spas.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| schemaVersion | String | Yes | Always "design-time-metadata-v1" |
| id | String | Yes | Unique service identifier (kebab-case) |
| name | String | Yes | Human-readable service name |
| description | String | No | Service description |
| version | String | Yes | Semantic version (e.g., "1.0.0") |
| boundedContext | String | Yes | Domain bounded context |
| capabilities | List<String> | No | Service capabilities |
| endpoints | List<EndpointContract> | No | Command/Query endpoints |
| events | List<EventContract> | No | Published events |
| consistency | Consistency | No | Consistency guarantees |
| security | Security | No | Security metadata |
| network | Network | No | Network requirements |
| license | String | No | License identifier |

**Validation Rules**:
- `version` must match semver pattern: `^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$`
- `id` should be kebab-case

---

### EndpointContract

**Purpose**: Describes a Command or Query endpoint

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Endpoint name (kebab-case in output) |
| type | EndpointType | Yes | COMMAND or QUERY |
| protocol | Protocol | Yes | HTTP or GRPC |
| methodPath | String | Yes | e.g., "POST /api/orders" |
| version | String | Yes | Endpoint version |
| schemaRef | String | Yes | URI reference to schema |

**Enum: EndpointType**: `COMMAND`, `QUERY`  
**Enum: Protocol**: `HTTP`, `GRPC`

---

### EventContract

**Purpose**: Describes a published event

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | String | Yes | Event type (kebab-case in output) |
| version | String | Yes | Event schema version |
| schemaRef | String | Yes | URI reference to event schema |

---

### Consistency

**Purpose**: Declares consistency guarantees

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| commands | ConsistencyLevel | No | ACID or EVENTUAL |
| queries | QueryConsistencyLevel | No | STRONG or EVENTUAL |

**Enum: ConsistencyLevel**: `ACID`, `EVENTUAL`  
**Enum: QueryConsistencyLevel**: `STRONG`, `EVENTUAL`

---

### Security

**Purpose**: Security configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| authentication | Authentication | No | Auth configuration |
| dataClassification | List<DataClassification> | Yes | At least one required |

**Enum: DataClassification**: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`

---

### Authentication

**Purpose**: Authentication mechanism details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | AuthType | No | Authentication mechanism |
| requiredScopes | List<String> | No | OAuth2/OIDC scopes |

**Enum: AuthType**: `OAUTH2`, `JWT`, `API_KEY`, `MTLS`, `NONE`

---

### Network

**Purpose**: Network requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| requiredEgress | List<String> | No | Required outbound dependencies |

---

## Context Entities

### SpasTrace

**Purpose**: W3C Trace Context storage (thread-local)

| Field | Type | Description |
|-------|------|-------------|
| traceId | String | 32 hex chars (16 bytes) |
| spanId | String | 16 hex chars (8 bytes) |
| traceFlags | String | 2 hex chars (e.g., "01" for sampled) |
| traceState | String | Optional vendor-specific state |

**Static Methods**:
- `current()` → SpasTrace
- `setCurrent(SpasTrace)` → void
- `clear()` → void
- `parseTraceparent(String)` → SpasTrace
- `toTraceparent()` → String

---

### SpasContext

**Purpose**: Request context with correlation and identity

| Field | Type | Description |
|-------|------|-------------|
| correlationId | String | Request correlation ID |
| userId | String | User identity (optional) |
| tenantId | String | Tenant identity (optional) |

**Static Methods**:
- `current()` → SpasContext
- `setCurrent(SpasContext)` → void
- `clear()` → void
- `wrap(Runnable)` → Runnable (propagates context)
- `wrap(Callable<T>)` → Callable<T> (propagates context)

---

## Annotation Types

### @SpasCommand

**Purpose**: Marks a method as a SPAS Command endpoint

| Element | Type | Default | Description |
|---------|------|---------|-------------|
| value | String | Required | Command name (converted to kebab-case) |
| version | String | "1.0" | Endpoint version |
| schemaRef | String | "" | Schema reference URI |

**Target**: METHOD  
**Retention**: SOURCE (processed at compile time)

---

### @SpasQuery

**Purpose**: Marks a method as a SPAS Query endpoint

| Element | Type | Default | Description |
|---------|------|---------|-------------|
| value | String | Required | Query name (converted to kebab-case) |
| version | String | "1.0" | Endpoint version |
| schemaRef | String | "" | Schema reference URI |

**Target**: METHOD  
**Retention**: SOURCE (processed at compile time)

---

### @SpasEvent

**Purpose**: Marks a class as a SPAS Event

| Element | Type | Default | Description |
|---------|------|---------|-------------|
| value | String | Required | Event type (converted to kebab-case) |
| version | String | "1.0" | Event version |
| schemaRef | String | "" | Schema reference URI |

**Target**: TYPE  
**Retention**: RUNTIME (needed by EventPublisher)

---

## Builder Classes

### ServiceIdentityBuilder

```java
ServiceIdentityBuilder.create()
    .withId("order-service")
    .withName("Order Service")
    .withVersion("1.0.0")
    .withBoundedContext("orders")
    .withDescription("Manages order lifecycle")
    .addCapability("order-management")
    .addCapability("order-tracking")
    .build() → ServiceIdentity
```

### SecurityBuilder

```java
SecurityBuilder.create()
    .withAuthenticationType(AuthType.JWT)
    .addRequiredScope("orders:read")
    .addDataClassification(DataClassification.CONFIDENTIAL)
    .build() → Security
```

### ConsistencyBuilder

```java
ConsistencyBuilder.create()
    .withCommands(ConsistencyLevel.ACID)
    .withQueries(QueryConsistencyLevel.EVENTUAL)
    .build() → Consistency
```

### NetworkBuilder

```java
NetworkBuilder.create()
    .addRequiredEgress("inventory-service")
    .addRequiredEgress("payment-gateway")
    .build() → Network
```

### MetadataComposer

```java
MetadataComposer.create()
    .withIdentity(identity)
    .withEndpoints(endpoints)
    .withEvents(events)
    .withSecurity(security)
    .withConsistency(consistency)
    .withNetwork(network)
    .compose() → ServiceMetadata
```

---

## State Transitions

### SpasContext Lifecycle

```
Request Arrives
      │
      ▼
┌─────────────────┐
│ Extract Headers │  SpasContextFilter
│ traceparent     │
│ x-correlation-id│
│ x-user-id       │
│ x-tenant-id     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set ThreadLocal │  SpasContext.setCurrent()
│ SpasTrace       │  SpasTrace.setCurrent()
│ SpasContext     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Handler Executes│  Business logic
│                 │  SpasContext.current() available
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Publish Event   │  EventPublisher reads context
│ (if needed)     │  Adds headers to request
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clear ThreadLocal│  SpasContext.clear()
│                 │  SpasTrace.clear()
└─────────────────┘
```

### Metadata Generation Flow

```
Maven Compile Phase
      │
      ▼
┌─────────────────────┐
│ SpasAnnotationProcessor │
│ scans source files      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────┐
│ Discover annotations │
│ @SpasCommand         │
│ @SpasQuery           │
│ @SpasEvent           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────┐
│ Build metadata model │
│ from annotations +   │
│ builder config       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────┐
│ Normalize names     │
│ to kebab-case       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────┐
│ Serialize to JSON   │
│ Jackson ObjectMapper│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────┐
│ Write spas.json     │
│ to target/classes/  │
│ or target/spas/     │
└─────────────────────┘
```
