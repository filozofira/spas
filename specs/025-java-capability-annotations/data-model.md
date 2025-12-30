# Data Model: Java Capability Annotations Guidance

**Feature**: 025-java-capability-annotations  
**Created**: 2025-12-30  
**Purpose**: Define entities, relationships, and state model for the feature.

## Overview

This feature does not introduce new runtime data entities or persistence requirements. Instead, it modifies **guidance artifacts** and **code patterns** that influence how developers declare service capabilities.

The "data" in this context refers to:
1. **CLI Template Content** (text templates that generate agent instructions)
2. **SDK Method Signatures** (deprecation metadata on Java methods)
3. **Documentation Content** (README sections and code examples)

---

## Conceptual Entities

### 1. CLI Template

**Definition**: ETA (Embedded JavaScript Template) files used by `spas-service init` to generate agent instructions.

**Attributes**:
- `filePath`: String - Location in `components/cli/spas-service/templates/`
- `templateContent`: String - ETA template with placeholders (e.g., `{NAME}`, `{CONTEXT}`)
- `targetLanguage`: Enum - `java | dotnet | all`
- `section`: Enum - `sdk-patterns | workflow-phases | agent-prompt`

**Relationships**:
- Contains 0..N `CodeExample` blocks
- Referenced by `WorkspaceService.create()` during workspace generation

**State Transitions**:
- Created → Modified (developer edits template)
- Modified → Validated (template compilation succeeds)
- Validated → Deployed (merged to main branch)

**Validation Rules**:
- ETA syntax must be valid (no unclosed tags)
- Placeholders must match expected tokens (`{NAME}`, `{CONTEXT}`, etc.)
- Generated output must not contain deprecated patterns (e.g., `addCapability()` for Java)

---

### 2. Code Example (within Template)

**Definition**: Inline code block in a CLI template showing how to use the SDK.

**Attributes**:
- `language`: Enum - `java | csharp`
- `codeSnippet`: String - Multi-line code sample
- `context`: String - Descriptive label (e.g., "Application Entry Point", "Phase 3 Guidance")
- `isDeprecated`: Boolean - Whether the example shows deprecated patterns

**Relationships**:
- Belongs to one `CLI Template`
- References zero or more `SDK Methods`

**State Transitions**:
- Created → Current (template uses best practices)
- Current → Deprecated (SDK evolves, pattern no longer recommended)
- Deprecated → Removed (template updated to remove example)

**Validation Rules**:
- If `language = java` and `codeSnippet` contains `addCapability`, then `isDeprecated = true`
- If `isDeprecated = true`, example MUST be removed or updated

---

### 3. SDK Method

**Definition**: A Java method in the SPAS SDK that provides programmatic capability registration.

**Attributes**:
- `className`: String - Fully qualified class name (e.g., `io.spas.sdk.spring.SpasServiceOptions`)
- `methodName`: String - Method identifier (e.g., `addCapability`)
- `signature`: String - Full method signature with return type
- `deprecatedSince`: String | null - SDK version when deprecated (e.g., "1.1.0")
- `forRemoval`: Boolean - Whether scheduled for removal
- `removalVersion`: String | null - Version when method will be removed (e.g., "2.0.0")
- `replacementGuidance`: String - Javadoc text explaining alternative approach

**Relationships**:
- May be referenced by `CodeExample` in CLI templates
- May be referenced by `Documentation Section` in SDK READMEs

**State Transitions**:
- Active → Deprecated (`@Deprecated` annotation added)
- Deprecated → Removed (method deleted in major version bump)

**Validation Rules**:
- If `forRemoval = true`, then `removalVersion` MUST be specified
- If `deprecatedSince` is set, then `replacementGuidance` MUST be non-empty
- Major version bump MUST remove all methods where `removalVersion ≤ currentVersion`

---

### 4. Documentation Section

**Definition**: A markdown section in SDK README files explaining a feature or pattern.

**Attributes**:
- `filePath`: String - Location of README (e.g., `components/sdk/java/README.md`)
- `heading`: String - Section title (e.g., "## Declaring Capabilities")
- `content`: String - Markdown content with code examples
- `lastUpdated`: Date - When section was last modified
- `targetAudience`: Enum - `getting-started | advanced | migration`

**Relationships**:
- May reference `SDK Method` in code examples
- May reference `Code Example` patterns from CLI templates

**State Transitions**:
- Missing → Drafted (section created)
- Drafted → Reviewed (content verified for accuracy)
- Reviewed → Published (merged to main branch)
- Published → Updated (SDK evolves, guidance revised)

**Validation Rules**:
- If referencing deprecated `SDK Method`, MUST include migration note
- Code examples MUST be syntactically valid (compile-tested)
- Migration notes MUST show before/after comparison

---

## Entity Relationships

```
CLI Template (1) ──┐
                   ├───> Code Example (0..N) ──┐
                   │                            ├───> SDK Method (0..N)
                   └────────────────────────────┘
                                                 │
Documentation Section (1) ───────────────────>─┘
```

**Constraints**:
- A `Code Example` MUST NOT reference a deprecated `SDK Method` unless within a migration note
- A `CLI Template` targeting Java MUST NOT generate code containing deprecated patterns
- A `Documentation Section` MUST include migration notes for all deprecated methods it previously referenced

