# Contributing to spas-compose CLI

Guide for developers working on the `spas-compose` CLI tool (not for domain architects using the tool—see [README.md](./README.md) for that).

## Prerequisites

- Node.js 20+
- npm
- Git

## Getting Started

```bash
cd components/cli/spas-compose
npm install
npm run build
npm link  # Makes spas-compose available globally for testing
```

## Project Structure

```
src/
├── index.ts                   # CLI entry point (Commander.js setup)
├── types.ts                   # TypeScript interfaces
├── commands/
│   ├── init.ts                # init command
│   ├── services-pull.ts       # services pull command
│   └── choreography-build.ts  # choreography build command
├── services/
│   ├── repository-client.ts   # SPAS Repository HTTP client
│   ├── workspace-service.ts   # Workspace operations
│   ├── pull-service.ts        # Service metadata download
│   ├── choreography-loader.ts # YAML parsing and validation
│   ├── jsonata-validator.ts   # JSONata syntax validation
│   └── docker-generator.ts    # Docker Compose generation
└── utils/
    ├── config.ts              # Configuration resolution
    ├── output.ts              # Terminal output formatting
    └── templates.ts           # File templates

test/
├── unit/                      # Unit tests for services/utils
├── integration/               # End-to-end command tests
└── fixtures/                  # Test data
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

### Lint and format

```bash
npm run lint
npm run format
```

## Making Changes Safely

### Adding a new command

1. Create command file in `src/commands/` (e.g., `choreography-validate.ts`)
2. Implement command logic with Commander.js option parsing
3. Add service layer logic in `src/services/` if needed
4. Register command in `src/index.ts`
5. Add unit tests for service logic
6. Add integration test for full command execution
7. Update [README.md](./README.md) with command usage

### Modifying choreography schema

The tool validates `choreography.yaml` against schemas in the workspace.

**Before changing validation rules**:
1. Update schema definition (reference principles/specs)
2. Update `choreography-loader.ts` validation logic
3. Add tests for new validation cases
4. Update agent prompt template if AI-assisted composition is affected

### Modifying Docker Compose generation

The `docker-generator.ts` service produces `docker-compose.yaml` + sidecar configs.

**When changing generator**:
1. Update generator logic
2. Add/update test fixtures in `test/fixtures/`
3. Verify generated output against Docker Compose schema
4. Test with real `docker compose up` in examples/domains/

### Agent prompt changes

The `init` command generates `.github/agents/spas.compose.agent.md`.

**When updating agent prompt**:
1. Modify template in `src/utils/templates.ts`
2. Keep under 25KB for fast loading
3. Maintain domain-relative path pattern (`${domainRoot}/{DOMAIN}/`)
4. Update examples and troubleshooting sections
5. Test with actual AI agent interactions

## Testing Strategy

### Unit Tests
- Test service layer logic (YAML parsing, JSONata validation, Docker generation)
- Mock HTTP calls to Repository
- Test error handling and edge cases

### Integration Tests
- Test full command execution (init, pull, build)
- Use fixtures for predictable test data
- Verify file system operations (workspace creation, file generation)

### Manual Testing
- Test against real Repository service
- Verify generated Docker Compose with `docker compose config`
- Test AI agent prompt with `/spas.compose` command

## Pull Request Checklist

Before submitting a PR:

- [ ] All tests pass (`npm test`)
- [ ] No linter errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] New commands documented in [README.md](./README.md)
- [ ] Breaking changes documented in PR description
- [ ] Integration test added for new commands
- [ ] Spec updated if adding user-facing features

## Development Workflow

### Testing locally with services

```bash
# Terminal 1: Start Repository
cd components/repository
docker compose up

# Terminal 2: Build and link CLI
cd components/cli/spas-compose
npm run build
npm link

# Terminal 3: Test workflow
cd examples/domains
spas-compose init test-domain
cd test-domain
spas-compose services pull order-service 1.0.0
spas-compose choreography build --docker --dry-run
```

### Debugging

```bash
# Add breakpoints in VS Code
# Run with debugger attached, or:
node --inspect-brk dist/index.js init test-domain
```

### Common issues

**`npm link` not working**:
- Run `npm unlink -g @spas/compose` first
- Rebuild: `npm run build`
- Link again: `npm link`

**TypeScript errors after dependency updates**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` fresh

**Test failures after schema changes**:
- Regenerate fixtures: update `test/fixtures/` with new schema format
- Update validation tests to match new rules

## Backwards Compatibility

Follow [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md).

**Non-breaking changes** (safe):
- Add new optional command flags
- Add new commands
- Improve error messages
- Add optional fields to generated files

**Breaking changes** (requires major version bump):
- Remove commands or flags
- Change command output format
- Change generated file structure
- Require new mandatory fields in choreography.yaml

## When to Update Specs

Update [specs/005-spas-compose-cli](../../../specs/005-spas-compose-cli/) when:
- Adding new commands (new User Story in spec.md + tasks in tasks.md)
- Changing CLI design patterns (update plan.md)
- Resolving design decisions (document in appendix)

Don't update specs for:
- Bug fixes
- Minor UI/output improvements
- Test additions

## References

- **User documentation**: [README.md](./README.md)
- **Feature spec**: [specs/005-spas-compose-cli](../../../specs/005-spas-compose-cli/)
- **CLI principles**: [principles/component/13-cli.md](../../../principles/component/13-cli.md)
- **Domain choreography**: [principles/component/14-domain-choreography.md](../../../principles/component/14-domain-choreography.md)
- **Versioning strategy**: [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md)
