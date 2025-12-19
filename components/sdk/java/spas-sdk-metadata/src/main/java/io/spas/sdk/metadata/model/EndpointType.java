package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the type of endpoint (Command or Query) in CQRS architecture.
 * Serializes as PascalCase to match design-time-metadata-v1 schema.
 */
public enum EndpointType {
    /**
     * Command endpoint - modifies state (write operation).
     */
    COMMAND("Command"),
    
    /**
     * Query endpoint - reads state (read-only operation).
     */
    QUERY("Query");

    private final String value;

    EndpointType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
