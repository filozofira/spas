# Introduction

SPAS (Self-contained, Portable, Adaptable Services) is a framework and specification that enables building services around a single bounded context that are reusable across domain contexts through choreography, not direct dependencies. SPAS emphasizes strong encapsulation, portable packaging, and configuration-driven adaptation.

## Why SPAS

- Fragmented microservice practices create distributed monoliths; SPAS enforces strict boundaries and event-first integration.
- Portability across OS/cloud/container platforms requires minimal runtime assumptions; SPAS services package everything needed to run.
- Reuse across domains demands decoupling from domain specifics; SPAS uses adaptation/choreography to bind services into different Domain Contexts without code changes.

## Design Goals

- Self-contained: No synchronous cross-context dependencies
- Portable: OS/cloud/container agnostic
- Adaptable: Join different Domain Contexts via configuration
- Observable: First-class telemetry and health
- Secure-by-default: Zero-trust communication
- Versionable: Contracts evolve safely over time

## Relationship to Existing Paradigms

- Domain-Driven Design (DDD): 1 bounded context → 1 SPAS service
- Microservices: Smaller and stricter; no runtime service dependencies
- Event-driven architecture (EDA): East–West communication is event-first
- Service mesh/Sidecar: Offloads networking, security, and reliability concerns
- API Gateway: North–South traffic terminates at the edge; TLS termination, authentication, routing (Production: REST→gRPC translation)

## Scope

SPAS specifies:

- What makes a service SPAS-compliant
- Protocols for sync (north-south) and async (east-west) communication
- Adaptation rules for choreography via `choreography.yaml`
- Packaging and repository integration
- Security, observability, and governance requirements

## Current Status

### PoC Phase (December 2025)

- ✅ **.NET SDK**: Production-ready implementation complete (2025-12-13)

  - Initial PoC (001-dotnet-spas-sdk): Metadata composition, event publishing, observability
  - Schema Alignment (002-metadata-schema-alignment): Design-time metadata aligned with spec
  - 60 unit tests passing, JsonSchema.Net validation
  - Builder APIs: ServiceIdentity, Contracts, Security, Consistency, Network
  - Schema location: `components/sdk/schemas/design-time-metadata-v1.schema.json`
  - See: `components/sdk/dotnet/README.md` and `specs/002-metadata-schema-alignment/COMPLETION.md`

- ✅ **Repository Service**: Service metadata registry complete (2025-12)

  - Publish/retrieve service archives with metadata and schemas
  - Search services with advanced filtering (name, version, tags)
  - Schema evolution validation following SPAS evolution rules
  - Runtime metadata enrichment (image digests, tags, repositories)
  - SQLite storage with IStorageProvider abstraction for future backends
  - 99 unit tests passing, 10 REST endpoints, OpenAPI contract
  - See: `components/repository/README.md` and `specs/003-repository-service/spec.md`

- ✅ **spas-service CLI**: Service publishing tooling complete (2025-01)

  - Publish service metadata to Repository from running service or archive
  - Pull service metadata archives by name and version
  - Dry-run mode for preview without publishing
  - CI/CD integration with `--archive` flag and runtime metadata injection
  - 48 unit tests passing
  - See: `components/cli/spas-service/README.md` and `specs/004-spas-service-cli/COMPLETION.md`

- ✅ **spas-compose CLI**: Domain composition tooling complete (2025-12-14)

  - Workspace scaffolding with `init` command
  - Service metadata pull from Repository with `services pull` command
  - Docker Compose deployment generation with `choreography build --docker`
  - Sidecar config file generation (`config.{service}.json`) for runnable deployments (006-sidecar-config-generator)
  - Custom backbone images with `--event-backbone` and `--observability-backbone` flags (008-compose-backbone-args)
  - Backbone disable support for BYO infrastructure (`--event-backbone none`)
  - AI-in-the-loop composition via `/spas.compose` agent prompt
  - 134 unit tests passing
  - See: `components/cli/spas-compose/README.md` and `specs/005-spas-compose-cli/COMPLETION.md`

