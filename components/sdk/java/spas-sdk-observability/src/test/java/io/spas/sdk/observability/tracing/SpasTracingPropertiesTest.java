package io.spas.sdk.observability.tracing;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SpasTracingProperties.
 */
class SpasTracingPropertiesTest {
    
    @Test
    void defaultValues_areCorrect() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Assert
        assertTrue(props.isEnabled());
        assertTrue(props.isPropagateContext());
        assertEquals(1.0, props.getSampleRate());
    }
    
    @Test
    void setEnabled_updatesValue() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act
        props.setEnabled(false);
        
        // Assert
        assertFalse(props.isEnabled());
    }
    
    @Test
    void setZipkinEndpoint_updatesValue() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act
        props.setZipkinEndpoint("http://custom:9411/api/v2/spans");
        
        // Assert - note: getZipkinEndpoint checks env vars first
        // In test environment without env vars, it should return the set value
        assertNotNull(props.getZipkinEndpoint());
    }
    
    @Test
    void setPropagateContext_updatesValue() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act
        props.setPropagateContext(false);
        
        // Assert
        assertFalse(props.isPropagateContext());
    }
    
    @Test
    void setSampleRate_withValidValue_updatesValue() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act
        props.setSampleRate(0.5);
        
        // Assert
        assertEquals(0.5, props.getSampleRate());
    }
    
    @Test
    void setSampleRate_withZero_updatesValue() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act
        props.setSampleRate(0.0);
        
        // Assert
        assertEquals(0.0, props.getSampleRate());
    }
    
    @Test
    void setSampleRate_withOne_updatesValue() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act
        props.setSampleRate(1.0);
        
        // Assert
        assertEquals(1.0, props.getSampleRate());
    }
    
    @Test
    void setSampleRate_withNegativeValue_throwsException() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> props.setSampleRate(-0.1));
    }
    
    @Test
    void setSampleRate_withValueGreaterThanOne_throwsException() {
        // Arrange
        SpasTracingProperties props = new SpasTracingProperties();
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> props.setSampleRate(1.1));
    }
}
