package io.spas.sdk.metadata.builders;

import java.util.ArrayList;
import java.util.List;

/**
 * Fluent builder for service identity metadata.
 */
public final class ServiceIdentityBuilder {
    private String id;
    private String name;
    private String version;
    private String boundedContext;
    private String description;
    private final List<String> capabilities = new ArrayList<>();
    private String license;
    
    private ServiceIdentityBuilder() {}
    
    public static ServiceIdentityBuilder create() {
        return new ServiceIdentityBuilder();
    }
    
    public ServiceIdentityBuilder withId(String id) {
        this.id = id;
        return this;
    }
    
    public ServiceIdentityBuilder withName(String name) {
        this.name = name;
        return this;
    }
    
    public ServiceIdentityBuilder withVersion(String version) {
        this.version = version;
        return this;
    }
    
    public ServiceIdentityBuilder withBoundedContext(String boundedContext) {
        this.boundedContext = boundedContext;
        return this;
    }
    
    public ServiceIdentityBuilder withDescription(String description) {
        this.description = description;
        return this;
    }
    
    /**
     * Adds a capability to the service identity.
     * 
     * @param capability the capability identifier (e.g., "order-management")
     * @return this builder for method chaining
     * @deprecated Capabilities are automatically discovered from the {@code capabilities}
     *             attribute in {@link io.spas.sdk.metadata.annotations.SpasService} annotation.
     *             Manual capability registration is no longer necessary.
     *             This method will be removed in version 2.0.0.
     * @see io.spas.sdk.metadata.annotations.SpasService
     */
    @Deprecated(since = "1.1.0", forRemoval = true)
    public ServiceIdentityBuilder addCapability(String capability) {
        this.capabilities.add(capability);
        return this;
    }
    
    public ServiceIdentityBuilder withLicense(String license) {
        this.license = license;
        return this;
    }
    
    public ServiceIdentity build() {
        if (id == null || id.isEmpty()) {
            throw new IllegalArgumentException("id is required");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name is required");
        }
        if (version == null || version.isEmpty()) {
            throw new IllegalArgumentException("version is required");
        }
        if (boundedContext == null || boundedContext.isEmpty()) {
            throw new IllegalArgumentException("boundedContext is required");
        }
        
        String normalizedDescription = (description == null || description.isBlank()) ? null : description;
        String normalizedLicense = (license == null || license.isBlank()) ? null : license;

        return new ServiceIdentity(
            id,
            name,
            version,
            boundedContext,
            normalizedDescription,
            capabilities.isEmpty() ? null : new ArrayList<>(capabilities),
            normalizedLicense
        );
    }
    
    /**
     * Simple record to hold service identity data.
     */
    public record ServiceIdentity(
        String id,
        String name,
        String version,
        String boundedContext,
        String description,
        List<String> capabilities,
        String license
    ) {}
}
