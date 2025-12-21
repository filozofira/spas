package io.spas.sdk.observability.tracing;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.opentelemetry.context.propagation.TextMapGetter;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.Collections;

/**
 * Servlet filter that creates spans for incoming HTTP requests and
 * propagates trace context from incoming headers.
 * 
 * <p>This filter automatically:</p>
 * <ul>
 *   <li>Extracts W3C trace context from incoming request headers</li>
 *   <li>Creates a server span for the HTTP request</li>
 *   <li>Sets span attributes for HTTP method, path, and status code</li>
 *   <li>Propagates trace ID to SLF4J MDC for logging correlation</li>
 *   <li>Records exceptions if they occur during request processing</li>
 * </ul>
 */
public class TracingFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(TracingFilter.class);
    
    private static final String MDC_TRACE_ID = "traceId";
    private static final String MDC_SPAN_ID = "spanId";
    
    private final OpenTelemetry openTelemetry;
    private final Tracer tracer;
    
    private static final TextMapGetter<HttpServletRequest> GETTER = new TextMapGetter<>() {
        @Override
        public Iterable<String> keys(HttpServletRequest carrier) {
            return Collections.list(carrier.getHeaderNames());
        }
        
        @Override
        public String get(HttpServletRequest carrier, String key) {
            return carrier != null ? carrier.getHeader(key) : null;
        }
    };
    
    /**
     * Creates a new tracing filter with the given OpenTelemetry instance.
     * 
     * @param openTelemetry the OpenTelemetry instance
     */
    public TracingFilter(OpenTelemetry openTelemetry) {
        this.openTelemetry = openTelemetry;
        this.tracer = SpasTracing.getTracer(openTelemetry);
    }
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        logger.debug("TracingFilter initialized");
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (!(request instanceof HttpServletRequest httpRequest) ||
            !(response instanceof HttpServletResponse httpResponse)) {
            chain.doFilter(request, response);
            return;
        }
        
        // Extract context from incoming headers
        Context extractedContext = openTelemetry.getPropagators()
                .getTextMapPropagator()
                .extract(Context.current(), httpRequest, GETTER);
        
        // Create span for this request
        String spanName = httpRequest.getMethod() + " " + getPath(httpRequest);
        Span span = tracer.spanBuilder(spanName)
                .setParent(extractedContext)
                .setSpanKind(SpanKind.SERVER)
                .startSpan();
        
        // Set span attributes
        span.setAttribute("http.method", httpRequest.getMethod());
        span.setAttribute("http.url", httpRequest.getRequestURL().toString());
        span.setAttribute("http.target", getPath(httpRequest));
        span.setAttribute("http.scheme", httpRequest.getScheme());
        span.setAttribute("http.host", httpRequest.getServerName());
        
        String userAgent = httpRequest.getHeader("User-Agent");
        if (userAgent != null) {
            span.setAttribute("http.user_agent", userAgent);
        }
        
        // Set MDC for logging correlation
        String traceId = span.getSpanContext().getTraceId();
        String spanId = span.getSpanContext().getSpanId();
        MDC.put(MDC_TRACE_ID, traceId);
        MDC.put(MDC_SPAN_ID, spanId);
        
        try (Scope scope = span.makeCurrent()) {
            chain.doFilter(request, response);
            
            // Set response status
            int statusCode = httpResponse.getStatus();
            span.setAttribute("http.status_code", statusCode);
            
            if (statusCode >= 400) {
                span.setStatus(StatusCode.ERROR, "HTTP " + statusCode);
            } else {
                span.setStatus(StatusCode.OK);
            }
        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
            MDC.remove(MDC_TRACE_ID);
            MDC.remove(MDC_SPAN_ID);
        }
    }
    
    @Override
    public void destroy() {
        logger.debug("TracingFilter destroyed");
    }
    
    private String getPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        return path;
    }
}
