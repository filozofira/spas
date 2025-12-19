package io.spas.sdk.spring;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class SpasMetadataControllerTest {

    private SpasProperties properties;
    private SpasMetadataController controller;

    @BeforeEach
    void setUp() {
        properties = new SpasProperties();
        controller = new SpasMetadataController(properties);
    }

    @Test
    void getMetadata_whenDisabled_returns404() {
        properties.getMetadata().setEnabled(false);

        ResponseEntity<String> response = controller.getMetadata();

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        assertTrue(response.getBody().contains("Metadata endpoint is disabled"));
    }

    @Test
    void getMetadata_whenEnabled_andNoSpasJson_returns404WithHint() {
        // spas.json won't exist in test classpath
        properties.getMetadata().setEnabled(true);

        ResponseEntity<String> response = controller.getMetadata();

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        assertTrue(response.getBody().contains("spas.json not found"));
        assertTrue(response.getBody().contains("@SpasService"));
    }

    @Test
    void getMetadata_whenEnvironmentRestricted_andNotMatching_returns404() {
        properties.getMetadata().setEnabled(true);
        properties.getMetadata().setAllowedEnvironment("production");
        
        // Test environment won't be "production"
        ResponseEntity<String> response = controller.getMetadata();

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        assertTrue(response.getBody().contains("not available in this environment"));
    }

    @Test
    void getMetadata_whenEnvironmentAllowsAll_proceedsToLookup() {
        properties.getMetadata().setEnabled(true);
        properties.getMetadata().setAllowedEnvironment("*");

        ResponseEntity<String> response = controller.getMetadata();

        // Will be 404 because spas.json doesn't exist in test classpath,
        // but proves environment check passed
        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        assertTrue(response.getBody().contains("spas.json not found"));
    }

    @Test
    void defaultProperties_areCorrect() {
        SpasProperties.Metadata metadata = new SpasProperties.Metadata();
        
        assertTrue(metadata.isEnabled());
        assertNull(metadata.getAllowedEnvironment());
        assertEquals("/_spas/metadata", metadata.getPath());
    }
}
