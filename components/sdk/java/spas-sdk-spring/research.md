# Research: SpasService Metadata Extraction and Injection

## 1. Reliable Main Class Detection

**Decision:** Use `SpringApplication.getMainApplicationClass()` with a fallback to scanning `SpringApplication.getAllSources()`.

**Rationale:**
*   `SpringApplication.getMainApplicationClass()` is the standard, most efficient way to retrieve the main class deduced or explicitly set by Spring Boot.
*   In some testing scenarios or complex setups, the main class might not be deduced correctly. `SpringApplication.getAllSources()` returns the sources passed to the application (usually including the main configuration class).
*   We will inspect the found class for the `@SpasService` annotation.

**Implementation Details:**
```java
Class<?> mainClass = application.getMainApplicationClass();
if (mainClass == null || !mainClass.isAnnotationPresent(SpasService.class)) {
    for (Object source : application.getAllSources()) {
        if (source instanceof Class<?> clazz && clazz.isAnnotationPresent(SpasService.class)) {
            mainClass = clazz;
            break;
        }
    }
}
```

## 2. PropertySource Injection

**Decision:** Use an `EnvironmentPostProcessor` to inject a `MapPropertySource`.

**Rationale:**
*   `EnvironmentPostProcessor` is the standard Spring Boot extension point for customizing the `Environment` before the application context is refreshed.
*   It provides access to both the `ConfigurableEnvironment` and the `SpringApplication` instance (needed for main class detection).

## 3. Precedence (Lower than application.yml)

**Decision:** Implement `Ordered` with `Ordered.LOWEST_PRECEDENCE` and use `propertySources.addLast()`.

**Rationale:**
*   Spring `PropertySources` are resolved in order (first match wins).
*   `application.yml` and `application.properties` are loaded by `ConfigDataEnvironmentPostProcessor`, which runs with order `Ordered.HIGHEST_PRECEDENCE + 10`.
*   By setting our processor to `Ordered.LOWEST_PRECEDENCE`, we ensure it runs *after* `ConfigDataEnvironmentPostProcessor`.
*   At this point, `application.yml` properties are already in the environment.
*   Calling `environment.getPropertySources().addLast(new MapPropertySource("spas-annotation-defaults", ...))` places our source at the end of the list, giving it the lowest priority. This effectively makes them "defaults" that can be overridden by `application.yml`, environment variables, or system properties.

## Alternatives Considered

### `SpringApplication.setDefaultProperties()`
*   **Pros:** explicitly designed for defaults.
*   **Cons:** `setDefaultProperties` is typically called before the environment is prepared. Calling it inside an `EnvironmentPostProcessor` might be too late for the initial environment preparation phases or require modifying the `defaultProperties` source in place. `addLast` is a more robust and explicit way to append low-priority sources during post-processing.

### `ApplicationContextInitializer`
*   **Pros:** Can also modify environment.
*   **Cons:** Runs later than `EnvironmentPostProcessor`. While valid, `EnvironmentPostProcessor` is semantically more appropriate for environment manipulation and ensures properties are available as early as possible (e.g., for other initializers).

### Scanning the Classpath
*   **Pros:** Finds the class even if not passed to `SpringApplication`.
*   **Cons:** Extremely slow and brittle. Relying on `SpringApplication` context is much more efficient and aligns with how the application is actually starting.
