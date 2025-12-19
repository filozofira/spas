package io.spas.sdk.metadata.model;

/**
 * Data classification level for compliance and security.
 */
public enum DataClassification {
    /**
     * Publicly available data.
     */
    PUBLIC,
    
    /**
     * Internal use only.
     */
    INTERNAL,
    
    /**
     * Confidential data requiring protection.
     */
    CONFIDENTIAL,
    
    /**
     * Restricted data with highest protection level.
     */
    RESTRICTED
}
