# SPAS Agent Instructions (GitHub Copilot)

**Last Updated**: 2026-01-01  
**Current Branch**: `main`  
**Current Feature**: Feature 026 Complete - Ready for new features

---

## 🎯 Quick Context

**What is SPAS?**  
Service Pattern Architecture System - A framework for building event-driven microservices with standardized metadata, sidecar-based event publishing, and composition tooling.

**Recent Completion**: Feature 026 - .NET SDK Controller Support ✅ COMPLETE (2025-12-31)

**Critical Testing Pattern**:
- ⚠️ Agent builds code (`dotnet build`, `npm run build`)
- ⚠️ User runs tests manually (VS Code terminal crashes when agent captures test output)
- Pattern established across all features

---

## 📋 Project Governance

- **Constitution**: `.specify/memory/constitution.md` (v1.0.5)
- **Architecture**: `principles/02-architecture-overview.md`
- **Decisions Log**: `principles/appendix/28-decision-log.md`
- **SpecKit Workflow**: `.specify/scripts/` - Feature planning methodology

**Key Principles**:
- Unit tests REQUIRED per user story (PoC and Production)
- Integration tests OPTIONAL during PoC, REQUIRED before Production
- SDK prepares events, Sidecar wraps CloudEvents
- Non-breaking extensions preferred
- Offline metadata generation (design-time)

---

## 🔧 Component: .NET SDK

**Status**: ✅ Complete (Production-Ready)

**Location**: `components/sdk/dotnet/`

**Documentation**:
- Feature 001 (Foundation): `specs/001-dotnet-spas-sdk/`
- Feature 026 (Controllers): `specs/026-dotnet-controller-support/` ✅ COMPLETE (2025-12-31)

**Technology**:
- .NET 10.0 (net10.0 target)
- ASP.NET Core (Minimal APIs + MVC Controllers)
- NJsonSchema 11.1.0 (schema generation)
- System.Text.Json, Microsoft.Extensions.*
- xUnit (testing)

**Project Structure**:

```text
components/sdk/dotnet/
├── SPAS.SDK.sln
├── src/
│   ├── Spas.Sdk.Core/              # Base types, interfaces
│   ├── Spas.Sdk.Metadata/          # ✅ Controller discovery complete
│   ├── Spas.Sdk.Events/            # Event publishing to sidecar
│   ├── Spas.Sdk.Observability/     # OpenTelemetry integration
│   ├── Spas.Sdk.Inbound/           # (Minimal - using native ASP.NET)
│   ├── Spas.Sdk.Configuration/     # (Minimal - using IConfiguration)
│   └── Spas.Sdk.Testing/           # Test utilities
├── test/
│   └── Spas.Sdk.*.Tests/           # ✅ 195 tests passing
└── examples/
    └── SampleService/              # Example with both patterns
```

**Key Features**:
- Attribute-based metadata: `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]`
- Offline metadata generation: `--generate-metadata`
- Event publishing with W3C Trace Context
- Single-line setup: `AddSpasServices()` + `RunSpasServiceAsync()`
- ✅ **NEW**: Full ASP.NET Core MVC Controller support
- ✅ **NEW**: Mixed Minimal API + Controller support
- ✅ **NEW**: Schema inference from `[FromBody]` parameters
- ✅ **NEW**: Controller-based event production

**Recent Completion (Feature 026)**:
- Added ASP.NET Core MVC Controller metadata discovery
- NON-BREAKING: All Minimal API functionality preserved
- Same attributes work on both Minimal API and Controllers
- Request schema inference from controller actions
- 195 tests passing, 74.33% coverage
- All 4 example services converted to controller-only architecture
- See: `specs/026-dotnet-controller-support/COMPLETION.md`

**Commands**:

```powershell
cd components/sdk/dotnet

# Build (agent-safe)
dotnet build --no-restore

# Tests (user runs)
dotnet test --no-build --verbosity minimal

# Generate metadata from service
cd examples/SampleService
dotnet run -- --generate-metadata --output ./metadata
```

---

## 🔧 Component: Java SDK

**Status**: ✅ Complete (PoC)

