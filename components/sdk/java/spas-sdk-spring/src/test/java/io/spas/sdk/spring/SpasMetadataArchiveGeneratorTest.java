package io.spas.sdk.spring;

import io.spas.sdk.spring.helpers.ZipAssert;
import org.junit.jupiter.api.Test;

import java.io.IOException;
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
}
