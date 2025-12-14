# Agent Prompt Contract: /spas.compose

**Location**: `.github/agents/spas-compose.md`  
**Trigger**: `/spas.compose <instruction>`

## Purpose

AI-assisted choreography composition that analyzes pulled service contracts and generates choreography configuration with transformations through iterative developer confirmation.

---

## Responsibilities

### 1. Workspace Awareness

The prompt MUST instruct the agent to:

- Detect domain workspace by presence of `choreography.yaml`
- Read service metadata from `services/<service-name>/spas.json`
- Read event schemas from `services/<service-name>/schemas/*.schema.json`
- Write choreography to `choreography.yaml`
- Write transformations to `transformations/<service-name>/*.jsonata`

### 2. Contract Analysis

The agent MUST be able to:

- Parse `spas.json` to extract `events.published[]` and `events.subscribed[]`
- Identify matching event patterns (publisher → subscriber compatibility)
- Detect schema differences requiring transformation
- Propose topic naming based on event types and bounded contexts

### 3. Choreography Generation

When generating `choreography.yaml`, the agent MUST:

- Follow schema defined in [choreography-schema.yaml](./choreography-schema.yaml)
- Use service names exactly as they appear in pulled metadata
- Reference transformation files with correct relative paths
- Support multiple named flows in single file
- Preserve existing flows when adding new ones

### 4. Transformation Generation

When generating `.jsonata` files, the agent MUST:

- Use valid JSONata syntax
- Map source event fields to target service's expected schema
- Handle common patterns: field renaming, nesting, array mapping
- Include comments explaining the transformation intent
- Follow naming convention: `inbound-<event-kebab>.jsonata` or `outbound-<event-kebab>.jsonata`

### 5. Iterative Confirmation Workflow

The agent MUST follow this workflow:

```text
1. Analyze → Propose choreography.yaml changes
2. Wait for developer: "confirm" | feedback
3. If feedback → Revise and re-propose (loop)
4. If confirm → Write choreography.yaml
5. Propose transformation files
6. Wait for developer: "confirm" | feedback
7. If feedback → Revise and re-propose (loop)
8. If confirm → Write transformation files
9. Suggest next steps (deploy command, add more flows)
```

---

## Expected Prompts

| User Prompt | Agent Behavior |
|-------------|----------------|
| `/spas.compose Analyze order-service and fulfillment-service` | Read both services, propose flow connecting them |
| `/spas.compose Add notification for FulfillmentCompleted` | Add new flow to existing choreography |
| `/spas.compose Review my choreography` | Validate choreography.yaml against pulled services |
| `/spas.compose Generate transformations for order-fulfillment flow` | Create missing .jsonata files for specified flow |

---

## Prompt Template Structure

The agent prompt file SHOULD include these sections:

```markdown
# /spas.compose - Choreography Composition Agent

## Context
- You are helping compose SPAS domain choreography
- Workspace structure: services/, choreography.yaml, transformations/

## Instructions
- Read service metadata from services/<name>/spas.json
- Analyze events.published and events.subscribed
- Propose choreography following schema conventions
- Generate JSONata transformations for schema mapping

## Workflow
1. Analyze requested services
2. Propose choreography (wait for confirm)
3. Generate transformations (wait for confirm)

## Constraints
- Never modify service metadata (read-only)
- Always preserve existing flows unless explicitly asked to replace
- Use kebab-case for topics and file names
```

---

## Validation Criteria

| Criterion | Verification |
|-----------|--------------|
| Workspace detection | Agent finds choreography.yaml before proceeding |
| Service reading | Agent correctly parses spas.json structure |
| Schema compliance | Generated choreography.yaml passes schema validation |
| JSONata validity | Generated .jsonata files have valid syntax |
| Iterative loop | Agent waits for confirmation before writing files |
| Preserve existing | Adding flow doesn't overwrite unrelated flows |

---

## References

- [spec.md User Story 4](../spec.md) — AI-Assisted Choreography Composition
- [choreography-schema.yaml](./choreography-schema.yaml) — Choreography YAML schema
- [data-model.md](../data-model.md) — Entity definitions
