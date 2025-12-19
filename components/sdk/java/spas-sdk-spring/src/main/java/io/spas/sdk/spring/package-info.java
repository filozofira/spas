/**
 * SPAS SDK Spring integration module.
 * 
 * <p>Provides Spring Boot auto-configuration:</p>
 * <ul>
 *   <li>{@code SpasAutoConfiguration} - Auto-configures SPAS components</li>
 *   <li>{@code SpasContextFilter} - Extracts trace/identity from requests</li>
 *   <li>{@code @EnableSpas} - Explicit activation annotation</li>
 * </ul>
 * 
 * <p><strong>This module is OPTIONAL.</strong> Core SDK functionality works
 * without Spring. Use this module only if you are building Spring Boot applications.</p>
 */
package io.spas.sdk.spring;
