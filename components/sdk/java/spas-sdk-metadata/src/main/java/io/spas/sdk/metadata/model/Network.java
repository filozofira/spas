package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Network requirements for the service.
 *
 * @param requiredEgress List of required outbound network dependencies
 */
public record Network(
    @JsonProperty("required-egress") List<String> requiredEgress
) {
}
