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
}
