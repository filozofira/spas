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

// Validate configuration on startup
function validateConfig(cfg) {
  const errors = [];
  
  // Validate inbound entries
  if (cfg.inbound) {
    cfg.inbound.forEach((entry, idx) => {
      if (!entry.kind) {
        errors.push(`inbound[${idx}]: missing required field 'kind' (must be "command" or "event")`);
      } else if (entry.kind !== 'command' && entry.kind !== 'event') {
        errors.push(`inbound[${idx}]: invalid kind '${entry.kind}' (must be "command" or "event")`);
      }
      
      if (entry.kind === 'command' && !entry.command) {
        errors.push(`inbound[${idx}]: kind=command requires 'command' field`);
      }
      if (entry.kind === 'event' && !entry.topic) {
        errors.push(`inbound[${idx}]: kind=event requires 'topic' field`);
      }
      if (!entry.transform) {
        errors.push(`inbound[${idx}]: missing required field 'transform'`);
      }
      if (entry.kind === 'command' && !entry.invokeEndpoint) {
        errors.push(`inbound[${idx}]: kind=command requires 'invokeEndpoint'`);
      }
    });
  }
  
  // Validate outbound entries
  if (cfg.outbound) {
    cfg.outbound.forEach((entry, idx) => {
      if (!entry.topic) {
        errors.push(`outbound[${idx}]: missing required field 'topic'`);
      }
      if (!entry.transform) {
        errors.push(`outbound[${idx}]: missing required field 'transform'`);
      }
    });
  }
  
  // Support legacy config temporarily but warn
  if (cfg.subscriptions || cfg.publications) {
    console.warn('[SIDECAR] WARNING: Legacy config detected. Please migrate to inbound/outbound schema.');
    // Auto-migrate for backward compatibility
    if (cfg.subscriptions && !cfg.inbound) {
      cfg.inbound = cfg.subscriptions.map(sub => ({
        kind: 'event',
        topic: sub.topic,
        transform: sub.transform,
        invokeEndpoint: sub.invokeEndpoint
      }));
    }
    if (cfg.publications && !cfg.outbound) {
      cfg.outbound = cfg.publications;
    }
  }
  
  if (errors.length > 0) {
    console.error('[SIDECAR] Configuration validation FAILED:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Invalid configuration. See errors above.');
  }
  
  console.log('[SIDECAR] Configuration validated successfully');
}

validateConfig(config);

// Zipkin configuration
const zipkinUrl = process.env.ZIPKIN_URL;
const serviceId = process.env.SERVICE_NAME || 'service';
const spanServiceName = process.env.SERVICE_SPAN_NAME || `${serviceId}-sidecar`;
const servicePort = process.env.SERVICE_PORT || '';

// Generate a random hex string for span IDs (Zipkin requires lowercase hex)
function generateSpanId() {
  return Math.random().toString(16).substr(2, 16).padEnd(16, '0');
}

