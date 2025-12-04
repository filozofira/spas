# 💡 Intro

This document contains the information produced during the research phase in this project.

## 🎯 Core Framework Components Analysis

Here are some suggestions to begin with:

|Component|Description|
|--|--|
|SPAS repository|A marketplace where developers can push-to or pull-from SPAS enabled services.|
|SPAS SDK|An SDK for different frameworks/languages, enabling developers to build SPAS enabled service quicker and easier.|
|SPAS protocol|allows services to effectively assimilate in different domain contexts, I.e. choregraphy where services can wire up to consume and produce events, leveraging SPAS components that can be configured to transform inbound and outbound events to make this possible.|
|SPAS-CLI|allowing developers to perform various tasks, such as pushing SPAS enabled service to or pulling SPAS enabled service from the SPAS repo, or to configure SPAS service to participation in the given domain choreography, etc.|
|SPAS Control Plain|allows developers to view all SPAS services and how they adapt to Domain choregraphy.|

### 1. **SPAS Repository/Marketplace**

- **Purpose**: Central registry for discoverable, reusable services
- **Key Features**:
  - Service metadata (capabilities, inbound endpoints, outbound events, inbound schemas and dependencies)
  - Versioning and compatibility tracking
  - Quality metrics and community ratings
  - License management for reusable components

### 2. **SPAS SDK**

- **Layers** I would suggest:
  - **Core SDK**: Abstract base classes, interfaces, common utilities
  - **Framework Adapters**: Spring Boot, .NET, Node.js, Python implementations
  - **Domain Templates**: Pre-built templates for common domains (ordering, billing, inventory)

### 3. **SPAS Protocol** - This is CRITICAL

This should include:

- **Service Discovery Protocol**: How services find each other
- **Event Contract Protocol**: Standardized event schemas and versioning
- **Capability Advertisement**: How services declare what they can do
- **Adaptation Handshake**: Protocol for services to negotiate their role in a specific domain

### 4. **SPAS CLI**

Commands I envision:

```bash
spas init --template order-service
spas publish --service my-order-service
spas discover --capability payment-processing
spas choreograph --domain ecommerce --services order,payment,notification
```

### 5. **SPAS Control Plane** - Essential for operational maturity

Should include:

- **Choreography Orchestrator**: Manages service compositions
- **Health & Compliance Monitor**: Ensures services adhere to SPAS principles
- **Adaptation Manager**: Handles dynamic re-wiring of services

## 🚀 Additional Critical Components worth considering

### 6. **SPAS Contract Registry**

- Stores and manages event schemas, data contracts, and API specifications
- Enforces compatibility between service versions
- Provides contract testing capabilities

### 7. **SPAS Composition Engine**

- Visual tool for designing domain choreographies
- Validates service compatibility within compositions
- Generates deployment descriptors for specific domains

### 8. **SPAS Adaptation Runtime**

- Dynamic configuration injector based on domain context
- Service capability resolver
- Fallback and circuit-breaking mechanisms

### 9. **SPAS Governance Dashboard**

- Monitoring service reuse metrics
- Compliance checking against SPAS principles
- Cost optimization and performance analytics

### 10. **SPAS Testing Harness**

- Framework for testing services in isolation and in composition
- Mock event generators for different domain scenarios
- Integration testing utilities

## 🏗️ Proposed Architecture Stack

```text
┌─────────────────────────────────────────────────┐
│               SPAS Governance Layer             │
│  Dashboard · Control Plane · Repository · CLI   │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│              Composition & Runtime              │
│  Composition Engine · Contract Registry ·       │
│  Adaptation Runtime · Testing Harness           │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│               Framework SDK Layer               │
│  Core Protocol · Framework Adapters · Templates │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│               Service Implementation            │
│           Actual SPAS Services                  │
└─────────────────────────────────────────────────┘
```

## 💡 Key Design Considerations

1. **Protocol First Approach**: The SPAS protocol should be framework-agnostic
2. **Progressive Enhancement**: Services can be "SPAS-enabled" to varying degrees
3. **Domain Composition vs Service Implementation**: Clear separation between building services and composing them for domains
4. **Metadata-Driven**: Heavy reliance on service metadata for discovery and adaptation

## 🔍 Critical Questions to Address

- How do services declare their **adaptability boundaries**? (What can change vs what's fixed)
- What's the **minimum viable SPAS service**? (Core requirements)
- How do you handle **cross-cutting concerns** (auth, logging, tracing) in a portable way?
- What's the **onboarding process** for existing services to become SPAS-compliant?

The key will be ensuring these components work together seamlessly while maintaining the core SPAS principles. The protocol and SDK will be the most technically challenging but also the most valuable parts.

## A Framework Blueprint and Implementation Suggestions

Instead of looking for a pre-packaged "SPAS framework," try combining following powerful tools and patterns to build solutions that fulfill the vision.

- **For Defining Boundaries**: Start with **EventStorming** or similar workshop techniques to discover your domain's Bounded Contexts and Aggregates. In DDD, an **Aggregate** is often a perfect candidate for a self-contained service.

- **For Communication and Choreography**: Fully embrace an **Event-Driven Architecture**.
  - Use **events as the "glue"** between services. A service within one Bounded Context publishes an event, and services in other contexts can subscribe to it to trigger their own logic.
  - Understand the semantic difference between a **Command** (an intent to do something) and an **Event** (a fact of something that happened). Commands are often directed, while events are broadcast for any interested party.

- **For Technical Implementation**:
  - **Containerization**: Package each service as a container for ultimate portability.
  - **Event Sourcing**: Consider this pattern, where the state of an entity is stored as a sequence of events. This provides a reliable audit trail and makes it easy to project data into different read models.
  - **CQRS (Command Query Responsibility Segregation)**: This pattern pairs well with Event Sourcing. It separates read and write operations, allowing you to optimize the query side for specific domains without affecting the command side.

## 🚧 Key Considerations and Potential Challenges

As you build this out, keep these points in mind:

- **Avoid the Distributed Monolith**: If you use events as implicit synchronous calls or create tight coupling, you risk building a distributed monolith, which has the worst traits of both monoliths and microservices.
- **Embrace Eventual Consistency**: In a system with choreographed, independent services, immediate data consistency is often impossible. You must design your system to handle eventual consistency.
- **Start Coarse-Grained**: When defining service boundaries, it's often safer to start with more coarse-grained services. **Splitting a service later is easier than merging multiple tightly intertwined ones**.
