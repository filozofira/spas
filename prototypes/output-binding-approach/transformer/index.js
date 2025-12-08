const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const PORT = parseInt(process.env.PORT || '7000', 10);

// Redis client for publishing transformed messages
const redisClient = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries) => {
      console.log(`[TRANSFORMER] Redis reconnect attempt #${retries}`);
      return Math.min(retries * 50, 5000);
    }
  }
});

redisClient.on('error', err => console.error('[TRANSFORMER] Redis error:', err));
redisClient.on('connect', () => console.log('[TRANSFORMER] Redis connected'));

async function waitForRedis(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await redisClient.ping();
      console.log(`[TRANSFORMER] Successfully pinged Redis after ${i} attempts`);
      return true;
    } catch (err) {
      console.log(`[TRANSFORMER] Waiting for Redis... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Redis did not become available in time');
}

async function initRedis() {
  try {
    await redisClient.connect();
    await waitForRedis();
    console.log(`[TRANSFORMER] Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (err) {
    console.error('[TRANSFORMER] Failed to connect to Redis:', err);
    // Don't exit - continue and retry connection when requests come in
  }
}

// Transformation endpoint
app.post('/transform', async (req, res) => {
  try {
    console.log('[TRANSFORMER] ===== MESSAGE RECEIVED =====');
    console.log('[TRANSFORMER] Raw request:', JSON.stringify(req.body, null, 2));

    // Extract the actual message data
    // DAPR output binding sends the data in the request body
    const messageData = req.body.data || req.body;
    
    console.log('[TRANSFORMER] Message data:', JSON.stringify(messageData, null, 2));

    // Apply transformation
    const transformedMessage = {
      ...messageData,
      _transformed: true,
      _transformed_at: new Date().toISOString(),
      _component: 'output-binding-transformer'
    };

    console.log('[TRANSFORMER] Transformed message:', JSON.stringify(transformedMessage, null, 2));

    // Publish transformed message to Redis pubsub channel
    const channel = 'orders-transformed';
    await redisClient.publish(channel, JSON.stringify(transformedMessage));
    console.log(`[TRANSFORMER] Published to channel '${channel}'`);

    // Return success to DAPR
    res.status(200).json({
      success: true,
      message: 'Transformation complete',
      transformed: transformedMessage
    });

  } catch (err) {
    console.error('[TRANSFORMER] Error during transformation:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, async () => {
  console.log(`[TRANSFORMER] Listening on port ${PORT}`);
  await initRedis();
});
