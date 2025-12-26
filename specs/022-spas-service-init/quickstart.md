# Quickstart: spas-service init

**Feature**: 022-spas-service-init  
**Time**: ~5 minutes

## Prerequisites

- Node.js 20+
- `spas-service` CLI installed (`npm install -g @spas/cli`)
- Git (recommended for agent file placement)
- AI agent (GitHub Copilot or compatible)

## Quick Setup

### 1. Initialize Service Workspace

```bash
# Create a new service workspace
spas-service init order-service

# Or in a specific directory
spas-service init order-service --output ./services
```

**Output**:
```
✓ Created service workspace: order-service

Workspace structure:
  • order-service/README.md
  • order-service/src/
  • order-service/schemas/endpoints/
  • order-service/schemas/events/
  • order-service/metadata/
  • order-service/.spas/schemas/design-time-metadata-v1.schema.json
  • .github/agents/spas.service.agent.md
  • .github/prompts/spas.service.prompt.md

Next steps:
  • cd order-service
  • /spas.service NAME:order-service STACK:java CONTEXT:orders Scaffold service
```

### 2. Navigate to Workspace

```bash
cd order-service
```

### 3. Scaffold Service with AI Agent

Use the generated agent prompt to scaffold your service:

```
/spas.service NAME:order-service STACK:java CONTEXT:orders
Create a service with CreateOrder command that produces order-created event
```

**Required Tokens**:
- `NAME:<id>` - Service identifier (must match workspace folder)
- `STACK:<java|dotnet>` - Technology stack
- `CONTEXT:<name>` - Bounded context for the service

### 4. Follow the 9-Phase Workflow

The AI agent will guide you through:

| Phase | What Happens |
|-------|--------------|
| 1. Analyze | Parse tokens, validate workspace |
| 2. Project Structure | Propose Maven/Gradle or .csproj |
| 3. Service Metadata | Configure identity, security, license |
| 4. Storage Layer | Create interface + in-memory impl |
| 5. Endpoints & Model | Add command/query endpoints |
| 6. Events | Create event classes and schemas |
| 7. Sidecar Integration | Wire up event publishing |
| 8. Runtime | Generate Dockerfile |
| 9. Validate | Build, generate metadata archive |

**Confirmation gates**: Agent asks for confirmation at each phase.

### 5. Build and Run

After scaffolding completes:

**Java**:
```bash
./mvnw clean package
# or
./gradlew build
```

**.NET**:
```bash
dotnet build
dotnet run
```

### 6. Generate Metadata

```bash
# Java - metadata generated during build via SDK plugin
# .NET - metadata generated during build via SDK task

# Publish to repository
spas-service publish --archive metadata/service.metadata.zip
```

## What's Created

### Workspace Structure

```
order-service/
├── README.md                    # Instructions, SDK links
├── src/                         # Your service code (empty)
├── schemas/
│   ├── endpoints/               # Endpoint request/response schemas
│   └── events/                  # Event payload schemas
├── metadata/                    # Generated metadata archives
└── .spas/
    └── schemas/
        └── design-time-metadata-v1.schema.json
```

### Agent Files (at git root)

```
.github/
├── agents/
│   └── spas.service.agent.md    # Full AI agent instructions
└── prompts/
    └── spas.service.prompt.md   # Trigger file for /spas.service
```

## Common Options

| Command | Description |
|---------|-------------|
| `spas-service init my-service` | Create workspace in current dir |
| `spas-service init my-service -o ./services` | Create in specific directory |
| `spas-service init my-service --force` | Overwrite existing |
| `spas-service init my-service --json` | JSON output for scripting |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid service name" | Use lowercase kebab-case (e.g., `my-service`) |
| "Workspace already exists" | Use `--force` or choose different name |
| Agent not working | Ensure `.github/agents/spas.service.agent.md` exists |
| Agent missing context | Use all required tokens: NAME, STACK, CONTEXT |

## Next Steps

1. **Read the generated README.md** for SDK-specific instructions
2. **Use `/spas.service`** to scaffold your first command/event pair
3. **Check example services** in `examples/services/` for reference patterns
4. **Publish metadata** to SPAS Repository when ready
