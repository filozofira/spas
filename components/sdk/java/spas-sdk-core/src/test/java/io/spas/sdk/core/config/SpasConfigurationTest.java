package io.spas.sdk.core.config;

import org.junit.jupiter.api.Test;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;

class SpasConfigurationTest {

    @Test
    void constructor_shouldThrowWhenServiceNameIsNull() {
        SpasConfigurationException exception = assertThrows(
            SpasConfigurationException.class,
            () -> new SpasConfiguration(null, null, null, null)
        );
        
        assertTrue(exception.getMessage().contains("SERVICE_NAME"));
        assertTrue(exception.getMessage().contains("required"));
    }

    @Test
    void constructor_shouldThrowWhenServiceNameIsEmpty() {
        SpasConfigurationException exception = assertThrows(
            SpasConfigurationException.class,
            () -> new SpasConfiguration("  ", null, null, null)
        );
        
        assertTrue(exception.getMessage().contains("SERVICE_NAME"));
    }

    @Test
    void constructor_shouldTrimServiceName() {
        SpasConfiguration config = new SpasConfiguration("  my-service  ", null, null, null);
        assertEquals("my-service", config.getServiceName());
    }

    @Test
    void constructor_shouldUseDefaultSidecarUrlWhenNoEnvVarsSet() {
        SpasConfiguration config = new SpasConfiguration("my-service", null, null, null);
        
        assertEquals("my-service", config.getServiceName());
        assertEquals(URI.create("http://localhost:3001"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldPrioritizeSidecarUrl() {
        SpasConfiguration config = new SpasConfiguration(
            "my-service",
            "http://sidecar.example.com:8080",
            "ignored-host",
            "9999"
        );
        
        assertEquals(URI.create("http://sidecar.example.com:8080"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldUseSidecarHostAndPortWhenUrlNotSet() {
        SpasConfiguration config = new SpasConfiguration(
            "my-service",
            null,
            "custom-host",
            "4000"
        );
        
        assertEquals(URI.create("http://custom-host:4000"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldUseDefaultPortWhenOnlyHostSet() {
        SpasConfiguration config = new SpasConfiguration(
            "my-service",
            null,
            "custom-host",
            null
        );
        
        assertEquals(URI.create("http://custom-host:3001"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldUseDefaultHostWhenOnlyPortSet() {
        SpasConfiguration config = new SpasConfiguration(
            "my-service",
            null,
            null,
            "5000"
        );
        
        assertEquals(URI.create("http://localhost:5000"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldThrowWhenSidecarUrlIsInvalid() {
        SpasConfigurationException exception = assertThrows(
            SpasConfigurationException.class,
            () -> new SpasConfiguration("my-service", "not a valid url", null, null)
        );
        
        assertTrue(exception.getMessage().contains("Invalid sidecar URL"));
    }

    @Test
    void constructor_shouldThrowWhenSidecarPortIsNotNumeric() {
        SpasConfigurationException exception = assertThrows(
            SpasConfigurationException.class,
            () -> new SpasConfiguration("my-service", null, "localhost", "not-a-number")
        );
        
        assertTrue(exception.getMessage().contains("Invalid SIDECAR_PORT"));
    }

    @Test
    void constructor_shouldHandleEmptyStringsSameAsNull() {
        SpasConfiguration config = new SpasConfiguration(
            "my-service",
            "  ",
            "  ",
            "  "
        );
        
        assertEquals(URI.create("http://localhost:3001"), config.getSidecarUrl());
    }

    @Test
    void toString_shouldContainServiceNameAndUrl() {
        SpasConfiguration config = new SpasConfiguration("my-service", null, null, null);
        String result = config.toString();
        
        assertTrue(result.contains("my-service"));
        assertTrue(result.contains("http://localhost:3001"));
    }

    @Test
    void getSidecarUrl_shouldReturnImmutableUri() {
        SpasConfiguration config = new SpasConfiguration("my-service", "http://example.com", null, null);
        URI url1 = config.getSidecarUrl();
        URI url2 = config.getSidecarUrl();
        
        assertEquals(url1, url2);
    }
}
