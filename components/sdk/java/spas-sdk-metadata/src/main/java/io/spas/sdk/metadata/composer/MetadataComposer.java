package io.spas.sdk.metadata.composer;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.spas.sdk.metadata.JacksonConfiguration;
import io.spas.sdk.metadata.builders.ServiceIdentityBuilder;
import io.spas.sdk.metadata.model.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Composes ServiceMetadata programmatically from individual components.
 * Alternative to annotation-based metadata generation.
 */
public final class MetadataComposer {
    private static final String SCHEMA_VERSION = "design-time-metadata-v1";
    private static final ObjectMapper MAPPER = JacksonConfiguration.getObjectMapper();
    
    private ServiceIdentityBuilder.ServiceIdentity identity;
    private List<EndpointContract> endpoints;
    private List<EventContract> events;
    private Security security;
    private Consistency consistency;
    private Network network;
    
    private MetadataComposer() {}
    
    public static MetadataComposer create() {
        return new MetadataComposer();
    }
    
    public MetadataComposer withIdentity(ServiceIdentityBuilder.ServiceIdentity identity) {
        this.identity = identity;
        return this;
    }
    
    public MetadataComposer withEndpoints(List<EndpointContract> endpoints) {
        this.endpoints = endpoints != null ? new ArrayList<>(endpoints) : null;
        return this;
    }
    
    public MetadataComposer withEvents(List<EventContract> events) {
        this.events = events != null ? new ArrayList<>(events) : null;
        return this;
    }
    
    public MetadataComposer withSecurity(Security security) {
        this.security = security;
        return this;
    }
    
    public MetadataComposer withConsistency(Consistency consistency) {
        this.consistency = consistency;
        return this;
    }
    
    public MetadataComposer withNetwork(Network network) {
        this.network = network;
        return this;
    }
    
    public ServiceMetadata compose() {
        if (identity == null) {
            throw new IllegalStateException("ServiceIdentity is required");
        }
        
        return new ServiceMetadata(
            SCHEMA_VERSION,
            identity.id(),
            identity.name(),
            identity.description(),
            identity.version(),
            identity.boundedContext(),
            identity.capabilities(),
            endpoints,
            events,
            consistency,
            security,
            network,
            identity.license()
        );
    }
    
    /**
     * Convenience method to compose and serialize to JSON.
     * 
     * @return JSON representation of the service metadata
     * @throws RuntimeException if serialization fails
     */
    public String composeJson() {
        try {
            return MAPPER.writerWithDefaultPrettyPrinter()
                .writeValueAsString(compose());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize metadata to JSON", e);
        }
    }
}
