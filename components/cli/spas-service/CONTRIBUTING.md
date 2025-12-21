# Contributing to spas-service CLI

Guide for developers working on the `spas-service` CLI tool (not for service developers using the tool—see [README.md](./README.md) for that).

## Prerequisites

- Node.js 20+
- npm
- Git

## Getting Started

```bash
cd components/cli/spas-service
npm install
npm run build
npm link  # Makes spas-service available globally for testing
```

## Project Structure

```
src/
├── index.ts                # CLI entry point (Commander.js setup)
├── types.ts                # TypeScript interfaces
├── commands/
│   ├── publish.ts          # publish command
│   └── pull.ts             # pull command
├── services/
│   ├── repository-client.ts # HTTP client for Repository API
│   ├── metadata-fetcher.ts  # Download metadata from service endpoint
│   ├── archive-builder.ts   # Create ZIP archives
│   └── validator.ts         # Metadata validation
└── utils/
    ├── config.ts           # Configuration resolution
    └── output.ts           # Terminal output formatting

test/
├── unit/                   # Unit tests for services/utils
├── integration/            # End-to-end command tests
└── fixtures/               # Test archives and metadata
```

## Building and Testing

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Watch mode

```bash
npm run test:watch
```

### Lint

```bash
npm run lint
```

## Making Changes Safely

### Adding a new command

1. Create command file in `src/commands/` (e.g., `unpublish.ts`)
2. Implement command logic with Commander.js option parsing
3. Add service layer logic in `src/services/` if needed
4. Register command in `src/index.ts`
5. Add unit tests for service logic
6. Add integration test for full command execution
7. Update [README.md](./README.md) with command usage

### Modifying publish workflow

The `publish` command supports two modes: from running service or from archive.

**When changing publish logic**:
1. Update `commands/publish.ts` command handler
2. Update `metadata-fetcher.ts` if changing how metadata is downloaded
3. Update `archive-builder.ts` if changing ZIP structure
4. Add tests for new scenarios
5. Test against real Repository service

**Runtime metadata (image digest, tag, repository)**:
- These are optional publish parameters
- Repository enriches design-time metadata → runtime metadata
- Don't duplicate Repository's transformation logic in CLI

### Modifying pull workflow

The `pull` command downloads archives from Repository.

**When changing pull logic**:
1. Update `commands/pull.ts` command handler
2. Update `repository-client.ts` if changing HTTP interaction
3. Add tests for new scenarios
4. Verify downloaded archives match published format

### Error handling

Follow consistent error patterns:
- Network errors: "Repository unreachable at {url}"
- Validation errors: "Metadata validation failed: {detail}"
- Not found errors: "Service {name} version {version} not found"

Exit codes:
- `0`: Success
- `1`: General error
- `2`: Validation error
- `3`: Network error

## Testing Strategy

### Unit Tests
- Test service layer logic (archive creation, metadata fetching, validation)
- Mock HTTP calls to Repository
- Test error handling and edge cases

### Integration Tests
- Test full command execution (publish, pull)
- Use fixtures for predictable test data
- Test against mock Repository server

### Manual Testing
- Test against real Repository service
- Verify published archives can be pulled
- Test with real SDK-generated metadata

## Pull Request Checklist

Before submitting a PR:

- [ ] All tests pass (`npm test`)
- [ ] No linter errors (`npm run lint`)
- [ ] New commands documented in [README.md](./README.md)
- [ ] Breaking changes documented in PR description
- [ ] Integration test added for new commands
- [ ] Spec updated if adding user-facing features

## Development Workflow

### Testing locally with Repository

```bash
# Terminal 1: Start Repository
cd components/repository
docker compose up

# Terminal 2: Build and link CLI
cd components/cli/spas-service
npm run build
npm link

# Terminal 3: Start a test service (e.g., .NET sample)
cd components/sdk/dotnet/examples/SampleService
export ASPNETCORE_ENVIRONMENT=Development
dotnet run

# Terminal 4: Test publish workflow
spas-service publish http://localhost:5000 --repo http://localhost:3000

# Verify in Repository
curl http://localhost:3000/services/sample-service/versions/1.0.0

# Test pull workflow
spas-service pull sample-service 1.0.0 --output ./downloads
unzip -l downloads/sample-service-1.0.0.zip
```

### Debugging

```bash
# Add breakpoints in VS Code
# Run with debugger attached, or:
node --inspect-brk dist/index.js publish http://localhost:5000
```

### Common issues

**`npm link` not working**:
- Run `npm unlink -g @spas/cli` first
- Rebuild: `npm run build`
- Link again: `npm link`

**Archive upload fails**:
- Check ZIP structure (must contain `spas.json` at root)
- Verify metadata validates against design-time-metadata-v1 schema
- Check Repository logs for validation errors

**Service metadata endpoint returns 404**:
- Ensure service is running in Development mode
- Verify service exposes `/_spas/metadata` endpoint
- Check service SDK implementation

## Backwards Compatibility

Follow [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md).

**Non-breaking changes** (safe):
- Add new optional command flags
- Improve error messages
- Add progress indicators

**Breaking changes** (requires major version bump):
- Remove commands or flags
- Change required parameter format
- Change ZIP archive structure
- Change metadata validation rules

## When to Update Specs

Update [specs/004-spas-service-cli](../../../specs/004-spas-service-cli/) when:
- Adding new commands (new User Story in spec.md + tasks in tasks.md)
- Changing CLI design patterns (update plan.md)
- Resolving design decisions (document in appendix)

Don't update specs for:
- Bug fixes
- Minor UI/output improvements
- Test additions

## References

- **User documentation**: [README.md](./README.md)
- **Feature spec**: [specs/004-spas-service-cli](../../../specs/004-spas-service-cli/)
- **CLI principles**: [principles/component/13-cli.md](../../../principles/component/13-cli.md)
- **Repository integration**: [principles/component/11-repository.md](../../../principles/component/11-repository.md)
- **Metadata schema**: [components/sdk/schemas/design-time-metadata-v1.schema.json](../../sdk/schemas/design-time-metadata-v1.schema.json)
- **Versioning strategy**: [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md)
