package io.spas.sdk.metadata.model;

/**
 * Declares consistency guarantees for commands and queries.
 *
 * @param commands Consistency level for write operations
 * @param queries Consistency level for read operations
 */
public record Consistency(
    ConsistencyLevel commands,
    QueryConsistencyLevel queries
) {
}
