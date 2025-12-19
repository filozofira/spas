# Feature Specification: spas-compose init Scaffolding Fixes

**Feature Branch**: `014-compose-init-fixes`  
**Created**: 2025-12-19  
**Completed**: 2025-12-19  
**Status**: ✅ Complete (PoC)
**Input**: User description: "Fix spas-compose init command scaffolding issues: missing runtime-metadata schema, incomplete README structure section, wrong diagram type in agent prompt, and incorrect command documentation"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Complete Schema Scaffolding (Priority: P1)

As a developer using spas-compose in an external project (outside the SPAS repository), I want all three required schema files to be scaffolded in the `.spas/schemas/` directory when I run `spas-compose init`, so that AI agents and validation tools have complete schema references.

**Why this priority**: Critical bug that breaks functionality outside the SPAS repository. Without the runtime-metadata schema, developers cannot properly understand or validate service metadata structure, and AI agents lack necessary context.

**Independent Test**: Run `spas-compose init test-domain` in a fresh directory outside the SPAS repository and verify all three schema files exist in `.spas/schemas/`.

**Acceptance Scenarios**:

1. **Given** I run `spas-compose init my-domain` in an external project, **When** the command completes, **Then** the directory `.spas/schemas/` contains three files: `sidecar-config-v1.schema.json`, `choreography-v1.schema.json`, and `runtime-metadata-v1.schema.json`
2. **Given** I run `spas-compose init my-domain` within the SPAS repository, **When** the command completes, **Then** all three schema files are still generated correctly without attempting file copy
3. **Given** the generated `runtime-metadata-v1.schema.json` exists, **When** I inspect its content, **Then** it contains the complete JSON schema matching the repository component's schema definition

---

### User Story 2 - Accurate README Documentation (Priority: P2)

As a developer initializing a new domain workspace, I want the generated README.md to accurately document the complete workspace structure including all three schema files, so that I understand what files are available and their purpose.

**Why this priority**: Important for developer experience and discoverability, but not blocking since developers can still use the workspace. Prevents confusion about available schemas.

**Independent Test**: Run `spas-compose init test-domain` and verify the README.md Structure section lists all three schemas.

**Acceptance Scenarios**:

1. **Given** I run `spas-compose init my-domain`, **When** I open the generated README.md, **Then** the Structure section lists all three schema files under `.spas/schemas/`: `sidecar-config-v1.schema.json`, `choreography-v1.schema.json`, and `runtime-metadata-v1.schema.json`
2. **Given** the README.md Structure section, **When** I compare it to the actual scaffolded files, **Then** the documentation matches the actual file structure completely

---

### User Story 3 - Correct Agent Prompt Diagram Guidance (Priority: P2)

As a developer using the `/spas.compose` agent, I want Phase 3 to correctly instruct generating a Choreography Diagram (mermaid flowchart) and adding it to the workspace README.md, so that the agent produces the correct diagram format consistent with SPAS examples.

**Why this priority**: Affects AI agent output quality and consistency. Wrong diagram type (sequence vs choreography flowchart) creates confusion and inconsistent documentation across projects.

**Independent Test**: Review the generated agent prompt file and verify Phase 3 mentions "Choreography Diagram" with mermaid flowchart format and instructs adding it to README.md.

**Acceptance Scenarios**:

1. **Given** I run `spas-compose init my-domain`, **When** I open `.github/agents/spas.compose.agent.md`, **Then** Phase 3: Propose section instructs "Generate Choreography Diagram (mermaid flowchart)" instead of "Generate Sequence Diagram"
2. **Given** the agent prompt Phase 3 instructions, **When** I read the workflow steps, **Then** it explicitly states to add the choreography diagram to the workspace README.md file
3. **Given** the choreography diagram instructions, **When** I review the format guidance, **Then** it references the mermaid flowchart format with subgraph structure (like `flowchart LR` with `subgraph [Domain Name]`)

---

### User Story 4 - Accurate Build Command Documentation (Priority: P2)

As a developer using the `/spas.compose` agent, I want the Actions section to document the correct build commands with proper flags (`--docker`, `--dev`, `--dry-run`), so that I can successfully validate and deploy my choreography.

**Why this priority**: Prevents command execution failures and confusion. Developers following incorrect documentation will fail to build their choreography correctly.

**Independent Test**: Review the generated agent prompt file and verify the Actions section contains correct build command variations.

