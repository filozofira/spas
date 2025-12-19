package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Authentication mechanism details.
 *
 * @param type Authentication type (OAUTH2, JWT, API_KEY, MTLS, NONE)
 * @param requiredScopes OAuth2/OIDC scopes required for access
 */
public record Authentication(
    AuthType type,
    @JsonProperty("required-scopes") List<String> requiredScopes
) {
}
