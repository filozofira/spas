package io.spas.sdk.metadata.model;

import java.util.List;

/**
 * Describes a canonical command and the events it produces.
 *
 * @param name Command name (kebab-case)
 * @param version Command version
 * @param produces Produced event references
 */
public record CommandContract(
    String name,
    String version,
    List<ProducedEventRef> produces
) {
}
