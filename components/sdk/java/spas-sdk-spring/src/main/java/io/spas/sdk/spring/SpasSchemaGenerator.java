package io.spas.sdk.spring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.victools.jsonschema.generator.*;
import com.github.victools.jsonschema.module.jackson.JacksonModule;
import com.github.victools.jsonschema.module.jackson.JacksonOption;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasEvent;
import io.spas.sdk.metadata.annotations.SpasQuery;

import java.util.*;
import java.util.logging.Logger;

/**
 * Generates JSON schemas from Java types annotated with SPAS annotations.
 * 
 * <p>Scans the application context for classes annotated with {@code @SpasCommand},
 * {@code @SpasQuery}, or {@code @SpasEvent} and generates JSON Schema draft-07
 * compliant schemas for each.</p>
 * 
 * <p>The generated schemas are used by the metadata endpoint to provide
 * contract schemas alongside spas.json.</p>
 */
public class SpasSchemaGenerator {

    private static final Logger log = Logger.getLogger(SpasSchemaGenerator.class.getName());
    private static final String DRAFT_07_SCHEMA = "http://json-schema.org/draft-07/schema#";
    
    private final SchemaGenerator generator;
    private final ObjectMapper objectMapper;

    public SpasSchemaGenerator() {
        // Configure Jackson module for proper property handling
        JacksonModule jacksonModule = new JacksonModule(
            JacksonOption.RESPECT_JSONPROPERTY_ORDER,
            JacksonOption.RESPECT_JSONPROPERTY_REQUIRED
        );

        // Configure schema generator
        SchemaGeneratorConfigBuilder configBuilder = new SchemaGeneratorConfigBuilder(
            SchemaVersion.DRAFT_7,
            OptionPreset.PLAIN_JSON
        );
        
        configBuilder.with(jacksonModule);
        
        // Use camelCase for property names (Java convention)
        configBuilder.forFields()
            .withPropertyNameOverrideResolver(field -> {
                String name = field.getDeclaredName();
                // Convert to camelCase if not already
                if (name.length() > 0) {
                    return Character.toLowerCase(name.charAt(0)) + name.substring(1);
                }
                return name;
            });
        
        SchemaGeneratorConfig config = configBuilder.build();
        this.generator = new SchemaGenerator(config);
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Generates JSON schemas for all annotated types found via classpath scanning.
     * 
     * @param basePackages The base packages to scan for annotated types
     * @return Map of schema reference paths to schema JSON strings
     */
    public Map<String, String> generateSchemasFromPackages(String... basePackages) {
        Map<String, String> schemas = new HashMap<>();
        
        // Note: Full classpath scanning requires Spring's component scanning
        // which runs during application context initialization.
        // For now, this method returns empty - schemas should be registered
        // via the auto-configuration or programmatically.
        
        log.fine("Schema generation from packages requires ApplicationContext scanning");
        return schemas;
    }

    /**
     * Generates a JSON schema for a specific type.
     * 
     * @param type The Java type to generate a schema for
     * @return The JSON schema as a string
     */
    public String generateSchema(Class<?> type) {
        try {
            JsonNode schemaNode = generator.generateSchema(type);
            
            // Ensure $schema is set to draft-07
            if (schemaNode instanceof ObjectNode objectNode) {
                objectNode.put("$schema", DRAFT_07_SCHEMA);
            }
            
            return objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(schemaNode);
        } catch (Exception e) {
            log.warning("Failed to generate schema for " + type.getName() + ": " + e.getMessage());
            return createFallbackSchema(type);
        }
    }

    /**
     * Generates schemas for a collection of types with their schema references.
     * 
     * @param typeMappings Map of schema reference paths to Java types
     * @return Map of schema reference paths to schema JSON strings
     */
    public Map<String, String> generateSchemas(Map<String, Class<?>> typeMappings) {
        Map<String, String> schemas = new HashMap<>();
        
        for (Map.Entry<String, Class<?>> entry : typeMappings.entrySet()) {
            String schemaRef = entry.getKey();
            Class<?> type = entry.getValue();
            
            String schema = generateSchema(type);
            schemas.put(schemaRef, schema);
            log.fine("Generated schema for " + schemaRef + " from " + type.getName());
        }
        
        return schemas;
    }

    /**
     * Scans classes for SPAS annotations and extracts schema references and types.
     * 
     * @param classes The classes to scan
     * @return Map of schema reference paths to annotated classes
     */
    public Map<String, Class<?>> extractSchemaTypeMappings(Collection<Class<?>> classes) {
        Map<String, Class<?>> mappings = new HashMap<>();
        
        for (Class<?> clazz : classes) {
            // Check for @SpasEvent
            SpasEvent eventAnnotation = clazz.getAnnotation(SpasEvent.class);
            if (eventAnnotation != null && !eventAnnotation.schemaRef().isEmpty()) {
                mappings.put(eventAnnotation.schemaRef(), clazz);
            }
            
            // Check for @SpasCommand (on classes that represent command payloads)
            SpasCommand commandAnnotation = clazz.getAnnotation(SpasCommand.class);
            if (commandAnnotation != null && !commandAnnotation.schemaRef().isEmpty()) {
                mappings.put(commandAnnotation.schemaRef(), clazz);
            }
            
            // Check for @SpasQuery (on classes that represent query payloads)
            SpasQuery queryAnnotation = clazz.getAnnotation(SpasQuery.class);
            if (queryAnnotation != null && !queryAnnotation.schemaRef().isEmpty()) {
                mappings.put(queryAnnotation.schemaRef(), clazz);
            }
        }
        
        return mappings;
    }

    private String createFallbackSchema(Class<?> type) {
        return String.format("""
            {
              "$schema": "%s",
              "title": "%s",
              "type": "object",
              "description": "Schema auto-generated for %s"
            }
            """, DRAFT_07_SCHEMA, type.getSimpleName(), type.getName());
    }
}
