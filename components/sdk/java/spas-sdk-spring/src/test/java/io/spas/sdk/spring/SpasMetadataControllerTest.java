package io.spas.sdk.spring;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

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

        ResponseEntity<byte[]> response = controller.getMetadata();

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        String body = new String(response.getBody());
        assertTrue(body.contains("Metadata endpoint is disabled"));
    }

    @Test
    void getMetadata_whenEnabled_andServicePresent_returnsZip() throws IOException {
        properties.getMetadata().setEnabled(true);
        properties.getMetadata().setAllowedEnvironment("*");

        ResponseEntity<byte[]> response = controller.getMetadata();

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        assertEquals("application/zip", response.getHeaders().getContentType().toString());
        assertNotNull(response.getBody());

        Set<String> entries = listZipEntries(response.getBody());
        assertTrue(entries.contains("spas.json"));
        assertTrue(entries.contains("schemas/endpoints/sample-request.schema.json"));
        assertTrue(entries.contains("schemas/endpoints/sample-response.schema.json"));
        assertTrue(entries.contains("schemas/events/sample-event.schema.json"));
    }

    @Test
    void getMetadata_whenEnvironmentRestricted_andNotMatching_returns404() {
        properties.getMetadata().setEnabled(true);
        properties.getMetadata().setAllowedEnvironment("production");
        
        // Test environment won't be "production"
        ResponseEntity<byte[]> response = controller.getMetadata();

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        String body = new String(response.getBody());
        assertTrue(body.contains("not available in this environment"));
    }

    @Test
    void getMetadata_whenEnvironmentAllowsAll_proceedsToLookup() {
        properties.getMetadata().setEnabled(true);
        properties.getMetadata().setAllowedEnvironment("*");

        ResponseEntity<byte[]> response = controller.getMetadata();
        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
    }

    @Test
    void defaultProperties_areCorrect() {
        SpasProperties.Metadata metadata = new SpasProperties.Metadata();
        
        assertTrue(metadata.isEnabled());
        assertEquals("development", metadata.getAllowedEnvironment());
        assertEquals("/_spas/metadata", metadata.getPath());
    }

    private static Set<String> listZipEntries(byte[] zipBytes) throws IOException {
        Set<String> entries = new HashSet<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entries.add(entry.getName());
                zis.closeEntry();
            }
        }
        return entries;
    }
}
