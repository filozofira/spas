package io.spas.sdk.metadata.composer;

import io.spas.sdk.metadata.builders.*;
import io.spas.sdk.metadata.model.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MetadataComposerTest {
    
    @Test
    void compose_shouldRequireIdentity() {
        MetadataComposer composer = MetadataComposer.create();
        
        assertThrows(IllegalStateException.class, composer::compose);
    }
    
    @Test
    void compose_shouldCreateMetadataWithIdentityOnly() {
        var identity = ServiceIdentityBuilder.create()
            .withId("test-service")
            .withName("Test Service")
            .withVersion("1.0.0")
            .withBoundedContext("test")
            .build();
        
        ServiceMetadata metadata = MetadataComposer.create()
            .withIdentity(identity)
            .compose();
        
        assertEquals("design-time-metadata-v1", metadata.schemaVersion());
        assertEquals("test-service", metadata.id());
        assertEquals("Test Service", metadata.name());
        assertEquals("1.0.0", metadata.version());
        assertEquals("test", metadata.boundedContext());
        assertNull(metadata.endpoints());
        assertNull(metadata.events());
        assertNull(metadata.security());
        assertNull(metadata.consistency());
        assertNull(metadata.network());
    }
    
    @Test
    void compose_shouldIncludeAllComponents() {
        var identity = ServiceIdentityBuilder.create()
            .withId("order-service")
            .withName("Order Service")
            .withVersion("1.0.0")
            .withBoundedContext("orders")
            .withDescription("Order management service")
            .addCapability("order-processing")
            .withLicense("MIT")
            .build();
        
        var endpoint = new EndpointContract(
            "create-order",
            EndpointType.COMMAND,
            Protocol.HTTP,
            "POST /orders",
            "1.0.0",
            "schemas/create-order.json",
            null
        );
        
        var event = new EventContract(
            "order-created",
            "1.0.0",
            "schemas/order-created.json",
            null
        );
        
        var security = SecurityBuilder.create()
            .withAuthenticationType(AuthType.OAUTH2)
            .addRequiredScope("orders:write")
            .addDataClassification(DataClassification.CONFIDENTIAL)
            .build();
        
        var consistency = ConsistencyBuilder.create()
            .withCommands(ConsistencyLevel.ACID)
            .withQueries(QueryConsistencyLevel.STRONG)
            .build();
        
        var network = NetworkBuilder.create()
            .addRequiredEgress("payment-gateway.example.com")
            .build();
        
        ServiceMetadata metadata = MetadataComposer.create()
            .withIdentity(identity)
            .withEndpoints(List.of(endpoint))
            .withEvents(List.of(event))
            .withSecurity(security)
            .withConsistency(consistency)
            .withNetwork(network)
            .compose();
        
        assertEquals("order-service", metadata.id());
        assertEquals(1, metadata.endpoints().size());
        assertEquals("create-order", metadata.endpoints().get(0).name());
        assertEquals(1, metadata.events().size());
        assertEquals("order-created", metadata.events().get(0).type());
        assertNotNull(metadata.security());
        assertEquals(AuthType.OAUTH2, metadata.security().authentication().type());
        assertNotNull(metadata.consistency());
        assertEquals(ConsistencyLevel.ACID, metadata.consistency().commands());
        assertNotNull(metadata.network());
        assertEquals(1, metadata.network().requiredEgress().size());
    }
    
    @Test
    void composeJson_shouldSerializeToJsonWithCamelCase() {
        var identity = ServiceIdentityBuilder.create()
            .withId("test-service")
            .withName("Test Service")
            .withVersion("1.0.0")
            .withBoundedContext("test")
            .build();
        
        String json = MetadataComposer.create()
            .withIdentity(identity)
            .composeJson();
        
        assertTrue(json.contains("\"schemaVersion\""));
        assertTrue(json.contains("\"test-service\""));
        assertTrue(json.contains("\"Test Service\""));
        assertTrue(json.contains("\"1.0.0\""));
        assertTrue(json.contains("\"boundedContext\""));
        assertFalse(json.contains("schema-version"));  // Should be camelCase
        assertFalse(json.contains("bounded-context"));  // Should be camelCase
    }
    
    @Test
    void composeJson_shouldExcludeNullFields() {
        var identity = ServiceIdentityBuilder.create()
            .withId("test-service")
            .withName("Test Service")
            .withVersion("1.0.0")
            .withBoundedContext("test")
            .build();
        
        String json = MetadataComposer.create()
            .withIdentity(identity)
            .composeJson();
        
        assertFalse(json.contains("\"description\""));
        assertFalse(json.contains("\"capabilities\""));
        assertFalse(json.contains("\"endpoints\""));
        assertFalse(json.contains("\"events\""));
        assertFalse(json.contains("\"security\""));
    }
}
