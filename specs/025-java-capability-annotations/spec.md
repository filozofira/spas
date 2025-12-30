# Feature Specification: Java Capability Annotations Guidance

**Feature Branch**: `025-java-capability-annotations`  
**Created**: 2025-12-30  
**Completed**: 2025-12-30
**Status**: ✅ Complete (PoC)  
**Input**: User description: "spas-service init CLI generated agent should be updated to instruct agents to use the annotation approach for Java capabilities instead of options.addCapability('{primary-capability}'). To avoid confusion the options.addCapability('{primary-capability}') should be removed from SDK."

## Clarifications

### Session 2025-12-30

- Q: Should `options.addCapability` be hard-removed now or first deprecated for one minor version? → A: Deprecate for one minor version with warnings.
- Q: Does this change apply strictly to Java SDK and Java scaffolds, or should similar wording be audited across all SDKs to avoid cross-language confusion? → A: Java-only (no cross-SDK audit).

## User Scenarios & Testing *(mandatory)*


### User Story 1 - Generate Java agent with correct guidance (Priority: P1)

A service developer uses `spas-service init` to scaffold a Java agent and receives clear instructions to declare capabilities via annotations on command and query handlers, not by calling an `options.addCapability` method.

**Why this priority**: Prevents incorrect usage patterns at the point of scaffolding; ensures consistency with the Java SDK's annotation-based capability model.

**Independent Test**: Run the CLI to generate a Java agent; the generated readme/instructions and sample code reference annotations for capability declaration and contain no references to `options.addCapability`.

**Acceptance Scenarios**:

1. **Given** a developer runs `spas-service init` targeting Java, **When** the agent is generated, **Then** the printed guidance and generated files instruct capability declaration via annotations.
2. **Given** a fresh scaffold, **When** searching the generated project, **Then** no occurrences of `options.addCapability` are present.

---

### User Story 2 - Java SDK aligns with annotation-only approach (Priority: P2)

A Java developer exploring the SDK does not find `options.addCapability` in public guidance or examples, avoiding mixed patterns and confusion.

**Why this priority**: Eliminates conflicting patterns across docs and code; reduces onboarding friction.

**Independent Test**: Review SDK examples and public APIs for Java; verify deprecation/removal of `options.addCapability` and presence of annotation examples.

**Acceptance Scenarios**:

1. **Given** the Java SDK docs and samples, **When** viewed by a developer, **Then** they demonstrate annotation-based capability declaration exclusively.

---

### User Story 3 - Update existing services to annotations (Priority: P3)

Teams with existing Java services using `options.addCapability` can quickly switch to annotation-based capability declaration without a formal migration document.

**Why this priority**: Encourages consistency across services with minimal overhead; no separate migration track needed.

**Independent Test**: A concise "Capability Declaration" section in Java SDK docs shows how to declare capabilities via annotations; no separate migration guide is produced.

**Acceptance Scenarios**:

1. **Given** a codebase with `options.addCapability`, **When** replacing capability declarations with annotations as shown in the SDK docs, **Then** the service builds successfully and behavior remains consistent.
2. **Given** the Java SDK docs, **When** viewing capability declaration guidance, **Then** annotations are the only documented path and no migration document is referenced.

---


### Edge Cases

- Generated project language is misidentified; ensure guidance changes only for Java targets.
- Projects upgrading SDK versions still compiling against removed/deprecated APIs.
- Mixed patterns in a codebase (some annotated, some using `options.addCapability`).
- Tooling that parses generated instructions relies on exact phrasing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `spas-service init` flow for Java MUST instruct capability declaration via annotations on handlers (e.g., commands/queries), not via `options.addCapability`.
- **FR-002**: The Java agent scaffold produced by the CLI MUST NOT contain any reference to `options.addCapability` in code, comments, or guidance text.
- **FR-003**: The Java SDK public-facing samples and docs MUST exclusively demonstrate annotation-based capability declaration.
- **FR-004**: The `options.addCapability` API in the Java SDK MUST be deprecated for one minor version with compiler/runtime warnings, then removed in the following minor version.
- **FR-005**: The SDK MUST include a clear deprecation message that directs users to the annotation-based approach (no separate migration guide required) and documents the removal version.
- **FR-006**: The repository documentation affected by the CLI and SDK MUST be updated to align with the annotation-only guidance for Java.
- **FR-007**: The CLI MUST pass existing non-Java paths unchanged (no impact to other languages or tooling). No cross-SDK wording audit or changes are in scope for this feature.

### Key Entities *(include if feature involves data)*

- **Generated Agent (Java)**: The scaffolded project and its included guidance.
- **Java SDK Guidance**: Samples and docs illustrating capability declaration.
- **Capability Annotation**: The annotation(s) used to declare capabilities on handlers.

## Success Criteria *(mandatory)*


### Measurable Outcomes

- **SC-001**: Generating a Java agent results in zero occurrences of `options.addCapability` across generated files and printed instructions.
- **SC-002**: 100% of Java SDK samples and docs show annotation-based capability declaration and 0% show `options.addCapability`.
- **SC-003**: A developer can update an example service using `options.addCapability` to annotations within 10 minutes using the SDK docs' capability section (no migration guide).
- **SC-004**: No change in non-Java scaffolds or SDKs verified by spot checks across at least one non-Java template.

## Assumptions

- Annotation-based capability declaration is the canonical approach for Java going forward.
- Non-Java platforms may continue to use different mechanisms; this feature does not alter them.
- The CLI can selectively tailor guidance based on the chosen language target.

## Open Questions

None.
