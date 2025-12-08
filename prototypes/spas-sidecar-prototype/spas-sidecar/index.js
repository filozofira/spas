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

// Zipkin configuration
const zipkinUrl = process.env.ZIPKIN_URL;
const serviceName = process.env.SERVICE_NAME || 'spas-sidecar';

// Simple Zipkin span sender using HTTP API v2
async function sendZipkinSpan(traceId, spanId, parentSpanId, spanName, timestamp, duration, tags = {}) {
  if (!zipkinUrl) return;
  
  try {
    // Parse W3C traceparent format: 00-{traceId}-{spanId}-{flags}
    let zipkinTraceId = traceId;
    let zipkinSpanId = spanId;
    let zipkinParentId = parentSpanId;
    
    if (traceId && traceId.startsWith('00-')) {
      const parts = traceId.split('-');
      zipkinTraceId = parts[1];
      zipkinSpanId = parts[2] || spanId;
    }
    
    const span = {
      traceId: zipkinTraceId,
      id: zipkinSpanId,
      name: spanName,
      timestamp: timestamp * 1000, // microseconds
      duration: duration * 1000, // microseconds
      localEndpoint: {
        serviceName: serviceName
      },
      tags: tags
    };
    
    if (zipkinParentId) {
      span.parentId = zipkinParentId;
    }
    
    await fetch(`${zipkinUrl}/api/v2/spans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([span])
    });
  } catch (err) {
    console.error('[SIDECAR] Error sending span to Zipkin:', err.message);
  }
}

if (zipkinUrl) {
  console.log(`[SIDECAR] Zipkin tracing enabled: ${zipkinUrl}`);
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
      const startTime = Date.now();
      console.log(`[SIDECAR] Received message on topic '${sub.topic}':`, message);
      let parsed;
      try { parsed = JSON.parse(message); } catch { parsed = message; }
      
      // Extract trace context
      const traceContext = extractTraceContext(parsed);
      console.log(`[SIDECAR] Trace context: ${traceContext}`);
      
      // Send receive span to Zipkin
      const receiveSpanId = Math.random().toString(36).substr(2, 16);
      await sendZipkinSpan(
        traceContext,
        receiveSpanId,
        null,
        `receive ${sub.topic}`,
        startTime,
        Date.now() - startTime,
        { 'message.topic': sub.topic, 'message.type': 'receive' }
      );
      
      // Transform the message
      const transformStart = Date.now();
      const transformed = transforms[sub.transform](parsed);
      
      // Send transform span to Zipkin
      const transformSpanId = Math.random().toString(36).substr(2, 16);
      await sendZipkinSpan(
        traceContext,
        transformSpanId,
        receiveSpanId,
        `transform ${sub.transform}`,
        transformStart,
        Date.now() - transformStart,
        { 'transform.function': sub.transform }
      );
      
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
          const invokeStart = Date.now();
          await fetch(sub.invokeEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'traceparent': cloudEvent.traceparent
            },
            body: JSON.stringify(cloudEvent)
          });
          
          // Send invoke span to Zipkin
          const invokeSpanId = Math.random().toString(36).substr(2, 16);
          await sendZipkinSpan(
            traceContext,
            invokeSpanId,
            transformSpanId,
            `invoke ${sub.invokeEndpoint}`,
            invokeStart,
            Date.now() - invokeStart,
            { 'http.url': sub.invokeEndpoint, 'http.method': 'POST' }
          );
          
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
  const startTime = Date.now();
  const topic = req.params.topic;
  const pub = config.publications.find(p => p.topic === topic);
  if (!pub) return res.status(404).send('Unknown topic');
  
  // Extract trace context from request headers if present
  const traceContext = req.headers.traceparent || null;
  console.log(`[SIDECAR] Publishing to topic '${topic}' with trace ID: ${traceContext}`);
  
  // Send receive span to Zipkin
  const receiveSpanId = Math.random().toString(36).substr(2, 16);
  await sendZipkinSpan(
    traceContext,
    receiveSpanId,
    null,
    `POST /publish/${topic}`,
    startTime,
    Date.now() - startTime,
    { 'http.method': 'POST', 'http.path': `/publish/${topic}` }
  );
  
  // Transform the message
  const transformStart = Date.now();
  const transformed = transforms[pub.transform](req.body);
  
  // Send transform span to Zipkin
  const transformSpanId = Math.random().toString(36).substr(2, 16);
  await sendZipkinSpan(
    traceContext,
    transformSpanId,
    receiveSpanId,
    `transform ${pub.transform}`,
    transformStart,
    Date.now() - transformStart,
    { 'transform.function': pub.transform }
  );
  
  // Wrap in CloudEvents
  const cloudEvent = wrapInCloudEvents(
    transformed,
    req.headers['x-service-name'] || 'unknown-service',
    topic,
    'message.publish',
    traceContext
  );
  
  console.log(`[SIDECAR] CloudEvent created (ID: ${cloudEvent.id})`);
  
  // Publish to Redis
  const publishStart = Date.now();
  await redisPubClient.publish(topic, JSON.stringify(cloudEvent));
  
  // Send publish span to Zipkin
  const publishSpanId = Math.random().toString(36).substr(2, 16);
  await sendZipkinSpan(
    traceContext,
    publishSpanId,
    transformSpanId,
    `publish ${topic}`,
    publishStart,
    Date.now() - publishStart,
    { 'message.topic': topic, 'message.broker': 'redis' }
  );
  
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

