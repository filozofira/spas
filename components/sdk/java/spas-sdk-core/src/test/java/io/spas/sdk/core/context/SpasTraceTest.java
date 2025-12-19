package io.spas.sdk.core.context;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SpasTraceTest {
    
    @AfterEach
    void cleanup() {
        SpasTrace.clear();
    }
    
    @Test
    void parseTraceparent_shouldParseValidTraceparent() {
        String traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
        
        SpasTrace trace = SpasTrace.parseTraceparent(traceparent);
        
        assertEquals("0af7651916cd43dd8448eb211c80319c", trace.getTraceId());
        assertEquals("b7ad6b7169203331", trace.getSpanId());
        assertEquals("01", trace.getTraceFlags());
        assertTrue(trace.getTraceState().isEmpty());
    }
    
    @Test
    void parseTraceparent_shouldThrowOnNullInput() {
        assertThrows(IllegalArgumentException.class, () -> SpasTrace.parseTraceparent(null));
    }
    
    @Test
    void parseTraceparent_shouldThrowOnEmptyInput() {
        assertThrows(IllegalArgumentException.class, () -> SpasTrace.parseTraceparent(""));
    }
    
    @Test
    void parseTraceparent_shouldThrowOnInvalidFormat() {
        assertThrows(IllegalArgumentException.class, 
            () -> SpasTrace.parseTraceparent("invalid-format"));
    }
    
    @Test
    void generate_shouldCreateValidTrace() {
        SpasTrace trace = SpasTrace.generate();
        
        assertNotNull(trace.getTraceId());
        assertNotNull(trace.getSpanId());
        assertEquals("01", trace.getTraceFlags());  // sampled
        assertEquals(32, trace.getTraceId().length());
        assertEquals(16, trace.getSpanId().length());
    }
    
    @Test
    void toTraceparent_shouldSerializeCorrectly() {
        SpasTrace trace = SpasTrace.builder()
            .traceId("0af7651916cd43dd8448eb211c80319c")
            .spanId("b7ad6b7169203331")
            .traceFlags("01")
            .build();
        
        assertEquals("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01", 
            trace.toTraceparent());
    }
    
    @Test
    void current_shouldReturnNullWhenNotSet() {
        assertNull(SpasTrace.current());
    }
    
    @Test
    void setCurrent_shouldSetTraceForCurrentThread() {
        SpasTrace trace = SpasTrace.generate();
        
        SpasTrace.setCurrent(trace);
        
        assertEquals(trace, SpasTrace.current());
    }
    
    @Test
    void clear_shouldRemoveCurrentTrace() {
        SpasTrace trace = SpasTrace.generate();
        SpasTrace.setCurrent(trace);
        
        SpasTrace.clear();
        
        assertNull(SpasTrace.current());
    }
    
    @Test
    void builder_shouldRequireTraceId() {
        assertThrows(IllegalArgumentException.class, () -> 
            SpasTrace.builder()
                .spanId("b7ad6b7169203331")
                .traceFlags("01")
                .build());
    }
    
    @Test
    void builder_shouldRequireSpanId() {
        assertThrows(IllegalArgumentException.class, () -> 
            SpasTrace.builder()
                .traceId("0af7651916cd43dd8448eb211c80319c")
                .traceFlags("01")
                .build());
    }
    
    @Test
    void builder_shouldDefaultTraceFlags() {
        SpasTrace trace = SpasTrace.builder()
            .traceId("0af7651916cd43dd8448eb211c80319c")
            .spanId("b7ad6b7169203331")
            .build();
        
        assertEquals("00", trace.getTraceFlags());  // default: not sampled
    }
    
    @Test
    void builder_shouldSupportTraceState() {
        SpasTrace trace = SpasTrace.builder()
            .traceId("0af7651916cd43dd8448eb211c80319c")
            .spanId("b7ad6b7169203331")
            .traceFlags("01")
            .traceState("congo=t61rcWkgMzE")
            .build();
        
        assertTrue(trace.getTraceState().isPresent());
        assertEquals("congo=t61rcWkgMzE", trace.getTraceState().get());
    }
}
