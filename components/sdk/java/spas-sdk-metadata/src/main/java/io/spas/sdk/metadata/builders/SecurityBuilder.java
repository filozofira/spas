package io.spas.sdk.metadata.builders;

import io.spas.sdk.metadata.model.Authentication;
import io.spas.sdk.metadata.model.AuthType;
import io.spas.sdk.metadata.model.DataClassification;
import io.spas.sdk.metadata.model.Security;

import java.util.ArrayList;
import java.util.List;

/**
 * Fluent builder for security metadata.
 */
public final class SecurityBuilder {
    private AuthType authenticationType;
    private final List<String> requiredScopes = new ArrayList<>();
    private List<DataClassification> dataClassification;
    
    private SecurityBuilder() {}
    
    public static SecurityBuilder create() {
        return new SecurityBuilder();
    }
    
    public SecurityBuilder withAuthenticationType(AuthType type) {
        this.authenticationType = type;
        return this;
    }
    
    public SecurityBuilder addRequiredScope(String scope) {
        this.requiredScopes.add(scope);
        return this;
    }
    
    public SecurityBuilder addDataClassification(DataClassification classification) {
        if (this.dataClassification == null) {
            this.dataClassification = new ArrayList<>();
        }
        this.dataClassification.add(classification);
        return this;
    }
    
    public Security build() {
        Authentication authentication = null;
        if (authenticationType != null || !requiredScopes.isEmpty()) {
            authentication = new Authentication(
                authenticationType,
                requiredScopes.isEmpty() ? null : new ArrayList<>(requiredScopes)
            );
        }
        
        return new Security(
            authentication, 
            dataClassification == null || dataClassification.isEmpty() ? null : dataClassification
        );
    }
}
