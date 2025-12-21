package io.spas.sdk.metadata.model;

import java.util.List;

/**
 * Security configuration for the service.
 *
 * @param authentication Authentication mechanism configuration
 * @param dataClassification Data classification levels (at least one required)
 */
public record Security(
    Authentication authentication,
    List<DataClassification> dataClassification
) {
}
