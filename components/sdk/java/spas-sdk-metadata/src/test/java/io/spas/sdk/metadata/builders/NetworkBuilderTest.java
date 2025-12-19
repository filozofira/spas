package io.spas.sdk.metadata.builders;

import io.spas.sdk.metadata.model.Network;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class NetworkBuilderTest {
    
    @Test
    void build_shouldCreateEmptyNetwork() {
        Network network = NetworkBuilder.create().build();
        
        assertNull(network.requiredEgress());
    }
    
    @Test
    void build_shouldIncludeRequiredEgress() {
        Network network = NetworkBuilder.create()
            .addRequiredEgress("payment-gateway.example.com")
            .addRequiredEgress("inventory-service.internal")
            .build();
        
        assertEquals(List.of("payment-gateway.example.com", "inventory-service.internal"), 
            network.requiredEgress());
    }
    
    @Test
    void addRequiredEgress_shouldAddMultipleDependencies() {
        Network network = NetworkBuilder.create()
            .addRequiredEgress("dep1")
            .addRequiredEgress("dep2")
            .addRequiredEgress("dep3")
            .build();
        
        assertEquals(3, network.requiredEgress().size());
        assertTrue(network.requiredEgress().contains("dep1"));
        assertTrue(network.requiredEgress().contains("dep2"));
        assertTrue(network.requiredEgress().contains("dep3"));
    }
}
