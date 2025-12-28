# Implementation Plan - Refactor spas-compose CLI agent prompt generation

## Technical Context

- **Language**: TypeScript 5.x
- **Framework**: Node.js (CLI)
- **Database**: N/A
- **Project Type**: CLI Tool

## Constitution Check

- [x] **No Breaking Changes**: The refactor is internal; CLI arguments and outputs remain compatible.
- [x] **Pattern Consistency**: Adopts the `Eta` templating pattern used in `spas-service`.
- [x] **Maintainability**: Decouples prompt logic from code, using modular partials.
- [x] **Documentation**: Enforces explicit documentation update steps in the new prompt workflow.

## Gates

- [x] **Research Complete**: `research.md` confirms Eta selection and embedding strategy.
- [x] **Data Model Defined**: `data-model.md` defines the template context and partial structure.
- [x] **Contracts Defined**: N/A (Internal refactor, no external API contracts).

## Phase 1: Setup & Dependencies

1.  **Add Dependency**:
    -   Update `components/cli/spas-compose/package.json` to include `eta` (v3.5.0+).
    -   Run `npm install`.

2.  **Configure Build**:
    -   Update `components/cli/spas-compose/package.json` scripts.
    -   Add `copy:templates` script to copy `src/templates/**/*.eta` to `dist/templates`.
    -   Update `build` script to include `copy:templates`.

3.  **Create Directory Structure**:
    -   Create `components/cli/spas-compose/src/templates/`.
    -   Create `components/cli/spas-compose/src/templates/partials/`.

## Phase 2: Template Implementation

1.  **Create Partials**:
    -   Create `src/templates/partials/technical-reference.eta` (Project structure, key files).
    -   Create `src/templates/partials/workflow-phases.eta` (The 5-phase workflow: Analyze, Propose, Generate, Validate, Build).
    -   Create `src/templates/partials/documentation-rules.eta` (Explicit README update instructions).
    -   Create `src/templates/partials/confirmation-gates.eta` (Strict user confirmation requirements).

2.  **Create Main Template**:
    -   Create `src/templates/agent-prompt.eta`.
    -   Include partials.
    -   Bind context variables (`projectPath`, `featureName`, `files`, etc.).

## Phase 3: Code Refactoring

1.  **Refactor Template Utility**:
    -   Modify `components/cli/spas-compose/src/utils/templates.ts`.
    -   Implement `Eta` instance configuration.
    -   Implement `renderAgentPrompt(context)` function.
    -   Ensure templates are loaded correctly from `dist/templates` (handling path resolution).

2.  **Update Consumer**:
    -   Locate usage of the old prompt generation logic (likely in `src/commands/generate/prompt.ts` or similar).
    -   Switch to using `renderAgentPrompt`.

## Phase 4: Verification

1.  **Unit Tests**:
    -   Update/Add tests in `components/cli/spas-compose/test/` to verify template rendering.
    -   Ensure all partials are resolved and context is interpolated correctly.

2.  **Manual Verification**:
    -   Build the CLI (`npm run build`).
    -   Run the command to generate a prompt.
    -   Verify the output matches the expected structure and contains all sections.