- 🚧 **SPAS Sidecar**: Production sidecar implementation in progress (48/49 tasks complete)
  - Event publishing via `POST /publish` with topic routing
  - Event subscription with Redis Streams delivery to service endpoints
  - Command invocation with request-response patterns
  - CloudEvents 1.0 envelope with W3C Trace Context
  - Distributed tracing with Zipkin span emission
  - Health and readiness endpoints for orchestration
  - See: `components/sidecar/README.md` and `specs/007-spas-sidecar/`

## Out of Scope (v1.0)

- Central orchestration (choreography-only)
- Control plane requirements (PoC avoids managed control plane)
- Serverless execution (container-only)

> PoC vs Production
>
> - PoC: Local repository, no auth; metadata-only policy declarations
> - Production: AuthN/AuthZ, signed packages, enforceable policies

## Feature grooming

List of features to discuss before deciding to implement, here referred to as "G-Features".
All G-Features should be listed here to ensure AI agents have easy access to it.

- G-Features are enumerated for reference only and not priority-wise
- G-Features should not drive implementation decisions of other PoC/Production ready features unless strongly justified.
- G-Feature description as least can contain following parts:
  1. Must-have a brief description outlining what feature is about.
  1. Nice-to-have examples and perhaps even code snippets etc.
  1. Must-have justification or why implement the feature.

### FG01: Extend spas-compose init to take --output argument

Extend spas-compose init to take --output argument indicating where to initiate domain, while agent promts would go to project root.

E.g. if I run `spas-compose public --output ./examples/ecommerce/public` cli would scaffold choreography files and folders in `./examples/ecommerce/public`, while agent prompts would go to `./.github/agents...`.

Agent prompt should not be called `/spas-compose` but `/spas.compose` to follow standard.

It is important that generated agent prompt has correct path references to domain schema files, etc. I.e.

