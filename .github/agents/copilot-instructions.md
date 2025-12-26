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
- Specs Navigation: Start at principles/README.md. Decisions recorded in principles/appendix/28-decision-log.md.

---

## Completion Reports (CRITICAL)

- When a spec is completed or when follow-up fixes/enhancements are made after completion, update that spec’s `COMPLETION.md`.
- Use the same section structure used in specs like `specs/013-agent-prompt-enrichment/COMPLETION.md`:
	- Put fixes under `## Post-Implementation Bug Fixes`.
	- Put non-critical improvements under `## Future Enhancements`.
- Keep each item concrete: symptom/impact → root cause (if known) → fix applied → files touched.

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

- Status: ✅ Complete (PoC) - Ready for development/testing use
- Completed: 2025-01 (Phase 7 finished)
- Tech: Node.js 20 LTS + TypeScript 5.x + Commander.js, axios, adm-zip, form-data
- Layout: components/cli/spas-service/{src,test,dist}
- Spec: specs/004-spas-service-cli/{plan.md, spec.md, tasks.md}
- Tests: 48/48 passing (verified via `npm test`)
- Commands: `publish`, `pull`

**What Was Built**:
- `spas-service publish <service-host>` - Publish from running service with interactive prompt
- `spas-service publish --archive <path>` - Publish from pre-built ZIP (CI/CD mode)
- `spas-service publish --dry-run` - Download and inspect metadata without publishing
- `spas-service pull <name> <version>` - Download published service metadata
- Runtime metadata flags: `--image-digest`, `--image-repository`, `--image-tag`
- Repository URL resolution: `--repo` flag or `SPAS_REPOSITORY_URL` env var

**Key Features**:
- TDD approach: All commands tested with unit and integration tests
- ESM modules with `.js` extension imports
- Retry logic with exponential backoff for service availability
- Chalk-based colored output for success/error messages
- Comprehensive error handling with actionable hints

**Quick Start Commands**:
```bash
# Navigate to CLI
cd components/cli/spas-service

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Use CLI locally (after build)
node dist/index.js --version
node dist/index.js publish http://localhost:5000 --dry-run
node dist/index.js pull order-service 1.0.0

# Or link globally for development
npm link
spas-service --version
```

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
- Node.js 20 LTS + TypeScript 5.x + Commander.js (CLI framework), axios (HTTP client), adm-zip (archive handling), form-data (multipart upload) (004-spas-service-cli)
- N/A (CLI tool, no persistence) (004-spas-service-cli)
- Node.js 20 LTS + TypeScript 5.3+ + Commander.js 11.x (CLI), js-yaml 4.x (YAML parsing), jsonata 2.x (transformation validation), axios 1.x (HTTP client), chalk 4.x (terminal output) (005-spas-compose-cli)
- Local filesystem (domain workspace); SPAS Repository via HTTP (005-spas-compose-cli)
- TypeScript 5.3 (Node.js 20+) + commander, js-yaml, jsonata (already in spas-compose) (006-sidecar-config-generator)
- N/A (generates files to filesystem) (006-sidecar-config-generator)
- Node.js 20+, TypeScript 5.3 + express, redis, node-fetch, uuid, jsonata (from prototype) (007-spas-sidecar)
- Redis Streams (message broker) (007-spas-sidecar)
- TypeScript 5.3, Node.js 20+ + Commander.js (CLI), js-yaml (YAML generation) (008-compose-backbone-args)
- N/A (generates files) (008-compose-backbone-args)
- TypeScript 5.3 (Node.js 20+) + Commander 11.x, js-yaml 4.x, jsonata 2.x, axios 1.x (009-compose-generator-fixes)
- Filesystem (reading/writing config files) (009-compose-generator-fixes)
- TypeScript 5.3, Node.js 20+ + jsonata 2.1.0, express 4.18.2, redis 4.6.12 (010-sidecar-transform-loading)
- N/A (in-memory transform cache only) (010-sidecar-transform-loading)
- C# 12 / .NET 10.0 + Microsoft.Extensions.Configuration, Microsoft.Extensions.Logging (011-sdk-sidecar-host)
- N/A (configuration only) (011-sdk-sidecar-host)
- C# 12 / .NET 10.0 (SDK), TypeScript / Node.js 20.x (Sidecar, CLI) + Microsoft.Extensions.Http (SDK), Express.js (Sidecar), Commander (CLI) (012-cloudevents-type-refactor)
- N/A (no persistence changes) (012-cloudevents-type-refactor)
- TypeScript 5.3+ (Node.js 20 LTS) + Commander.js 11.x, js-yaml 4.x, JSONata 2.x (013-agent-prompt-enrichment)
- N/A (generates static markdown file) (013-agent-prompt-enrichment)
- TypeScript 5.3+ (ES2022 target), Node.js >=20.0.0 + Commander 11 (CLI framework), js-yaml 4 (YAML parsing), chalk 4 (output formatting) (014-compose-init-fixes)
- File system operations (generate/write schema and documentation files) (014-compose-init-fixes)
- TypeScript 5.9.3, Node.js ES2022 target + Fastify 5.6.2, better-sqlite3 12.5.0, ajv 8.17.1 for validation (015-repository-service-fixes)
- SQLite database with existing schema, no migrations required (015-repository-service-fixes)
- Java 17+ (user has Java 21) + Jackson (JSON), java.net.http.HttpClient, Spring Boot 3.x (optional integration) (016-java-spas-sdk)
- N/A (SDK generates files, no runtime storage) (016-java-spas-sdk)
- TypeScript (Node.js) + Java (Maven/Spring Boot) + .NET + JSON Schema, TypeScript toolchain (repo/sidecar), Java annotations/runtime reflection (metadata), .NET attributes + metadata composer (017-metadata-descriptions)
- Repository persistence (existing; not changed by this feature) (017-metadata-descriptions)
- C# / .NET 10 + Java 17+ + Node.js 20 (TypeScript); Ajv for JSON Schema validation; SDK metadata generation via attributes/annotations (018-command-produces-events)
- N/A (metadata-only; no persistence) (018-command-produces-events)
- C# / .NET 10, Java 17+, Node.js 20 (TypeScript) + Ajv (JSON Schema validation), System.Text.Json (.NET), Spring/Jackson (Java) (018-command-produces-events)
- TypeScript 5.x (Node.js CLI) + Commander.js (CLI framework) (019-compose-diagram-flow)
- N/A (template strings in source code) (019-compose-diagram-flow)
- C# / .NET 10 (SDK + example services), Java 17 (SDK + example services) (021-sdk-metadata-extraction)
- Filesystem output (metadata ZIP written to `./metadata/service.metadata.zip` by default) (021-sdk-metadata-extraction)

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
		- Specs Navigation: Start at principles/README.md. Decisions recorded in principles/appendix/28-decision-log.md.

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
