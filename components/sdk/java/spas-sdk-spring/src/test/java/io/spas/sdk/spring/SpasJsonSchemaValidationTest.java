package io.spas.sdk.spring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;

class SpasJsonSchemaValidationTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void generatedSpasJson_validatesAgainstEmbeddedDesignTimeSchema() throws Exception {
        SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();
        byte[] archive = generator.generateArchive();

        String spasJsonText = readZipEntryText(archive, "spas.json");
        assertNotNull(spasJsonText);

        JsonNode spasJson = OBJECT_MAPPER.readTree(spasJsonText);

        try (InputStream schemaStream = SpasJsonSchemaValidationTest.class.getResourceAsStream(
            "/schemas/design-time-metadata-v1.schema.json")) {

            assertNotNull(schemaStream, "Schema resource not found on classpath: /schemas/design-time-metadata-v1.schema.json");

            JsonNode schemaNode = OBJECT_MAPPER.readTree(schemaStream);

            JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);
            JsonSchema schema = factory.getSchema(schemaNode);

            Set<ValidationMessage> errors = schema.validate(spasJson);
            assertTrue(errors.isEmpty(), "Schema validation failed: " + errors);
        }
    }

    private static String readZipEntryText(byte[] zipBytes, String entryName) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entryName.equals(entry.getName())) {
                    byte[] bytes = zis.readAllBytes();
                    return new String(bytes, StandardCharsets.UTF_8);
                }
            }
        }

        fail("ZIP entry not found: " + entryName);
        return null;
    }
}
