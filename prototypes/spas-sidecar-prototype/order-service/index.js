const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { randomBytes } = require('crypto');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

const SERVICE_NAME = process.env.SERVICE_NAME || 'order-service';
const SIDECAR_HOST = `${SERVICE_NAME}-sidecar`;
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7001;
const ZIPKIN_URL = process.env.ZIPKIN_URL;

// Generate span ID for Zipkin
function generateSpanId() {
  return Math.random().toString(16).substr(2, 16).padEnd(16, '0');
}

// Send span to Zipkin
async function sendZipkinSpan(traceId, spanId, parentSpanId, spanName, timestamp, duration, tags = {}) {
  if (!ZIPKIN_URL) return;
  
  try {
    let zipkinTraceId = traceId;
    let zipkinParentId = parentSpanId;
    
    if (traceId && traceId.startsWith('00-')) {
      const parts = traceId.split('-');
      zipkinTraceId = parts[1];
    }
    
    const span = {
      traceId: zipkinTraceId,
      id: spanId,
      name: spanName,
      timestamp: timestamp * 1000,
      duration: duration * 1000,
      localEndpoint: { serviceName: SERVICE_NAME },
      tags: tags
    };
    
    if (zipkinParentId) {
      span.parentId = zipkinParentId;
    }
    
    await fetch(`${ZIPKIN_URL}/api/v2/spans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([span])
    });
  } catch (err) {
    if (!err.message.includes('ECONNREFUSED')) {
      console.error('[ORDER-SERVICE] Error sending span to Zipkin:', err.message);
    }
  }
}

// Generate W3C Trace Context compliant traceparent
function generateTraceContext() {
  const version = '00';
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  const traceFlags = '01'; // sampled
  return `${version}-${traceId}-${spanId}-${traceFlags}`;
}

// Extract trace context from CloudEvents message
function extractTraceContext(message) {
  if (message && message.traceparent) {
    return message.traceparent;
  }
  return 'no-trace-id';
}

// Health endpoint for sidecar
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Endpoint for order-service-sidecar to invoke with processed orders
app.post('/incoming', async (req, res) => {
  const startTime = Date.now();
  const traceId = extractTraceContext(req.body);
  const spanId = generateSpanId();
  const parentSpanId = req.headers['x-parent-span-id'] || null;
  
  // Check if this is a command invocation or event response
  const messageType = req.body.type || '';
  const subject = req.body.subject || '';
  
  if (messageType === 'command.invoke' && subject === 'create-order') {
    // This is a command to create an order - publish it to Redis
    console.log('[ORDER-SERVICE] ===== COMMAND RECEIVED: CREATE ORDER =====');
    console.log(`[ORDER-SERVICE] Trace ID: ${traceId}`);
    console.log('[ORDER-SERVICE] Full Message:', JSON.stringify(req.body, null, 2));
    
    const cloudEventData = req.body.data || req.body;
    const orderData = cloudEventData.data || cloudEventData;
    const orderId = orderData.orderId || 'unknown';
    
    console.log(`[ORDER-SERVICE] Creating order: ${orderId}`);
    
    try {
      const publishStartTime = Date.now();
      const publishSpanId = generateSpanId();
      
      const publishUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/publish/orders-requested`;
      console.log(`[ORDER-SERVICE] Publishing order to sidecar: ${publishUrl}`);
      
      const publishRes = await fetch(publishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'traceparent': traceId,
          'x-service-name': SERVICE_NAME
        },
        body: JSON.stringify(orderData)
      });
      
      const publishDuration = Date.now() - publishStartTime;
      await sendZipkinSpan(
        traceId,
        publishSpanId,
        parentSpanId,
        'publish order',
        publishStartTime,
        publishDuration,
        { 'service.operation': 'publish-order', 'orderId': orderId, 'http.status_code': publishRes.status }
      );
      
      console.log(`[ORDER-SERVICE] Sidecar publish status: ${publishRes.status}`);
      if (publishRes.ok) {
        const publishResponse = await publishRes.json();
        console.log('[ORDER-SERVICE] Order published successfully');
        console.log('[ORDER-SERVICE] Publish response:', JSON.stringify(publishResponse, null, 2));
      }
    } catch (err) {
      console.error('[ORDER-SERVICE] Error publishing order:', err.message);
    }
    
    res.status(200).json({
      status: 'ok',
      processedOrderId: orderId,
      traceparent: traceId
    });
  } else {
    // This is a fulfillment response event
    console.log('[ORDER-SERVICE] ===== PROCESSED ORDER RECEIVED FROM FULFILLMENT =====');
    console.log(`[ORDER-SERVICE] Trace ID: ${traceId}`);
    console.log('[ORDER-SERVICE] Full Message:', JSON.stringify(req.body, null, 2));
    
    const cloudEventData = req.body.data || req.body;
    const innerData = (cloudEventData.data && cloudEventData.data.data) || cloudEventData.data || cloudEventData;
    console.log('[ORDER-SERVICE] Processed Order Data:', JSON.stringify(innerData, null, 2));
    
    const orderId = innerData.orderId || 'unknown';
    const status = innerData.status || 'unknown';
    console.log(`[ORDER-SERVICE] Order ${orderId} has been ${status}`);
    
    const duration = Date.now() - startTime;
    await sendZipkinSpan(
      traceId,
      spanId,
      parentSpanId,
      'process fulfillment response',
      startTime,
      duration,
      { 'service.operation': 'process-response', 'orderId': orderId, 'status': status, 'http.method': 'POST', 'http.path': '/incoming' }
    );
    
    res.status(200).json({
      status: 'ok',
      processedOrderId: orderId,
      traceparent: traceId
    });
  }
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSidecar(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://${SIDECAR_HOST}:${SIDECAR_PORT}/health`, {
        method: 'GET'
      });
      if (res.ok) {
        console.log('[ORDER-SERVICE] SPAS sidecar is ready');
        return true;
      }
    } catch (e) {
      console.log(`[ORDER-SERVICE] Waiting for SPAS sidecar... (${i + 1}/${maxRetries})`);
    }
    await delay(1000);
  }
  throw new Error('SPAS sidecar did not become ready in time');
}

