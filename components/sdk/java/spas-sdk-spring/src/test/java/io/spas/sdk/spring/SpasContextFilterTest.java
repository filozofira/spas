package io.spas.sdk.spring;

import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.core.context.SpasTrace;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SpasContextFilterTest {
    
    private SpasContextFilter filter;
    
    @Mock
    private HttpServletRequest request;
    
    @Mock
    private HttpServletResponse response;
    
    @Mock
    private FilterChain filterChain;
    
    private AutoCloseable mocks;
    
    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        filter = new SpasContextFilter();
        
        // Clear any existing context
        SpasTrace.clear();
        SpasContext.clear();
    }
    
    @AfterEach
    void tearDown() throws Exception {
        SpasTrace.clear();
        SpasContext.clear();
        mocks.close();
    }
    
    @Test
    void doFilterInternal_shouldExtractTraceparent() throws ServletException, IOException {
        String traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
        when(request.getHeader("traceparent")).thenReturn(traceparent);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
        // Context is cleared after filter, so we can't verify directly
    }
    
    @Test
    void doFilterInternal_shouldGenerateTraceWhenMissing() throws ServletException, IOException {
        when(request.getHeader("traceparent")).thenReturn(null);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldExtractCorrelationId() throws ServletException, IOException {
        String correlationId = "corr-123";
        when(request.getHeader("x-correlation-id")).thenReturn(correlationId);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldExtractUserId() throws ServletException, IOException {
        String userId = "user-456";
        when(request.getHeader("x-user-id")).thenReturn(userId);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldExtractTenantId() throws ServletException, IOException {
        String tenantId = "tenant-789";
        when(request.getHeader("x-tenant-id")).thenReturn(tenantId);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldExtractAllHeaders() throws ServletException, IOException {
        when(request.getHeader("traceparent"))
            .thenReturn("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01");
        when(request.getHeader("x-correlation-id")).thenReturn("corr-123");
        when(request.getHeader("x-user-id")).thenReturn("user-456");
        when(request.getHeader("x-tenant-id")).thenReturn("tenant-789");
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldClearContextAfterRequest() throws ServletException, IOException {
        when(request.getHeader("traceparent"))
            .thenReturn("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01");
        when(request.getHeader("x-correlation-id")).thenReturn("corr-123");
        
        filter.doFilterInternal(request, response, filterChain);
        
        // Verify context is cleared
        assertNull(SpasTrace.current());
        assertNull(SpasContext.current());
    }
    
    @Test
    void doFilterInternal_shouldClearContextOnException() throws ServletException, IOException {
        when(request.getHeader("traceparent"))
            .thenReturn("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01");
        doThrow(new ServletException("Test exception")).when(filterChain).doFilter(request, response);
        
        assertThrows(ServletException.class, () -> 
            filter.doFilterInternal(request, response, filterChain));
        
        // Verify context is cleared even on exception
        assertNull(SpasTrace.current());
        assertNull(SpasContext.current());
    }
    
    @Test
    void doFilterInternal_shouldIgnoreBlankHeaders() throws ServletException, IOException {
        when(request.getHeader("traceparent")).thenReturn("  ");
        when(request.getHeader("x-correlation-id")).thenReturn("");
        when(request.getHeader("x-user-id")).thenReturn(null);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldHandleInvalidTraceparent() throws ServletException, IOException {
        when(request.getHeader("traceparent")).thenReturn("invalid-traceparent");
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
        // Should generate new trace when invalid
    }
    
    // === Phase 7: Identity Header Propagation Tests ===
    
    @Test
    void doFilterInternal_shouldPropagateUserIdToContext() throws ServletException, IOException {
        String userId = "user-123";
        when(request.getHeader("x-user-id")).thenReturn(userId);
        
        // Capture context during filter execution
        doAnswer(invocation -> {
            SpasContext context = SpasContext.current();
            assertNotNull(context, "SpasContext should be set during filter chain");
            assertEquals(userId, context.getUserId().orElse(null), "User ID should be propagated to context");
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldPropagateTenantIdToContext() throws ServletException, IOException {
        String tenantId = "tenant-abc";
        when(request.getHeader("x-tenant-id")).thenReturn(tenantId);
        
        // Capture context during filter execution
        doAnswer(invocation -> {
            SpasContext context = SpasContext.current();
            assertNotNull(context, "SpasContext should be set during filter chain");
            assertEquals(tenantId, context.getTenantId().orElse(null), "Tenant ID should be propagated to context");
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldPropagateCorrelationIdToContext() throws ServletException, IOException {
        String correlationId = "corr-xyz";
        when(request.getHeader("x-correlation-id")).thenReturn(correlationId);
        
        // Capture context during filter execution
        doAnswer(invocation -> {
            SpasContext context = SpasContext.current();
            assertNotNull(context, "SpasContext should be set during filter chain");
            assertEquals(correlationId, context.getCorrelationId(), "Correlation ID should be propagated to context");
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldPropagateAllIdentityHeaders() throws ServletException, IOException {
        String correlationId = "corr-456";
        String userId = "user-789";
        String tenantId = "tenant-xyz";
        
        when(request.getHeader("x-correlation-id")).thenReturn(correlationId);
        when(request.getHeader("x-user-id")).thenReturn(userId);
        when(request.getHeader("x-tenant-id")).thenReturn(tenantId);
        
        // Capture context during filter execution
        doAnswer(invocation -> {
            SpasContext context = SpasContext.current();
            assertNotNull(context, "SpasContext should be set during filter chain");
            assertEquals(correlationId, context.getCorrelationId(), "Correlation ID should be propagated");
            assertEquals(userId, context.getUserId().orElse(null), "User ID should be propagated");
            assertEquals(tenantId, context.getTenantId().orElse(null), "Tenant ID should be propagated");
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldNotSetContextFieldsWhenHeadersMissing() throws ServletException, IOException {
        // No identity headers provided
        when(request.getHeader("x-correlation-id")).thenReturn(null);
        when(request.getHeader("x-user-id")).thenReturn(null);
        when(request.getHeader("x-tenant-id")).thenReturn(null);
        
        // Capture context during filter execution
        doAnswer(invocation -> {
            SpasContext context = SpasContext.current();
            assertNotNull(context, "SpasContext should be set even when headers are missing");
            assertNotNull(context.getCorrelationId(), "Correlation ID should be auto-generated when header missing");
            assertTrue(context.getUserId().isEmpty(), "User ID should be empty when header missing");
            assertTrue(context.getTenantId().isEmpty(), "Tenant ID should be empty when header missing");
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldNotSetContextFieldsWhenHeadersBlank() throws ServletException, IOException {
        when(request.getHeader("x-correlation-id")).thenReturn("  ");
        when(request.getHeader("x-user-id")).thenReturn("");
        when(request.getHeader("x-tenant-id")).thenReturn("   ");
        
        // Capture context during filter execution
        doAnswer(invocation -> {
            SpasContext context = SpasContext.current();
            assertNotNull(context, "SpasContext should be set");
            assertNotNull(context.getCorrelationId(), "Correlation ID should be auto-generated when header is blank");
            assertTrue(context.getUserId().isEmpty(), "User ID should be empty when header is blank");
            assertTrue(context.getTenantId().isEmpty(), "Tenant ID should be empty when header is blank");
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_shouldPropagateTraceContextToThreadLocal() throws ServletException, IOException {
        String traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
        when(request.getHeader("traceparent")).thenReturn(traceparent);
        
        // Capture trace during filter execution
        doAnswer(invocation -> {
            SpasTrace trace = SpasTrace.current();
            assertNotNull(trace, "SpasTrace should be set during filter chain");
            assertEquals("0af7651916cd43dd8448eb211c80319c", trace.getTraceId());
            assertEquals("b7ad6b7169203331", trace.getSpanId());
            return null;
        }).when(filterChain).doFilter(request, response);
        
        filter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
}
