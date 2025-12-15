const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'api-gateway';
const SIDECAR_HOST = process.env.SIDECAR_HOST || `${SERVICE_NAME}-sidecar`;
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7000;
const PORT = process.env.PORT || 3000;

// Sidecar behavior mode (set by domain deployment)
const SIDECAR_MODE = process.env.SIDECAR_MODE || 'sync'; // 'sync' | 'async'

console.log(`[${SERVICE_NAME}] Starting in ${SIDECAR_MODE} mode`);

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    service: SERVICE_NAME, 
    mode: SIDECAR_MODE,
    timestamp: new Date().toISOString() 
  });
});

// POST /orders - Create order
// E-Commerce: sidecar uses HTTP proxy mode (sync response)
// B2B: sidecar publishes event (async, returns 202)
app.post('/orders', async (req, res) => {
  const { customerId, items, total } = req.body;

  if (!customerId || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields: customerId, items, total' });
  }

  const traceparent = generateTraceParent();
  const correlationId = `order-${Date.now()}`;

  console.log(`[${SERVICE_NAME}] POST /orders - Mode: ${SIDECAR_MODE}`);
  console.log(`[${SERVICE_NAME}] Trace: ${traceparent}`);

  try {
    if (SIDECAR_MODE === 'sync') {
      // E-Commerce: Sidecar proxies HTTP request to order-service sidecar
      const sidecarUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/invoke/create-order`;
      
      console.log(`[${SERVICE_NAME}] Invoking command via sidecar: ${sidecarUrl}`);

      const response = await fetch(sidecarUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'traceparent': traceparent,
          'x-correlation-id': correlationId
        },
        body: JSON.stringify({ customerId, items, total })
      });

      const result = await response.json();
      
      return res.status(response.status).json(result);

    } else {
      // B2B: Sidecar publishes OrderRequested event
      const sidecarUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/publish`;
      
      console.log(`[${SERVICE_NAME}] Publishing event via sidecar: ${sidecarUrl}`);

      const response = await fetch(sidecarUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-name': SERVICE_NAME,
          'x-event-type': 'com.b2b.order.requested',
          'traceparent': traceparent,
          'x-correlation-id': correlationId
        },
        body: JSON.stringify({ customerId, items, total })
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to publish order request' });
      }

      // Async mode - return 202 Accepted
      return res.status(202).json({ 
        status: 'accepted', 
        correlationId,
        message: 'Order request submitted for processing'
      });
    }
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error:`, error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /products - Browse products (always sync via sidecar)
app.get('/products', async (req, res) => {
  const traceparent = generateTraceParent();
  const category = req.query.category;

  console.log(`[${SERVICE_NAME}] GET /products`);
  console.log(`[${SERVICE_NAME}] Trace: ${traceparent}`);

  try {
    // Sidecar proxies to product-service sidecar (HTTP)
    const sidecarUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/invoke/list-products${category ? `?category=${category}` : ''}`;
    
    console.log(`[${SERVICE_NAME}] Invoking query via sidecar: ${sidecarUrl}`);

    const response = await fetch(sidecarUrl, {
      method: 'GET',
      headers: {
        'traceparent': traceparent
      }
    });

    const products = await response.json();
    
    return res.status(response.status).json(products);

  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error:`, error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    service: SERVICE_NAME,
    mode: SIDECAR_MODE,
    endpoints: [
      'POST /orders',
      'GET /products',
      'GET /health'
    ]
  });
});

// Generate W3C trace context
function generateTraceParent() {
  const version = '00';
  const traceId = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const spanId = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const flags = '01';
  return `${version}-${traceId}-${spanId}-${flags}`;
}

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  console.log(`[${SERVICE_NAME}] Sidecar: ${SIDECAR_HOST}:${SIDECAR_PORT}`);
  console.log(`[${SERVICE_NAME}] Mode: ${SIDECAR_MODE}`);
});
