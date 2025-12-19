package io.spas.sdk.spring;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * REST controller that exposes SPAS service metadata at /_spas/metadata.
 * 
 * <p>The spas.json file is generated at compile-time by the SPAS SDK
 * annotation processor and included in the classpath. This controller
 * reads and serves that file to enable runtime metadata discovery.</p>
 * 
 * <p>This endpoint is used by:</p>
 * <ul>
 *   <li>spas-service CLI to fetch and publish metadata to the repository</li>
 *   <li>Development tools for service introspection</li>
 *   <li>Sidecar for runtime contract validation</li>
 * </ul>
 * 
 * <p>The endpoint can be disabled via configuration:
 * {@code spas.metadata.enabled=false}</p>
 */
@RestController
@RequestMapping("/_spas")
public class SpasMetadataController {

    private static final Logger log = Logger.getLogger(SpasMetadataController.class.getName());
    private static final String SPAS_JSON_RESOURCE = "spas.json";

    private final SpasProperties properties;
    private volatile String cachedMetadata;

    public SpasMetadataController(SpasProperties properties) {
        this.properties = properties;
    }

    /**
     * Returns the service metadata (spas.json).
     * 
     * @return The spas.json content as JSON, or appropriate error response.
     */
    @GetMapping(value = "/metadata", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getMetadata() {
        // Check if metadata endpoint is enabled
        if (!properties.getMetadata().isEnabled()) {
            return ResponseEntity.status(404)
                .body("{\"error\": \"Metadata endpoint is disabled\", " +
                      "\"hint\": \"Set spas.metadata.enabled=true to enable\"}");
        }

        // Check environment restriction if configured
        String allowedEnv = properties.getMetadata().getAllowedEnvironment();
        if (allowedEnv != null && !allowedEnv.isBlank()) {
            String currentEnv = System.getenv("SPRING_PROFILES_ACTIVE");
            if (currentEnv == null) {
                currentEnv = System.getProperty("spring.profiles.active", "default");
            }
            
            if (!allowedEnv.equalsIgnoreCase(currentEnv) && 
                !allowedEnv.equalsIgnoreCase("*")) {
                return ResponseEntity.status(404)
                    .body("{\"error\": \"Metadata endpoint is not available in this environment\", " +
                          "\"environment\": \"" + currentEnv + "\", " +
                          "\"hint\": \"Enable in " + allowedEnv + " mode\"}");
            }
        }

        try {
            // Use cached metadata if available
            if (cachedMetadata != null) {
                return ResponseEntity.ok(cachedMetadata);
            }

            ClassPathResource resource = new ClassPathResource(SPAS_JSON_RESOURCE);
            if (!resource.exists()) {
                log.warning("spas.json not found in classpath. Ensure @SpasService annotation is present " +
                        "and spas-sdk-metadata-processor is configured in the build.");
                return ResponseEntity.status(404)
                    .body("{\"error\": \"spas.json not found\", " +
                          "\"hint\": \"Ensure @SpasService annotation is present and annotation processor is configured\"}");
            }

            try (InputStream is = resource.getInputStream()) {
                String content = StreamUtils.copyToString(is, StandardCharsets.UTF_8);
                
                // Cache the metadata since it's static (generated at compile time)
                cachedMetadata = content;
                
                log.fine("Serving spas.json metadata (" + content.length() + " bytes)");
                return ResponseEntity.ok(content);
            }
        } catch (IOException e) {
            log.log(Level.SEVERE, "Failed to read spas.json from classpath", e);
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"Failed to read spas.json\", \"message\": \"" + 
                      e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
