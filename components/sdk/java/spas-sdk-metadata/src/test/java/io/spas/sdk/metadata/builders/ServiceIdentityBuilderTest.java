package io.spas.sdk.metadata.builders;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ServiceIdentityBuilderTest {
    
    @Test
    void build_shouldCreateServiceIdentityWithRequiredFields() {
        var identity = ServiceIdentityBuilder.create()
            .withId("order-service")
            .withName("Order Service")
            .withVersion("1.0.0")
            .withBoundedContext("orders")
            .build();
        
        assertEquals("order-service", identity.id());
        assertEquals("Order Service", identity.name());
        assertEquals("1.0.0", identity.version());
        assertEquals("orders", identity.boundedContext());
        assertNull(identity.description());
        assertNull(identity.capabilities());
        assertNull(identity.license());
    }
    
    @Test
    void build_shouldIncludeOptionalFields() {
        var identity = ServiceIdentityBuilder.create()
            .withId("order-service")
            .withName("Order Service")
            .withVersion("1.0.0")
            .withBoundedContext("orders")
            .withDescription("Manages customer orders")
            .addCapability("order-management")
            .addCapability("inventory-tracking")
            .withLicense("MIT")
            .build();
        
        assertEquals("Manages customer orders", identity.description());
        assertEquals(List.of("order-management", "inventory-tracking"), identity.capabilities());
        assertEquals("MIT", identity.license());
    }
    
    @Test
    void build_shouldThrowWhenIdMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            ServiceIdentityBuilder.create()
                .withName("Order Service")
                .withVersion("1.0.0")
                .withBoundedContext("orders")
                .build());
    }
    
    @Test
    void build_shouldThrowWhenNameMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            ServiceIdentityBuilder.create()
                .withId("order-service")
                .withVersion("1.0.0")
                .withBoundedContext("orders")
                .build());
    }
    
    @Test
    void build_shouldThrowWhenVersionMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            ServiceIdentityBuilder.create()
                .withId("order-service")
                .withName("Order Service")
                .withBoundedContext("orders")
                .build());
    }
    
    @Test
    void build_shouldThrowWhenBoundedContextMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            ServiceIdentityBuilder.create()
                .withId("order-service")
                .withName("Order Service")
                .withVersion("1.0.0")
                .build());
    }
    
    @Test
    void addCapability_shouldAddMultipleCapabilities() {
        var identity = ServiceIdentityBuilder.create()
            .withId("order-service")
            .withName("Order Service")
            .withVersion("1.0.0")
            .withBoundedContext("orders")
            .addCapability("capability1")
            .addCapability("capability2")
            .addCapability("capability3")
            .build();
        
        assertEquals(3, identity.capabilities().size());
        assertTrue(identity.capabilities().contains("capability1"));
        assertTrue(identity.capabilities().contains("capability2"));
        assertTrue(identity.capabilities().contains("capability3"));
    }
}
