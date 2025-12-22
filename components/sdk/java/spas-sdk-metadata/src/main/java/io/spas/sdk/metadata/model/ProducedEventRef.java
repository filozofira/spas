package io.spas.sdk.metadata.model;

/**
 * Reference to an event produced by a command.
 *
 * @param type Event type (kebab-case)
 * @param version Event version
 * @param when PoC value (always "success")
 */
public record ProducedEventRef(
    String type,
    String version,
    String when
) {
}
