package io.spas.sdk.events;

/**
 * Thrown when an event class is missing the required @SpasEvent annotation.
 */
public class EventAnnotationMissingException extends SpasPublishException {
    public EventAnnotationMissingException(String message) {
        super(message);
    }
}
