# Java SPAS SDK - Public API Contracts

**Feature**: 016-java-spas-sdk  
**Date**: 2025-12-19  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the public API surface for the Java SPAS SDK. All classes and interfaces documented here are part of the stable API contract.

## Package Structure

```
io.spas.sdk.core           # Core context and utilities
io.spas.sdk.metadata       # Annotations and builders
io.spas.sdk.events         # Event publishing
io.spas.sdk.spring         # Spring Boot integration
```

---

## io.spas.sdk.core

### SpasContext

Thread-safe context for correlation and identity.

```java
package io.spas.sdk.core.context;

public final class SpasContext {
    // Static accessors
    public static SpasContext current();
    public static void setCurrent(SpasContext context);
    public static void clear();
    
    // Context propagation wrappers
    public static Runnable wrap(Runnable runnable);
    public static <T> Callable<T> wrap(Callable<T> callable);
    public static <T> Supplier<T> wrap(Supplier<T> supplier);
    
    // Builder
    public static Builder builder();
    
    // Getters
    public String getCorrelationId();
    public Optional<String> getUserId();
    public Optional<String> getTenantId();
    
    public static final class Builder {
        public Builder correlationId(String correlationId);
        public Builder userId(String userId);
        public Builder tenantId(String tenantId);
        public SpasContext build();
    }
}
```

### SpasTrace

W3C Trace Context storage.

```java
package io.spas.sdk.core.context;

public final class SpasTrace {
    // Static accessors
    public static SpasTrace current();
    public static void setCurrent(SpasTrace trace);
    public static void clear();
    
    // Parsing
    public static SpasTrace parseTraceparent(String traceparent);
    public static SpasTrace generate();  // New trace
    
    // Serialization
    public String toTraceparent();
    
    // Getters
    public String getTraceId();
    public String getSpanId();
    public String getTraceFlags();
    public Optional<String> getTraceState();
    
    // Builder
    public static Builder builder();
    
    public static final class Builder {
        public Builder traceId(String traceId);
        public Builder spanId(String spanId);
        public Builder traceFlags(String traceFlags);
        public Builder traceState(String traceState);
        public SpasTrace build();
    }
}
```

### SpasConfiguration

Configuration loading from environment.

```java
package io.spas.sdk.core.config;

public final class SpasConfiguration {
    // Factory
    public static SpasConfiguration fromEnvironment();
    public static SpasConfiguration fromProperties(Properties properties);
    
    // Getters
    public String getServiceName();
    public String getSidecarUrl();
    public Optional<String> getSidecarHost();
    public Optional<Integer> getSidecarPort();
    
    // Validation
    public void validate() throws SpasConfigurationException;
}
```

### KebabCaseConverter

Utility for name normalization.

```java
package io.spas.sdk.core.util;

public final class KebabCaseConverter {
    public static String convert(String input);
    // "CreateOrder" → "create-order"
    // "OrderCreatedEvent" → "order-created-event"
    // "already-kebab" → "already-kebab"
}
```

---

## io.spas.sdk.metadata

### Annotations

```java
package io.spas.sdk.metadata.annotations;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface SpasCommand {
    String value();                    // Command name
    String version() default "1.0";
    String schemaRef() default "";
}

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface SpasQuery {
    String value();                    // Query name
    String version() default "1.0";
    String schemaRef() default "";
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)   // Runtime for EventPublisher lookup
public @interface SpasEvent {
    String value();                    // Event type
    String version() default "1.0";
    String schemaRef() default "";
}
```

### Model Classes

```java
package io.spas.sdk.metadata.model;

public record ServiceMetadata(
    String schemaVersion,
    String id,
    String name,
    String description,
    String version,
    String boundedContext,
    List<String> capabilities,
    List<EndpointContract> endpoints,
    List<EventContract> events,
    Consistency consistency,
    Security security,
    Network network,
    String license
) {}

public record EndpointContract(
    String name,
    EndpointType type,
    Protocol protocol,
    String methodPath,
    String version,
    String schemaRef
) {}

public record EventContract(
    String type,
    String version,
    String schemaRef
) {}

public record Consistency(
    ConsistencyLevel commands,
    QueryConsistencyLevel queries
) {}

public record Security(
    Authentication authentication,
    List<DataClassification> dataClassification
) {}

public record Authentication(
    AuthType type,
    List<String> requiredScopes
) {}

public record Network(
    List<String> requiredEgress
) {}

public enum EndpointType { COMMAND, QUERY }
public enum Protocol { HTTP, GRPC }
public enum ConsistencyLevel { ACID, EVENTUAL }
public enum QueryConsistencyLevel { STRONG, EVENTUAL }
public enum AuthType { OAUTH2, JWT, API_KEY, MTLS, NONE }
public enum DataClassification { PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED }
```

### Builders

