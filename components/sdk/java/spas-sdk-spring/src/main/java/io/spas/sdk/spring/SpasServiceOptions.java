package io.spas.sdk.spring;

import io.spas.sdk.metadata.model.Consistency;
import io.spas.sdk.metadata.model.Network;
import io.spas.sdk.metadata.model.Security;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Optional overrides used when generating runtime SPAS metadata.
 * <p>
 * Values not set here fall back to {@code @SpasService} annotation values
 * or SDK defaults.
 */
public final class SpasServiceOptions {

    private String serviceId;
    private String serviceName;
    private String version;
    private String boundedContext;
    private String description;
    private final List<String> capabilities = new ArrayList<>();

    private Consistency consistency;
    private Security security;
    private Network network;
    private String license;

    private String basePackage;

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getBoundedContext() {
        return boundedContext;
    }

    public void setBoundedContext(String boundedContext) {
        this.boundedContext = boundedContext;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getCapabilities() {
        return Collections.unmodifiableList(capabilities);
    }

    public void addCapability(String capability) {
        if (capability == null || capability.isBlank()) {
            return;
        }
        capabilities.add(capability);
    }

    public Consistency getConsistency() {
        return consistency;
    }

    public void setConsistency(Consistency consistency) {
        this.consistency = consistency;
    }

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    public Network getNetwork() {
        return network;
    }

    public void setNetwork(Network network) {
        this.network = network;
    }

    public String getLicense() {
        return license;
    }

    public void setLicense(String license) {
        this.license = license;
    }

    /**
     * Overrides the base package used for runtime classpath scanning.
     * If not set, the SDK attempts to infer it.
     */
    public String getBasePackage() {
        return basePackage;
    }

    public void setBasePackage(String basePackage) {
        this.basePackage = basePackage;
    }
}
