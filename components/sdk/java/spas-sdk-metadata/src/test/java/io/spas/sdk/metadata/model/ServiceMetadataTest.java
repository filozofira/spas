package io.spas.sdk.metadata.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ServiceMetadataTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        // Use camelCase to match design-time-metadata-v1 schema
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE);
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    @Test
    void serviceMetadata_shouldSerializeToJson() throws Exception {
        ServiceMetadata metadata = new ServiceMetadata(
            "design-time-metadata-v1",
            "test-service",
            "Test Service",
            "A test service",
            "1.0.0",
            "testing",
            List.of("test-capability"),
            List.of(new EndpointContract(
                "test-command",
                EndpointType.COMMAND,
                Protocol.HTTP,
                "POST /api/test",
                "1.0.0",
                "schemas/endpoints/test.schema.json",
                null
            )),
            List.of(new EventContract(
                "test-event",
                "1.0.0",
                "schemas/events/test-event.schema.json",
                null
            )),
            new Consistency(ConsistencyLevel.ACID, QueryConsistencyLevel.STRONG),
            new Security(
                new Authentication(AuthType.OAUTH2, List.of("read", "write")),
                List.of(DataClassification.INTERNAL)
            ),
            new Network(List.of("http://api.example.com")),
            "MIT"
        );

        String json = objectMapper.writeValueAsString(metadata);

        assertTrue(json.contains("\"schemaVersion\":\"design-time-metadata-v1\""));
        assertTrue(json.contains("\"id\":\"test-service\""));
        assertTrue(json.contains("\"test-command\""));
        assertTrue(json.contains("\"test-event\""));
        assertTrue(json.contains("\"boundedContext\":\"testing\""));
    }

    @Test
    void serviceMetadata_shouldDeserializeFromJson() throws Exception {
        String json = """
            {
              "schemaVersion": "design-time-metadata-v1",
              "id": "test-service",
              "name": "Test Service",
              "version": "1.0.0",
              "boundedContext": "testing",
              "endpoints": [
                {
                  "name": "test-command",
                  "type": "Command",
                  "protocol": "Http",
                  "methodPath": "/api/test",
                  "version": "1.0.0",
                  "schemaRef": "schemas/endpoints/test.schema.json"
                }
              ],
              "events": [
                {
                  "type": "test-event",
                  "version": "1.0.0",
                  "schemaRef": "schemas/events/test-event.schema.json"
                }
              ],
              "consistency": {
                "commands": "ACID",
                "queries": "STRONG"
              },
              "security": {
                "authentication": {
                  "type": "JWT",
                  "requiredScopes": ["read"]
                },
                                "dataClassification": ["internal"]
              }
            }
            """;

        ServiceMetadata metadata = objectMapper.readValue(json, ServiceMetadata.class);

        assertEquals("design-time-metadata-v1", metadata.schemaVersion());
        assertEquals("test-service", metadata.id());
        assertEquals("Test Service", metadata.name());
        assertEquals("testing", metadata.boundedContext());
        assertEquals(1, metadata.endpoints().size());
        assertEquals("test-command", metadata.endpoints().get(0).name());
        assertEquals(EndpointType.COMMAND, metadata.endpoints().get(0).type());
    }

    @Test
    void endpointContract_shouldSerializeWithCamelCase() throws Exception {
        EndpointContract endpoint = new EndpointContract(
            "create-order",
            EndpointType.COMMAND,
            Protocol.HTTP,
            "/api/orders",
            "1.0.0",
            "schemas/endpoints/create-order.schema.json",
            null
        );

        String json = objectMapper.writeValueAsString(endpoint);

        assertTrue(json.contains("\"methodPath\":\"/api/orders\""));
        assertTrue(json.contains("\"schemaRef\":\"schemas/endpoints/create-order.schema.json\""));
    }

    @Test
    void eventContract_shouldSerializeWithCamelCase() throws Exception {
        EventContract event = new EventContract(
            "order-created",
            "1.0.0",
            "schemas/events/order-created.schema.json",
            null
        );

        String json = objectMapper.writeValueAsString(event);

        assertTrue(json.contains("\"schemaRef\":\"schemas/events/order-created.schema.json\""));
    }

    @Test
    void authentication_shouldSerializeWithCamelCase() throws Exception {
        Authentication auth = new Authentication(
            AuthType.OAUTH2,
            List.of("orders:read", "orders:write")
        );

        String json = objectMapper.writeValueAsString(auth);

        assertTrue(json.contains("\"requiredScopes\":[\"orders:read\",\"orders:write\"]"));
    }

    @Test
    void security_shouldSerializeWithCamelCase() throws Exception {
        Security security = new Security(
            new Authentication(AuthType.JWT, null),
            List.of(DataClassification.CONFIDENTIAL, DataClassification.INTERNAL)
        );

        String json = objectMapper.writeValueAsString(security);

        assertTrue(json.contains("\"dataClassification\":[\"confidential\",\"internal\"]"));
    }

    @Test
    void network_shouldSerializeWithCamelCase() throws Exception {
        Network network = new Network(
            List.of("http://orders-api.internal", "http://inventory-api.internal")
        );

        String json = objectMapper.writeValueAsString(network);

        assertTrue(json.contains("\"requiredEgress\""));
    }

    @Test
    void serviceMetadata_shouldHandleNullOptionalFields() throws Exception {
        ServiceMetadata metadata = new ServiceMetadata(
            "design-time-metadata-v1",
            "minimal-service",
            "Minimal",
            null,  // description
            "1.0.0",
            "test",
            null,  // capabilities
            null,  // endpoints
            null,  // events
            null,  // consistency
            new Security(null, List.of(DataClassification.PUBLIC)),
            null,  // network
            null   // license
        );

        String json = objectMapper.writeValueAsString(metadata);

        assertFalse(json.contains("description"));
        assertFalse(json.contains("capabilities"));
        assertFalse(json.contains("endpoints"));
        assertFalse(json.contains("events"));
        assertFalse(json.contains("consistency"));
    }
}
