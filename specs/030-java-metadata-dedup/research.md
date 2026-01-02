# Research: Java SDK Metadata Deduplication

**Feature**: Remove Redundant Java SDK Metadata
**Date**: 2026-01-02

## 1. Main Class Detection

### Decision
Use `SpringApplication.getMainApplicationClass()` within an `EnvironmentPostProcessor`.

### Rationale
The `EnvironmentPostProcessor` interface receives the `SpringApplication` instance as an argument. `SpringApplication` has logic to deduce the main application class. This is the most reliable and framework-supported method to identify the entry point of the application where `@SpringBootApplication` is typically placed.

### Alternatives Considered
- **Classpath Scanning**: Scanning the entire classpath for a class with `@SpringBootApplication` is prohibitively expensive and slow at startup.
- **Stack Trace Inspection**: Inspecting the stack trace to find the `main` method is a common fallback but is brittle and less "clean" than using the framework's own deduction.
- **Bean Scanning**: Waiting for the `ApplicationContext` to be fully refreshed to find the bean annotated with `@SpringBootApplication` is too late, as we need these properties available during the environment preparation phase.

## 2. Property Injection Mechanism

### Decision
Implement `EnvironmentPostProcessor` registered via `META-INF/spring.factories` (or `META-INF/spring/org.springframework.boot.env.EnvironmentPostProcessor.imports` for Spring Boot 3).

### Rationale
`EnvironmentPostProcessor` allows us to customize the `Environment` *before* the application context is refreshed. This ensures that the `spas.service.*` properties are available for `@ConditionalOnProperty` checks and other configuration logic that runs early in the lifecycle.

### Alternatives Considered
- **`ApplicationContextInitializer`**: Similar capability, but `EnvironmentPostProcessor` is specifically designed for environment manipulation and is the standard pattern for this type of infrastructure setup.
- **`@PropertySource` annotation**: Cannot be dynamically generated based on another annotation's values easily without hardcoding a file path.

## 3. Property Precedence

### Decision
Add the custom `PropertySource` to the **end** of the `MutablePropertySources` list using `environment.getPropertySources().addLast()`.

### Rationale
Spring `PropertyResolver` iterates through property sources in order and returns the first value found. By adding our source to the *end* of the list (`addLast`), we ensure it has the lowest priority. This means any values defined in `application.yml`, environment variables, or command-line arguments (which are added earlier in the list) will naturally override our annotation-derived values.

### Alternatives Considered
- **`addFirst()`**: This would make the annotation values override `application.yml`, which violates the requirement for standard configuration precedence.
- **Explicit Priority Ordering**: Trying to insert "after" a specific named source (like `configurationProperties`) is brittle because source names can vary. `addLast` is the safest way to implement "defaults".
