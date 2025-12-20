package io.spas.sdk.events;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.core.context.SpasTrace;
import io.spas.sdk.metadata.annotations.SpasEvent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;

class EventPublisherTest {
    
    private WireMockServer wireMockServer;
    private EventPublisher eventPublisher;
    
    @SpasEvent(type = "TestEvent", version = "1.0.0", schemaRef = "test.json")
    static class TestEvent {
        public String message;
        
        public TestEvent(String message) {
            this.message = message;
        }
    }
    
    static class UnannotatedEvent {
        public String message;
    }
    
    @BeforeEach
    void setup() {
        // Start WireMock server
        wireMockServer = new WireMockServer(8089);
        wireMockServer.start();
        WireMock.configureFor("localhost", 8089);
        
        // Configure EventPublisher
        EventPublisherConfig config = EventPublisherConfig.builder()
            .sidecarUrl("http://localhost:8089")
            .timeout(Duration.ofSeconds(5))
            .build();
        eventPublisher = new EventPublisher(config, "test-service");
    }
    
    @AfterEach
    void teardown() {
        wireMockServer.stop();
        SpasContext.clear();
        SpasTrace.clear();
    }
    
    @Test
    void publish_shouldSendEventToSidecar() {
        stubFor(post(urlEqualTo("/publish"))
            .willReturn(aResponse().withStatus(202)));
        
        TestEvent event = new TestEvent("test message");
        
        eventPublisher.publish(event);
        
        verify(postRequestedFor(urlEqualTo("/publish"))
            .withHeader("Content-Type", equalTo("application/json"))
            .withHeader("x-service-name", equalTo("test-service"))
            .withHeader("x-event-name", equalTo("test-event"))
            .withRequestBody(containing("\"message\":\"test message\"")));
    }
    
    @Test
    void publish_shouldIncludeTraceContext() {
        stubFor(post(urlEqualTo("/publish"))
            .willReturn(aResponse().withStatus(202)));
        
        SpasTrace trace = SpasTrace.builder()
            .traceId("0af7651916cd43dd8448eb211c80319c")
            .spanId("b7ad6b7169203331")
            .traceFlags("01")
            .build();
        SpasTrace.setCurrent(trace);
        
        TestEvent event = new TestEvent("test message");
        
        eventPublisher.publish(event);
        
        verify(postRequestedFor(urlEqualTo("/publish"))
            .withHeader("traceparent", equalTo("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01")));
    }
    
    @Test
    void publish_shouldIncludeCorrelationContext() {
        stubFor(post(urlEqualTo("/publish"))
            .willReturn(aResponse().withStatus(202)));
        
        SpasContext context = SpasContext.builder()
            .correlationId("test-correlation-id")
            .userId("user123")
            .tenantId("tenant456")
            .build();
        SpasContext.setCurrent(context);
        
        TestEvent event = new TestEvent("test message");
        
        eventPublisher.publish(event);
        
        verify(postRequestedFor(urlEqualTo("/publish"))
            .withHeader("x-correlation-id", equalTo("test-correlation-id"))
            .withHeader("x-user-id", equalTo("user123"))
            .withHeader("x-tenant-id", equalTo("tenant456")));
    }
    
    @Test
    void publish_shouldThrowWhenEventLacksAnnotation() {
        UnannotatedEvent event = new UnannotatedEvent();
        event.message = "test";
        
        EventAnnotationMissingException exception = assertThrows(
            EventAnnotationMissingException.class, 
            () -> eventPublisher.publish(event));
        
        assertTrue(exception.getMessage().contains("UnannotatedEvent"));
        assertTrue(exception.getMessage().contains("@SpasEvent"));
    }
    
    @Test
    void publish_shouldThrowWhenSidecarUnavailable() {
        wireMockServer.stop();  // Stop the server to simulate unavailability
        
        TestEvent event = new TestEvent("test message");
        
        assertThrows(SidecarUnavailableException.class, 
            () -> eventPublisher.publish(event));
    }
    
    @Test
    void publish_shouldThrowWhenSidecarReturnsError() {
        stubFor(post(urlEqualTo("/publish"))
            .willReturn(aResponse().withStatus(500).withBody("Internal Server Error")));
        
        TestEvent event = new TestEvent("test message");
        
        SpasPublishException exception = assertThrows(
            SpasPublishException.class, 
            () -> eventPublisher.publish(event));
        
        assertTrue(exception.getMessage().contains("500"));
    }
    
    @Test
    void publish_shouldConvertEventNameToKebabCase() {
        stubFor(post(urlEqualTo("/publish"))
            .willReturn(aResponse().withStatus(202)));
        
        TestEvent event = new TestEvent("test message");
        
        eventPublisher.publish(event);
        
        verify(postRequestedFor(urlEqualTo("/publish"))
            .withHeader("x-event-name", equalTo("test-event")));
    }
}
