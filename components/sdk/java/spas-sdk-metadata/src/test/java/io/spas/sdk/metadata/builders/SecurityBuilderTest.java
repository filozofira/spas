package io.spas.sdk.metadata.builders;

import io.spas.sdk.metadata.model.AuthType;
import io.spas.sdk.metadata.model.DataClassification;
import io.spas.sdk.metadata.model.Security;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SecurityBuilderTest {
    
    @Test
    void build_shouldCreateEmptySecurity() {
        Security security = SecurityBuilder.create().build();
        
        assertNull(security.authentication());
        assertNull(security.dataClassification());
    }
    
    @Test
    void build_shouldIncludeAuthentication() {
        Security security = SecurityBuilder.create()
            .withAuthenticationType(AuthType.OAUTH2)
            .addRequiredScope("read:orders")
            .addRequiredScope("write:orders")
            .build();
        
        assertNotNull(security.authentication());
        assertEquals(AuthType.OAUTH2, security.authentication().type());
        assertEquals(List.of("read:orders", "write:orders"), security.authentication().requiredScopes());
    }
    
    @Test
    void build_shouldIncludeDataClassification() {
        Security security = SecurityBuilder.create()
            .addDataClassification(DataClassification.CONFIDENTIAL)
            .build();
        
        assertEquals(List.of(DataClassification.CONFIDENTIAL), security.dataClassification());
    }
    
    @Test
    void build_shouldCombineAuthenticationAndClassification() {
        Security security = SecurityBuilder.create()
            .withAuthenticationType(AuthType.JWT)
            .addRequiredScope("admin")
            .addDataClassification(DataClassification.RESTRICTED)
            .build();
        
        assertNotNull(security.authentication());
        assertEquals(AuthType.JWT, security.authentication().type());
        assertEquals(List.of("admin"), security.authentication().requiredScopes());
        assertEquals(List.of(DataClassification.RESTRICTED), security.dataClassification());
    }
    
    @Test
    void addRequiredScope_shouldAddMultipleScopes() {
        Security security = SecurityBuilder.create()
            .withAuthenticationType(AuthType.API_KEY)
            .addRequiredScope("scope1")
            .addRequiredScope("scope2")
            .addRequiredScope("scope3")
            .build();
        
        assertEquals(3, security.authentication().requiredScopes().size());
        assertTrue(security.authentication().requiredScopes().contains("scope1"));
        assertTrue(security.authentication().requiredScopes().contains("scope2"));
        assertTrue(security.authentication().requiredScopes().contains("scope3"));
    }
}