```java
package io.spas.sdk.metadata.builders;

public final class ServiceIdentityBuilder {
    public static ServiceIdentityBuilder create();
    
    public ServiceIdentityBuilder withId(String id);
    public ServiceIdentityBuilder withName(String name);
    public ServiceIdentityBuilder withVersion(String version);
    public ServiceIdentityBuilder withBoundedContext(String context);
    public ServiceIdentityBuilder withDescription(String description);
    public ServiceIdentityBuilder addCapability(String capability);
    public ServiceIdentityBuilder withLicense(String license);
    
    public ServiceIdentity build();
}

public final class SecurityBuilder {
    public static SecurityBuilder create();
    
    public SecurityBuilder withAuthenticationType(AuthType type);
    public SecurityBuilder addRequiredScope(String scope);
    public SecurityBuilder addDataClassification(DataClassification classification);
    
    public Security build();
}

public final class ConsistencyBuilder {
    public static ConsistencyBuilder create();
    
    public ConsistencyBuilder withCommands(ConsistencyLevel level);
    public ConsistencyBuilder withQueries(QueryConsistencyLevel level);
    
    public Consistency build();
}

public final class NetworkBuilder {
    public static NetworkBuilder create();
    
    public NetworkBuilder addRequiredEgress(String dependency);
    
    public Network build();
}

public final class MetadataComposer {
    public static MetadataComposer create();
    
    public MetadataComposer withIdentity(ServiceIdentity identity);
    public MetadataComposer withEndpoints(List<EndpointContract> endpoints);
    public MetadataComposer withEvents(List<EventContract> events);
    public MetadataComposer withSecurity(Security security);
    public MetadataComposer withConsistency(Consistency consistency);
    public MetadataComposer withNetwork(Network network);
    
    public ServiceMetadata compose();
    public String composeJson();  // Convenience method
}
```

---

## io.spas.sdk.events

### EventPublisher

```java
package io.spas.sdk.events;

public final class EventPublisher {
    // Factory
    public static EventPublisher create(SpasConfiguration config);
    public static EventPublisher create(EventPublisherConfig config);
    
    // Publishing
    public <T> CompletableFuture<Void> publishAsync(T event);
    public <T> void publish(T event) throws SpasPublishException;
    
    // Event must be annotated with @SpasEvent
    // SDK derives event name from annotation, converts to kebab-case
}

public final class EventPublisherConfig {
    public static Builder builder();
    
    public String getServiceName();
    public String getSidecarUrl();
    public Duration getConnectTimeout();
    public Duration getRequestTimeout();
    
    public static final class Builder {
        public Builder serviceName(String name);
        public Builder sidecarUrl(String url);
        public Builder connectTimeout(Duration timeout);
        public Builder requestTimeout(Duration timeout);
        public EventPublisherConfig build();
    }
}
```

### Exceptions

```java
package io.spas.sdk.events;

public class SpasPublishException extends RuntimeException {
    public SpasPublishException(String message);
    public SpasPublishException(String message, Throwable cause);
}

public class SidecarUnavailableException extends SpasPublishException {
    public SidecarUnavailableException(String sidecarUrl, Throwable cause);
}

public class EventAnnotationMissingException extends SpasPublishException {
    public EventAnnotationMissingException(Class<?> eventClass);
}
```

---

## io.spas.sdk.spring

### Auto-Configuration

```java
package io.spas.sdk.spring;

@AutoConfiguration
@ConditionalOnClass(SpasContext.class)
@EnableConfigurationProperties(SpasProperties.class)
public class SpasAutoConfiguration {
    // Registers:
    // - SpasContextFilter
    // - EventPublisher (if spas.sidecar.url configured)
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SpasAutoConfiguration.class)
public @interface EnableSpas {
}
```

### Configuration Properties

```java
package io.spas.sdk.spring;

@ConfigurationProperties(prefix = "spas")
public class SpasProperties {
    private String serviceName;
    private boolean enabled = true;
    private Sidecar sidecar = new Sidecar();
    
    // Getters/setters
    
    public static class Sidecar {
        private String url;
        private String host;
        private Integer port = 8080;
        private Duration connectTimeout = Duration.ofSeconds(5);
        private Duration requestTimeout = Duration.ofSeconds(30);
        
        // Getters/setters
    }
}
```

### Filter

```java
package io.spas.sdk.spring;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class SpasContextFilter extends OncePerRequestFilter {
    // Extracts from headers:
    // - traceparent → SpasTrace
    // - x-correlation-id → SpasContext.correlationId
    // - x-user-id → SpasContext.userId
    // - x-tenant-id → SpasContext.tenantId
    
    // Sets ThreadLocal, clears on request completion
}
```

---

## HTTP Headers Contract

### Inbound (extracted by filter)

| Header | Required | Description |
|--------|----------|-------------|
| traceparent | No | W3C Trace Context |
| tracestate | No | W3C Trace State (pass-through) |
| x-correlation-id | No | Request correlation ID |
| x-user-id | No | User identity |
| x-tenant-id | No | Tenant identity |

### Outbound (added by EventPublisher)

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | application/json |
| traceparent | Yes | W3C Trace Context |
| x-service-name | Yes | Service name (from config) |
| x-event-name | Yes | Event type (kebab-case) |
| x-correlation-id | Yes | From SpasContext |
| x-user-id | If present | From SpasContext |
| x-tenant-id | If present | From SpasContext |
