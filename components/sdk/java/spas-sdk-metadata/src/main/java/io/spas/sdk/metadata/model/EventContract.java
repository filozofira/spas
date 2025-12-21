package io.spas.sdk.metadata.model;

/**
 * Describes a published event.
 *
 * @param type Event type (will be converted to kebab-case in JSON output)
 * @param version Event schema version (e.g., "1.0.0")
 * @param schemaRef URI reference to event schema
 */
public record EventContract(
    String type,
    String version,
    String schemaRef
) {
}
