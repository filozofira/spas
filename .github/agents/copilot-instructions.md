# SPAS Copilot Instructions

Last updated: 2025-12-12

---

## 🤖 Agent Handover (New Machine / New Session)

**Current Feature State**: .NET SPAS SDK (001-dotnet-spas-sdk)

### ✅ Completion Status
- **Status**: ✅ Complete (PoC) - Ready for development/testing use
- **Completed**: 2025-12-12
- **Branch**: `001-dotnet-spas-sdk` (active feature branch)
- **Build**: ✅ Success (6 warnings documented in SECURITY.md)
- **Tests**: 88/88 passing (verified via `dotnet test --no-build`)

### 📁 Essential Reading (Priority Order)
1. **specs/001-dotnet-spas-sdk/COMPLETION.md** - Comprehensive completion summary with metrics
2. **specs/001-dotnet-spas-sdk/tasks.md** - All 60 tasks (marked complete), includes agent handover section
3. **specs/001-dotnet-spas-sdk/plan.md** - Architecture, tech stack, project structure
4. **specs/001-dotnet-spas-sdk/SECURITY.md** - PoC security review + Production migration checklist
5. **specs/001-dotnet-spas-sdk/quickstart.md** - Getting started guide

### 🎯 Key Context for New Agents

**What Was Built**:
- 7 SDK packages: Core, Metadata, Events, Observability, + 3 deferred/placeholder
- Attribute-based metadata auto-discovery (SpasCommandAttribute, SpasQueryAttribute, SpasEventAttribute)
- Event publishing to sidecar with W3C Trace Context propagation
- OpenTelemetry + Zipkin integration for distributed tracing
- Dev-only metadata endpoint (/_spas/metadata) with environment gating
- Single-line configuration: `AddSpasServices()` abstracts all SPAS infrastructure

**Critical Decisions Made**:
1. **FR-005 Deferred**: Spas.Sdk.Inbound empty - using native ASP.NET Core minimal APIs
   - Documented in `components/sdk/dotnet/src/Spas.Sdk.Inbound/README.md`
2. **FR-006 Deferred**: Spas.Sdk.Configuration minimal - using standard ASP.NET Core IConfiguration
3. **Configuration Pattern**: Environment variables match docker-compose prototype (SERVICE_NAME, SIDECAR_HOST, ZIPKIN_URL)
4. **Full Abstraction**: `AddSpasServices()` configures EventPublisher + OpenTelemetry + Zipkin in one call

**Known Issues** (Non-Blocking for PoC):
- OpenTelemetry.Api 1.10.0 has CVE (NU1902) - documented, requires upgrade to 2.0+ for Production
- Package pruning warnings (NU1510) - documented, cosmetic only
- All warnings tracked in SECURITY.md

### 🚀 Quick Start Commands
```powershell
# Navigate to SDK
cd components/sdk/dotnet

# Build (agent-safe)
dotnet build --no-restore

# Run tests (user should execute, agent can build only)
dotnet test --no-build --verbosity minimal

# Run sample service
cd examples/SampleService
dotnet run
```

### ⚠️ Testing Workflow (CRITICAL)
- **Agent builds**: Use `dotnet build` freely
- **User runs tests**: Terminal crashes when agent captures test output in VS Code
- **Established Pattern**: Agent builds, user confirms test results

### 📋 Next Actions if Work Resumes
- **PoC Deployment**: Follow quickstart.md to run with sidecar prototype
- **Production Hardening**: Start with SECURITY.md Migration Checklist (mTLS, Key Vault, OTel 2.0+)
- **Feature Additions**: Review deferred packages before adding new capabilities

---

## Common Guidance

- Testing Policy: Unit tests are REQUIRED per user story (PoC and Production). Integration tests are OPTIONAL during PoC unless explicitly requested; REQUIRED before non‑PoC releases. See .specify/memory/constitution.md (v1.0.3).
- Events Boundary: SDKs prepare payload/trace/correlation/identity; Sidecar wraps CloudEvents and performs transformations. See principles/component/12-sdk.md.
- Inbound Routing: SDKs are route‑agnostic. "/incoming" is a recommended sample default, not enforced.
- PoC vs Production: PoC uses HTTP, identity in payload, Zipkin tracing. Production introduces gRPC, mTLS/SPIFFE, full OTel, Prometheus, etc. See principles/02-architecture-overview.md.
- Specs Navigation: Start at principles/INDEX.md. Decisions recorded in principles/appendix/28-decision-log.md.

