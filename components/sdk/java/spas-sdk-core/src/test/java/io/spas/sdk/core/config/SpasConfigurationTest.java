package io.spas.sdk.core.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;

class SpasConfigurationTest {

    @Test
    void constructor_shouldDefaultServiceNameWhenServiceNameIsNull() {
        SpasConfiguration config = new SpasConfiguration(null, null, null, null);

        assertEquals("unknown-service", config.getServiceName());
        assertEquals(URI.create("http://localhost:7000"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldIgnoreSidecarPortWhenServiceNameMissing() {
        SpasConfiguration config = new SpasConfiguration(null, null, null, "9000");

        assertEquals("unknown-service", config.getServiceName());
        assertEquals(URI.create("http://localhost:7000"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldDefaultServiceNameWhenServiceNameIsEmpty() {
        SpasConfiguration config = new SpasConfiguration("  ", null, null, null);

        assertEquals("unknown-service", config.getServiceName());
        assertEquals(URI.create("http://localhost:7000"), config.getSidecarUrl());
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
        assertEquals(URI.create("http://my-service-sidecar:7000"), config.getSidecarUrl());
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
        
        assertEquals(URI.create("http://custom-host:7000"), config.getSidecarUrl());
    }

    @Test
    void constructor_shouldUseDefaultHostWhenOnlyPortSet() {
        SpasConfiguration config = new SpasConfiguration(
            "my-service",
            null,
            null,
            "5000"
        );
        
        assertEquals(URI.create("http://my-service-sidecar:5000"), config.getSidecarUrl());
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
        
        assertEquals(URI.create("http://my-service-sidecar:7000"), config.getSidecarUrl());
    }

    @Test
    void toString_shouldContainServiceNameAndUrl() {
        SpasConfiguration config = new SpasConfiguration("my-service", null, null, null);
        String result = config.toString();
        
        assertTrue(result.contains("my-service"));
        assertTrue(result.contains("http://my-service-sidecar:7000"));
    }

    @ParameterizedTest
    @CsvSource({
        "Order_Service,http://order-service-sidecar:7000",
        "My Service,http://my-service-sidecar:7000",
        "INVENTORY-SERVICE,http://inventory-service-sidecar:7000",
        "api,http://api-sidecar:7000",
        "Product__Service,http://product-service-sidecar:7000",
        "  spaced  ,http://spaced-sidecar:7000"
    })
    void constructor_shouldNormalizeServiceNameForDerivedSidecarHost(String serviceName, String expectedUrl) {
        SpasConfiguration config = new SpasConfiguration(serviceName, null, null, null);
        assertEquals(URI.create(expectedUrl), config.getSidecarUrl());
    }

    @Test
    void getSidecarUrl_shouldReturnImmutableUri() {
        SpasConfiguration config = new SpasConfiguration("my-service", "http://example.com", null, null);
        URI url1 = config.getSidecarUrl();
        URI url2 = config.getSidecarUrl();
        
        assertEquals(url1, url2);
    }
}
