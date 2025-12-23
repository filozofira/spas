# Contributing to SPAS SDK for Java

Guide for developers working on the Java SDK itself (not for service developers using the SDK—see [README.md](./README.md) for that).

## Prerequisites

- Java 17+ (JDK)
- Maven 3.8+
- Git
- IDE with Java support (IntelliJ IDEA, Eclipse, VS Code with Java extensions)

## Getting Started

```bash
cd components/sdk/java
mvn clean install
```

## Project Structure

See [README.md](./README.md#modules) for module overview. The [examples/sample-service](./examples/sample-service/) provides a runnable reference implementation.

## Building and Testing

### Build all modules

```bash
mvn clean install
```

### Build without tests (faster iteration)

```bash
mvn clean install -DskipTests
```

### Run all tests

```bash
mvn test
```

### Run tests for a specific module

```bash
mvn test -pl spas-sdk-metadata
```

### Run tests in watch mode

```bash
# In module directory
mvn test-compile -Dmaven.test.skip=true
mvn surefire:test -Dsurefire.rerunFailingTestsCount=1
```

## Making Changes Safely

### Schema Alignment

The SDK produces `spas.json` that must validate against [design-time-metadata-v1.schema.json](../schemas/design-time-metadata-v1.schema.json).

**Before adding new metadata fields**:
1. Check if field exists in schema
2. If new field needed, update schema first (coordinate with Repository team)
3. Add property to relevant model class (e.g., `ServiceMetadata`, `ContractDefinition`)
4. Update annotation processor to emit field
5. Add schema validation test

**Naming conventions**: See [../CONVENTIONS.md](../CONVENTIONS.md) for cross-SDK rules (kebab-case events, schemaRef format, etc.).

### Backwards Compatibility

Follow [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md).

**Non-breaking changes** (safe):
- Add new optional metadata fields
- Add new annotations or attributes
- Add new builder methods with defaults

**Breaking changes** (requires major version bump):
- Remove public APIs
- Change method signatures
- Change annotation processing behavior
- Require new mandatory fields in metadata

### When to Update Specs

Update [specs/016-java-spas-sdk](../../../specs/016-java-spas-sdk/) when:
- Adding new user-facing features (new User Story in spec.md + tasks in tasks.md)
- Changing architecture (update plan.md)
- Resolving design decisions (document in appendix or decision log)

Don't update specs for:
- Bug fixes
- Internal refactoring
- Test additions

## Framework-Agnostic Design

The core modules (`spas-sdk-core`, `spas-sdk-metadata`, `spas-sdk-events`) must remain **framework-agnostic**.

**Allowed dependencies**:
- Jackson (JSON serialization)
- SLF4J (logging facade)
- Standard Java libraries

**NOT allowed in core modules**:
- Spring Framework classes
- Jakarta EE annotations (except standard ones like `@PostConstruct`)
- JAX-RS implementations
- Servlet API (use abstractions instead)

**Spring-specific code** goes in `spas-sdk-spring` module only.

## Annotation Processor Development

The metadata processor runs during Maven compilation and generates `target/classes/spas.json`.

**Testing annotation processors**:
1. Use Google Compile Testing library ([compile-testing](https://github.com/google/compile-testing))
2. Create test source files with annotations in `src/test/resources/test-sources/`
3. Run processor and verify generated `spas.json` content
4. Test error cases (missing required fields, invalid syntax)

**Processor workflow**:
1. Scan for `@SpasCommand`, `@SpasQuery`, `@SpasEvent` annotations
2. Normalize names (PascalCase → kebab-case)
3. Build metadata model
4. Serialize to JSON
5. Validate against schema (optional, can be done in CI)

## Pull Request Checklist

Before submitting a PR:

- [ ] All tests pass (`mvn test`)
- [ ] No compiler warnings
- [ ] Code follows Google Java Style Guide
- [ ] New features have corresponding unit tests
- [ ] Breaking changes documented in PR description
- [ ] Spec updated if adding user-facing features
- [ ] [CONVENTIONS.md](../CONVENTIONS.md) followed for cross-SDK consistency

## Development Workflow

### Adding a new metadata field

1. Update schema: [../schemas/design-time-metadata-v1.schema.json](../schemas/design-time-metadata-v1.schema.json)
2. Add property to relevant model class (e.g., `ServiceMetadata`, `ContractDefinition`)
3. Add annotation attribute if user-facing (e.g., `@SpasEvent(description = "...")`)
4. Update annotation processor to read and emit field
5. Add test in `MetadataProcessorTest` verifying field appears in output
6. Add schema validation test

### Adding a new annotation

1. Create annotation class in `spas-sdk-metadata/src/.../annotations/` 
2. Add `@Retention(RetentionPolicy.RUNTIME)` and `@Target(...)` appropriately
3. Update annotation processor to scan for new annotation
4. Add processing logic in `MetadataProcessor`
5. Add test in `MetadataProcessorTest`
6. Add usage example in sample-service

### Adding a new builder

1. Create builder class in `spas-sdk-metadata/src/.../builders/`
2. Follow immutable builder pattern (return new instance on each method call)
3. Add validation in `build()` method
4. Add unit tests for builder logic
5. Document builder methods with Javadoc

## Testing Strategy

### Unit Tests
- Test annotation processor generates correct metadata
- Test builders produce correct structure
- Test event publisher sends correct headers
- Mock external dependencies (sidecar HTTP calls)

### Integration Tests
- Run sample-service and verify generated `spas.json`
- Validate generated metadata against schema
- Test Spring Boot auto-configuration (if using `spas-sdk-spring`)

### What NOT to test
- Don't test Jackson serialization library internals
- Don't test Maven compilation process
- Don't test sidecar or repository (those have their own tests)

## Code Style

Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html).

**Key points**:
- 2 spaces for indentation (not tabs)
- 100 character line limit
- Use `Optional<T>` for nullable return values
- Prefer immutability (final fields, unmodifiable collections)
- Use records for data transfer objects (Java 17+)

## References

- **User documentation**: [README.md](./README.md)
- **Shared conventions**: [../CONVENTIONS.md](../CONVENTIONS.md)
- **Feature spec**: [specs/016-java-spas-sdk](../../../specs/016-java-spas-sdk/)
- **SDK principles**: [principles/component/12-sdk.md](../../../principles/component/12-sdk.md)
- **Versioning strategy**: [principles/governance/23-versioning-strategy.md](../../../principles/governance/23-versioning-strategy.md)