**Location**: `components/sdk/java/`

**Documentation**: `specs/016-java-spas-sdk/`

**Technology**:
- Java 17+ (Spring Boot 3.x integration)
- Jackson (JSON serialization)
- Maven build system

**Key Features**:
- Annotation-based metadata: `@SpasCommand`, `@SpasQuery`, `@SpasEvent`
- Spring Boot auto-configuration
- Controller support (via `@RestController`)

**Commands**:

```bash
cd components/sdk/java
mvn clean install
```

---

## 🔧 Component: spas-service CLI

**Status**: ✅ Complete (PoC)

**Location**: `components/cli/spas-service/`

**Documentation**:
- Feature 004: `specs/004-spas-service-cli/`
- Feature 022: `specs/022-spas-service-init/`

**Technology**:
- TypeScript 5.x, Node.js 20 LTS
- Commander.js (CLI framework)
- Eta 4.x (templating engine for agent prompts)
- axios, adm-zip, form-data

**Commands**:

```bash
spas-service init <service-name>       # Create workspace + agent prompts
spas-service publish --archive <path>  # Publish to repository
spas-service pull <name> <version>     # Download metadata
```

**Template Files** (`.eta` format):
- `templates/agent-prompt.eta` - Agent instructions (✅ Updated for controllers)
- `templates/partials/sdk-patterns.eta` - SDK examples (✅ Controller patterns added)
- `templates/readme.eta`, `templates/prompt-trigger.eta` - Workspace docs

**Note**: Templates are for agent prompts/docs, NOT code generation. Code examples live in `examples/services/`.

**Build & Test**:

```bash
cd components/cli/spas-service
npm install
npm run build
npm test  # 48/48 passing
```

---

## 🔧 Component: spas-compose CLI

**Status**: ✅ Complete (PoC)

**Location**: `components/cli/spas-compose/`

**Documentation**: `specs/005-spas-compose-cli/`

**Technology**:
- TypeScript 5.3+, Node.js 20 LTS
- Commander.js, js-yaml, jsonata, chalk

**Commands**:

```bash
spas-compose init          # Initialize domain workspace
spas-compose generate      # Generate docker-compose from metadata
```

---

## 🔧 Component: Repository Service

**Status**: ✅ Complete (PoC)

**Location**: `components/repository/`

**Documentation**: `specs/003-repository-service/`

**Technology**:
- TypeScript 5.9.3, Node.js (ES2022)
- Fastify 5.6.2 (HTTP framework)
- better-sqlite3 12.5.0 (storage)
- ajv 8.17.1 (JSON Schema validation)

**Features**:
- Service metadata publishing/retrieval
- Version management
- SQLite storage (PoC), PostgreSQL (Production plan)

**Commands**:

```bash
cd components/repository
npm install
npm start
```

---

## 🔧 Component: Sidecar

**Status**: ✅ Complete (PoC)

**Location**: `components/sidecar/`

**Documentation**: `specs/007-spas-sidecar/`

**Technology**:
- TypeScript 5.3+, Node.js 20+
- Express.js (HTTP server)
- Redis Streams (message broker)
- jsonata 2.x (transformations)

**Features**:
- Event publishing endpoint (`/publish`)
- CloudEvents wrapping (follows CloudEvents v1.0 spec)
- Transform loading from metadata
- Redis Streams integration

**Commands**:

```bash
cd components/sidecar
npm install
npm start
```

---

## 📚 Component: Example Services

**Status**: ✅ Complete - All services updated with controller support

**Location**: `examples/services/`

**Services**:
1. **order-service** (.NET 10) - Order management ✅ Controller-only
2. **product-service** (.NET 10) - Product catalog ✅ Controller-only
3. **inventory-service** (.NET 10) - Stock management ✅ Controller-only
4. **subscription-service** (.NET 10) - Subscriptions ✅ Controller-only
5. **basket-service** (Java/Spring Boot) - Shopping basket
6. **fulfillment-service** (Java/Spring Boot) - Order fulfillment

**Purpose**:
- Real-world usage patterns
- Integration testing
- Reference for developers (NOT templates)