async function publishMessage(messageId) {
  const traceparent = generateTraceContext();
  const publishSpanId = generateSpanId();
  const startTime = Date.now();
  
  const messageData = {
    orderId: `ORDER-${messageId}`,
    amount: Math.random() * 1000,
    timestamp: new Date().toISOString()
  };

  // Send to order-service-sidecar
  const url = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/publish/orders-requested`;
  console.log(`[ORDER-SERVICE] Sending message ${messageId} to sidecar...`);
  console.log(`[ORDER-SERVICE] Trace ID: ${traceparent}`);
  console.log(`[ORDER-SERVICE] Message data:`, JSON.stringify(messageData, null, 2));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'traceparent': traceparent,
      'x-service-name': 'order-service'
    },
    body: JSON.stringify(messageData)
  });

  const duration = Date.now() - startTime;
  await sendZipkinSpan(
    traceparent,
    publishSpanId,
    null,
    'publish order',
    startTime,
    duration,
    { 'service.operation': 'publish-order', 'orderId': messageData.orderId, 'http.status_code': res.status }
  );

  console.log(`[ORDER-SERVICE] Sidecar publish status for message ${messageId}: ${res.status}`);
  if (!res.ok) {
    console.error('[ORDER-SERVICE] Error:', await res.text());
  } else {
    const response = await res.json();
    console.log(`[ORDER-SERVICE] Message ${messageId} sent successfully`);
    console.log(`[ORDER-SERVICE] Response:`, JSON.stringify(response, null, 2));
  }
}

async function main() {
  try {
    await waitForSidecar();
    
    // Start Express server
    const port = process.env.PORT || 5001;
    app.listen(port, () => {
      console.log(`[ORDER-SERVICE] Listening on port ${port}`);
    });
    
    console.log('[ORDER-SERVICE] Starting to publish messages...');
    for (let i = 1; i <= 5; i++) {
      await publishMessage(i);
      await delay(2000);
    }
    
    console.log('[ORDER-SERVICE] Done publishing messages');
  } catch (err) {
    console.error('[ORDER-SERVICE] Fatal error:', err.message);
    process.exit(1);
  }
}

main();
