/**
 * Configuration Loader
 *
 * Loads and validates sidecar configuration from JSON files.
 * Supports legacy config format migration.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { SidecarConfig, LegacyConfig, InboundEntry, OutboundEntry } from '../types.js';
import { assertValidConfig } from './schema.js';

/**
 * Load configuration from file path.
 *
 * @param configPath - Path to JSON configuration file
 * @returns Validated SidecarConfig
 * @throws Error if file not found or config invalid
 */
export async function loadConfig(configPath: string): Promise<SidecarConfig> {
  // Check file exists
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  // Read and parse JSON
  let rawConfig: unknown;
  try {
    const content = await readFile(configPath, 'utf-8');
    rawConfig = JSON.parse(content);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${err.message}`);
    }
    throw err;
  }

  // Check for legacy format and migrate if needed
  if (isLegacyConfig(rawConfig)) {
    console.log('[config] Detected legacy configuration format, migrating...');
    rawConfig = migrateLegacyConfig(rawConfig);
  }

  // Validate and return
  assertValidConfig(rawConfig);
  return rawConfig;
}

/**
 * Load configuration from environment variable path.
 *
 * @returns Validated SidecarConfig
 * @throws Error if CONFIG_PATH not set or config invalid
 */
export async function loadConfigFromEnv(): Promise<SidecarConfig> {
  const configPath = process.env.CONFIG_PATH;

  if (!configPath) {
    throw new Error('CONFIG_PATH environment variable is required');
  }

  return loadConfig(configPath);
}

/**
 * Check if config is in legacy format.
 * Legacy format has subscriptions/publications instead of inbound/outbound.
 */
export function isLegacyConfig(config: unknown): config is LegacyConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const cfg = config as Record<string, unknown>;

  // Legacy format has subscriptions or publications at root
  return Array.isArray(cfg.subscriptions) || Array.isArray(cfg.publications);
}

/**
 * Migrate legacy configuration to new format.
 *
 * Legacy format:
 * {
 *   subscriptions: [{ topic, transform, invokeEndpoint }],
 *   publications: [{ topic, transform }]
 * }
 *
 * New format:
 * {
 *   inbound: [{ kind: 'event', topic, transform, invokeEndpoint }],
 *   outbound: [{ eventType, topic, transform }]
 * }
 */
export function migrateLegacyConfig(legacy: LegacyConfig): SidecarConfig {
  const inbound: InboundEntry[] = [];
  const outbound: OutboundEntry[] = [];

  // Migrate subscriptions to inbound with kind='event'
  if (legacy.subscriptions) {
    for (const sub of legacy.subscriptions) {
      inbound.push({
        kind: 'event',
        topic: sub.topic,
        transform: sub.transform,
        invokeEndpoint: sub.invokeEndpoint,
      });
    }
  }

  // Migrate publications to outbound
  // Legacy format used topic; new format requires eventType for routing
  // We'll use topic as eventType for migration (service should update config)
  if (legacy.publications) {
    for (const pub of legacy.publications) {
      outbound.push({
        eventType: pub.topic, // Use topic as eventType for legacy migration
        topic: pub.topic,
        transform: pub.transform,
      });
    }
  }

  return { inbound, outbound };
}

/**
 * Get configuration summary for logging.
 */
export function getConfigSummary(config: SidecarConfig): string {
  const eventSubscriptions = config.inbound.filter((e) => e.kind === 'event').length;
  const commandHandlers = config.inbound.filter((e) => e.kind === 'command').length;
  const publications = config.outbound.length;

  return `${eventSubscriptions} event subscription(s), ${commandHandlers} command handler(s), ${publications} publication route(s)`;
}
