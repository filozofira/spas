package io.spas.sdk.metadata.model;

import java.util.List;

/**
 * Authentication mechanism details.
 *
 * @param type Authentication type (OAUTH2, JWT, API_KEY, MTLS, NONE)
 * @param requiredScopes OAuth2/OIDC scopes required for access
 */
public record Authentication(
    AuthType type,
    List<String> requiredScopes
) {
}
