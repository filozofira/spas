# SPAS Copilot Instructions

Last updated: 2025-12-12

## Common Guidance

- Testing Policy: Unit tests are REQUIRED per user story (PoC and Production). Integration tests are OPTIONAL during PoC unless explicitly requested; REQUIRED before non‑PoC releases. See .specify/memory/constitution.md (v1.0.3).
- Events Boundary: SDKs prepare payload/trace/correlation/identity; Sidecar wraps CloudEvents and performs transformations. See principles/component-specification/12-sdk-specification.md.
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
- Spec: principles/component-specification/13-cli-specification.md
- Notes: Commands to include service init/pack/publish and compose workflows. Not active in current branch.

---

## Component: Repository

- Status: Planned (Phase 2)
- Spec: principles/component-specification/12-repository-spec.md
- Notes: PoC storage file‑based; Production PostgreSQL. Not active in current branch.

---

## Component: Sidecar

- Status: Prototype complete; ready to evolve
- Path: prototypes/spas-sidecar-prototype/
- Spec: principles/component-specification/10-sidecar-contract.md

---

## Component: Services (Examples)

- Status: To be built for end‑to‑end demos (Phase 4)
- Examples root: examples/
- Domain: e‑commerce sample planned per TASKS.md

---

## Quick Links

- Constitution: .specify/memory/constitution.md (v1.0.3)
- SDK Spec: principles/component-specification/12-sdk-specification.md
- Feature Docs: specs/001-dotnet-spas-sdk/
- Tasks: specs/001-dotnet-spas-sdk/tasks.md
- Plan: specs/001-dotnet-spas-sdk/plan.md
- Decisions: principles/appendix/28-decision-log.md
# spas Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-12

## Active Technologies

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
		- Events Boundary: SDKs prepare payload/trace/correlation/identity; Sidecar wraps CloudEvents and performs transformations. See principles/component-specification/12-sdk-specification.md.
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
		- Spec: principles/component-specification/13-cli-specification.md
		- Notes: Commands to include service init/pack/publish and compose workflows. Not active in current branch.

		---

		## Component: Repository

		- Status: Planned (Phase 2)
		- Spec: principles/component-specification/12-repository-spec.md
		- Notes: PoC storage file‑based; Production PostgreSQL. Not active in current branch.

		---

		## Component: Sidecar

		- Status: Prototype complete; ready to evolve
		- Path: prototypes/spas-sidecar-prototype/
		- Spec: principles/component-specification/10-sidecar-contract.md

		---

		## Component: Services (Examples)

		- Status: To be built for end‑to‑end demos (Phase 4)
		- Examples root: examples/
		- Domain: e‑commerce sample planned per TASKS.md

		---

		## Quick Links

		- Constitution: .specify/memory/constitution.md (v1.0.3)
		- SDK Spec: principles/component-specification/12-sdk-specification.md
		- Feature Docs: specs/001-dotnet-spas-sdk/
		- Tasks: specs/001-dotnet-spas-sdk/tasks.md
		- Plan: specs/001-dotnet-spas-sdk/plan.md
		- Decisions: principles/appendix/28-decision-log.md
````