---

## Component: SDK (.NET)

- Status: Active feature (branch 001-dotnet-spas-sdk)
- Tech: .NET 10 (target net10.0), Microsoft.Extensions.Logging, System.Text.Json
- Layout: components/sdk/dotnet/{src,test,examples}
- Solution: components/sdk/dotnet/SPAS.SDK.sln
- Packages (src): Spas.Sdk.Core, Spas.Sdk.Metadata, Spas.Sdk.Events, Spas.Sdk.Inbound, Spas.Sdk.Configuration, Spas.Sdk.Observability, Spas.Sdk.Testing
- Tests (test): One test project per package (unit tests required per story)
- Example: components/sdk/dotnet/examples/SampleService
- Docs: specs/001-dotnet-spas-sdk/{plan.md, spec.md, tasks.md}
- Boundaries: SDK prepares payload + context; Sidecar handles CloudEvents wrapping and transformations
- Inbound: Route‑agnostic helpers; samples may use "/incoming"
- Test Workflow: **IMPORTANT** - Agent builds (`dotnet build`), user runs tests (`dotnet test --no-build`). Agent's terminal execution may cause VS Code crashes when capturing test output. User feedback confirms test results.
- Immediate Next Step: Scaffold solution/projects per specs/001-dotnet-spas-sdk/plan.md and specs/001-dotnet-spas-sdk/tasks.md

Project Structure

```
components/
└── sdk/
    └── dotnet/
        ├── SPAS.SDK.sln
        ├── src/
        │   ├── Spas.Sdk.Core/
        │   ├── Spas.Sdk.Metadata/
        │   ├── Spas.Sdk.Events/
        │   ├── Spas.Sdk.Inbound/
        │   ├── Spas.Sdk.Configuration/
        │   ├── Spas.Sdk.Observability/
        │   └── Spas.Sdk.Testing/
        ├── test/
        │   ├── Spas.Sdk.Core.Tests/
        │   ├── Spas.Sdk.Metadata.Tests/
        │   ├── Spas.Sdk.Events.Tests/
        │   ├── Spas.Sdk.Inbound.Tests/
        │   ├── Spas.Sdk.Configuration.Tests/
        │   ├── Spas.Sdk.Observability.Tests/
        │   └── Spas.Sdk.Testing.Tests/
        └── examples/
            └── SampleService/
```

Commands

```bash
# Open solution
code components/sdk/dotnet/SPAS.SDK.sln

# Create folders (first-time)
mkdir -p components/sdk/dotnet/{src,test,examples}

# Build (after scaffolding)
dotnet build components/sdk/dotnet/SPAS.SDK.sln -c Debug
```

---

## Component: CLI

- Status: Planned (Phase 3)
- Spec: principles/component/13-cli.md
- Notes: Commands to include service init/pack/publish and compose workflows. Not active in current branch.

---

## Component: Repository

- Status: Planned (Phase 2)
- Spec: principles/component/11-repository.md
- Notes: PoC storage file‑based; Production PostgreSQL. Not active in current branch.

---

## Component: Sidecar

- Status: Prototype complete; ready to evolve
- Path: prototypes/spas-sidecar-prototype/
- Spec: principles/component/10-sidecar-contract.md

---

## Component: Services (Examples)

- Status: To be built for end‑to‑end demos (Phase 4)
- Examples root: examples/
- Domain: e‑commerce sample planned per TASKS.md

---

## Quick Links

- Constitution: .specify/memory/constitution.md (v1.0.3)
- SDK Spec: principles/component/12-sdk.md
- Feature Docs: specs/001-dotnet-spas-sdk/
- Tasks: specs/001-dotnet-spas-sdk/tasks.md
- Plan: specs/001-dotnet-spas-sdk/plan.md
- Decisions: principles/appendix/28-decision-log.md
# spas Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-12

## Active Technologies
- C# / .NET (net10.0 per SDK csproj targets) + SPAS .NET SDK projects (`Spas.Sdk.*`), JSON serialization (System.Text.Json), JSON Schema validation lib (NEEDS CLARIFICATION which) (002-metadata-schema-alignment)
- .Net Testing framework: **xUnit** for SDK unit tests and validation tasks.
- N/A (design-time metadata files) (002-metadata-schema-alignment)

