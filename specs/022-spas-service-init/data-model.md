# Data Model: spas-service init

**Feature**: 022-spas-service-init  
**Date**: 2025-12-26

## Entities

### 1. Service Workspace

The folder structure created by `spas-service init`.

```
{service-name}/
├── README.md                           # Workflow instructions, SDK links
├── src/                                # Service source code (empty)
├── schemas/                            # Event/endpoint JSON schemas (empty)
│   ├── endpoints/                      # Endpoint request/response schemas
│   └── events/                         # Event payload schemas
├── metadata/                           # Generated metadata archives (empty)
└── .spas/
    └── schemas/
        └── design-time-metadata-v1.schema.json  # For AI agent reference
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| name | string (kebab-case) | Service identifier, matches folder name |
| path | string (absolute) | Full path to workspace root |
| projectRoot | string \| null | Git root for agent file placement |

---

### 2. Service Name

Unique identifier for the service following SPAS naming conventions.

**Validation Rules**:
- Lowercase letters and numbers only
- Hyphen-separated words (no underscores)
- Starts with a letter
- Ends with a letter or number
- Pattern: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`

**Examples**:
- ✅ `order-service`
- ✅ `inventory-service`
- ✅ `my-service-v2`
- ❌ `Order-Service` (uppercase)
- ❌ `my_service` (underscore)
- ❌ `2service` (starts with number)

---

### 3. Agent Prompt Context

Data passed to the agent prompt template.

```typescript
interface AgentPromptContext {
  /** Path from project root to workspace parent (e.g., "./services") */
  workspaceRoot: string;
}
```

**Note**: Unlike spas-compose which uses `DOMAIN:` prefix, spas-service uses `NAME:` to identify the service workspace. The agent prompt is stack-agnostic; stack-specific behavior is determined by the `STACK:` token at runtime.

---

### 4. README Context

Data passed to the README template.

```typescript
interface ReadmeContext {
  /** Service name (kebab-case) */
  serviceName: string;
}
```

---

### 5. Init Command Options

CLI options for the init command.

```typescript
interface InitOptions {
  /** Custom output directory */
  output?: string;
  /** Overwrite existing workspace */
  force?: boolean;
  /** Output JSON instead of human-readable */
  json?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}
```

---

### 6. Command Result

Standard result type for CLI commands.

```typescript
interface CommandResult {
  success: boolean;
  message: string;
  error?: {
    code: string;
    details: string;
  };
  data?: {
    name: string;
    path: string;
    files: string[];
    agentPromptPath?: string;
    promptFilePath?: string;
  };
}
```

---

## State Transitions

### Workspace Creation Flow

```
[Empty Directory]
       │
       ▼ spas-service init <name>
       │
       ├─ [Name Invalid] → Error: INVALID_NAME
       │
       ├─ [Exists && !force] → Error: WORKSPACE_EXISTS
       │
       ▼ [Valid]
       │
[Create Directories]
       │  - {name}/
       │  - {name}/src/
       │  - {name}/schemas/endpoints/
       │  - {name}/schemas/events/
       │  - {name}/metadata/
       │  - {name}/.spas/schemas/
       │
       ▼
[Write Files]
       │  - README.md
       │  - .spas/schemas/design-time-metadata-v1.schema.json
       │
       ▼
[Find Git Root]
       │
       ├─ [Git Found] → Use git root for agent files
       │
       ├─ [No Git] → Use workspace parent, warn user
       │
       ▼
[Write Agent Files]
       │  - .github/agents/spas.service.agent.md
       │  - .github/prompts/spas.service.prompt.md
       │
       ▼
[Success Result]
```

---

## Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        spas-service init                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      Service Workspace                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  README.md  │  │  src/        │  │  .spas/schemas/          │ │
│  │  (generated)│  │  (empty)     │  │  design-time-metadata-   │ │
│  │             │  │              │  │  v1.schema.json          │ │
│  └─────────────┘  └──────────────┘  └──────────────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐                               │
│  │  schemas/   │  │  metadata/   │                               │
│  │  endpoints/ │  │  (empty)     │                               │
│  │  events/    │  │              │                               │
│  └─────────────┘  └──────────────┘                               │
└───────────────────────────┬─────────────────────────────────────-─┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌───────────────────────┐        ┌───────────────────────┐
│   Agent Prompt        │        │   Prompt Trigger      │
│   .github/agents/     │        │   .github/prompts/    │
│   spas.service.       │        │   spas.service.       │
│   agent.md            │        │   prompt.md           │
│   (~25-35 KB)         │        │   (~100 bytes)        │
└───────────────────────┘        └───────────────────────┘
```
