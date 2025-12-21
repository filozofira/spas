package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Authentication mechanism type.
 * Serializes as PascalCase to match design-time-metadata-v1 schema.
 */
public enum AuthType {
    /**
     * OAuth 2.0 authentication.
     */
    OAUTH2("OAuth2"),
    
    /**
     * JWT (JSON Web Token) authentication.
     */
    JWT("JWT"),
    
    /**
     * API Key authentication.
     */
    API_KEY("ApiKey"),
    
    /**
     * Mutual TLS (mTLS) authentication.
     */
    MTLS("mTLS"),
    
    /**
     * No authentication required.
     */
    NONE("None");

    private final String value;

    AuthType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
