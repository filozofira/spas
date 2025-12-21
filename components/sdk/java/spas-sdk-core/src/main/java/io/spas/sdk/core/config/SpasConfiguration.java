package io.spas.sdk.core.config;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Configuration for the SPAS SDK, loaded from environment variables.
 * <p>
 * Service name resolution:
 * <ul>
 *   <li>{@code SERVICE_NAME} - The unique identifier for this service</li>
 *   <li>Default: {@code "unknown-service"}</li>
 * </ul>
 * <p>
 * Sidecar URL configuration (in priority order):
 * <ol>
 *   <li>{@code SIDECAR_URL} - Full URL (e.g., "http://localhost:7000")</li>
 *   <li>{@code SIDECAR_HOST} and {@code SIDECAR_PORT} - Host and port components</li>
 *   <li>Derived from {@code SERVICE_NAME}: {@code http://{service-name}-sidecar:7000} (DNS-normalized)</li>
 *   <li>Localhost fallback: {@code http://localhost:7000}</li>
 * </ol>
 */
public final class SpasConfiguration {

    private static final String DEFAULT_SIDECAR_HOST = "localhost";
     private static final int DEFAULT_SIDECAR_PORT = 7000;
    private static final String DEFAULT_SIDECAR_SCHEME = "http";
     private static final String DEFAULT_SERVICE_NAME = "unknown-service";

     private static final Pattern NON_ALNUM_SEQUENCE = Pattern.compile("[^a-z0-9]+");

    private final String serviceName;
    private final URI sidecarUrl;

    /**
     * Creates a new SPAS configuration by loading values from environment variables.
     * <p>
    * @throws SpasConfigurationException if sidecar URL is invalid
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
        String providedServiceName = trimToNull(serviceName);
        this.serviceName = providedServiceName != null ? providedServiceName : DEFAULT_SERVICE_NAME;
        this.sidecarUrl = resolveSidecarUrl(sidecarUrl, sidecarHost, sidecarPort, providedServiceName);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String normalizeForDns(String serviceName) {
        String trimmed = trimToNull(serviceName);
        if (trimmed == null) {
            return null;
        }

        String normalized = NON_ALNUM_SEQUENCE.matcher(trimmed.toLowerCase()).replaceAll("-");
        normalized = normalized.replaceAll("^-+", "").replaceAll("-+$", "");
        return normalized.isEmpty() ? null : normalized;
    }

    private URI resolveSidecarUrl(String sidecarUrl, String sidecarHost, String sidecarPort, String serviceNameForDerivation) {
        try {
            // Priority 1: SIDECAR_URL
            String trimmedSidecarUrl = trimToNull(sidecarUrl);
            if (trimmedSidecarUrl != null) {
                return new URI(trimmedSidecarUrl);
            }

            // Priority 2: SIDECAR_HOST and SIDECAR_PORT
            String explicitHost = trimToNull(sidecarHost);
            int port = Optional.ofNullable(trimToNull(sidecarPort))
                .map(Integer::parseInt)
                .orElse(DEFAULT_SIDECAR_PORT);

            if (explicitHost != null) {
                return new URI(DEFAULT_SIDECAR_SCHEME, null, explicitHost, port, null, null, null);
            }

            // Priority 3: Derived from service name using convention
            String normalizedServiceName = normalizeForDns(serviceNameForDerivation);
            if (normalizedServiceName != null) {
                String derivedHost = normalizedServiceName + "-sidecar";
                return new URI(DEFAULT_SIDECAR_SCHEME, null, derivedHost, port, null, null, null);
            }

            // Priority 4: Localhost fallback
            return new URI(DEFAULT_SIDECAR_SCHEME, null, DEFAULT_SIDECAR_HOST, DEFAULT_SIDECAR_PORT, null, null, null);

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
