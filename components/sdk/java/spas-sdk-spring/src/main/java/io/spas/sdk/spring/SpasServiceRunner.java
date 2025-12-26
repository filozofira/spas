package io.spas.sdk.spring;

import io.spas.sdk.metadata.generation.MetadataGenerationConstants;

import org.springframework.boot.SpringApplication;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Objects;
import java.util.function.Consumer;

/**
 * Entry-point helper for Spring Boot services.
 * <p>
 * If {@code --generate-metadata} is present, generates the SPAS metadata archive and returns.
 * Otherwise starts the Spring Boot application.
 */
public final class SpasServiceRunner {

    private SpasServiceRunner() {
    }

    public static void run(Class<?> applicationClass, String[] args, Consumer<SpasServiceOptions> configureOptions) {
        Objects.requireNonNull(applicationClass, "applicationClass");

        if (SpasServiceRunnerArgs.isGenerateMetadata(args)) {
            SpasServiceOptions options = new SpasServiceOptions();
            if (configureOptions != null) {
                configureOptions.accept(options);
            }

            Path outputDir = SpasServiceRunnerArgs.getOutputDirectory(args);

            SpasMetadataArchiveGenerator generator = new SpasMetadataArchiveGenerator();
            try {
                generator.writeArchive(outputDir, options);
            } catch (IOException e) {
                throw new IllegalStateException("Failed to write metadata archive", e);
            }

            return;
        }

        SpringApplication.run(applicationClass, args);
    }

    private static final class SpasServiceRunnerArgs {

        private SpasServiceRunnerArgs() {
        }

        static boolean isGenerateMetadata(String[] args) {
            if (args == null) {
                return false;
            }

            for (String arg : args) {
                if ("--generate-metadata".equals(arg)) {
                    return true;
                }
            }

            return false;
        }

        static Path getOutputDirectory(String[] args) {
            if (args == null) {
                return null;
            }

            for (int i = 0; i < args.length; i++) {
                String arg = args[i];
                if (arg == null) {
                    continue;
                }

                if (arg.startsWith("--output=")) {
                    String value = arg.substring("--output=".length());
                    return value.isBlank() ? null : Path.of(value);
                }

                if ("--output".equals(arg) && i + 1 < args.length) {
                    String value = args[i + 1];
                    return (value == null || value.isBlank()) ? null : Path.of(value);
                }

                // Support the existing system property shape too.
                if (arg.startsWith("-D" + MetadataGenerationConstants.OUTPUT_DIRECTORY_PROPERTY + "=")) {
                    String value = arg.substring(("-D" + MetadataGenerationConstants.OUTPUT_DIRECTORY_PROPERTY + "=").length());
                    return value.isBlank() ? null : Path.of(value);
                }
            }

            return null;
        }
    }
}
