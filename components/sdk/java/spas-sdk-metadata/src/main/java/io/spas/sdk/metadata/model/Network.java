package io.spas.sdk.metadata.model;

import java.util.List;

/**
 * Network requirements for the service.
 *
 * @param requiredEgress List of required outbound network dependencies
 */
public record Network(
    List<String> requiredEgress
) {
}
