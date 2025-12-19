package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Network protocol used for communication.
 * Serializes as PascalCase to match design-time-metadata-v1 schema.
 */
public enum Protocol {
    /**
     * HTTP/REST protocol.
     */
    HTTP("Http"),
    
    /**
     * gRPC protocol.
     */
    GRPC("Grpc");

    private final String value;

    Protocol(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
