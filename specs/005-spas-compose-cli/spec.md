# Feature Specification: spas-compose CLI

**Feature Branch**: `005-spas-compose-cli`  
**Created**: 2025-12-14  
**Status**: Draft  
**Input**: User description: "Create spas-compose CLI tool for domain choreography composition with AI-in-the-loop assistance"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - Initialize Domain Workspace (Priority: P1)

As a developer, I want to initialize a new domain workspace so that I have a structured environment for composing services into a domain choreography.

**Why this priority**: Foundation for all composition work. Without a domain workspace, no other operations are possible.

**Independent Test**: Can be fully tested by running `spas-compose init my-domain` and verifying the folder structure is created with README.md, empty choreography.yaml, and agent prompt reference.

**Acceptance Scenarios**:

1. **Given** an empty directory, **When** I run `spas-compose init e-commerce`, **Then** a folder `e-commerce/` is created with:
   - `README.md` containing workflow instructions and command reference
   - `choreography.yaml` with empty/minimal structure
   - `services/` empty directory for pulled service metadata
   - `transformations/` empty directory for JSONata files

2. **Given** I run `spas-compose init my-domain`, **When** the command completes, **Then** agent prompt file `.github/agents/spas-compose.md` is created at project root (if not exists) for AI-assisted composition.

3. **Given** a domain folder already exists, **When** I run `spas-compose init my-domain`, **Then** the command fails with a clear error message suggesting `--force` flag to overwrite.

---

### User Story 2 - Pull Service Metadata (Priority: P1)

As a developer, I want to pull service metadata from the SPAS Repository so that I have machine-readable contracts available for choreography composition.

**Why this priority**: Services are the building blocks of choreography. Without pulled service metadata, the AI agent has no contracts to analyze.

**Independent Test**: Can be fully tested by running `spas-compose services pull order-service 1.0.0` against a running Repository and verifying metadata and schemas are stored locally.

**Acceptance Scenarios**:

1. **Given** a domain workspace exists, **When** I run `spas-compose services pull order-service 1.0.0 --repo http://localhost:3000`, **Then** service metadata is downloaded to `services/order-service/`:
   - `spas.json` — full service metadata
   - `schemas/` — event and message schemas

2. **Given** a domain workspace exists, **When** I run `spas-compose services pull order-service 1.0.0` without `--repo`, **Then** the CLI uses `SPAS_REPOSITORY_URL` environment variable or default `http://localhost:3000`.

3. **Given** a service is already pulled, **When** I run `spas-compose services pull order-service 1.0.0`, **Then** the command updates/overwrites the existing metadata.

4. **Given** the repository is unreachable, **When** I run `spas-compose services pull order-service 1.0.0`, **Then** the command fails with actionable error message including repository URL and connectivity hints.

---

### User Story 3 - Deploy Choreography to Docker Compose (Priority: P2)

As a developer, I want to generate a Docker Compose deployment from my choreography so that I can run the composed domain locally.

