package io.spas.sdk.spring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;

class EndpointDiscoveryTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void generatedSpasJson_includesHttpVerbInMethodPath_withoutStartingServer() throws Exception {
        SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();
        byte[] archive = generator.generateArchive();
        assertNotNull(archive);

        String spasJsonText = readZipEntryText(archive, "spas.json");
        JsonNode root = OBJECT_MAPPER.readTree(spasJsonText);

        JsonNode endpoints = root.get("endpoints");
        assertNotNull(endpoints);
        assertTrue(endpoints.isArray());

        boolean foundPostOrders = false;
        boolean foundGetOrder = false;

        for (JsonNode endpoint : endpoints) {
            String name = endpoint.get("name").asText();
            String protocol = endpoint.get("protocol").asText();
            String methodPath = endpoint.get("methodPath").asText();

            if ("create-order".equals(name)) {
                assertEquals("Http", protocol);
                assertEquals("POST /api/orders", methodPath);
                foundPostOrders = true;
            }

            if ("get-order".equals(name)) {
                assertEquals("Http", protocol);
                assertEquals("GET /api/orders/{id}", methodPath);
                foundGetOrder = true;
            }
        }

        assertTrue(foundPostOrders, "Expected endpoint 'create-order' with methodPath 'POST /api/orders'");
        assertTrue(foundGetOrder, "Expected endpoint 'get-order' with methodPath 'GET /api/orders/{id}'");
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
