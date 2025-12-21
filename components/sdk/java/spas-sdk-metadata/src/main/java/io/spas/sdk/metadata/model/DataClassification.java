package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Data classification level for compliance and security.
 * Serializes as PascalCase to match design-time-metadata-v1 schema.
 */
public enum DataClassification {
    /**
     * Publicly available data.
     */
    PUBLIC("Public"),
    
    /**
     * Internal use only.
     */
    INTERNAL("Internal"),
    
    /**
     * Confidential data requiring protection.
     */
    CONFIDENTIAL("Confidential"),
    
    /**
     * Restricted data with highest protection level.
     */
    RESTRICTED("Restricted");

    private final String value;

    DataClassification(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
