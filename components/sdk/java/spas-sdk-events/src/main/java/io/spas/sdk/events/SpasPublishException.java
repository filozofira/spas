package io.spas.sdk.events;

/**
 * Base exception for event publishing failures.
 */
public class SpasPublishException extends RuntimeException {
    public SpasPublishException(String message) {
        super(message);
    }
    
    public SpasPublishException(String message, Throwable cause) {
        super(message, cause);
    }
}
