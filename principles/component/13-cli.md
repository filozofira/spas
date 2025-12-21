# CLI Specification

Defines the responsibilities and contracts for command-line tools that power the SPAS developer workflow.

## Tool Responsibilities

### spas-service: Service Packaging and Publishing

**Responsibilities:**

- Initialize new SPAS services with templates that ensure compliance
- Retrieve design-time metadata from running services and decompose to folder structures
- Package services into distributable archives containing metadata, schemas, and transformations
- Publish service archives and metadata to the SPAS Repository for discovery and deployment

**Constraints:**

- MUST validate service metadata against `design-time-metadata-v1` schema before packaging
- MUST NOT modify service source code during packaging
- MUST preserve schema versions and metadata integrity through the publish pipeline

**Example Workflow**: _Service developer initializes service → defines spas.json and contracts → publishes to Repository → other domains can discover and compose the service_

---

### spas-compose: Domain Choreography Composition

**Responsibilities:**

- Initialize domain workspaces with scaffolded folder structure and workflow guides
- Retrieve published service metadata and contracts from the SPAS Repository
- Validate choreography.yaml configurations against service contracts and transformation syntax
- Generate deployment artifacts (docker-compose.yaml, sidecar configurations) from choreography definitions
- Support validation-only (dry-run) mode to preview artifacts without file generation

**Constraints:**

- MUST NOT modify service definitions or metadata (`services/` folder is read-only at runtime)
- MUST validate all JSONata transformation expressions before generating deployment artifacts
- MUST ensure choreography references only published, discoverable services
- Sidecar configurations MUST be generated with complete routing rules and transformation mappings

**Example Workflow**: _Domain composer initializes workspace → pulls services from Repository → uses AI-assisted composition to analyze contracts and propose choreography → validates and builds deployment artifacts → runs docker-compose_

---

## AI-in-the-Loop Composition

After pulling services, developers use the `/spas.compose` agent prompt to analyze event contracts and propose choreography mappings. The agent iteratively:

1. Analyzes service contracts and event schemas
2. Proposes topic routing and event mapping rules
3. Generates JSONata transformation expressions
4. Updates choreography.yaml based on developer feedback
5. Supports confirmation/iteration before final deployment build

See `.github/agents/spas-compose.md` for agent prompt structure and examples.

### Description-First Guidance

When service metadata includes optional plain-text `description` fields (service/endpoints/events), the generated compose agent prompt SHOULD:

- Treat descriptions as the primary semantic signal for intent matching.
- Quote the exact description snippet(s) used to justify endpoint/event selection.
- Explicitly fall back to names/types/schemas when descriptions are missing.
- Never invent missing descriptions.

---

## Configuration Management

Configuration follows convention-over-configuration principles:

- **Service Identity**: SERVICE_NAME environment variable is canonical; derived from package metadata
- **Repository Discovery**: Global config at `~/.spas/config.yaml` specifies default repository URL; per-workspace overrides supported
- **Deployment Configuration**: spas-compose generates per-service sidecar configurations from choreography.yaml; infrastructure settings (Redis, Zipkin) specified as environment variables in deployment manifests

---

## Cross-Component Boundaries

### Responsibilities & Handoffs

| Boundary                | CLI Responsibility                                               | Not CLI                                    | Rationale                                                           |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Metadata composition    | Deterministically assemble `spas.json` from service code         | Enforce schemas/policies                   | CLI orchestrates; Repository validates and enforces                 |
| Artifact packaging      | Bundle metadata, schemas, transformations into archives          | Store packages permanently                 | CLI prepares; Repository is source-of-truth for published artifacts |
| Choreography validation | Verify all references, transformations, and service availability | Perform runtime policy enforcement         | CLI validates structure; Sidecar enforces policies at runtime       |
| Development endpoints   | MAY call `/_spas/metadata` for local dev workflows               | MUST NOT depend on endpoints in production | Dev endpoint is convenience; publish flow is production contract    |
| Runtime configuration   | Generate sidecar configurations from choreography definitions    | Manage infrastructure (Docker/Kubernetes)  | CLI produces configs; infrastructure tools deploy them              |

---

## Deferred Capabilities (PoC)

- Service compliance validation (design-time checks beyond schema)
- Choreography diffing and version comparison
- Event replay for testing and debugging
- Transformation auto-scaffolding and DSL support
- Plugin/extension architecture

---

## Related Documents

For implementation details and command syntax, see:

- [spas-service CLI Guide](../../components/cli/spas-service/README.md)
- [spas-compose CLI Guide](../../components/cli/spas-compose/README.md)
- [Repository Specification](11-repository.md) — Service discovery and artifact storage
- [Service Metadata](../service/06-service-metadata.md) — spas.json schema and contracts
- [Domain Choreography](14-domain-choreography.md) — Transformation semantics and routing rules
