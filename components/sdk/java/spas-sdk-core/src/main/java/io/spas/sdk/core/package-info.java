/**
 * SPAS SDK Core module.
 * 
 * <p>Provides core functionality for SPAS services:</p>
 * <ul>
 *   <li>{@code SpasContext} - Thread-local context for correlation and identity</li>
 *   <li>{@code SpasTrace} - W3C Trace Context storage and propagation</li>
 *   <li>{@code SpasConfiguration} - Configuration loading from environment</li>
 *   <li>{@code KebabCaseConverter} - Name normalization utility</li>
 * </ul>
 * 
 * <p>This module is framework-agnostic and has no Spring dependencies.</p>
 */
package io.spas.sdk.core;
