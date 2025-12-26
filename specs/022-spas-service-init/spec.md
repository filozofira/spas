# Feature Specification: spas-service init Command + AI Agent Prompt

**Feature Branch**: `022-spas-service-init`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: User description: "Add spas-service init command that scaffolds a language-agnostic workspace for developing a SPAS-compliant service, plus generates a rich AI agent prompt that guides developers through service scaffolding via a systematic human-in-the-loop workflow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize Service Workspace (Priority: P1)

As a developer, I want to initialize a new SPAS service workspace so that I have a structured environment with guidance for building a compliant service.

**Why this priority**: Foundation for all service development. Without a workspace, no guided AI-assisted development is possible. This is the CLI-side of the feature.

**Independent Test**: Run `spas-service init order-service`, verify folder structure is created with README.md, placeholder directories, schemas, and agent prompt files.

**Acceptance Scenarios**:

1. **Given** an empty directory, **When** I run `spas-service init order-service`, **Then** a folder `order-service/` is created with:
   - `README.md` containing workflow instructions, example `/spas.service` invocations, and links to SDK docs
   - `src/` empty directory for service code
   - `schemas/` empty directory for event/endpoint schemas
   - `metadata/` empty directory for generated metadata archives
   - `.spas/schemas/design-time-metadata-v1.schema.json` for AI agent reference

2. **Given** I run `spas-service init order-service`, **When** the command completes, **Then** agent prompt files are created at git root (if detected) or workspace parent:
   - `.github/agents/spas.service.agent.md` (full agent instructions)
   - `.github/prompts/spas.service.prompt.md` (SpecKit trigger file)

3. **Given** a service folder already exists, **When** I run `spas-service init order-service`, **Then** the command fails with error message suggesting `--force` flag.

4. **Given** `--force` flag, **When** I run `spas-service init order-service --force`, **Then** existing workspace is overwritten.

5. **Given** `--output ./services` flag, **When** I run `spas-service init order-service --output ./services`, **Then** workspace is created at `./services/order-service/`.

6. **Given** an invalid service name (spaces, uppercase, special characters), **When** I run `spas-service init "My Service"`, **Then** the command fails with validation error explaining naming rules (lowercase, hyphen-separated).

---

### User Story 2 - AI-Assisted Service Scaffolding (Priority: P1)

As a developer, I want to use an AI agent to scaffold my SPAS service code based on my technology stack and bounded context, so that I get a working starting point without manual boilerplate.

**Why this priority**: Core value proposition — AI-guided scaffolding dramatically reduces time-to-first-event. Equal priority with US1 as they work together.

**Independent Test**: Invoke `/spas.service NAME:order-service STACK:java CONTEXT:orders Scaffold service with CreateOrder command` and verify agent proposes project structure, generates code, and creates valid `spas.json`.

**Acceptance Scenarios**:

1. **Given** a service workspace exists, **When** developer runs `/spas.service NAME:order-service STACK:java CONTEXT:orders Create service with CreateOrder command that produces order-created event`, **Then** the AI agent:
   - Validates required tokens (NAME, STACK, CONTEXT) are present
   - Reads workspace structure from `{workspaceRoot}/{NAME}/`
   - Proposes project structure appropriate for the stack
   - Prompts developer for confirmation before generating

2. **Given** missing required token (e.g., no `STACK:`), **When** developer runs `/spas.service NAME:my-service CONTEXT:orders Create service`, **Then** the agent responds with clear error listing required tokens and example usage.

3. **Given** invalid STACK value, **When** developer runs `/spas.service NAME:my-service STACK:python CONTEXT:orders ...`, **Then** the agent responds with error listing supported stacks (java, dotnet).

4. **Given** agent proposes structure and developer confirms, **When** generation completes, **Then** the agent runs validation checklist (project structure, annotations present, schema files exist) and suggests next steps.

---

### User Story 3 - Phased Workflow with Human Confirmation (Priority: P1)

As a developer, I want the AI agent to follow a systematic workflow with confirmation gates at each phase, so that I maintain control over what gets generated.

**Why this priority**: Human-in-the-loop is critical for trust and correctness. Without gates, developer loses control.

**Independent Test**: Invoke `/spas.service` and verify agent pauses for confirmation between each major phase.

**Acceptance Scenarios**:

1. **Given** a scaffolding request with all required tokens, **When** agent completes Analyze phase, **Then** it summarizes understanding and asks for confirmation before proceeding to Project Structure phase.

2. **Given** agent proposes project structure, **When** developer provides feedback like "use Gradle instead of Maven", **Then** agent revises proposal and prompts again.

