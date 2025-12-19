package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Describes a Command or Query endpoint.
 *
 * @param name Endpoint name (will be converted to kebab-case in JSON output)
 * @param type Endpoint type (COMMAND or QUERY)
 * @param protocol Network protocol (HTTP or GRPC)
 * @param methodPath HTTP method and path (e.g., "POST /api/orders") or gRPC method
 * @param version Endpoint version (e.g., "1.0.0")
 * @param schemaRef URI reference to request/response schema
 */
public record EndpointContract(
    String name,
    EndpointType type,
    Protocol protocol,
    @JsonProperty("method-path") String methodPath,
    String version,
    @JsonProperty("schema-ref") String schemaRef
) {
}
