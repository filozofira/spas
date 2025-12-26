package io.spas.sdk.spring.helpers;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class ZipAssert {
    private ZipAssert() {}

    public static Set<String> listEntryNames(byte[] zipBytes) throws IOException {
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

    public static Set<String> listEntryNames(Path zipPath) throws IOException {
        return listEntryNames(Files.readAllBytes(zipPath));
    }
}
