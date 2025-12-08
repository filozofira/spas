const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const configPath = process.env.CONFIG_PATH || path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const transforms = require('./transform');

// Zipkin configuration (for future implementation)
// Note: Zipkin v0.22.0 has a different API - needs proper instrumentation
const zipkinUrl = process.env.ZIPKIN_URL;
if (zipkinUrl) {
  console.log(`[SIDECAR] Zipkin URL configured: ${zipkinUrl}`);
  console.log(`[SIDECAR] Note: CloudEvents with traceparent headers provide trace correlation`);
} else {
  console.log('[SIDECAR] Zipkin tracing disabled (ZIPKIN_URL not set)');
}

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

const REDIS_HOST = config.redis.host;
const REDIS_PORT = config.redis.port;
const redisSubClient = redis.createClient({ socket: { host: REDIS_HOST, port: REDIS_PORT } });
const redisPubClient = redis.createClient({ socket: { host: REDIS_HOST, port: REDIS_PORT } });

redisSubClient.on('error', err => console.error('[SIDECAR] Redis SUB error:', err));
redisPubClient.on('error', err => console.error('[SIDECAR] Redis PUB error:', err));

// CloudEvents wrapper function
function wrapInCloudEvents(data, source, subject, eventType = 'message.transformed', traceId = null) {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const cloudEvent = {
    specversion: '1.0',
    type: eventType,
    source: source,
    subject: subject,
    id: id,
    time: now,
    datacontenttype: 'application/json',
    traceparent: traceId || `00-${uuidv4().replace(/-/g, '')}-${Math.random().toString(36).substr(2, 16)}-01`,
    data: data
  };
  
  return cloudEvent;
}

// Extract trace context from CloudEvents
function extractTraceContext(message) {
  if (typeof message === 'object' && message.traceparent) {
    return message.traceparent;
  }
  return null;
}

async function subscribeTopics() {
  await redisSubClient.connect();
  for (const sub of config.subscriptions) {
    await redisSubClient.subscribe(sub.topic, async (message) => {
      console.log(`[SIDECAR] Received message on topic '${sub.topic}':`, message);
      let parsed;
      try { parsed = JSON.parse(message); } catch { parsed = message; }
      
      // Extract trace context
      const traceContext = extractTraceContext(parsed);
      console.log(`[SIDECAR] Trace context: ${traceContext}`);
      
      // Transform the message
      const transformed = transforms[sub.transform](parsed);
      
      // Wrap in CloudEvents
      const cloudEvent = wrapInCloudEvents(
        transformed,
        'spas-sidecar',
        sub.topic,
        'message.transformed',
        traceContext
      );
      
      console.log(`[SIDECAR] Transformed and wrapped in CloudEvents (ID: ${cloudEvent.id})`);
      
      // Invoke endpoint if configured
      if (sub.invokeEndpoint) {
        try {
          await fetch(sub.invokeEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'traceparent': cloudEvent.traceparent
            },
            body: JSON.stringify(cloudEvent)
          });
          console.log(`[SIDECAR] Invoked endpoint ${sub.invokeEndpoint} with trace ID`);
        } catch (err) {
          console.error(`[SIDECAR] Error invoking endpoint:`, err);
        }
      }
    });
    console.log(`[SIDECAR] Subscribed to topic '${sub.topic}'`);
  }
}

async function initPublishClient() {
  await redisPubClient.connect();
}

app.post('/publish/:topic', async (req, res) => {
  const topic = req.params.topic;
  const pub = config.publications.find(p => p.topic === topic);
  if (!pub) return res.status(404).send('Unknown topic');
  
  // Extract trace context from request headers if present
  const traceContext = req.headers.traceparent || null;
  console.log(`[SIDECAR] Publishing to topic '${topic}' with trace ID: ${traceContext}`);
  
  // Transform the message
  const transformed = transforms[pub.transform](req.body);
  
  // Wrap in CloudEvents
  const cloudEvent = wrapInCloudEvents(
    transformed,
    req.headers['x-service-name'] || 'unknown-service',
    topic,
    'message.publish',
    traceContext
  );
  
  console.log(`[SIDECAR] CloudEvent created (ID: ${cloudEvent.id})`);
  
  await redisPubClient.publish(topic, JSON.stringify(cloudEvent));
  console.log(`[SIDECAR] Published to Redis topic '${topic}'`);
  
  res.status(200).json({
    status: 'published',
    topic,
    messageId: cloudEvent.id,
    traceparent: cloudEvent.traceparent
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const port = process.env.PORT || 7000;
app.listen(port, async () => {
  console.log(`[SIDECAR] Listening on port ${port}`);
  await initPublishClient();
  await subscribeTopics();
});

