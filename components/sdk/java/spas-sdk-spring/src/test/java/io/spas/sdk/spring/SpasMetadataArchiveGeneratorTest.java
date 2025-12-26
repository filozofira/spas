package io.spas.sdk.spring;

import io.spas.sdk.spring.helpers.ZipAssert;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

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
}
