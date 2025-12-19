package io.spas.sdk.metadata.model;

/**
 * Authentication mechanism type.
 */
public enum AuthType {
    /**
     * OAuth 2.0 authentication.
     */
    OAUTH2,
    
    /**
     * JWT (JSON Web Token) authentication.
     */
    JWT,
    
    /**
     * API Key authentication.
     */
    API_KEY,
    
    /**
     * Mutual TLS (mTLS) authentication.
     */
    MTLS,
    
    /**
     * No authentication required.
     */
    NONE
}
