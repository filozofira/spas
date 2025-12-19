package io.spas.sdk.core.config;

/**
 * Exception thrown when SPAS SDK configuration is invalid or incomplete.
 * This is a runtime exception that indicates a critical configuration error
 * that prevents the SDK from functioning correctly.
 */
public class SpasConfigurationException extends RuntimeException {

    /**
     * Constructs a new configuration exception with the specified detail message.
     *
     * @param message the detail message
     */
    public SpasConfigurationException(String message) {
        super(message);
    }

    /**
     * Constructs a new configuration exception with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause of the exception
     */
    public SpasConfigurationException(String message, Throwable cause) {
        super(message, cause);
    }
}