// Simple Zipkin span sender using HTTP API v2
async function sendZipkinSpan(traceId, spanId, parentSpanId, spanName, timestamp, duration, tags = {}) {
  if (!zipkinUrl) {
    return;
  }
  
  try {
    // Parse W3C traceparent format: 00-{traceId}-{spanId}-{flags}
    let zipkinTraceId = traceId;
    let zipkinParentId = parentSpanId;
    
    if (traceId && traceId.startsWith('00-')) {
      const parts = traceId.split('-');
      zipkinTraceId = parts[1]; // Extract trace ID (32 hex chars)
      // DO NOT use the spanId from traceparent as parentId
      // The parentSpanId parameter already contains the correct parent
      // We only extract the trace ID from the traceparent header
    }
    
    const span = {
      traceId: zipkinTraceId,
      id: spanId, // Use the provided span ID (unique for this span)
      name: spanName,
      timestamp: timestamp * 1000, // microseconds
      duration: duration * 1000, // microseconds
      localEndpoint: {
        serviceName: spanServiceName
      },
      tags: tags
    };
    
    if (zipkinParentId) {
      span.parentId = zipkinParentId;
    }
    
    const response = await fetch(`${zipkinUrl}/api/v2/spans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([span])
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SIDECAR] Zipkin span rejected: ${response.status} - ${errorText}`);
      console.error(`[SIDECAR] Span was:`, JSON.stringify(span, null, 2));
    }
  } catch (err) {
    // Silently ignore connection errors (Zipkin may not be ready yet)
    // Only log if it's not a connection error
    if (!err.message.includes('ECONNREFUSED')) {
      console.error('[SIDECAR] Error sending span to Zipkin:', err.message);
    }
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
    traceparent: traceId || `00-${uuidv4().replace(/-/g, '')}-${generateSpanId()}-01`,
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
  const eventInbound = (config.inbound || []).filter(entry => entry.kind === 'event');
  
  for (const sub of eventInbound) {
    // Start reading from the latest messages (new ones)
    // Use '0' to read from the beginning, or '$' to read only new messages
    let lastId = '$';
    
    const readStream = async () => {
      while (true) {
        try {
          const messages = await redisSubClient.xRead(
            { key: sub.topic, id: lastId },
            { COUNT: 10, BLOCK: 0 } // Block indefinitely until messages arrive
          );
          
          if (messages && Array.isArray(messages) && messages.length > 0) {
            for (const result of messages) {
              const streamMessages = result.messages || [];
              for (const messageObj of streamMessages) {
                lastId = messageObj.id;
                const startTime = Date.now();
                const messageData = messageObj.message.data;
                
                console.log(`[SIDECAR] Received message on stream '${sub.topic}' (ID: ${messageObj.id}):`, messageData);
                let parsed;
                try { parsed = JSON.parse(messageData); } catch { parsed = messageData; }
                
                // Extract trace context
                const traceContext = extractTraceContext(parsed);
                console.log(`[SIDECAR] Trace context: ${traceContext}`);
                
                // Send receive span to Zipkin
                const receiveSpanId = generateSpanId();
                await sendZipkinSpan(
                  traceContext,
                  receiveSpanId,
                  null,
                  `receive event ${sub.topic}`,
                  startTime,
                  Date.now() - startTime,
                  { 'kind': 'event', 'transport': 'redis', 'event.topic': sub.topic, 'message.type': 'receive' }
                );
                
                // Transform the message
                const transformStart = Date.now();
                const transformed = transforms[sub.transform](parsed);
                
                // Send transform span to Zipkin
                const transformSpanId = generateSpanId();
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
                  const hasProtocol = sub.invokeEndpoint.startsWith('http://') || sub.invokeEndpoint.startsWith('https://');
                  const normalizedPath = sub.invokeEndpoint.startsWith('/') ? sub.invokeEndpoint : `/${sub.invokeEndpoint}`;
                  const portPart = servicePort ? `:${servicePort}` : '';
                  const invokeUrl = hasProtocol ? sub.invokeEndpoint : `http://${serviceId}${portPart}${normalizedPath}`;

                  try {
                    const invokeStart = Date.now();
                    await fetch(invokeUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'traceparent': cloudEvent.traceparent
                      },
                      body: JSON.stringify(cloudEvent)
                    });
                    
                    // Send invoke span to Zipkin
                    const invokeSpanId = generateSpanId();
                    await sendZipkinSpan(
                      traceContext,
                      invokeSpanId,
                      transformSpanId,
                      `invoke ${invokeUrl}`,
                      invokeStart,
                      Date.now() - invokeStart,
                      { 'http.url': invokeUrl, 'http.method': 'POST' }
                    );
                    
                    console.log(`[SIDECAR] Invoked endpoint ${invokeUrl} with trace ID`);
                  } catch (err) {
                    console.error(`[SIDECAR] Error invoking endpoint:`, err);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`[SIDECAR] Error reading from stream '${sub.topic}':`, err);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
        }
      }
    };
    
    // Start reading stream in background
    readStream().catch(err => console.error(`[SIDECAR] Stream reader error for '${sub.topic}':`, err));
    console.log(`[SIDECAR] Subscribed to stream '${sub.topic}'`);
  }
}

async function initPublishClient() {
  await redisPubClient.connect();
}

// Command invocation route
app.post('/invoke/:command', async (req, res) => {
  const startTime = Date.now();
  const commandName = req.params.command;
  const commandEntry = (config.inbound || []).find(entry => entry.kind === 'command' && entry.command === commandName);
  
  if (!commandEntry) {
    return res.status(404).json({ error: 'Unknown command', command: commandName });
  }
  
  // Extract or generate trace context
  const traceContext = req.headers.traceparent || `00-${uuidv4().replace(/-/g, '')}-${generateSpanId()}-01`;
  console.log(`[SIDECAR] Invoking command '${commandName}' with trace ID: ${traceContext}`);
  
  try {
    // Send receive span to Zipkin
    const receiveSpanId = generateSpanId();
    await sendZipkinSpan(
      traceContext,
      receiveSpanId,
      null,
      `invoke command ${commandName}`,
      startTime,
      Date.now() - startTime,
      { 'kind': 'command', 'transport': 'http', 'command.name': commandName, 'http.method': 'POST' }
    );
    
    // Transform the message
    const transformStart = Date.now();
    const transformed = transforms[commandEntry.transform](req.body);
    
    // Send transform span to Zipkin
    const transformSpanId = generateSpanId();
    await sendZipkinSpan(
      traceContext,
      transformSpanId,
      receiveSpanId,
      `transform ${commandEntry.transform}`,
      transformStart,
      Date.now() - transformStart,
      { 'transform.function': commandEntry.transform, 'kind': 'command' }
    );
    
    // Wrap in CloudEvents
    const cloudEvent = wrapInCloudEvents(
      transformed,
      req.headers['x-service-name'] || 'unknown-caller',
      commandName,
      'command.invoke',
      traceContext
    );
    
    console.log(`[SIDECAR] CloudEvent created for command (ID: ${cloudEvent.id})`);
    
    // Invoke service endpoint
    const hasProtocol = commandEntry.invokeEndpoint.startsWith('http://') || commandEntry.invokeEndpoint.startsWith('https://');
    const normalizedPath = commandEntry.invokeEndpoint.startsWith('/') ? commandEntry.invokeEndpoint : `/${commandEntry.invokeEndpoint}`;
    const portPart = servicePort ? `:${servicePort}` : '';
    const invokeUrl = hasProtocol ? commandEntry.invokeEndpoint : `http://${serviceId}${portPart}${normalizedPath}`;
    
    const invokeStart = Date.now();
    const serviceResponse = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'traceparent': cloudEvent.traceparent
      },
      body: JSON.stringify(cloudEvent)
    });
    
    // Send invoke span to Zipkin
    const invokeSpanId = generateSpanId();
    await sendZipkinSpan(
      traceContext,
      invokeSpanId,
      transformSpanId,
      `invoke service ${invokeUrl}`,
      invokeStart,
      Date.now() - invokeStart,
      { 'http.url': invokeUrl, 'http.method': 'POST', 'http.status_code': serviceResponse.status, 'kind': 'command' }
    );
    
    console.log(`[SIDECAR] Invoked service ${invokeUrl}, status: ${serviceResponse.status}`);
    
    // Return service response to caller
    const responseBody = await serviceResponse.json().catch(() => ({}));
    res.status(serviceResponse.status).json({
      status: 'command-invoked',
      command: commandName,
      serviceResponse: responseBody,
      traceparent: traceContext
    });
    
  } catch (err) {
    console.error(`[SIDECAR] Error invoking command '${commandName}':`, err);
    res.status(500).json({ error: 'Command invocation failed', message: err.message });
  }
});

