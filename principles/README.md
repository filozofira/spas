# SPAS Principles

SPAS principles documentation serves a dual audience: developers seeking architectural clarity and AI agents requiring precise constraints. This eliminates ambiguity during development, enabling high-fidelity code generation while ensuring both human and automated contributors align with the framework's core design.

**Treat these as living documents.** When implementation work reveals
needed changes to principles, update them immediately. This ensures
future developers and AI agents have accurate context.

Below you can find the quick navigation to SPAS principles documents organized by concern and audience.

## Foundation (Start Here)

- **[01-core-principles.md](01-core-principles.md)** - Immutable principles guiding SPAS design
- **[02-architecture-overview.md](02-architecture-overview.md)** - High-level system architecture
- **[SPAS Framework Constitution](../.specify/memory/constitution.md)** - Governance, cross-component boundaries, and universal rules

## For Service Developers

- **[service/03-service-model.md](service/03-service-model.md)** - What makes a service SPAS-compliant
- **[service/04-service-contract.md](service/04-service-contract.md)** - Service definition and contracts
- **[service/05-service-lifecycle.md](service/05-service-lifecycle.md)** - Service build, package, deploy
- **[service/06-service-metadata.md](service/06-service-metadata.md)** - Metadata schema (spas.json)

## Communication Protocols

- **[protocol/07-communication-model.md](protocol/07-communication-model.md)** - North-South and East-West patterns
- **[protocol/08-grpc-protocol.md](protocol/08-grpc-protocol.md)** - gRPC service definition standards
- **[protocol/09-event-protocol.md](protocol/09-event-protocol.md)** - CloudEvents format and semantics

## Platform Components

- **[component/10-sidecar-contract.md](component/10-sidecar-contract.md)** - Sidecar/mesh responsibilities
- **[component/11-repository.md](component/11-repository.md)** - SPAS Repository
- **[component/12-sdk.md](component/12-sdk.md)** - SDK requirements
- **[component/13-cli.md](component/13-cli.md)** - CLI tools
- **[component/14-domain-choreography.md](component/14-domain-choreography.md)** - Message transformation and choreography

## Infrastructure & Operations

- **[infrastructure/15-package-format.md](infrastructure/15-package-format.md)** - Service packaging (OCI images)
- **[infrastructure/16-schema-registry.md](infrastructure/16-schema-registry.md)** - Schema management
- **[infrastructure/17-runtime-environment.md](infrastructure/17-runtime-environment.md)** - Kubernetes, Docker Compose deployment

## Tooling & Testing

- **[tooling/18-testing-harness.md](tooling/18-testing-harness.md)** - Testing framework and choreography simulation

## Security

- **[security/19-security-model.md](security/19-security-model.md)** - Complete security model
- **[security/20-identity-access.md](security/20-identity-access.md)** - AuthN/AuthZ
- **[security/21-network-security.md](security/21-network-security.md)** - Network policies and encryption
- **[security/22-data-security.md](security/22-data-security.md)** - Data classification and protection

## Governance & Evolution

- **[governance/23-versioning-strategy.md](governance/23-versioning-strategy.md)** - Version management
- **[governance/24-compliance-checklist.md](governance/24-compliance-checklist.md)** - Compliance validation
- **[governance/25-evolution-policy.md](governance/25-evolution-policy.md)** - How the spec evolves

## Reference Materials

- **[appendix/26-reference-examples.md](appendix/26-reference-examples.md)** - Complete working examples
- **[appendix/27-glossary.md](appendix/27-glossary.md)** - Terminology
- **[appendix/28-decision-log.md](appendix/28-decision-log.md)** - Architecture Decision Records (ADRs)

## Key Concepts

| Concept           | Document                                                   |
| ----------------- | ---------------------------------------------------------- |
| Bounded Context   | [Service Model](service/03-service-model.md)               |
| Domain Context    | [Domain Choreography](component/14-domain-choreography.md) |
| Choreography      | [Domain Choreography](component/14-domain-choreography.md) |
| CloudEvents       | [Event Protocol](protocol/09-event-protocol.md)            |
| Sidecar Pattern   | [Sidecar Contract](component/10-sidecar-contract.md)       |
| W3C Trace Context | [Communication Model](protocol/07-communication-model.md)  |
| Service Mesh      | [Sidecar Contract](component/10-sidecar-contract.md)       |

## By Audience

**I want to build a SPAS service**
→ Start with [Core Principles](01-core-principles.md), then [Service Model](service/03-service-model.md) and [Service Contract](service/04-service-contract.md)

**I want to compose services into a Domain Context**
→ Read [Domain Choreography](component/14-domain-choreography.md) and [Communication Model](protocol/07-communication-model.md)

**I want to implement a sidecar or SDK**
→ Start with [Sidecar Contract](component/10-sidecar-contract.md), [Event Protocol](protocol/09-event-protocol.md), and [Domain Choreography](component/14-domain-choreography.md)

**I want to deploy SPAS services**
→ Read [Service Lifecycle](service/05-service-lifecycle.md) and [Runtime Environment](infrastructure/17-runtime-environment.md)

**I'm concerned about security**
→ Read [Core Principles](01-core-principles.md) (Security by Default), then [Security Model](security/19-security-model.md)

**I want to understand architectural decisions**
→ Read [Architecture Overview](02-architecture-overview.md) and [Decision Log](appendix/28-decision-log.md)

---

## Developer Cross-Reference Guide

When implementing features, use these patterns to navigate the spec:

### Building SDK Features

```text
Feature requested: "Event publishing API"
  ↓
Consult: component/12-sdk.md (SDK Specification > Responsibilities)
  ↓
Implement API to match spec examples
  ↓
Cross-check: service/04-service-contract.md (events[] published definitions)
  ↓
Validate: Examples match appendix/26-reference-examples.md
```

### Building Repository API

```text
Feature: "GET /services/{name}/{version}"
  ↓
Consult: component/11-repository.md (API Endpoints)
  ↓
Check schema: service/06-service-metadata.md
  ↓
Review: governance/24-compliance-checklist.md (validation requirements)
```

### Building CLI Commands

```text
Feature: "spas-service pack"
  ↓
Consult: component/13-cli.md (Commands section)
  ↓
Understand input: service/06-service-metadata.md (spas.json schema)
  ↓
Understand output: infrastructure/15-package-format.md
  ↓
Validate: Examples from appendix/26-reference-examples.md
```

---

## Quick Specification Lookup

| Component | Spec Reference | Purpose |
|-----------|----------------|----------|
| SDK | [component/12-sdk.md](component/12-sdk.md) | Service development library |
| Repository | [component/11-repository.md](component/11-repository.md) | Metadata storage & discovery |
| CLI | [component/13-cli.md](component/13-cli.md) | Packaging & composition tooling |
| Sidecar | [component/10-sidecar-contract.md](component/10-sidecar-contract.md) | Runtime transformation & event I/O |
| Service Contracts | [service/04-service-contract.md](service/04-service-contract.md) | What services expose |
| Service Metadata | [service/06-service-metadata.md](service/06-service-metadata.md) | spas.json schema |
| Choreography | [component/14-domain-choreography.md](component/14-domain-choreography.md) | Adaptation & mapping |
| Communication | [protocol/07-communication-model.md](protocol/07-communication-model.md) | HTTP (PoC) → gRPC (prod) |
| Events | [protocol/09-event-protocol.md](protocol/09-event-protocol.md) | CloudEvents + W3C Trace Context |
| Decisions | [appendix/28-decision-log.md](appendix/28-decision-log.md) | Architecture Decision Records |
