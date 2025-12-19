package io.spas.sdk.metadata.model;

/**
 * Consistency level for write operations (commands).
 */
public enum ConsistencyLevel {
    /**
     * ACID (Atomic, Consistent, Isolated, Durable) transactions.
     */
    ACID,
    
    /**
     * Eventual consistency - operations may take time to propagate.
     */
    EVENTUAL
}
