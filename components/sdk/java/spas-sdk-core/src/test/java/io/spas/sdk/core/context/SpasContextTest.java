package io.spas.sdk.core.context;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class SpasContextTest {
    
    @AfterEach
    void cleanup() {
        SpasContext.clear();
    }
    
    @Test
    void current_shouldReturnNullWhenNotSet() {
        assertNull(SpasContext.current());
    }
    
    @Test
    void setCurrent_shouldSetContextForCurrentThread() {
        SpasContext context = SpasContext.builder()
            .correlationId("test-correlation-id")
            .build();
        
        SpasContext.setCurrent(context);
        
        assertEquals(context, SpasContext.current());
    }
    
    @Test
    void clear_shouldRemoveCurrentContext() {
        SpasContext context = SpasContext.builder()
            .correlationId("test-correlation-id")
            .build();
        SpasContext.setCurrent(context);
        
        SpasContext.clear();
        
        assertNull(SpasContext.current());
    }
    
    @Test
    void builder_shouldAutoGenerateCorrelationId() {
        SpasContext context = SpasContext.builder().build();
        
        assertNotNull(context.getCorrelationId());
        assertFalse(context.getCorrelationId().isEmpty());
    }
    
    @Test
    void builder_shouldUseProvidedCorrelationId() {
        SpasContext context = SpasContext.builder()
            .correlationId("my-correlation-id")
            .build();
        
        assertEquals("my-correlation-id", context.getCorrelationId());
    }
    
    @Test
    void builder_shouldSupportUserId() {
        SpasContext context = SpasContext.builder()
            .userId("user123")
            .build();
        
        assertTrue(context.getUserId().isPresent());
        assertEquals("user123", context.getUserId().get());
    }
    
    @Test
    void builder_shouldSupportTenantId() {
        SpasContext context = SpasContext.builder()
            .tenantId("tenant456")
            .build();
        
        assertTrue(context.getTenantId().isPresent());
        assertEquals("tenant456", context.getTenantId().get());
    }
    
    @Test
    void getUserId_shouldReturnEmptyWhenNotSet() {
        SpasContext context = SpasContext.builder().build();
        
        assertTrue(context.getUserId().isEmpty());
    }
    
    @Test
    void getTenantId_shouldReturnEmptyWhenNotSet() {
        SpasContext context = SpasContext.builder().build();
        
        assertTrue(context.getTenantId().isEmpty());
    }
    
    @Test
    void wrap_runnable_shouldPropagateContext() {
        SpasContext context = SpasContext.builder()
            .correlationId("original-id")
            .build();
        SpasContext.setCurrent(context);
        
        AtomicReference<String> capturedId = new AtomicReference<>();
        Runnable wrapped = SpasContext.wrap(() -> {
            capturedId.set(SpasContext.current().getCorrelationId());
        });
        
        SpasContext.clear();  // Clear context before running
        wrapped.run();
        
        assertEquals("original-id", capturedId.get());
    }
    
    @Test
    void wrap_callable_shouldPropagateContext() throws Exception {
        SpasContext context = SpasContext.builder()
            .correlationId("original-id")
            .build();
        SpasContext.setCurrent(context);
        
        Callable<String> callable = () -> SpasContext.current().getCorrelationId();
        Callable<String> wrapped = SpasContext.wrap(callable);
        
        SpasContext.clear();  // Clear context before running
        String result = wrapped.call();
        
        assertEquals("original-id", result);
    }
    
    @Test
    void wrap_supplier_shouldPropagateContext() {
        SpasContext context = SpasContext.builder()
            .correlationId("original-id")
            .build();
        SpasContext.setCurrent(context);
        
        java.util.function.Supplier<String> supplier = () -> SpasContext.current().getCorrelationId();
        java.util.function.Supplier<String> wrapped = SpasContext.wrap(supplier);
        
        SpasContext.clear();  // Clear context before running
        String result = wrapped.get();
        
        assertEquals("original-id", result);
    }
    
    @Test
    void wrap_shouldRestorePreviousContext() {
        SpasContext outerContext = SpasContext.builder()
            .correlationId("outer-id")
            .build();
        SpasContext.setCurrent(outerContext);
        
        SpasContext innerContext = SpasContext.builder()
            .correlationId("inner-id")
            .build();
        
        Runnable wrapped = SpasContext.wrap(() -> {
            SpasContext.setCurrent(innerContext);
        });
        
        wrapped.run();
        
        // Outer context should be restored
        assertEquals("outer-id", SpasContext.current().getCorrelationId());
    }
}
