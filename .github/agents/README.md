# AI Agents

SPAS includes GitHub Copilot agent prompts to accelerate development workflows.

## Available Agents

### Domain Composition

| Agent | Purpose |
|-------|---------|
| `/spas.compose` | AI-assisted domain choreography authoring — generates `choreography.yaml` mappings and JSONata transformations |

### SpecKit (Specification Toolkit)

SpecKit provides a structured workflow for turning ideas into implemented features:

| Agent | Purpose |
|-------|---------|
| `/speckit.specify` | Create structured specifications from requirements |
| `/speckit.clarify` | Identify ambiguities and ask clarifying questions |
| `/speckit.analyze` | Analyze specs for gaps and inconsistencies |
| `/speckit.plan` | Generate implementation plans from specs |
| `/speckit.tasks` | Break plans into actionable task lists |
| `/speckit.checklist` | Generate quality/acceptance checklists |
| `/speckit.implement` | Execute tasks with guided implementation |
| `/speckit.taskstoissues` | Convert tasks to GitHub issues |
| `/speckit.constitution` | Manage project constitution (norms/conventions) |

## Usage

### Prerequisites

- GitHub Copilot with agent support (Copilot Chat)
- VS Code with GitHub Copilot extension

### Invoking Agents

In Copilot Chat, type the agent name followed by your request:

```
/spas.compose Compose DOMAIN:order-fulfillment choreography using order-service, inventory-service and fulfillment-service.
```

```
/speckit.specify Create a spec for adding retry logic to event publishing
```

### Workflow Example (SpecKit)

1. **Specify**: `/speckit.specify` — Write initial spec from requirements
2. **Clarify**: `/speckit.clarify` — Resolve ambiguities
3. **Plan**: `/speckit.plan` — Create implementation plan
4. **Tasks**: `/speckit.tasks` — Generate task breakdown
5. **Implement**: `/speckit.implement` — Execute tasks with AI guidance

## Configuration

Agent prompts are stored in:

- `.github/agents/` — Agent prompt files
- `.specify/` — SpecKit memory, templates, and constitution

## Contributing

When modifying agent prompts:

1. Test changes with representative scenarios
2. Keep prompts focused and composable
3. Document any new agents in this README
