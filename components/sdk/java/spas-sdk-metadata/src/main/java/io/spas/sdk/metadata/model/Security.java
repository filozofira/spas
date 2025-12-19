package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Security configuration for the service.
 *
 * @param authentication Authentication mechanism configuration
 * @param dataClassification Data classification levels (at least one required)
 */
public record Security(
    Authentication authentication,
    @JsonProperty("data-classification") List<DataClassification> dataClassification
) {
}