app.post('/publish/:topic', async (req, res) => {
  const startTime = Date.now();
  const topic = req.params.topic;
  const pub = (config.outbound || []).find(p => p.topic === topic);
  if (!pub) return res.status(404).send('Unknown topic');
  
  // Extract trace context from request headers if present
  const traceContext = req.headers.traceparent || null;
  console.log(`[SIDECAR] Publishing to topic '${topic}' with trace ID: ${traceContext}`);
  
  // Send receive span to Zipkin
  const receiveSpanId = generateSpanId();
  await sendZipkinSpan(
    traceContext,
    receiveSpanId,
    null,
    `POST /publish/${topic}`,
    startTime,
    Date.now() - startTime,
    { 'kind': 'event', 'transport': 'http', 'event.topic': topic, 'http.method': 'POST', 'http.path': `/publish/${topic}` }
  );
  
  // Transform the message
  const transformStart = Date.now();
  const transformed = transforms[pub.transform](req.body);
  
  // Send transform span to Zipkin
  const transformSpanId = generateSpanId();
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
  
  // Publish to Redis Stream
  const publishStart = Date.now();
  const streamId = await redisPubClient.xAdd(topic, '*', { data: JSON.stringify(cloudEvent) });
  
  // Send publish span to Zipkin
  const publishSpanId = generateSpanId();
  await sendZipkinSpan(
    traceContext,
    publishSpanId,
    transformSpanId,
    `publish event ${topic}`,
    publishStart,
    Date.now() - publishStart,
    { 'kind': 'event', 'transport': 'redis', 'event.topic': topic, 'message.broker': 'redis-stream', 'stream.id': streamId }
  );
  
  console.log(`[SIDECAR] Published to Redis stream '${topic}' (ID: ${streamId})`);
  
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