```markdown
...

1. **Contract Analysis**: Parse service metadata from `./examples/ecommerce/public/services/*/spas.json`
   ...
   other paths...
```

Also, any reference to spas principles should be removed, since this will not be available for domain developer operating from different project. Instead it important info should be embedded in prompt.
I.e. currently below is mentioned in References section:

```markdown
## References

- [./examples/ecommerce/public/.spas/schemas/sidecar-config-v1.schema.json](public/.spas/schemas/sidecar-config-v1.schema.json)
- [specs/005-spas-compose-cli/](specs/005-spas-compose-cli/)
- [principles/component/14-domain-choreography.md](principles/component/14-domain-choreography.md)
- [ADR-037: AI-in-the-loop composition](principles/appendix/28-decision-log.md)
```

**Justification:** Agent prompts are project-level resources (shared across all domains).
Domain workspaces are domain-specific (each domain has its own choreography)
Current behavior creates agent prompts relative to where you run the command, causing duplication or misplacement.

### FG02: Add State element to Service Metadata

Add StateStore or State element to spas.json, design-time and runtime.

**StateStore design-time example:**

```json
{
  "schemaVersion": "design-time-metadata-v1",
  "id": "test-service",
  "name": "Test Service",
  //...
  "network": {
    "requiredEgress": [],
    "requiredStateStore": {
      "imageDigest": "sha256:abc123...",
      "imageRepository": "postgres",
      "imageTag": "15.15-trixie"
    }
  },
  "security": {
    //...
  },
  "license": "MIT"
}
```

**Justification:** Adding StateStore to spas.json can enable following improvements:

- Allow spas-compose CLI to add these dependencies to docker-compose file and hence allow one command to bootstrap full domain with all dependencies.
- Visualises full network dependencies required by service to operate.

### FG03: Cross Domain Choreography

Extend framework to support choreographies across multiple domain contexts.

**Justification:** Adding this feature would allow domain composers to integrate multiple domains into one SPAS solution, allowing data to flow/synchronise across these boundaries. E.g. admin-e-commerce and public-e-commerce domain contexts can synchronise products, stock related data and similar.

### FG04: SDK Metadata extraction

Consider swapping `_spas/metadata` endpoint with cli based extraction of metadata archive.
E.g. extend SDK to support writing metadata to file (e.g. already implemented in SampleService `SpasComposer.ComposeToFile(...)`) when running app with certain arguments.

SDK be extended to allow something similar to following startup code in Program.cs

```csharp
var arguments = string.Join(' ', args);
if (arguments.Contains("--generate-metadata"))
{
    //TODO: Code to discover, generate and save metadata to disk.
    Console.WriteLine($"SPAS metadata generated at: some/path/SampleService.metadata.zip");
    return;
}

Console.WriteLine("Normal startup.");
//TODO: normal startup
```

Given above SDK and service startup code, developer can run below commands.

```bash
# To output meta data and exit
dotnet run -- --generate-metadata

# Normal startup
dotnet run
```

**Justification:** Above solution provides several benefits:

- Improves service startup time, since metadata discovery will run only on local machine.
- Allows easier integration with CI/CD pipelines to build and publish service metadata to SPAS Repository automatically.
- Would simplify spas-service publishing since there is no need to wait for developer to start service any more.

### FG05: spas-compose should use image references from runtime metadata

Currently `spas-compose choreography build --docker` generates `build: ./service-name` directives expecting local Dockerfiles. When services have `runtime` metadata in spas.json (image, repository, tag, digest), the generated docker-compose should use `image:` instead.

**Current (incorrect):**

```yaml
order-service:
  build: ./order-service
```

**Expected:**

```yaml
order-service:
  image: spas-examples/order-service:1.0.0
```

Similarly, sidecar services should reference a published sidecar image (`spas/sidecar:latest`) rather than expecting a local `./spas-sidecar/` folder.

**Justification:** Domain composers pull service metadata from Repository - they don't have local source code. The generated docker-compose must be runnable using only published images.

### FG06: spas-compose sidecar config generation incomplete

`spas-compose choreography build --docker` generates sidecar config files with missing or incorrect fields:

**Issue 1: Missing eventType in outbound config**

Generated:

```json
{
  "outbound": [{ "topic": "orders-created" }]
}
```

Expected:

```json
{
  "outbound": [{ "eventType": "OrderCreated", "topic": "orders-created" }]
}
```

**Issue 2: Wrong eventType format**

Generator uses event name (`OrderCreated`) instead of full CloudEvents type from service metadata (`com.ecommerce.order.created`). The sidecar routes by exact eventType match, so SDK-published events fail routing.

Generated: `"eventType": "OrderCreated"`
Expected: `"eventType": "com.ecommerce.order.created"`

**Issue 3: Incorrect invokeEndpoint**

Generator uses `/events/order-created` but service exposes `/incoming`. Should derive endpoint from service metadata or use consistent convention.

**Issue 4: Incorrect transform path**

Generated:

```json
{
  "inbound": [
    {
      "transform": "transformations/inbound-order-created.jsonata"
    }
  ]
}
```

Expected:

```json
{
  "inbound": [
    {
      "transform": "transformations/inventory-service/inbound-order-created.jsonata"
    }
  ]
}
```

**Issue 5: Sidecar doesn't load transform files (sidecar bug)**

The sidecar passes the transform file path directly to JSONata instead of loading the file content first. This causes transform failures. Workaround: omit transform or inline the JSONata expression.

**Justification:** Sidecar fails to start or route events with invalid configuration. The generator should:

1. Include `eventType` from service metadata (full CloudEvents type)
2. Use correct transform path matching the workspace structure
3. Derive `invokeEndpoint` from service contract or use consistent convention
4. Sidecar should load transform file content before passing to JSONata

### FG07: spas-compose generates incorrect service and sidecar ports

`spas-compose choreography build --docker` generates docker-compose with incorrect port configurations.

**Issue 1: Service ports**

.NET services in containers default to port 8080 (ASP.NET Core behavior). The generator uses arbitrary ports (5001, 5002, etc.).

**Generated:**

```yaml
order-service:
  ports:
    - "5002:5002"
  environment:
    - PORT=5002
```

**Expected (for .NET services):**

```yaml
order-service:
  ports:
    - "5002:8080"
  environment:
    - PORT=8080
```

**Issue 2: Sidecar ports**

Generator assigns different ports per sidecar (7001, 7002, 7003...), but services have hardcoded sidecar configuration (e.g., `appsettings.json` with port 7001). Service cannot connect to sidecar due to port mismatch.

**Generated:**

```yaml
order-service-sidecar:
  environment:
    - PORT=7002 # Sidecar listens here
order-service:
  environment:
    - SIDECAR_PORT=7002 # But service config may have 7001 hardcoded
```

**Expected:**

```yaml
order-service-sidecar:
  environment:
    - SIDECAR_PORT=7001 # Sidecar reads SIDECAR_PORT, not PORT
order-service:
  environment:
    - SERVICE_NAME=order-service
    - SIDECAR_PORT=7001
```

**Issue 3: Wrong sidecar port environment variable name**

Generator outputs `PORT=7001` for sidecars, but the sidecar reads `SIDECAR_PORT`. This causes sidecar to use default port (3500) instead of configured port.

**PoC Fix:**

- Use port 8080 for all service containers (standard container port)
- Use port 7001 for all sidecars (standard sidecar port)
- Add `SERVICE_NAME` and `SIDECAR_PORT` env vars (SDK reads these directly)
- Note: `SIDECAR_HOST` becomes unnecessary once FG08 is implemented (host derived from SERVICE_NAME)

**Future Options:**

- Add `port` and `sidecarPort` fields to service metadata schema
- Allow port override in choreography.yaml per service

**Justification:** Services unreachable without correct port mapping. Services cannot publish events if they can't connect to their sidecar.

**Justification:** Services unreachable without correct port mapping. Sidecars also need correct SERVICE_PORT to invoke service endpoints.

### FG08: SDK should derive sidecar host from SERVICE_NAME convention

The .NET SDK currently requires explicit `SIDECAR_HOST` environment variable to connect to the sidecar. Per prototype design, the sidecar naming convention is `{service-name}-sidecar`, making this variable redundant.

**Current behavior:**

```csharp
// SpasConfiguration.cs
Host = Environment.GetEnvironmentVariable("SIDECAR_HOST") ?? "localhost";
```

**Expected behavior:**

```csharp
var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME");
Host = serviceName != null ? $"{serviceName}-sidecar" : "localhost";
```

**docker-compose implications:**

Current (redundant):

```yaml
order-service:
  environment:
    - SERVICE_NAME=order-service
    - SIDECAR_HOST=order-service-sidecar # Redundant!
    - SIDECAR_PORT=7001
```

Expected (simpler):

```yaml
order-service:
  environment:
    - SERVICE_NAME=order-service
    - SIDECAR_PORT=7001 # Host derived from SERVICE_NAME
```

**Justification:**

- Reduces configuration redundancy
- Follows convention-over-configuration principle
- Aligns with prototype design decisions
- Simplifies docker-compose generation in spas-compose

## Related Documents

- [Principles](./principles/README.md) - SPAS Framework guiding principles
- [Specs](./specs/README.md) - GitHub SpecKit files
- [Components](./components/README.md) - SPAS Framework component development
- Prototypes
  - [spas-sidecar](./prototypes/spas-sidecar-prototype/README.md) - SPAS Sidecar prototype
- [Examples](./examples/README.md)