3. **Given** developer confirms at each phase, **When** all phases complete, **Then** agent has executed:
   - Phase 1 (Analyze): Parse tokens, validate workspace, confirm understanding
   - Phase 2 (Project Structure): Propose stack-appropriate structure, scaffold if approved
   - Phase 3 (Service Metadata): Propose identity/security/license per design-time schema, scaffold if approved
   - Phase 4 (Storage Layer): Propose interface + in-memory implementation, scaffold if approved
   - Phase 5 (Endpoints & Model): Propose command/query endpoints, DTOs, domain model, scaffold if approved
   - Phase 6 (Events): Propose event classes, schemas, produces[] relationships, scaffold if approved
   - Phase 7 (Sidecar Integration): Scaffold event publishing via SDK, scaffold if approved
   - Phase 8 (Runtime): Propose Dockerfile, scaffold if approved
   - Phase 9 (Validate & Next Steps): Build project, generate metadata archive, suggest publish command

4. **Given** validation fails at any phase, **When** failure detected, **Then** agent proposes fix and asks for confirmation before applying.

---

### User Story 4 - Stack-Specific Code Generation (Priority: P2)

As a developer, I want the agent to generate idiomatic code for my chosen stack, so that the scaffolded service follows best practices for that ecosystem.

**Why this priority**: Quality of generated code affects adoption. P2 because P1 establishes the workflow foundation.

**Independent Test**: Generate services with `STACK:java` and `STACK:dotnet`, verify each produces idiomatic project structure and SDK integration.

**Acceptance Scenarios**:

1. **Given** `STACK:java`, **When** agent generates project, **Then** it creates:
   - Maven or Gradle build file with spas-sdk-spring dependency
   - Main application class with SPAS SDK integration
   - Command handler class with appropriate annotations
   - Event class with appropriate annotations
   - Produces correct `spas.json` with kebab-case event names

2. **Given** `STACK:dotnet`, **When** agent generates project, **Then** it creates:
   - `.csproj` with Spas.Sdk.AspNetCore package reference
   - Program.cs with SPAS service registration
   - Command handler with appropriate attributes
   - Event class with appropriate attributes
   - Produces correct `spas.json` with kebab-case event names

3. **Given** either stack, **When** agent generates schemas, **Then** it creates JSON Schema files in:
   - `schemas/endpoints/{command-name}.schema.json` for request DTOs
   - `schemas/events/{event-type}.schema.json` for event payloads

---

### User Story 5 - Self-Contained Agent Prompt (Priority: P2)

As a developer using `spas-service init` in my own project (without SPAS repo access), I want the agent prompt to contain all SPAS service development guidance so the AI can work autonomously.

**Why this priority**: External developers won't have SPAS repo. Agent must be self-contained. P2 because it's a quality refinement on the core functionality.

**Independent Test**: Run `spas-service init` in empty project, verify agent prompt contains SDK integration patterns, metadata schema reference, event publishing contract, and no external SPAS repo path references.

**Acceptance Scenarios**:

1. **Given** generated agent prompt, **Then** it documents:
   - Event publishing contract (POST /publish + required headers: traceparent, x-service-name, x-event-name, x-correlation-id)
   - Context propagation patterns
   - Metadata schema structure (commands, endpoints, events, produces[] relationship)
   - Event name normalization (PascalCase → kebab-case)
   - SDK integration patterns for both Java and .NET stacks

2. **Given** generated agent prompt, **Then** it includes no references to `principles/`, `specs/`, `components/`, or other SPAS repo paths.

3. **Given** generated agent prompt, **Then** all file paths use `{workspaceRoot}/{NAME}/` pattern.

4. **Given** generated agent prompt, **Then** it references `.spas/schemas/design-time-metadata-v1.schema.json` as the authoritative metadata schema.

---

### Edge Cases

- What happens when `spas-service init` is run outside git repo? → Command succeeds, warns that agent prompts work best with git repo context, places agent files at workspace parent directory.
- What happens when developer requests unsupported feature (e.g., GraphQL endpoint)? → Agent responds with "Not supported in PoC" and explains SPAS supports HTTP Commands/Queries only.
- What happens when developer provides conflicting tokens (e.g., two STACK: values)? → Agent uses first value and warns about duplicate.
- What happens when workspace has partial files from failed generation? → Agent detects existing files and offers to continue or clean up.
- What happens when developer skips a phase? → Agent allows skipping optional phases (Storage, Runtime) but warns about incomplete service.
- What happens when `--json` flag is used? → CLI outputs structured JSON result for tooling integration.

## Requirements *(mandatory)*

### Functional Requirements

#### CLI Requirements

- **FR-001**: CLI MUST provide `spas-service init <service-name>` command to scaffold a service workspace.
- **FR-002**: CLI MUST validate service name (lowercase, hyphen-separated, starts with letter, ends with letter/number).
- **FR-003**: CLI MUST create folder structure: `README.md`, `src/`, `schemas/`, `metadata/`, `.spas/schemas/`.
- **FR-004**: CLI MUST copy `design-time-metadata-v1.schema.json` to `.spas/schemas/` for agent reference.
- **FR-005**: CLI MUST generate `.github/agents/spas.service.agent.md` with complete agent instructions.
- **FR-006**: CLI MUST generate `.github/prompts/spas.service.prompt.md` as SpecKit trigger file.
- **FR-007**: CLI MUST support `--output <path>` flag for custom output directory.
- **FR-008**: CLI MUST support `--force` flag to overwrite existing workspace.
- **FR-009**: CLI MUST detect git root for agent file placement (same pattern as spas-compose init).
- **FR-010**: CLI MUST support `--json` flag for structured JSON output.
- **FR-011**: CLI MUST support `--verbose` flag for detailed operation logging.
- **FR-012**: CLI MUST exit with code 0 on success, non-zero on failure.

