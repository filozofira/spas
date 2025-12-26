# AI Agents

SPAS includes GitHub Copilot agent prompts to accelerate development workflows.

## Available Agents

### Service Development

| Agent | Purpose |
|-------|---------|
| `/spas.service` | AI-assisted SPAS service scaffolding — creates complete service structure with endpoints, events, and sidecar integration |

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

### Workflow Example (Service Development)

The `/spas.service` agent guides you through a 9-phase human-in-the-loop workflow:

1. **Initialize workspace**: Run `spas-service init <service-name>` to create the folder structure
2. **Invoke agent**: `/spas.service NAME:<id> STACK:<java|dotnet> CONTEXT:<name>` followed by your requirements
3. **Follow phases**: The agent asks for confirmation at each phase before proceeding

```
/spas.service NAME:order-service STACK:java CONTEXT:orders
Create a service with CreateOrder command that produces order-created event
```

**9-Phase Workflow:**

| Phase | What Happens |
|-------|--------------|
| 1. Analyze | Parse tokens, validate workspace structure |
| 2. Project Structure | Propose Maven/Gradle or .csproj setup |
| 3. Service Metadata | Configure identity, security, license |
| 4. Storage Layer | Create repository interface + in-memory impl |
| 5. Endpoints & Model | Add command/query endpoints with schemas |
| 6. Events | Create event classes and CloudEvent schemas |
| 7. Sidecar Integration | Wire up SPAS sidecar for event publishing |
| 8. Runtime | Generate Dockerfile and deployment config |
| 9. Validate | Build project, generate metadata archive |

**Key Features:**
- Confirmation gates at each phase (human-in-the-loop)
- SDK-based metadata extraction (no manual schema files)
- Sidecar integration for event publishing
- Both Java/Spring and .NET support

## Configuration

Agent prompts are stored in:

- `.github/agents/` — Agent prompt files
- `.specify/` — SpecKit memory, templates, and constitution

## Contributing

When modifying agent prompts:

1. Test changes with representative scenarios
2. Keep prompts focused and composable
3. Document any new agents in this README
