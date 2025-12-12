# SPAS Specification Index

Quick navigation to SPAS specification documents organized by concern and audience.

## Foundation (Start Here)

- **[01-core-principles.md](01-core-principles.md)** - Immutable principles guiding SPAS design
- **[02-architecture-overview.md](02-architecture-overview.md)** - High-level system architecture
- **[SPAS Framework Constitution](../.specify/memory/constitution.md)** - Governance, cross-component boundaries, and universal rules

## For Service Developers

- **[service-specification/03-service-model.md](service-specification/03-service-model.md)** - What makes a service SPAS-compliant
- **[service-specification/04-service-contract.md](service-specification/04-service-contract.md)** - Service definition and contracts
- **[service-specification/05-service-lifecycle.md](service-specification/05-service-lifecycle.md)** - Service build, package, deploy
- **[service-specification/06-service-metadata.md](service-specification/06-service-metadata.md)** - Metadata schema (spas.json)

## Communication Protocols

- **[protocol-specification/07-communication-model.md](protocol-specification/07-communication-model.md)** - North-South and East-West patterns
- **[protocol-specification/08-grpc-protocol.md](protocol-specification/08-grpc-protocol.md)** - gRPC service definition standards
- **[protocol-specification/09-event-protocol.md](protocol-specification/09-event-protocol.md)** - CloudEvents format and semantics

## Platform Components

- **[component-specification/10-sidecar-contract.md](component-specification/10-sidecar-contract.md)** - Sidecar/mesh responsibilities
- **[component-specification/11-repository-spec.md](component-specification/11-repository-spec.md)** - SPAS Repository
- **[component-specification/12-sdk-specification.md](component-specification/12-sdk-specification.md)** - SDK requirements
- **[component-specification/13-cli-specification.md](component-specification/13-cli-specification.md)** - CLI tools
- **[component-specification/14-domain-choreography.md](component-specification/14-domain-choreography.md)** - Message transformation and choreography

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

| Concept | Document |
|---------|----------|
| Bounded Context | [Service Model](service-specification/03-service-model.md) |
| Domain Context | [Domain Choreography](component-specification/14-domain-choreography.md) |
| Choreography | [Domain Choreography](component-specification/14-domain-choreography.md) |
| CloudEvents | [Event Protocol](protocol-specification/09-event-protocol.md) |
| Sidecar Pattern | [Sidecar Contract](component-specification/10-sidecar-contract.md) |
| W3C Trace Context | [Communication Model](protocol-specification/07-communication-model.md) |
| Service Mesh | [Sidecar Contract](component-specification/10-sidecar-contract.md) |

## By Audience

**I want to build a SPAS service**
→ Start with [Core Principles](01-core-principles.md), then [Service Model](service-specification/03-service-model.md) and [Service Contract](service-specification/04-service-contract.md)

**I want to compose services into a Domain Context**
→ Read [Domain Choreography](component-specification/14-domain-choreography.md) and [Communication Model](protocol-specification/07-communication-model.md)

**I want to implement a sidecar or SDK**
→ Start with [Sidecar Contract](component-specification/10-sidecar-contract.md), [Event Protocol](protocol-specification/09-event-protocol.md), and [Domain Choreography](component-specification/14-domain-choreography.md)

**I want to deploy SPAS services**
→ Read [Service Lifecycle](service-specification/05-service-lifecycle.md) and [Runtime Environment](infrastructure/17-runtime-environment.md)

**I'm concerned about security**
→ Read [Core Principles](01-core-principles.md) (Security by Default), then [Security Model](security/19-security-model.md)

**I want to understand architectural decisions**
→ Read [Architecture Overview](02-architecture-overview.md) and [Decision Log](appendix/28-decision-log.md)
