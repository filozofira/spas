# Feature Specification: Compose Diagram Flow Notations

**Feature Branch**: `019-compose-diagram-flow`  
**Created**: 2025-12-23  
**Completed**: 2025-12-23
**Status**: ✅ Complete (PoC)
**Input**: User description: "Extend agent prompt to include agent instruction to add start and end flow notations while generating choreography diagram and make sure that diagram is added to choreography readme"

## Clarifications

### Session 2025-12-23

- Q: Where should the Start/End diagram rules be stored so that `spas-compose init` can include them in the generated agent prompt? → A: Store rules in the `spas-compose` CLI codebase (template embedded in generator)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Agent Generates Diagram with Start/End Nodes (Priority: P1)

When a user invokes the `/spas.compose` agent command to compose a domain choreography, the agent generates a Mermaid flowchart diagram that includes explicit "Start" and "End" nodes to clearly indicate the beginning and termination of the event flow.

**Why this priority**: Start/End notations provide visual clarity for understanding where the choreography begins (user action) and ends (terminal state). This is essential for documentation and onboarding.

**Independent Test**: Invoke `/spas.compose` on any domain with 2+ services; verify the generated diagram contains `Start([Start])` and `End([End])` nodes with appropriate edges.

**Acceptance Scenarios**:

1. **Given** a domain workspace with pulled service contracts, **When** the user runs `/spas.compose` to generate choreography, **Then** the Mermaid diagram includes a `Start([Start])` node connected to the first service in the flow.
2. **Given** a domain workspace with pulled service contracts, **When** the user runs `/spas.compose` to generate choreography, **Then** the Mermaid diagram includes an `End([End])` node connected from the last event target in the flow.
3. **Given** a choreography with multiple terminal events, **When** the diagram is generated, **Then** all terminal paths converge to the `End([End])` node.

---

### User Story 2 - Diagram Auto-Inserted into Domain README (Priority: P1)

When the `/spas.compose` agent generates a choreography, it automatically inserts or updates the Mermaid diagram in the domain's `README.md` file so that documentation stays in sync with the choreography definition.

**Why this priority**: Having the diagram in the README ensures developers and stakeholders always see the current flow without needing to manually update documentation.

**Independent Test**: Run `/spas.compose` on a domain; verify the domain `README.md` contains the generated Mermaid diagram block.

**Acceptance Scenarios**:

1. **Given** a domain workspace with an existing README, **When** the agent generates choreography, **Then** the README is updated to include the Mermaid diagram at the top of the file.
2. **Given** a domain workspace without a README, **When** the agent generates choreography, **Then** a new README is created containing the Mermaid diagram.
3. **Given** a domain README with an existing diagram, **When** the agent regenerates choreography, **Then** the existing diagram is replaced with the updated diagram.

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

### Edge Cases

- What happens when the choreography has only one service? → Diagram should show `Start → [service] → End`.
- What happens when there are circular event flows? → Diagram should still have Start/End nodes; cycles are shown as edges back to earlier nodes.
- What happens when README has other content? → Only the diagram section is updated; other content is preserved.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `spas-compose init` CLI command MUST generate agent prompt template that instructs the agent to include `Start([Start])` node in all generated Mermaid diagrams.
- **FR-002**: `spas-compose init` CLI command MUST generate agent prompt template that instructs the agent to include `End([End])` node in all generated Mermaid diagrams.
- **FR-003**: Generated agent prompt MUST instruct the agent to connect the Start node to the first service/event in the flow.
- **FR-004**: Generated agent prompt MUST instruct the agent to connect terminal events to the End node.
- **FR-005**: Generated agent prompt MUST instruct the agent to insert or update the Mermaid diagram in the domain README.md file.
- **FR-006**: Generated agent prompt MUST instruct the agent to use Mermaid `flowchart LR` direction for horizontal flow visualization.
- **FR-007**: Generated agent prompt MUST instruct the agent to label diagram edges with the event type (e.g., `|checkout-initiated|`).
- **FR-008**: Diagram rules MUST be embedded in the `spas-compose` CLI codebase as a template.

### Key Entities

- **Mermaid Diagram**: Flowchart visualization of the choreography with Start/End nodes, service nodes, and event-labeled edges.
- **Domain README**: The `README.md` file in the domain workspace root that contains the choreography diagram.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of diagrams generated by `/spas.compose` include Start and End nodes.
- **SC-002**: Domain README contains the choreography diagram after every `/spas.compose` invocation.
- **SC-003**: Diagram accurately reflects all event flows defined in `choreography.yaml`.
- **SC-004**: No manual diagram editing required after agent generates choreography.
