# Template Data Model

This document describes the data context passed to the Eta templates for generating the agent prompt.

## Agent Prompt Context

The `agent-prompt.eta` template receives the following data object:

```typescript
interface AgentPromptContext {
  /**
   * Relative path from the project root to the domain parent directory.
   * Used to construct paths in the prompt (e.g., `${domainRoot}/{DOMAIN}/...`).
   * Example: "./examples/ecommerce" or "."
   */
  domainRoot: string;
}
```

## Partials

All partials receive the same context object (`it` in Eta).

### `workflow-phases.eta`

Uses `it.domainRoot` to specify paths for validation steps.

### `technical-reference.eta`

Uses `it.domainRoot` to point to schema file locations.

### `error-handling.eta`

Uses `it.domainRoot` to suggest correct CLI commands in error messages.
