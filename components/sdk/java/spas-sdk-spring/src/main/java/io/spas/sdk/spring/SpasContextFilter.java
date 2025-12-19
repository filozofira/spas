package io.spas.sdk.spring;

import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.core.context.SpasTrace;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that extracts SPAS context from HTTP headers.
 * Populates SpasTrace and SpasContext ThreadLocal instances from:
 * - traceparent: W3C Trace Context
 * - x-correlation-id: Request correlation ID
 * - x-user-id: User identity
 * - x-tenant-id: Tenant identity
 * 
 * Executes early in filter chain (HIGHEST_PRECEDENCE + 10).
 * Clears context after request completes.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class SpasContextFilter extends OncePerRequestFilter {
    
    private static final String HEADER_TRACEPARENT = "traceparent";
    private static final String HEADER_CORRELATION_ID = "x-correlation-id";
    private static final String HEADER_USER_ID = "x-user-id";
    private static final String HEADER_TENANT_ID = "x-tenant-id";
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        try {
            // Extract trace context
            String traceparent = request.getHeader(HEADER_TRACEPARENT);
            if (traceparent != null && !traceparent.isBlank()) {
                try {
                    SpasTrace trace = SpasTrace.parseTraceparent(traceparent);
                    SpasTrace.setCurrent(trace);
                } catch (IllegalArgumentException e) {
                    // Invalid traceparent, generate new trace
                    SpasTrace.setCurrent(SpasTrace.generate());
                }
            } else {
                // Generate new trace if not provided
                SpasTrace.setCurrent(SpasTrace.generate());
            }
            
            // Extract identity context
            String correlationId = request.getHeader(HEADER_CORRELATION_ID);
            String userId = request.getHeader(HEADER_USER_ID);
            String tenantId = request.getHeader(HEADER_TENANT_ID);
            
            SpasContext.Builder contextBuilder = SpasContext.builder();
            if (correlationId != null && !correlationId.isBlank()) {
                contextBuilder.correlationId(correlationId);
            }
            if (userId != null && !userId.isBlank()) {
                contextBuilder.userId(userId);
            }
            if (tenantId != null && !tenantId.isBlank()) {
                contextBuilder.tenantId(tenantId);
            }
            
            SpasContext.setCurrent(contextBuilder.build());
            
            // Continue filter chain
            filterChain.doFilter(request, response);
            
        } finally {
            // Clean up ThreadLocal to prevent leaks
            SpasTrace.clear();
            SpasContext.clear();
        }
    }
}