---

## Data Flow

### 1. Developer runs `spas-service init`

```
User Input (service-name, language)
  ↓
WorkspaceService.create()
  ↓
Template Engine (ETA)
  ├─ Loads `CLI Template` (sdk-patterns.eta, workflow-phases.eta)
  ├─ Substitutes placeholders ({NAME}, {CONTEXT})
  ├─ Generates agent instruction file (.github/agents/spas.service.agent.md)
  └─ Outputs guidance with Code Examples
  ↓
Developer sees recommended patterns (NO addCapability() for Java)
```

**Data Validation Points**:
- Template compilation (ETA syntax)
- Generated output matches language (Java-specific sections for STACK:java)
- No deprecated patterns in generated code

---

### 2. Developer uses SDK in service code

```
Developer writes service class
  ↓
References Documentation Section ("Declaring Capabilities")
  ↓
Follows Code Example showing annotations
  ↓
Compiles service with Maven/Gradle
  ├─ If using addCapability(): Deprecation warning emitted
  └─ If using annotations: No warnings
  ↓
Metadata extractor discovers capabilities from annotations
  ↓
spas.json generated with capability list
```

**Data Validation Points**:
- Compiler checks for `@Deprecated` methods (warnings)
- Metadata extractor validates annotation presence (runtime/build-time)
- Generated spas.json includes capabilities from annotations

---

## State Model

### SDK Method Lifecycle

```
[Active]
   │
   │ (Developer adds @Deprecated annotation)
   ↓
[Deprecated]
   │
   │ (Minor version releases: 1.1.0, 1.2.0, ...)
   ↓
[Scheduled for Removal]
   │
   │ (Major version bump: 2.0.0)
   ↓
[Removed]
```

**Invariants**:
- An active method cannot transition directly to removed (must pass through deprecated)
- A deprecated method must remain available for at least one minor version
- A removed method cannot be restored (must use new method name if functionality returns)

---

### CLI Template Lifecycle

```
[Current Best Practice]
   │
   │ (SDK evolves; pattern deprecated)
   ↓
[Contains Deprecated Pattern]
   │
   │ (Developer updates template)
   ↓
[Updated to New Pattern]
   │
   │ (Validation passes)
   ↓
[Current Best Practice]
```

**Invariants**:
- A template MUST NOT remain in "Contains Deprecated Pattern" state beyond one minor SDK version
- Updates MUST preserve non-affected language sections (e.g., .NET patterns unchanged)
- Generated output MUST compile without warnings for the target language

---

## Validation Rules Summary

### Template-Level Rules
1. **Language Isolation**: Changes to Java patterns MUST NOT affect .NET patterns
2. **Placeholder Consistency**: All `{TOKENS}` must have corresponding substitution values
3. **Example Accuracy**: Code examples must compile in target language

### SDK-Level Rules
1. **Deprecation Completeness**: `@Deprecated` annotation MUST include `since` and `forRemoval`
2. **Javadoc Links**: Replacement guidance MUST use `@link` to reference alternative APIs
3. **Version Sequencing**: `removalVersion` MUST be greater than `deprecatedSince`

### Documentation-Level Rules
1. **Migration Note Presence**: If a README previously showed `addCapability()`, it MUST include a migration note
2. **Code Example Validity**: All code snippets MUST be syntactically correct
3. **Consistency**: README examples MUST match CLI template patterns

---

## Impact on Success Criteria

### SC-001: Zero `addCapability()` occurrences in generated Java scaffolds

**Data Validation**: 
- Post-deployment: Run `spas-service init` with `STACK:java`
- Search generated files for regex: `addCapability\(`
- Assert: 0 matches

**Entity Involved**: `CLI Template`, `Code Example`

---

### SC-002: 100% annotation-based examples in SDK docs

**Data Validation**:
- Parse all README.md files in `components/sdk/java/`
- Extract code blocks with language tag `java`
- Search for `addCapability` outside migration notes
- Assert: 0 matches

**Entity Involved**: `Documentation Section`

---

### SC-003: Migration within 10 minutes

**Data Validation**:
- Provide sample service using `addCapability()`
- Follow migration note in README
- Measure time to convert + compile successfully
- Assert: ≤ 10 minutes

**Entity Involved**: `Documentation Section` (migration note), `SDK Method` (deprecation message)

---

### SC-004: No impact on non-Java scaffolds

**Data Validation**:
- Run `spas-service init` with `STACK:dotnet`
- Verify `.NET` sections of templates unchanged
- Assert: Git diff shows no changes to .NET-specific template blocks

**Entity Involved**: `CLI Template` (language-specific sections)

---

## Summary

While this feature does not introduce traditional runtime data entities, it involves structured artifacts (templates, SDK methods, documentation) with defined states, transitions, and validation rules. The "data model" describes how these artifacts relate, evolve, and ensure consistent guidance for developers declaring service capabilities.

**Key Takeaway**: Deprecation and guidance updates are treated as first-class data transformations with validation rules equivalent to schema migrations in traditional data systems.