**Acceptance Scenarios**:

1. **Given** I run `spas-compose init my-domain`, **When** I open `.github/agents/spas.compose.agent.md` and locate the Actions section, **Then** it lists "Dry-run validation: `spas-compose choreography build --docker --dry-run`" (not missing `--docker`)
2. **Given** the Actions section in the agent prompt, **When** I review the build options, **Then** it shows three distinct commands: dry-run with `--docker --dry-run`, dev build with `--docker --dev`, and prod build with `--docker`
3. **Given** the documented commands, **When** I execute them following the agent prompt, **Then** each command works as documented without errors

---

### Edge Cases

- What happens when running `spas-compose init` in the SPAS repository itself? (Should still generate schemas inline rather than attempting copy)
- What happens if the `.spas/schemas/` directory already exists from a previous init with `--force`? (Should overwrite schemas cleanly)
- What happens if there's a schema validation issue in the generated runtime-metadata schema? (Should fail gracefully with clear error)

## Requirements _(mandatory)_

### Functional Requirements

#### Schema Generation (FG01)

- **FR-001**: `spas-compose init` MUST generate `runtime-metadata-v1.schema.json` inline using a `generateRuntimeMetadataSchema()` function in `templates.ts`
- **FR-002**: The generated `runtime-metadata-v1.schema.json` MUST contain the complete and valid JSON Schema matching `components/repository/schemas/runtime-metadata-v1.schema.json`
- **FR-003**: `workspace-service.ts` MUST call `generateRuntimeMetadataSchema()` instead of attempting to copy from file system
- **FR-004**: The schema generation MUST work identically whether run inside or outside the SPAS repository
- **FR-005**: All three schemas (`sidecar-config-v1.schema.json`, `choreography-v1.schema.json`, `runtime-metadata-v1.schema.json`) MUST be generated and written to `.spas/schemas/` directory

#### README Documentation (FG02)

- **FR-006**: The `generateWorkspaceReadme()` function in `templates.ts` MUST list all three schema files in the Structure section
- **FR-007**: The README Structure section MUST show the `.spas/schemas/` directory with three child files listed
- **FR-008**: The schema file names in README MUST exactly match the actual generated file names

#### Agent Prompt Diagram Guidance (FG03)

- **FR-009**: The `generateAgentFile()` function MUST change Phase 3 instruction from "Generate Sequence Diagram" to "Generate Choreography Diagram"
- **FR-010**: Phase 3 MUST specify using "mermaid flowchart" format (not sequence diagram format)
- **FR-011**: Phase 3 MUST instruct to add the choreography diagram to the workspace README.md file
- **FR-012**: The choreography diagram format guidance MUST reference the pattern used in `examples/domains/README.md` (flowchart LR with subgraph)

#### Agent Prompt Command Documentation (FG04)

- **FR-013**: The agent prompt Actions section MUST document "Dry-run validation: `spas-compose choreography build --docker --dry-run`"
- **FR-014**: The agent prompt Actions section MUST document "Docker dev build: `spas-compose choreography build --docker --dev`"
- **FR-015**: The agent prompt Actions section MUST document "Docker prod build: `spas-compose choreography build --docker`"
- **FR-016**: The `--dry-run` command MUST include the `--docker` flag
- **FR-017**: All three build command variations MUST be clearly documented and distinct

### Key Entities _(include if feature involves data)_

- **Runtime Metadata Schema**: JSON Schema defining the structure of SPAS runtime service metadata, including design-time metadata enriched with runtime deployment fields (image references, resource requirements, environment variables)
- **Workspace README**: Generated markdown documentation file describing the domain workspace structure, workflow steps, and available commands
- **Agent Prompt File**: Markdown file containing AI agent instructions for the `/spas.compose` command, including workflow phases, actions, and technical references

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers can run `spas-compose init` in any directory (inside or outside SPAS repository) and receive all three schema files in `.spas/schemas/`
- **SC-002**: The generated README.md Structure section accurately reflects 100% of scaffolded files
- **SC-003**: The `/spas.compose` agent generates choreography diagrams in the correct mermaid flowchart format (not sequence diagrams) when following Phase 3 instructions
- **SC-004**: Developers can execute all three documented build commands (`--docker --dry-run`, `--docker --dev`, `--docker`) successfully without command-line errors
- **SC-005**: Zero instances of missing runtime-metadata schema in external projects after fix is deployed
