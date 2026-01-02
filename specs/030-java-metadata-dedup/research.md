# Research: Java SDK Metadata Deduplication

**Feature**: Remove Redundant Java SDK Metadata
**Date**: 2026-01-02

## 1. Configuration Binding Approach

### Decision
Extend the existing `SpasProperties` class (annotated with `@ConfigurationProperties(prefix = "spas")`) to include service identity fields, and populate them from the `@SpasService` annotation during application startup.

### Rationale
Spring Boot's `@ConfigurationProperties` mechanism automatically handles property precedence (environment variables > application.yml > defaults). By adding the annotation processor to populate these properties when they're not explicitly set, we leverage Spring's existing infrastructure without introducing custom `PropertySource` implementations.

### Alternatives Considered
- **`EnvironmentPostProcessor` with custom `PropertySource`**: More complex, requires understanding of Spring's property resolution order, and adds a new infrastructure component. Rejected in favor of simpler bean-based approach.
- **`ApplicationContextInitializer`**: Similar capability to `EnvironmentPostProcessor` but runs slightly later. Not needed since we can use a simple bean processor.

## 2. Annotation Processing Mechanism

### Decision
Implement a `BeanFactoryPostProcessor` that scans for the main application class (annotated with `@SpringBootApplication`), extracts the `@SpasService` annotation values, and populates the `SpasProperties` bean if the fields are null.

### Rationale
`BeanFactoryPostProcessor` runs after bean definitions are loaded but before beans are instantiated. This timing allows us to modify the `SpasProperties` bean definition to include annotation-derived values as defaults. The processor can reliably find the main class by scanning for `@SpringBootApplication`.

### Alternatives Considered
- **`@PostConstruct` on `SpasProperties`**: Too late in the lifecycle; properties are already bound by the time `@PostConstruct` runs.
- **Custom `PropertySourcesPlaceholderConfigurer`**: Overly complex for this use case.

## 3. Property Precedence

### Decision
Rely on Spring Boot's standard configuration property binding order. The annotation values will only be used if the corresponding properties are not set in `application.yml`, environment variables, or command-line arguments.

### Rationale
Spring Boot resolves properties in a well-defined order (command line > environment > config files > defaults). By setting annotation values as bean defaults during `BeanFactoryPostProcessor`, they naturally have the lowest priority. No custom precedence logic is needed.

### Alternatives Considered
- **Manual precedence checks**: Checking each property source manually would duplicate Spring Boot's built-in logic and be error-prone.
- **Custom `PropertySource` ordering**: Unnecessary complexity when standard property binding already provides the desired behavior.
