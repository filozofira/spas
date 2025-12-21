package io.spas.sdk.metadata;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

/**
 * Centralized Jackson ObjectMapper configuration for SPAS metadata serialization.
 * <p>
 * This configuration ensures consistent JSON output across all SDK components:
 * <ul>
 *   <li><b>CamelCase naming</b>: Java camelCase → JSON camelCase (e.g., schemaRef → schemaRef)</li>
 *   <li><b>Non-null serialization</b>: Omit null fields from JSON output</li>
 * </ul>
 * <p>
 * The ObjectMapper instance is thread-safe and can be reused across the application.
 * <p>
 * Note: SPAS design-time-metadata-v1 schema uses camelCase property names per ADR-039.
 * 
 * @see MetadataComposer
 * @see io.spas.sdk.metadata.model.ServiceMetadata
 */
public final class JacksonConfiguration {
    
    /**
     * Pre-configured ObjectMapper for SPAS metadata serialization.
     * <p>
     * Configuration:
     * <ul>
     *   <li>Property naming: {@link PropertyNamingStrategies#LOWER_CAMEL_CASE}</li>
     *   <li>Serialization inclusion: {@link JsonInclude.Include#NON_NULL}</li>
     * </ul>
     */
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
        .setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE)
        .setSerializationInclusion(JsonInclude.Include.NON_NULL);
    
    private JacksonConfiguration() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Returns a pre-configured ObjectMapper instance for SPAS metadata.
     * <p>
     * The returned ObjectMapper is:
     * <ul>
     *   <li>Thread-safe (can be shared across threads)</li>
     *   <li>Configured for camelCase property names (per design-time-metadata-v1 schema)</li>
     *   <li>Configured to omit null values</li>
     * </ul>
     * 
     * @return the singleton ObjectMapper instance
     */
    public static ObjectMapper getObjectMapper() {
        return OBJECT_MAPPER;
    }
    
    /**
     * Creates a new ObjectMapper instance with SPAS metadata configuration.
     * <p>
     * Use this method if you need a separate instance with custom modifications.
     * For most use cases, prefer {@link #getObjectMapper()} to reuse the singleton.
     * 
     * @return a new ObjectMapper configured for SPAS metadata
     */
    public static ObjectMapper createObjectMapper() {
        return new ObjectMapper()
            .setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }
}
