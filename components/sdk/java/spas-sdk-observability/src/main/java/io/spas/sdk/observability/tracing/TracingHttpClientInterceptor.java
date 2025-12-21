package io.spas.sdk.observability.tracing;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.opentelemetry.context.propagation.TextMapSetter;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;

/**
 * Spring RestTemplate interceptor that adds tracing to outbound HTTP calls.
 * 
 * <p>This interceptor automatically:</p>
 * <ul>
 *   <li>Creates a client span for each outbound HTTP request</li>
 *   <li>Propagates W3C trace context in request headers</li>
 *   <li>Records HTTP method, URL, and response status</li>
 *   <li>Records exceptions if the request fails</li>
 * </ul>
 * 
 * <p>Usage:</p>
 * <pre>{@code
 * RestTemplate restTemplate = new RestTemplate();
 * restTemplate.getInterceptors().add(new TracingHttpClientInterceptor(openTelemetry));
 * }</pre>
 */
public class TracingHttpClientInterceptor implements ClientHttpRequestInterceptor {
    
    private final OpenTelemetry openTelemetry;
    private final Tracer tracer;
    
    private static final TextMapSetter<HttpRequest> SETTER = (carrier, key, value) -> {
        if (carrier != null && key != null && value != null) {
            carrier.getHeaders().set(key, value);
        }
    };
    
    /**
     * Creates a new interceptor with the given OpenTelemetry instance.
     * 
     * @param openTelemetry the OpenTelemetry instance
     */
    public TracingHttpClientInterceptor(OpenTelemetry openTelemetry) {
        this.openTelemetry = openTelemetry;
        this.tracer = SpasTracing.getTracer(openTelemetry);
    }
    
    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, 
            ClientHttpRequestExecution execution) throws IOException {
        
        String spanName = "HTTP " + request.getMethod() + " " + request.getURI().getHost();
        
        Span span = tracer.spanBuilder(spanName)
                .setSpanKind(SpanKind.CLIENT)
                .startSpan();
        
        // Set span attributes
        span.setAttribute("http.method", request.getMethod().name());
        span.setAttribute("http.url", request.getURI().toString());
        span.setAttribute("http.host", request.getURI().getHost());
        
        int port = request.getURI().getPort();
        if (port > 0) {
            span.setAttribute("http.port", port);
        }
        
        try (Scope scope = span.makeCurrent()) {
            // Inject trace context into outbound headers
            openTelemetry.getPropagators()
                    .getTextMapPropagator()
                    .inject(Context.current(), request, SETTER);
            
            ClientHttpResponse response = execution.execute(request, body);
            
            int statusCode = response.getStatusCode().value();
            span.setAttribute("http.status_code", statusCode);
            
            if (statusCode >= 400) {
                span.setStatus(StatusCode.ERROR, "HTTP " + statusCode);
            } else {
                span.setStatus(StatusCode.OK);
            }
            
            return response;
        } catch (IOException e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }
}
