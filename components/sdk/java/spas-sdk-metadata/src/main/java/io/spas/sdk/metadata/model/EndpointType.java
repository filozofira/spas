package io.spas.sdk.metadata.model;

/**
 * Represents the type of endpoint (Command or Query) in CQRS architecture.
 */
public enum EndpointType {
    /**
     * Command endpoint - modifies state (write operation).
     */
    COMMAND,
    
    /**
     * Query endpoint - reads state (read-only operation).
     */
    QUERY
}
