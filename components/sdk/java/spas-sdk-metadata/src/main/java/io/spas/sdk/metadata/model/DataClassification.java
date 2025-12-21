package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Data classification level for compliance and security.
 * Serializes as lowercase to match design-time-metadata-v1 schema.
 */
public enum DataClassification {
    /**
     * Publicly available data.
     */
    PUBLIC("public"),
    
    /**
     * Internal use only.
     */
    INTERNAL("internal"),
    
    /**
     * Confidential data requiring protection.
     */
    CONFIDENTIAL("confidential"),
    
    /**
     * Restricted data with highest protection level.
     */
    RESTRICTED("restricted");

    private final String value;

    DataClassification(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