- .NET 10 (target net10.0); Microsoft.Extensions.Logging; System.Text.Json (001-dotnet-spas-sdk)

## Project Structure

````text
components/
└── sdk/
	└── .net/
		├── SPAS.SDK.sln
		├── src/
		│  ├── Spas.Sdk.Core/
		│  ├── Spas.Sdk.Metadata/
		│  ├── Spas.Sdk.Events/
		│  ├── Spas.Sdk.Inbound/
		│  ├── Spas.Sdk.Configuration/
		│  ├── Spas.Sdk.Observability/
		│  └── Spas.Sdk.Testing/
		├── test/
		# SPAS Copilot Instructions

		Last updated: 2025-12-12

		## Common Guidance

		- Testing Policy: Unit tests are REQUIRED per user story (PoC and Production). Integration tests are OPTIONAL during PoC unless explicitly requested; REQUIRED before non‑PoC releases. See .specify/memory/constitution.md (v1.0.3).
		- Events Boundary: SDKs prepare payload/trace/correlation/identity; Sidecar wraps CloudEvents and performs transformations. See principles/component/12-sdk.md.
		- Inbound Routing: SDKs are route‑agnostic. `/incoming` is a recommended sample default, not enforced.
		- PoC vs Production: PoC uses HTTP, identity in payload, Zipkin tracing. Production introduces gRPC, mTLS/SPIFFE, full OTel, Prometheus, etc. See principles/02-architecture-overview.md.
		- Specs Navigation: Start at principles/INDEX.md. Decisions recorded in principles/appendix/28-decision-log.md.

		---

		## Component: SDK (.NET)

		- Status: Active feature (branch 001-dotnet-spas-sdk)
		- Tech: .NET 10 (target net10.0), Microsoft.Extensions.Logging, System.Text.Json
	- Layout: components/sdk/dotnet/{src,test,examples}
		- Solution: components/sdk/dotnet/SPAS.SDK.sln
		- Packages (src): Spas.Sdk.Core, Metadata, Events, Inbound, Configuration, Observability, Testing
		- Tests (test): One test project per package
		- Example: components/sdk/dotnet/examples/SampleService
	- Docs: specs/001-dotnet-spas-sdk/{plan.md,spec.md,tasks.md}
	- Boundaries: SDK prepares payload + context; Sidecar handles CloudEvents wrapping and transformations
	- Inbound: Route‑agnostic helpers; samples may use `/incoming`
	- Testing: Unit tests required per story (see tasks.md sections)
	- Immediate Next Step: Scaffold solution/projects per specs/001-dotnet-spas-sdk/plan.md and specs/001-dotnet-spas-sdk/tasks.md

	Commands

	```
	# Open solution
	code components/sdk/dotnet/SPAS.SDK.sln

	# Create folders (first-time)
	mkdir -p components/sdk/dotnet/{src,test,examples}

	# Build (after scaffolding)
	dotnet build components/sdk/dotnet/SPAS.SDK.sln -c Debug
		---

		## Component: CLI

		- Status: Planned (Phase 3)
		- Spec: principles/component/13-cli.md
		- Notes: Commands to include service init/pack/publish and compose workflows. Not active in current branch.

		---

		## Component: Repository

		- Status: Planned (Phase 2)
		- Spec: principles/component/11-repository.md
		- Notes: PoC storage file‑based; Production PostgreSQL. Not active in current branch.

		---

		## Component: Sidecar

		- Status: Prototype complete; ready to evolve
		- Path: prototypes/spas-sidecar-prototype/
		- Spec: principles/component/10-sidecar-contract.md

		---

		## Component: Services (Examples)

		- Status: To be built for end‑to‑end demos (Phase 4)
		- Examples root: examples/
		- Domain: e‑commerce sample planned per TASKS.md

		---

		## Quick Links

		- Constitution: .specify/memory/constitution.md (v1.0.3)
		- SDK Spec: principles/component/12-sdk.md
		- Feature Docs: specs/001-dotnet-spas-sdk/
		- Tasks: specs/001-dotnet-spas-sdk/tasks.md
		- Plan: specs/001-dotnet-spas-sdk/plan.md
		- Decisions: principles/appendix/28-decision-log.md
````
