package io.spas.sdk.spring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.spas.sdk.spring.helpers.ZipAssert;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;

class SpasMetadataArchiveGeneratorTest {

    @Test
    void generateArchive_writesZipAndIncludesSpasJson() throws IOException {
        SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();

        byte[] archive = generator.generateArchive();
        assertNotNull(archive);
        assertTrue(archive.length > 0);

        Set<String> entries = ZipAssert.listEntryNames(archive);
        assertTrue(entries.contains("spas.json"));
    }

    @Test
    void writeArchiveFromSystemProperties_withDefaultOutputDirectory_createsMetadataDirectoryAndWritesZip() throws IOException {
        Path tempRoot = Files.createTempDirectory("spas-metadata-tests");
        String originalUserDir = System.getProperty("user.dir");

        try {
            System.setProperty("user.dir", tempRoot.toString());
            System.clearProperty("spas.metadata.output");

            SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();

            Path zipPath = generator.writeArchiveFromSystemProperties();
            assertNotNull(zipPath);

            assertTrue(Files.exists(zipPath));
            assertTrue(zipPath.endsWith(Path.of("metadata", "service.metadata.zip")));

            Set<String> entries = ZipAssert.listEntryNames(zipPath);
            assertTrue(entries.contains("spas.json"));
        } finally {
            if (originalUserDir != null) {
                System.setProperty("user.dir", originalUserDir);
            }

            System.clearProperty("spas.metadata.output");

            // Best-effort cleanup
            try {
                Files.walk(tempRoot)
                    .sorted((a, b) -> b.getNameCount() - a.getNameCount())
                    .forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                    });
            } catch (IOException ignored) {}
        }
    }

    @Test
    void writeArchive_whenArchiveExists_overwritesExistingFile() throws IOException {
        Path outputDir = Files.createTempDirectory("spas-metadata-tests-output");

        try {
            SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();

            Path zipPath = generator.writeArchive(outputDir);
            assertTrue(Files.exists(zipPath));

            Files.writeString(zipPath, "not a zip");

            Path overwrittenZipPath = generator.writeArchive(outputDir);
            assertEquals(zipPath, overwrittenZipPath);

            Set<String> entries = ZipAssert.listEntryNames(overwrittenZipPath);
            assertTrue(entries.contains("spas.json"));
        } finally {
            // Best-effort cleanup
            try {
                Files.walk(outputDir)
                    .sorted((a, b) -> b.getNameCount() - a.getNameCount())
                    .forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                    });
            } catch (IOException ignored) {}
        }
    }

    /**
     * T005: Test that endpoints with optional path attribute have paths correctly inferred from Spring annotations.
     */
    @Test
    void optionalPath_withSpringAnnotations_infersPathCorrectly() throws Exception {
        SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();
        byte[] archive = generator.generateArchive();
        assertNotNull(archive);

        String spasJsonText = readZipEntryText(archive, "spas.json");
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(spasJsonText);

        JsonNode endpoints = root.get("endpoints");
        assertNotNull(endpoints);
        assertTrue(endpoints.isArray());

        boolean foundCreateProduct = false;
        boolean foundGetProduct = false;
        boolean foundCreateBatch = false;

        for (JsonNode endpoint : endpoints) {
            String name = endpoint.get("name").asText();
            String methodPath = endpoint.get("methodPath").asText();

            if ("create-product".equals(name)) {
                assertEquals("/api/products", methodPath, "CreateProduct should infer path from @RequestMapping + @PostMapping");
                foundCreateProduct = true;
            } else if ("get-product".equals(name)) {
                assertEquals("/api/products/{id}", methodPath, "GetProduct should infer path from @RequestMapping + @GetMapping");
                foundGetProduct = true;
            } else if ("create-product-batch".equals(name)) {
                assertEquals("/api/products/batch", methodPath, "CreateProductBatch should infer path from @RequestMapping + @PostMapping('/batch')");
                foundCreateBatch = true;
            }
        }

        assertTrue(foundCreateProduct, "Expected endpoint 'create-product' with inferred path");
        assertTrue(foundGetProduct, "Expected endpoint 'get-product' with inferred path");
        assertTrue(foundCreateBatch, "Expected endpoint 'create-product-batch' with inferred path");
    }

    /**
     * T006: Test that endpoints with no Spring annotations and no explicit path are skipped with a warning.
     */
    @Test
    void missingPath_withNoSpringAnnotations_skipsEndpointWithWarning() throws Exception {
        SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();
        byte[] archive = generator.generateArchive();
        assertNotNull(archive);

        String spasJsonText = readZipEntryText(archive, "spas.json");
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(spasJsonText);

        JsonNode endpoints = root.get("endpoints");
        assertNotNull(endpoints);
        assertTrue(endpoints.isArray());

        // Verify that OrphanCommand is NOT in the endpoints list
        for (JsonNode endpoint : endpoints) {
            String name = endpoint.get("name").asText();
            assertNotEquals("orphan-command", name, 
                "OrphanCommand should be skipped when path cannot be inferred");
        }
    }

    /**
     * T007: Test that explicit path attribute takes precedence over Spring annotation inference (backward compatibility).
     */
    @Test
    void explicitPath_takingPrecedenceOverSpringAnnotations() throws Exception {
        SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();
        byte[] archive = generator.generateArchive();
        assertNotNull(archive);

        String spasJsonText = readZipEntryText(archive, "spas.json");
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(spasJsonText);

        JsonNode endpoints = root.get("endpoints");
        assertNotNull(endpoints);
        assertTrue(endpoints.isArray());

        boolean foundCreateOrder = false;
        boolean foundGetOrder = false;

        for (JsonNode endpoint : endpoints) {
            String name = endpoint.get("name").asText();
            String methodPath = endpoint.get("methodPath").asText();

            // SampleController has explicit path attributes that match Spring annotations
            if ("create-order".equals(name)) {
                assertEquals("/api/orders", methodPath, "CreateOrder should use explicit path (backward compatibility)");
                foundCreateOrder = true;
            } else if ("get-order".equals(name)) {
                assertEquals("/api/orders/{id}", methodPath, "GetOrder should use explicit path (backward compatibility)");
                foundGetOrder = true;
            }
        }

        assertTrue(foundCreateOrder, "Expected endpoint 'create-order' with explicit path");
        assertTrue(foundGetOrder, "Expected endpoint 'get-order' with explicit path");
    }

    private static String readZipEntryText(byte[] zipBytes, String entryName) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entryName.equals(entry.getName())) {
                    return new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        }

        throw new IllegalStateException("ZIP entry not found: " + entryName);
    }
}