#### Agent Prompt Requirements

- **FR-013**: Agent prompt MUST require `NAME:<service-id>`, `STACK:<java|dotnet>`, `CONTEXT:<bounded-context>` tokens.
- **FR-014**: Agent prompt MUST define 9-phase workflow: Analyze → Project Structure → Service Metadata → Storage Layer → Endpoints & Model → Events → Sidecar Integration → Runtime → Validate & Next Steps.
- **FR-015**: Agent prompt MUST require developer confirmation between each phase.
- **FR-016**: Agent prompt MUST document event publishing contract (POST /publish with required headers).
- **FR-017**: Agent prompt MUST document SDK integration patterns for both Java and .NET stacks.
- **FR-018**: Agent prompt MUST include metadata schema documentation with `commands[].produces[]` relationship.
- **FR-019**: Agent prompt MUST include validation checklist for generated artifacts.
- **FR-020**: Agent prompt MUST NOT reference external SPAS repo paths (principles/, specs/, components/).
- **FR-021**: Agent prompt MUST reference `.spas/schemas/design-time-metadata-v1.schema.json` as authoritative schema.

#### Generated README Requirements

- **FR-022**: Generated README MUST include example `/spas.service` invocations with all required tokens.
- **FR-023**: Generated README MUST include links to SPAS SDK documentation (Java and .NET).
- **FR-024**: Generated README MUST document the phased workflow.
- **FR-025**: Generated README MUST include build and run instructions placeholder.

### Key Entities

- **Service Workspace**: Folder structure for SPAS service development. Root contains README.md, src/, schemas/, metadata/, .spas/.
- **Service Name**: Unique identifier for the service (kebab-case). Maps to `id` in spas.json.
- **Bounded Context**: Domain context the service belongs to. Maps to `boundedContext` in spas.json.
- **Stack**: Technology stack for implementation. Supported values: `java` (Spring Boot + spas-sdk-spring) or `dotnet` (.NET 8+ + Spas.Sdk.AspNetCore).
- **Agent Prompt**: Generated markdown at `.github/agents/spas.service.agent.md` containing all AI-assisted development instructions.
- **Design-Time Metadata Schema**: JSON Schema defining the structure of `spas.json` that SDKs must produce.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can scaffold service workspace with single command in under 5 seconds.
- **SC-002**: AI agent successfully scaffolds building Java service in ≤9 confirmation cycles (one per phase).
- **SC-003**: AI agent successfully scaffolds building .NET service in ≤9 confirmation cycles (one per phase).
- **SC-004**: Generated service builds successfully on first attempt after scaffolding completes.
- **SC-005**: Generated service produces valid `spas.json` when metadata generation is invoked.
- **SC-006**: Zero references to SPAS repo-internal paths in generated agent prompt.
- **SC-007**: Agent prompt file size under 35KB (prevents context window issues).
- **SC-008**: 100% of required tokens (NAME, STACK, CONTEXT) validated before agent proceeds.

## Assumptions

- Developer has Java 17+ or .NET 8+ installed for their chosen stack.
- Developer has Maven/Gradle (Java) or dotnet CLI (.NET) available for building.
- SPAS SDKs are published and installable (Maven Central for Java, NuGet for .NET).
- AI agent (GitHub Copilot or compatible) is available in developer's environment.
- The `spas-service` CLI is already installed (via npm install -g @spas/cli).
- Storage layer uses in-memory implementation for PoC (interface allows future swap).

## Dependencies

- Existing `spas-service` CLI codebase (components/cli/spas-service)
- Design-time metadata schema (components/schemas/design-time-metadata-v1.schema.json)
- SPAS SDK documentation (.NET and Java)

## References

- [principles/component/12-sdk.md](../../principles/component/12-sdk.md) — SDK specification
- [principles/service/03-service-model.md](../../principles/service/03-service-model.md) — What makes a service SPAS-compliant
- [components/schemas/design-time-metadata-v1.schema.json](../../components/schemas/design-time-metadata-v1.schema.json) — Metadata schema
- [specs/005-spas-compose-cli](../005-spas-compose-cli/spec.md) — Reference pattern for init + agent workflow
- [specs/013-agent-prompt-enrichment](../013-agent-prompt-enrichment/spec.md) — Reference for self-contained agent prompt
- [components/sdk/dotnet/README.md](../../components/sdk/dotnet/README.md) — .NET SDK documentation
- [components/sdk/java/README.md](../../components/sdk/java/README.md) — Java SDK documentation
