package io.spas.sdk.metadata;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

/**
 * Centralized Jackson ObjectMapper configuration for SPAS metadata serialization.
 * <p>
 * This configuration ensures consistent JSON output across all SDK components:
 * <ul>
 *   <li><b>Kebab-case naming</b>: Java camelCase → JSON kebab-case (e.g., serviceName → service-name)</li>
 *   <li><b>Non-null serialization</b>: Omit null fields from JSON output</li>
 * </ul>
 * <p>
 * The ObjectMapper instance is thread-safe and can be reused across the application.
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
     *   <li>Property naming: {@link PropertyNamingStrategies#KEBAB_CASE}</li>
     *   <li>Serialization inclusion: {@link JsonInclude.Include#NON_NULL}</li>
     * </ul>
     */
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
        .setPropertyNamingStrategy(PropertyNamingStrategies.KEBAB_CASE)
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
     *   <li>Configured for kebab-case property names</li>
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
            .setPropertyNamingStrategy(PropertyNamingStrategies.KEBAB_CASE)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }
}
