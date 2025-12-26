package io.spas.sdk.spring;

import io.spas.sdk.metadata.generation.MetadataGenerationConstants;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.LinkedHashMap;
import java.util.Map;

public final class SpasGenerateMetadataEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "spasGenerateMetadataOverrides";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String enabled = environment.getProperty(MetadataGenerationConstants.GENERATE_METADATA_PROPERTY);
        if (!"true".equalsIgnoreCase(enabled)) {
            return;
        }

        Map<String, Object> overrides = new LinkedHashMap<>();
        overrides.put("spring.main.web-application-type", "none");
        overrides.put("spas.tracing.enabled", "false");

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, overrides));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