**Why this priority**: Deployment is the ultimate goal of composition. This enables running and testing the choreography. Ranked P2 because it depends on having a valid choreography.yaml (which AI assists with).

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker` with a valid choreography.yaml and verifying docker-compose.yaml is generated with correct service and sidecar configurations.

**Acceptance Scenarios**:

1. **Given** a domain with valid `choreography.yaml` and pulled services, **When** I run `spas-compose choreography deploy --docker`, **Then** `docker-compose.yaml` is generated with:
   - Service containers for each participating service
   - Sidecar containers for each service with transformation volume mounts
   - Redis container for event streaming
   - Zipkin container for distributed tracing
   - Correct environment variables and network configuration

2. **Given** a domain with valid choreography, **When** I run `spas-compose choreography deploy --docker --dry-run`, **Then** the command validates choreography and shows what would be generated without writing files.

3. **Given** transformation files referenced in choreography don't exist, **When** I run `spas-compose choreography deploy --docker`, **Then** the command fails with clear error listing missing transformation files.

4. **Given** services referenced in choreography haven't been pulled, **When** I run `spas-compose choreography deploy --docker`, **Then** the command fails with error suggesting `spas-compose services pull` for missing services.

---

### User Story 4 - AI-Assisted Choreography Composition (Priority: P2)

As a developer, I want to use an AI agent to analyze pulled service contracts and propose choreography so that I don't have to manually match event schemas and create transformation rules.

**Why this priority**: This is the key differentiator of spas-compose. The AI-in-the-loop approach dramatically simplifies complex choreography composition. Ranked P2 because it requires the init and pull infrastructure first.

**Independent Test**: Can be tested by running `/spas.compose` agent prompt with pulled services and verifying the agent proposes valid choreography.yaml updates.

**Acceptance Scenarios**:

1. **Given** services are pulled to the workspace, **When** developer runs `/spas.compose Analyze contracts for order-service and fulfillment-service`, **Then** the AI agent:
   - Reads service metadata and event schemas from `services/` folder
   - Proposes choreography.yaml with named flows, topic mappings, and transformation references
   - Prompts developer to confirm or provide feedback

2. **Given** AI proposes choreography, **When** developer responds with "confirm", **Then** the agent:
   - Writes the choreography to `choreography.yaml`
   - Generates `.jsonata` transformation files in `transformations/<service-name>/`
   - Prompts developer to confirm transformation files

3. **Given** AI proposes choreography, **When** developer provides feedback like "change topic name to orders-v2", **Then** the agent revises the proposal and prompts for confirmation again (iterative loop).

4. **Given** transformations are confirmed, **When** developer wants to add another flow, **Then** they can run `/spas.compose Add notification flow for fulfillment-completed events` and follow the same iterative process.

---

### Edge Cases

- What happens when `spas-compose init` is run outside a git repository? — Command succeeds but warns that agent prompts require git repository context.
- What happens when pulling a service version that doesn't exist? — CLI returns 404-based error with suggestion to list available versions.
- What happens when choreography.yaml has syntax errors? — Deploy command fails fast with YAML parsing error and line number.
- How does system handle conflicting service versions in choreography? — Validation warns if same service appears with different versions.
- What happens when JSONata transformation file has syntax errors? — Deploy validates JSONata syntax and reports errors with file path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CLI MUST provide `spas-compose init <domain-name>` command to scaffold a domain workspace with standard folder structure.
- **FR-002**: CLI MUST provide `spas-compose services pull <name> <version>` command to download service metadata from SPAS Repository.
- **FR-003**: CLI MUST provide `spas-compose choreography deploy --docker` command to generate Docker Compose deployment from choreography.yaml.
- **FR-004**: CLI MUST support `--dry-run` flag on deploy command to validate without generating files.
- **FR-005**: CLI MUST support `--repo <url>` flag and `SPAS_REPOSITORY_URL` environment variable for repository location.
- **FR-006**: CLI MUST create/update `.github/agents/spas-compose.md` agent prompt file during init.
- **FR-007**: CLI MUST validate that referenced services are pulled before deployment.
- **FR-008**: CLI MUST validate that referenced transformation files exist before deployment.
- **FR-009**: CLI MUST validate JSONata syntax in transformation files before deployment.
- **FR-010**: CLI MUST generate sidecar configurations with correct volume mounts for transformation folders.
- **FR-011**: Generated docker-compose.yaml MUST include Redis and Zipkin infrastructure containers.
- **FR-012**: CLI MUST follow text I/O protocol: success to stdout, errors to stderr, exit codes (0 success, non-zero failure).

### Key Entities

- **Domain Workspace**: Folder structure containing choreography configuration, pulled service metadata, and transformation files. Root contains choreography.yaml and README.md.
- **Choreography**: YAML configuration defining named flows, participating services, topic mappings, and transformation references. Single file supports multiple named flows.
- **Transformation**: JSONata expression file (`.jsonata`) that transforms event payloads between service internal schemas and domain schemas. Organized per-service in `transformations/<service-name>/`.
- **Pulled Service**: Local copy of service metadata (`spas.json`) and schemas, stored in `services/<service-name>/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can initialize a domain workspace in under 5 seconds with single command.
- **SC-002**: Developer can pull service metadata from repository in under 10 seconds per service.
- **SC-003**: Developer can generate valid docker-compose.yaml from choreography in under 30 seconds.
- **SC-004**: Generated docker-compose.yaml runs successfully with `docker compose up` without manual edits.
- **SC-005**: AI agent can propose initial choreography for 2-3 services within one iteration 80% of the time.
- **SC-006**: CLI provides actionable error messages that guide developer to resolution without consulting documentation.

## Assumptions

- SPAS Repository is running and accessible via HTTP (default http://localhost:3000).
- Services have been published to Repository via `spas-service publish` before pulling.
- Developer has Docker installed for running generated docker-compose.yaml.
- AI agent prompt (`.github/agents/spas-compose.md`) is recognized by GitHub Copilot or compatible AI tool.
- Transformation files use JSONata format per ADR-036.
- Choreography.yaml supports multiple named flows per ADR-037.

## References

- [principles/component/13-cli.md](../../principles/component/13-cli.md) — CLI specification (source of truth)
- [principles/component/14-domain-choreography.md](../../principles/component/14-domain-choreography.md) — Choreography and transformation specification
- [ADR-036](../../principles/appendix/28-decision-log.md) — JSONata for transformation files
- [ADR-037](../../principles/appendix/28-decision-log.md) — AI-in-the-loop composition
- [ADR-038](../../principles/appendix/28-decision-log.md) — Sidecar language flexibility