**Recent Updates (Feature 026)**:
- All 4 .NET services converted to controller-only architecture
- Health endpoints separated to dedicated `HealthController.cs` files
- Program.cs simplified (~45 lines each)
- All services generate metadata successfully

**Commands**:

```bash
cd examples/services

# Build all services
.\Build-Services.ps1

# Get metadata from a service
.\Get-ServiceMetadata.ps1 -ServiceName order-service

# Publish to repository
.\Publish-Services.ps1
```

---

## 🛠️ Active Technologies Summary

### Languages & Frameworks
- C# / .NET 10.0, ASP.NET Core (Minimal APIs + MVC Controllers)
- Java 17+, Spring Boot 3.x
- TypeScript 5.3+, Node.js 20 LTS

### Testing
- xUnit (.NET)
- JUnit (Java)
- Jest (TypeScript/Node.js)

### Schema & Validation
- NJsonSchema 11.1.0 (.NET schema generation)
- JsonSchema.Net 6.0.0
- JSON Schema Draft-07
- Ajv 8.x (Node.js validation)

### Storage & Messaging
- SQLite (repository - PoC)
- Redis Streams (sidecar message broker)
- Filesystem (metadata archives)

### Latest Additions (Feature 026 - In Progress)
- ASP.NET Core MVC `IActionDescriptorCollectionProvider`
- `ControllerActionDescriptor` (action metadata)
- `AttributeRouteInfo` (route resolution)

---

## 🚀 Quick Start for New Agents

### Understand Current Feature

1. Read `specs/026-dotnet-controller-support/spec.md`
2. Read `specs/026-dotnet-controller-support/plan.md`
3. Read `specs/026-dotnet-controller-support/research.md`
4. Read `specs/026-dotnet-controller-support/quickstart.md`

### Build & Validate

```powershell
# .NET SDK
cd components/sdk/dotnet
dotnet build

# CLI Tools
cd components/cli/spas-service
npm install && npm run build

cd components/cli/spas-compose
npm install && npm run build

# Repository
cd components/repository
npm install && npm run build

# Sidecar
cd components/sidecar
npm install && npm run build
```

### Common Patterns

- **Metadata Generation**: `dotnet run -- --generate-metadata --output ./metadata`
- **Publish to Repository**: `spas-service publish --archive ./metadata/service.metadata.zip`
- **Service Discovery**: SDK auto-discovers endpoints with `[SpasCommand]`/`[SpasQuery]` attributes
- **Event Publishing**: `IEventPublisher.PublishAsync(event)` (SDK → Sidecar → Redis)

---

## 📖 Essential Links

- **Constitution**: `.specify/memory/constitution.md` (v1.0.5)
- **Architecture**: `principles/02-architecture-overview.md`
- **SDK Principles**: `principles/component/12-sdk.md`
- **Current Feature**: `specs/026-dotnet-controller-support/`
- **All Specs**: `specs/` (001 through 026)
- **Decisions**: `principles/appendix/28-decision-log.md`

---

## 🐛 Known Issues & Patterns

### Testing Pattern (CRITICAL)

- **Agent**: Can build (`dotnet build`, `npm run build`)
- **User**: Must run tests manually (terminal crashes when agent captures output)
- **Established**: Used across all features successfully

### PoC vs Production

- **PoC**: HTTP, SQLite, identity in payload, Zipkin tracing
- **Production**: gRPC, PostgreSQL, mTLS/SPIFFE, full OTel, Prometheus

### .NET SDK Warnings (Non-Blocking)

- OpenTelemetry.Api 1.10.0 CVE (NU1902) - Upgrade to 2.0+ for Production
- Package pruning warnings (NU1510) - Cosmetic only
- Tracked in `specs/001-dotnet-spas-sdk/SECURITY.md`

---

## 📝 Completion Reports

When completing or updating features, update `specs/<feature>/COMPLETION.md`:

- **Post-Implementation Bug Fixes**: Symptom → root cause → fix → files
- **Future Enhancements**: Non-critical improvements
- See `specs/013-agent-prompt-enrichment/COMPLETION.md` for example structure

---
