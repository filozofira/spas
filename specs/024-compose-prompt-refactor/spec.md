# Feature Specification: Refactor spas-compose Agent Prompt

**Feature Branch**: `024-compose-prompt-refactor`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Refactor the `spas-compose` CLI agent prompt generation to improve maintainability and enforce a stricter, more consistent AI workflow. The goal is to decouple prompt content from the CLI code to enable easier updates and to enhance the agent instructions. Key improvements include adding rigorous confirmation gates at the end of each phase and defining explicit, standalone steps for documentation updates (such as inserting diagrams into READMEs), ensuring the agent reliably follows the intended choreography development process without skipping steps."

## Clarifications

### Session 2025-12-28
- Q: Which template engine should be used for decoupling the prompt content? → A: Mandate `Eta` (matches `spas-service`).
- Q: How should templates be distributed with the CLI? → A: Embed templates in binary (matches `spas-service`).
- Q: Should the prompt be split into partials (e.g., technical reference)? → A: Yes, include `technical-reference.eta`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Strict Workflow Enforcement (Priority: P1)

As a domain composer using the AI agent, I want the agent to follow a strict, gated workflow where it must stop and ask for my confirmation at the end of each phase, so that I can verify the output (e.g., proposed design, generated files) before proceeding.

**Why this priority**: Prevents the agent from cascading errors by jumping ahead and ensures the user is in control of the composition process.

**Independent Test**: Initialize a new workspace, invoke the agent, and verify that after the "Analyze" phase, the agent stops and presents a summary with a "Proceed?" prompt. Repeat for "Propose" and "Generate" phases.

**Acceptance Scenarios**:

1. **Given** the agent has completed the "Analyze" phase, **When** it presents the analysis summary, **Then** it must explicitly ask "Proceed to Phase 2 (Propose)? (yes/no)" and wait for user input.
2. **Given** the agent has completed the "Propose" phase, **When** it presents the design, **Then** it must explicitly ask "Proceed to Phase 3 (Generate)? (yes/no)" and wait for user input.

---

### User Story 2 - Explicit Documentation Updates (Priority: P1)

As a domain composer, I want the agent to treat "Update README with Diagram" as a mandatory, standalone action in the workflow, so that my domain documentation always reflects the current choreography design.

**Why this priority**: Documentation is often skipped by agents if it's a sub-bullet. Making it a primary action ensures the visual diagram is always available for review.

**Independent Test**: Run the agent through the "Propose" phase and verify that it explicitly executes a file edit to update `README.md` with the Mermaid diagram before asking to proceed.

**Acceptance Scenarios**:

1. **Given** the agent is in the "Propose" phase, **When** it designs the choreography, **Then** it must generate a Mermaid diagram and insert/update it in the workspace `README.md` file.
2. **Given** the `README.md` is updated, **When** the agent presents the design summary, **Then** it confirms that the documentation has been updated.

---

### User Story 3 - Decoupled Prompt Templates (Priority: P2)

As a CLI maintainer, I want the agent prompt content to be stored in separate template files (not TypeScript code), so that I can easily read, edit, and format the prompt instructions without recompiling the CLI.

**Why this priority**: Improves developer experience and maintainability of the CLI codebase.

**Independent Test**: Verify that `src/utils/templates.ts` no longer contains long string literals for the prompt and instead loads content from template files.

**Acceptance Scenarios**:

1. **Given** the `spas-compose` CLI source code, **When** I inspect `src/utils/templates.ts`, **Then** I see logic to render templates rather than hardcoded prompt strings.
2. **Given** a change is needed in the prompt text, **When** I edit the corresponding template file, **Then** the `spas-compose init` command generates the updated prompt.

### Edge Cases

- **Template File Missing**: If a template file is missing at runtime, the CLI should fail gracefully with a clear error message.
- **Invalid Template Syntax**: If a template contains invalid syntax, the CLI should report the error during generation.
`Eta` 
## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST generate the agent prompt using external `Eta` template files.
- **FR-002**: The agent prompt MUST define a 5-phase workflow (Analyze, Propose, Generate, Validate, Build).
- **FR-003**: Each phase in the prompt MUST conclude with a mandatory confirmation gate requiring user input to proceed.
- **FR-004**: The "Propose" phase MUST include a standalone action step to update the workspace `README.md` with the choreography diagram.
- **FR-005**: The CLI MUST support rendering templates with dynamic context (e.g., domain root).
- **FR-006**: Templates MUST be embedded in the CLI build artifact to avoid runtime file dependencies.
- **FR-007**: The prompt structure MUST be modularized using partials (e.g., `technical-reference.eta`) for maintainability.
### Success Criteria

- **Measurable**: Agent stops at confirmation gates 100% of the time in test runs.
- **Measurable**: `README.md` is updated with a Mermaid diagram in 100% of "Propose" phase executions.
- **Maintainability**: Prompt content is fully decoupled from TypeScript code.
