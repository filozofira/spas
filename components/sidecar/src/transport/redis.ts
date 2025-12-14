/**
 * Redis Transport Client
 *
 * Wrapper around node-redis for Redis Streams operations (XADD, XREAD).
 * Used for event publishing and subscription.
 */

import { createClient, RedisClientType } from 'redis';
import type { RedisStreamMessage } from '../types.js';

/**
 * Redis client wrapper for sidecar operations.
 */
export class RedisClient {
  private client: RedisClientType | null = null;
  private subscriberClient: RedisClientType | null = null;
  private readonly host: string;
  private readonly port: number;
  private connected = false;

  constructor(host: string = 'localhost', port: number = 6379) {
    this.host = host;
    this.port = port;
  }

  /**
   * Connect to Redis server.
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const url = `redis://${this.host}:${this.port}`;

    // Main client for publishing
    this.client = createClient({ url });
    this.client.on('error', (err) => {
      console.error('[REDIS] Client error:', err.message);
    });

    // Subscriber client for XREAD (needs separate connection)
    this.subscriberClient = createClient({ url });
    this.subscriberClient.on('error', (err) => {
      console.error('[REDIS] Subscriber error:', err.message);
    });

    await this.client.connect();
    await this.subscriberClient.connect();

    this.connected = true;
    console.log(`[REDIS] Connected to ${this.host}:${this.port}`);
  }

  /**
   * Disconnect from Redis server.
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    if (this.client) {
      await this.client.quit();
      this.client = null;
    }

    if (this.subscriberClient) {
      await this.subscriberClient.quit();
      this.subscriberClient = null;
    }

    this.connected = false;
    console.log('[REDIS] Disconnected');
  }

  /**
   * Check if connected to Redis.
   */
  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /**
   * Add message to Redis Stream (XADD).
   *
   * @param stream - Stream name (topic)
   * @param fields - Message fields as key-value pairs
   * @returns Message ID assigned by Redis
   */
  async xadd(stream: string, fields: Record<string, string>): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }

    const id = await this.client.xAdd(stream, '*', fields);
    return id;
  }

  /**
   * Read messages from Redis Streams (XREAD) with blocking.
   *
   * @param streams - Array of stream names to read from
   * @param ids - Array of last-read message IDs (use '$' for new messages only)
   * @param blockMs - Block timeout in milliseconds (0 = block forever)
   * @returns Array of messages per stream, or null if timeout
   */
  async xread(
    streams: string[],
    ids: string[],
    blockMs: number = 5000
  ): Promise<Map<string, RedisStreamMessage[]> | null> {
    if (!this.subscriberClient) {
      throw new Error('Redis subscriber client not connected');
    }

    // Build streams object for xRead
    const streamKeys = streams.reduce(
      (acc, stream, i) => {
        acc[stream] = ids[i] || '$';
        return acc;
      },
      {} as Record<string, string>
    );

    const result = await this.subscriberClient.xRead(
      Object.entries(streamKeys).map(([key, id]) => ({
        key,
        id,
      })),
      {
        BLOCK: blockMs,
        COUNT: 10,
      }
    );

    if (!result) {
      return null;
    }

    // Transform result to Map<stream, messages[]>
    const messagesMap = new Map<string, RedisStreamMessage[]>();

    for (const streamData of result) {
      const messages: RedisStreamMessage[] = streamData.messages.map((msg) => ({
        id: msg.id,
        message: msg.message as Record<string, string>,
      }));
      messagesMap.set(streamData.name, messages);
    }

    return messagesMap;
  }

  /**
   * Ping Redis to check connectivity.
   */
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

/**
 * Create Redis client from environment variables.
 */
export function createRedisClient(): RedisClient {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  return new RedisClient(host, port);
}
