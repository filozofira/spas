package io.spas.sdk.core.config;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;

/**
 * Configuration for the SPAS SDK, loaded from environment variables.
 * <p>
 * Required environment variables:
 * <ul>
 *   <li>{@code SERVICE_NAME} - The unique identifier for this service</li>
 * </ul>
 * <p>
 * Sidecar URL configuration (in priority order):
 * <ol>
 *   <li>{@code SIDECAR_URL} - Full URL (e.g., "http://localhost:3001")</li>
 *   <li>{@code SIDECAR_HOST} and {@code SIDECAR_PORT} - Host and port components</li>
 *   <li>Default: "http://localhost:3001"</li>
 * </ol>
 */
public final class SpasConfiguration {

    private static final String DEFAULT_SIDECAR_HOST = "localhost";
    private static final int DEFAULT_SIDECAR_PORT = 3001;
    private static final String DEFAULT_SIDECAR_SCHEME = "http";

    private final String serviceName;
    private final URI sidecarUrl;

    /**
     * Creates a new SPAS configuration by loading values from environment variables.
     * <p>
     * This constructor performs fail-fast validation and will throw
     * {@link SpasConfigurationException} if required configuration is missing.
     *
     * @throws SpasConfigurationException if SERVICE_NAME is not set or if sidecar URL is invalid
     */
    public SpasConfiguration() {
        this(System.getenv("SERVICE_NAME"),
             System.getenv("SIDECAR_URL"),
             System.getenv("SIDECAR_HOST"),
             System.getenv("SIDECAR_PORT"));
    }

    /**
     * Package-private constructor for testing.
     *
     * @param serviceName the service name
     * @param sidecarUrl the sidecar URL
     * @param sidecarHost the sidecar host
     * @param sidecarPort the sidecar port
     */
    SpasConfiguration(String serviceName, String sidecarUrl, String sidecarHost, String sidecarPort) {
        this.serviceName = validateServiceName(serviceName);
        this.sidecarUrl = resolveSidecarUrl(sidecarUrl, sidecarHost, sidecarPort);
    }

    private String validateServiceName(String serviceName) {
        if (serviceName == null || serviceName.trim().isEmpty()) {
            throw new SpasConfigurationException(
                "SERVICE_NAME environment variable is required but not set. " +
                "Please set SERVICE_NAME to your service's unique identifier."
            );
        }
        return serviceName.trim();
    }

    private URI resolveSidecarUrl(String sidecarUrl, String sidecarHost, String sidecarPort) {
        try {
            // Priority 1: SIDECAR_URL
            if (sidecarUrl != null && !sidecarUrl.trim().isEmpty()) {
                return new URI(sidecarUrl.trim());
            }

            // Priority 2: SIDECAR_HOST and SIDECAR_PORT
            String host = Optional.ofNullable(sidecarHost)
                .filter(h -> !h.trim().isEmpty())
                .orElse(DEFAULT_SIDECAR_HOST);

            int port = Optional.ofNullable(sidecarPort)
                .filter(p -> !p.trim().isEmpty())
                .map(Integer::parseInt)
                .orElse(DEFAULT_SIDECAR_PORT);

            // Priority 3: Default
            return new URI(DEFAULT_SIDECAR_SCHEME, null, host, port, null, null, null);

        } catch (URISyntaxException e) {
            throw new SpasConfigurationException(
                "Invalid sidecar URL configuration: " + e.getMessage(), e
            );
        } catch (NumberFormatException e) {
            throw new SpasConfigurationException(
                "Invalid SIDECAR_PORT value: must be a valid integer", e
            );
        }
    }

    /**
     * Gets the service name from the SERVICE_NAME environment variable.
     *
     * @return the service name
     */
    public String getServiceName() {
        return serviceName;
    }

    /**
     * Gets the sidecar URL, resolved from environment variables or defaults.
     *
     * @return the sidecar URL
     */
    public URI getSidecarUrl() {
        return sidecarUrl;
    }

    @Override
    public String toString() {
        return "SpasConfiguration{" +
               "serviceName='" + serviceName + '\'' +
               ", sidecarUrl=" + sidecarUrl +
               '}';
    }
}
