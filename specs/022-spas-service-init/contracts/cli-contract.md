# CLI Contract: spas-service init

**Feature**: 022-spas-service-init  
**Date**: 2025-12-26

## Command Specification

### Syntax

```bash
spas-service init <service-name> [options]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `<service-name>` | Yes | Name of the service workspace to create (kebab-case) |

### Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--output <path>` | `-o` | string | `.` | Custom output directory |
| `--force` | `-f` | boolean | false | Overwrite existing workspace |
| `--json` | | boolean | false | Output JSON instead of human-readable |
| `--verbose` | `-v` | boolean | false | Enable verbose logging |
| `--help` | `-h` | boolean | | Display help information |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (invalid name, workspace exists, I/O error) |

---

## Output Formats

### Human-Readable Output (default)

**Success**:
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
  • /spas.service NAME:order-service STACK:java CONTEXT:orders Scaffold service with CreateOrder command
```

**Error - Invalid Name**:
```
✗ Invalid service name: My Service
  Service name must be lowercase, start with a letter, use hyphens (not underscores), and end with a letter or number.
  Example: order-service, inventory-service
```

**Error - Workspace Exists**:
```
✗ Workspace already exists: ./order-service
  Use --force to overwrite existing workspace.
```

### JSON Output (--json flag)

**Success**:
```json
{
  "success": true,
  "message": "Created service workspace: order-service",
  "data": {
    "name": "order-service",
    "path": "/home/user/projects/order-service",
    "files": [
      "order-service/README.md",
      "order-service/src/",
      "order-service/schemas/endpoints/",
      "order-service/schemas/events/",
      "order-service/metadata/",
      "order-service/.spas/schemas/design-time-metadata-v1.schema.json",
      ".github/agents/spas.service.agent.md",
      ".github/prompts/spas.service.prompt.md"
    ],
    "agentPromptPath": ".github/agents/spas.service.agent.md",
    "promptFilePath": ".github/prompts/spas.service.prompt.md"
  }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Invalid service name: My Service",
  "error": {
    "code": "INVALID_NAME",
    "details": "Service name must be lowercase, start with a letter, use hyphens (not underscores), and end with a letter or number."
  }
}
```

---

## Error Codes

| Code | Condition | User Action |
|------|-----------|-------------|
| `INVALID_NAME` | Service name doesn't match pattern | Use kebab-case name |
| `WORKSPACE_EXISTS` | Directory already exists | Use `--force` or choose different name |
| `IO_ERROR` | File system error | Check permissions, disk space |
| `SCHEMA_NOT_FOUND` | design-time-metadata schema missing | Reinstall CLI |

---

## Examples

### Basic Usage

```bash
# Create workspace in current directory
spas-service init order-service

# Create workspace in specific directory
spas-service init order-service --output ./services

# Overwrite existing workspace
spas-service init order-service --force

# JSON output for scripting
spas-service init order-service --json

# Verbose output for debugging
spas-service init order-service --verbose
```

### With AI Agent

After running `spas-service init order-service`:

```
/spas.service NAME:order-service STACK:java CONTEXT:orders
Create a service with CreateOrder command that produces order-created event
```

---

## Service Name Validation

### Pattern

```regex
^[a-z][a-z0-9]*(-[a-z0-9]+)*$
```

### Valid Examples

- `order-service`
- `inventory`
- `my-service-v2`
- `a`
- `ab1`

### Invalid Examples

| Input | Reason |
|-------|--------|
| `Order-Service` | Contains uppercase |
| `my_service` | Contains underscore |
| `2service` | Starts with number |
| `service-` | Ends with hyphen |
| `my--service` | Double hyphen |
| `my service` | Contains space |
