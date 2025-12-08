const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// Redis subscriber for listening to transformed messages
const redisSubscriber = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  }
});

redisSubscriber.on('error', err => console.error('[SUBSCRIBER] Redis error:', err));

async function initRedis() {
  try {
    await redisSubscriber.connect();
    console.log(`[SUBSCRIBER] Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
    
    // Subscribe to transformed messages channel
    await redisSubscriber.subscribe('orders-transformed', (message) => {
      console.log('[SUBSCRIBER] ===== MESSAGE RECEIVED FROM REDIS =====');
      try {
        const parsedMessage = JSON.parse(message);
        console.log('[SUBSCRIBER] Transformed message:', JSON.stringify(parsedMessage, null, 2));
        console.log('[SUBSCRIBER] Message has _transformed flag:', parsedMessage._transformed);
        console.log('[SUBSCRIBER] Message has _transformed_at:', parsedMessage._transformed_at);
        console.log('[SUBSCRIBER] Component:', parsedMessage._component);
      } catch (e) {
        console.log('[SUBSCRIBER] Message (raw):', message);
      }
    });
    
    console.log('[SUBSCRIBER] Subscribed to orders-transformed channel');
  } catch (err) {
    console.error('[SUBSCRIBER] Failed to connect to Redis:', err);
    process.exit(1);
  }
}

// Health endpoint for DAPR sidecar
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Keep the Dapr subscription endpoint (for reference, though we're using Redis directly)
app.get('/dapr/subscribe', (_req, res) => {
  console.log('[SUBSCRIBER] Dapr requesting subscription list');
  res.json([
    {
      pubsubname: 'redis-pubsub',
      topic: 'orders-transformed',
      route: '/orders'
    }
  ]);
});

app.post('/orders', (req, res) => {
  console.log('[SUBSCRIBER] ===== MESSAGE FROM DAPR =====');
  console.log('[SUBSCRIBER] Received:', JSON.stringify(req.body, null, 2));
  res.status(200).send('OK');
});

const port = process.env.PORT || 6000;

app.listen(port, async () => {
  console.log(`[SUBSCRIBER] Listening on port ${port}`);
  await initRedis();
});
