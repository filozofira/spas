# Contributing to SPAS SDK for .NET

Guide for developers working on the .NET SDK itself (not for service developers using the SDK—see [README.md](./README.md) for that).

## Prerequisites

- .NET 10 SDK
- Visual Studio 2022 or VS Code with C# extension
- Git

## Getting Started

```bash
cd components/sdk/dotnet
dotnet restore
dotnet build
```

## Project Structure

The SDK is organized into focused packages:

| Package | Purpose |
|---------|---------|
| `Spas.Sdk.Core` | Context (SpasContext, ISpasClock), identity middleware, trace utilities |
| `Spas.Sdk.Metadata` | Metadata builders, composition, schema validation, auto-discovery |
| `Spas.Sdk.Events` | Event publishing to sidecar (EventPublisher, EventBuilder) |
| `Spas.Sdk.Observability` | Tracelog middleware, OpenTelemetry integration, Zipkin export |
| `Spas.Sdk.DevEndpoint` | Development metadata endpoint (ZIP archive generation) |
| `Spas.Sdk.Inbound` | **DEFERRED** - See [module notes](#module-notes) |

**Examples**:
- [examples/SampleService](./examples/SampleService/) - Runnable reference implementation

## Building and Testing

### Build all packages

```bash
dotnet build
```

### Run all tests

```bash
dotnet test
```

### Run tests for a specific package

```bash
dotnet test src/Spas.Sdk.Metadata.Tests
```

### Watch mode (re-run tests on file changes)

```bash
dotnet watch test --project src/Spas.Sdk.Metadata.Tests
```

## Making Changes Safely

### Schema Alignment

The SDK produces `spas.json` that must validate against [design-time-metadata-v1.schema.json](../schemas/design-time-metadata-v1.schema.json).

**Before adding new metadata fields**:
1. Check if field exists in schema
2. If new field needed, update schema first (coordinate with Repository team)
3. Add builder method or attribute property
4. Update `SpasComposer` to include field
5. Add schema validation test

**Naming conventions**: See [../CONVENTIONS.md](../CONVENTIONS.md) for cross-SDK rules (kebab-case events, schemaRef format, etc.).

### Backwards Compatibility

Follow [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md).

**Non-breaking changes** (safe):
- Add new optional metadata fields
- Add new middleware or extension methods
- Add new builder methods with defaults

**Breaking changes** (requires major version bump):
- Remove public APIs
- Change method signatures
- Change default behavior
- Require new mandatory fields in metadata

### When to Update Specs

Update [specs/001-dotnet-spas-sdk](../../../specs/001-dotnet-spas-sdk/) when:
- Adding new user-facing features (new User Story in spec.md + tasks in tasks.md)
- Changing architecture (update plan.md)
- Resolving design decisions (document in appendix or decision log)

Don't update specs for:
- Bug fixes
- Internal refactoring
- Test additions

## Module Notes

### Spas.Sdk.Inbound (DEFERRED)

See [src/Spas.Sdk.Inbound/README.md](./src/Spas.Sdk.Inbound/README.md) for rationale and future implementation path.

**Summary**: Handler base classes deferred; services use native ASP.NET Core minimal APIs instead.

## Pull Request Checklist

Before submitting a PR:

- [ ] All tests pass (`dotnet test`)
- [ ] No compiler warnings in Release configuration
- [ ] New features have corresponding unit tests
- [ ] Breaking changes documented in PR description
- [ ] Spec updated if adding user-facing features
- [ ] [CONVENTIONS.md](../CONVENTIONS.md) followed for cross-SDK consistency

## Development Workflow

### Adding a new metadata field

1. Update schema: [../schemas/design-time-metadata-v1.schema.json](../schemas/design-time-metadata-v1.schema.json)
2. Add property to relevant model class (e.g., `ServiceMetadata`, `ContractDefinition`)
3. Add builder method (e.g., `SecurityBuilder.WithDataClassification(...)`)
4. Update `SpasComposer.Compose()` to serialize field
5. Add test in `SpasComposerTests` verifying field appears in output
6. Add schema validation test in `MetadataValidationTests`

### Adding a new attribute

1. Create attribute class in `Spas.Sdk.Metadata/Attributes/` (inherit from `Attribute`)
2. Update `MetadataDiscoveryService` to scan for new attribute
3. Add builder integration in `MetadataDiscoveryService.DiscoverContracts()`
4. Add test in `MetadataDiscoveryTests`
5. Add usage example in SampleService

### Adding a new middleware

1. Create middleware class in appropriate package (e.g., `Spas.Sdk.Observability`)
2. Add extension method for `IApplicationBuilder` or `WebApplication`
3. Add configuration options class if needed
4. Add unit tests for middleware logic
5. Add integration test in SampleService
6. Document in [README.md](./README.md) if user-facing

## Testing Strategy

### Unit Tests
- Test builders produce correct metadata structure
- Test validation catches schema violations
- Test middleware extracts context correctly
- Mock external dependencies (sidecar, Zipkin)

### Integration Tests
- Run SampleService and verify `/_spas/metadata` output
- Validate generated `spas.json` against schema
- Test event publishing sends correct headers

### What NOT to test
- Don't test .NET framework behavior (e.g., `ILogger` works)
- Don't test sidecar or repository (those have their own tests)
- Don't test schema validation library (Ajv) internals

## References

- **User documentation**: [README.md](./README.md)
- **Shared conventions**: [../CONVENTIONS.md](../CONVENTIONS.md)
- **Feature spec**: [specs/001-dotnet-spas-sdk](../../../specs/001-dotnet-spas-sdk/)
- **SDK principles**: [principles/component/12-sdk.md](../../../principles/component/12-sdk.md)
- **Versioning strategy**: [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md)
