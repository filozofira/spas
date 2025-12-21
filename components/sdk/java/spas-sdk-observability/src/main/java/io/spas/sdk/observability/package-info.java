/**
 * SPAS SDK Observability module.
 * 
 * Provides OpenTelemetry-based distributed tracing with Zipkin exporter
 * for SPAS-compliant services. This module mirrors the .NET 
 * Spas.Sdk.Observability package functionality.
 * 
 * <p>Key components:</p>
 * <ul>
 *   <li>{@link io.spas.sdk.observability.tracing.SpasTracing} - Core tracing configuration</li>
 *   <li>{@link io.spas.sdk.observability.tracing.SpasTracingAutoConfiguration} - Spring Boot auto-configuration</li>
 *   <li>{@link io.spas.sdk.observability.tracing.TracingFilter} - HTTP request/response tracing filter</li>
 * </ul>
 * 
 * @see <a href="https://opentelemetry.io/">OpenTelemetry</a>
 * @see <a href="https://zipkin.io/">Zipkin</a>
 */
package io.spas.sdk.observability;
