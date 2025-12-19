package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Root entity representing complete service metadata.
 * This is serialized to spas.json at compile time.
 *
 * @param schemaVersion Schema version (always "design-time-metadata-v1")
 * @param id Service identifier (kebab-case)
 * @param name Human-readable service name
 * @param description Service description
 * @param version Service version (semantic versioning)
 * @param boundedContext Domain bounded context
 * @param capabilities List of service capabilities
 * @param endpoints Command and Query endpoints
 * @param events Published events
 * @param consistency Consistency guarantees
 * @param security Security configuration
 * @param network Network requirements
 * @param license License identifier (e.g., "MIT", "Apache-2.0")
 */
public record ServiceMetadata(
    @JsonProperty("schema-version") String schemaVersion,
    String id,
    String name,
    String description,
    String version,
    @JsonProperty("bounded-context") String boundedContext,
    List<String> capabilities,
    List<EndpointContract> endpoints,
    List<EventContract> events,
    Consistency consistency,
    Security security,
    Network network,
    String license
) {
    /**
     * Creates a new ServiceMetadata with the standard schema version.
     */
    public static final String SCHEMA_VERSION = "design-time-metadata-v1";
}
