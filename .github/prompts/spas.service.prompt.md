---
description: Trigger for SPAS service scaffolding agent
globs: ["**/*.java", "**/*.cs", "**/*.csproj", "**/pom.xml", "**/build.gradle", "**/spas.json", "**/Dockerfile"]
---

# SPAS Service Scaffolding

This prompt triggers the SPAS service scaffolding agent. Use the full agent instructions at `.github/agents/spas.service.agent.md`.

## Usage

```
/spas.service NAME:<service-name> STACK:<java|dotnet> CONTEXT:<bounded-context>
[Optional description of commands, events, and business logic]
```

**Required Tokens**:
- `NAME:<id>` - Service identifier (must match workspace folder name)
- `STACK:<java|dotnet>` - Technology stack (java for Spring Boot, dotnet for ASP.NET Core)
- `CONTEXT:<name>` - Bounded context (e.g., orders, inventory, payments)

**Example**:
```
/spas.service NAME:order-service STACK:java CONTEXT:orders
Create a service with CreateOrder command that produces order-created event
```

## What This Does

The agent will:
1. Parse tokens and validate workspace structure
2. Scaffold project structure (Maven/Gradle or .csproj)
3. Generate service metadata (spas.json)
4. Create storage layer with repository interface
5. Implement command/query endpoints
6. Define event classes and generate JSON schemas
7. Wire up sidecar integration for event publishing
8. Generate Dockerfile for containerization
9. Build and validate the service

Each phase requires confirmation before proceeding.

## Agent Location

Full instructions: `.github/agents/spas.service.agent.md`

## Next Steps

After scaffolding:
1. Build the service (`./mvnw package` or `dotnet build`)
2. Run locally and test endpoints
3. Generate metadata archive
4. Publish to SPAS repository: `spas-service publish ./metadata/service.metadata.zip`
