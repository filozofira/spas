const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { randomBytes } = require('crypto');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

const SERVICE_NAME = process.env.SERVICE_NAME || 'order-service';
const SIDECAR_HOST = `${SERVICE_NAME}-sidecar`;
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7001;

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
app.post('/incoming', (req, res) => {
  const traceId = extractTraceContext(req.body);
  
  console.log('[ORDER-SERVICE] ===== PROCESSED ORDER RECEIVED FROM FULFILLMENT =====');
  console.log(`[ORDER-SERVICE] Trace ID: ${traceId}`);
  console.log('[ORDER-SERVICE] Full Message:', JSON.stringify(req.body, null, 2));
  
  // Extract the actual data from CloudEvents wrapper (nested twice)
  const cloudEventData = req.body.data || req.body;
  const innerData = (cloudEventData.data && cloudEventData.data.data) || cloudEventData.data || cloudEventData;
  console.log('[ORDER-SERVICE] Processed Order Data:', JSON.stringify(innerData, null, 2));
  
  // Handle the processed order (correlate with original order, update DB, etc.)
  const orderId = innerData.orderId || 'unknown';
  const status = innerData.status || 'unknown';
  console.log(`[ORDER-SERVICE] Order ${orderId} has been ${status}`);
  
  res.status(200).json({
    status: 'ok',
    processedOrderId: orderId,
    traceparent: traceId
  });
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
