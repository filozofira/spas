package io.spas.sdk.metadata.builders;

import io.spas.sdk.metadata.model.Network;

import java.util.ArrayList;
import java.util.List;

/**
 * Fluent builder for network metadata.
 */
public final class NetworkBuilder {
    private final List<String> requiredEgress = new ArrayList<>();
    
    private NetworkBuilder() {}
    
    public static NetworkBuilder create() {
        return new NetworkBuilder();
    }
    
    public NetworkBuilder addRequiredEgress(String dependency) {
        this.requiredEgress.add(dependency);
        return this;
    }
    
    public Network build() {
        return new Network(requiredEgress.isEmpty() ? null : new ArrayList<>(requiredEgress));
    }
}
