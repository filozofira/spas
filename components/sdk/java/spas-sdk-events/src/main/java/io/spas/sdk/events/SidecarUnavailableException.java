package io.spas.sdk.events;

/**
 * Thrown when the sidecar is unavailable or unreachable.
 */
public class SidecarUnavailableException extends SpasPublishException {
    public SidecarUnavailableException(String message) {
        super(message);
    }
    
    public SidecarUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
