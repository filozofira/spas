package io.spas.sdk.metadata.model;

/**
 * Consistency level for read operations (queries).
 */
public enum QueryConsistencyLevel {
    /**
     * Strong consistency - reads always reflect latest writes.
     */
    STRONG,
    
    /**
     * Eventual consistency - reads may not reflect latest writes immediately.
     */
    EVENTUAL
}
