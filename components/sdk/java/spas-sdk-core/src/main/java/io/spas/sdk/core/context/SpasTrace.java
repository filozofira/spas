package io.spas.sdk.core.context;

import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * W3C Trace Context storage using InheritableThreadLocal.
 * Enables distributed tracing across service boundaries.
 * 
 * @see <a href="https://www.w3.org/TR/trace-context/">W3C Trace Context</a>
 */
public final class SpasTrace {
    private static final InheritableThreadLocal<SpasTrace> CURRENT = new InheritableThreadLocal<>();
    
    private static final Pattern TRACEPARENT_PATTERN = 
        Pattern.compile("^00-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$");
    
    private final String traceId;
    private final String spanId;
    private final String traceFlags;
    private final String traceState;
    
    private SpasTrace(String traceId, String spanId, String traceFlags, String traceState) {
        this.traceId = traceId;
        this.spanId = spanId;
        this.traceFlags = traceFlags;
        this.traceState = traceState;
    }
    
    /**
     * Gets the current trace context for this thread.
     * 
     * @return current trace context, or null if not set
     */
    public static SpasTrace current() {
        return CURRENT.get();
    }
    
    /**
     * Sets the current trace context for this thread and child threads.
     * 
     * @param trace the trace context to set
     */
    public static void setCurrent(SpasTrace trace) {
        CURRENT.set(trace);
    }
    
    /**
     * Clears the current trace context from this thread.
     */
    public static void clear() {
        CURRENT.remove();
    }
    
    /**
     * Parses a W3C traceparent header value.
     * 
     * @param traceparent the traceparent header value (format: 00-{trace-id}-{span-id}-{flags})
     * @return parsed trace context
     * @throws IllegalArgumentException if traceparent format is invalid
     */
    public static SpasTrace parseTraceparent(String traceparent) {
        if (traceparent == null || traceparent.isEmpty()) {
            throw new IllegalArgumentException("traceparent cannot be null or empty");
        }
        
        var matcher = TRACEPARENT_PATTERN.matcher(traceparent);
        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                "Invalid traceparent format. Expected: 00-{trace-id}-{span-id}-{flags}");
        }
        
        return builder()
            .traceId(matcher.group(1))
            .spanId(matcher.group(2))
            .traceFlags(matcher.group(3))
            .build();
    }
    
    /**
     * Generates a new trace context with random IDs.
     * 
     * @return new trace context
     */
    public static SpasTrace generate() {
        String traceId = UUID.randomUUID().toString().replace("-", "") + 
                        UUID.randomUUID().toString().replace("-", "").substring(0, 32 - 32);
        String spanId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        
        return builder()
            .traceId(traceId)
            .spanId(spanId)
            .traceFlags("01")  // sampled
            .build();
    }
    
    /**
     * Serializes this trace context to W3C traceparent format.
     * 
     * @return traceparent header value (format: 00-{trace-id}-{span-id}-{flags})
     */
    public String toTraceparent() {
        return String.format("00-%s-%s-%s", traceId, spanId, traceFlags);
    }
    
    public String getTraceId() {
        return traceId;
    }
    
    public String getSpanId() {
        return spanId;
    }
    
    public String getTraceFlags() {
        return traceFlags;
    }
    
    public Optional<String> getTraceState() {
        return Optional.ofNullable(traceState);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static final class Builder {
        private String traceId;
        private String spanId;
        private String traceFlags = "00";  // default: not sampled
        private String traceState;
        
        private Builder() {}
        
        public Builder traceId(String traceId) {
            this.traceId = traceId;
            return this;
        }
        
        public Builder spanId(String spanId) {
            this.spanId = spanId;
            return this;
        }
        
        public Builder traceFlags(String traceFlags) {
            this.traceFlags = traceFlags;
            return this;
        }
        
        public Builder traceState(String traceState) {
            this.traceState = traceState;
            return this;
        }
        
        public SpasTrace build() {
            if (traceId == null || traceId.isEmpty()) {
                throw new IllegalArgumentException("traceId is required");
            }
            if (spanId == null || spanId.isEmpty()) {
                throw new IllegalArgumentException("spanId is required");
            }
            if (traceFlags == null || traceFlags.isEmpty()) {
                throw new IllegalArgumentException("traceFlags is required");
            }
            
            return new SpasTrace(traceId, spanId, traceFlags, traceState);
        }
    }
}
