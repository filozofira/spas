package io.spas.sdk.core.context;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.function.Supplier;

/**
 * Thread-safe context for correlation and identity propagation.
 * Uses InheritableThreadLocal to automatically propagate to child threads.
 */
public final class SpasContext {
    private static final InheritableThreadLocal<SpasContext> CURRENT = new InheritableThreadLocal<>();
    
    private final String correlationId;
    private final String userId;
    private final String tenantId;
    
    private SpasContext(String correlationId, String userId, String tenantId) {
        this.correlationId = correlationId;
        this.userId = userId;
        this.tenantId = tenantId;
    }
    
    /**
     * Gets the current context for this thread.
     * 
     * @return current context, or null if not set
     */
    public static SpasContext current() {
        return CURRENT.get();
    }
    
    /**
     * Sets the current context for this thread and child threads.
     * 
     * @param context the context to set
     */
    public static void setCurrent(SpasContext context) {
        CURRENT.set(context);
    }
    
    /**
     * Clears the current context from this thread.
     */
    public static void clear() {
        CURRENT.remove();
    }
    
    /**
     * Wraps a Runnable to propagate the current context.
     * 
     * @param runnable the runnable to wrap
     * @return wrapped runnable that propagates context
     */
    public static Runnable wrap(Runnable runnable) {
        SpasContext context = current();
        return () -> {
            SpasContext previous = current();
            try {
                setCurrent(context);
                runnable.run();
            } finally {
                setCurrent(previous);
            }
        };
    }
    
    /**
     * Wraps a Callable to propagate the current context.
     * 
     * @param callable the callable to wrap
     * @param <T> the result type
     * @return wrapped callable that propagates context
     */
    public static <T> Callable<T> wrap(Callable<T> callable) {
        SpasContext context = current();
        return () -> {
            SpasContext previous = current();
            try {
                setCurrent(context);
                return callable.call();
            } finally {
                setCurrent(previous);
            }
        };
    }
    
    /**
     * Wraps a Supplier to propagate the current context.
     * 
     * @param supplier the supplier to wrap
     * @param <T> the result type
     * @return wrapped supplier that propagates context
     */
    public static <T> Supplier<T> wrap(Supplier<T> supplier) {
        SpasContext context = current();
        return () -> {
            SpasContext previous = current();
            try {
                setCurrent(context);
                return supplier.get();
            } finally {
                setCurrent(previous);
            }
        };
    }
    
    public String getCorrelationId() {
        return correlationId;
    }
    
    public Optional<String> getUserId() {
        return Optional.ofNullable(userId);
    }
    
    public Optional<String> getTenantId() {
        return Optional.ofNullable(tenantId);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static final class Builder {
        private String correlationId;
        private String userId;
        private String tenantId;
        
        private Builder() {}
        
        public Builder correlationId(String correlationId) {
            this.correlationId = correlationId;
            return this;
        }
        
        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }
        
        public Builder tenantId(String tenantId) {
            this.tenantId = tenantId;
            return this;
        }
        
        public SpasContext build() {
            // Auto-generate correlation ID if not provided
            String finalCorrelationId = correlationId != null ? correlationId : UUID.randomUUID().toString();
            return new SpasContext(finalCorrelationId, userId, tenantId);
        }
    }
}
