package io.spas.sdk.metadata.model;

/**
 * Describes a Command or Query endpoint.
 *
 * @param name Endpoint name (will be converted to kebab-case in JSON output)
 * @param type Endpoint type (COMMAND or QUERY)
 * @param protocol Network protocol (HTTP or GRPC)
 * @param methodPath HTTP route path (e.g., "/api/orders") or gRPC method path
 * @param version Endpoint version (e.g., "1.0.0")
 * @param schemaRef URI reference to request/response schema
 */
public record EndpointContract(
    String name,
    EndpointType type,
    Protocol protocol,
    String methodPath,
    String version,
    String schemaRef
) {
}
