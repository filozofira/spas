const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'fulfillment-service';
const SIDECAR_HOST = process.env.SIDECAR_HOST || `${SERVICE_NAME}-sidecar`;
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7010;
const PORT = process.env.PORT || 8080;

// In-memory fulfillment tracking
const fulfillments = [];

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

// Incoming events from sidecar (StockReserved)
app.post('/incoming', async (req, res) => {
  const event = req.body;
  const traceparent = req.headers['traceparent'];
  const correlationId = req.headers['x-correlation-id'];
  const eventType = req.headers['x-event-type'];

  console.log(`[${SERVICE_NAME}] Received event: ${eventType}`);
  console.log(`[${SERVICE_NAME}] Trace: ${traceparent}`);
  console.log(`[${SERVICE_NAME}] Payload:`, JSON.stringify(event, null, 2));

  // Extract order information from StockReserved event
  const orderId = event.orderId;
  const reservations = event.reservations || [];

  if (!orderId) {
    console.error(`[${SERVICE_NAME}] Missing orderId in event`);
    return res.status(400).json({ error: 'Missing orderId' });
  }

  // Simulate fulfillment processing
  const fulfillmentId = `fulf-${Date.now()}`;
  const fulfillment = {
    fulfillmentId,
    orderId,
    items: reservations.map(r => ({
      productId: r.productId,
      quantity: r.quantity
    })),
    status: 'completed',
    completedAt: new Date().toISOString()
  };

  fulfillments.push(fulfillment);
  console.log(`[${SERVICE_NAME}] Fulfillment created: ${fulfillmentId} for order ${orderId}`);

  // Publish FulfillmentCompleted event back through sidecar
  try {
    const publishPayload = {
      fulfillmentId: fulfillment.fulfillmentId,
      orderId: fulfillment.orderId,
      status: fulfillment.status,
      completedAt: fulfillment.completedAt
    };

    const sidecarUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/publish`;
    console.log(`[${SERVICE_NAME}] Publishing FulfillmentCompleted to ${sidecarUrl}`);

    const response = await fetch(sidecarUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': SERVICE_NAME,
        'x-event-type': 'com.ecommerce.fulfillment.completed',
        'traceparent': traceparent || generateTraceParent(),
        'x-correlation-id': correlationId || orderId
      },
      body: JSON.stringify(publishPayload)
    });

    if (!response.ok) {
      console.error(`[${SERVICE_NAME}] Failed to publish event: ${response.status}`);
    } else {
      console.log(`[${SERVICE_NAME}] FulfillmentCompleted event published successfully`);
    }
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error publishing event:`, error.message);
  }

  res.json({ status: 'processed', fulfillmentId });
});

// Query endpoint - list fulfillments
app.get('/fulfillments', (_req, res) => {
  res.json(fulfillments);
});

// Query endpoint - get specific fulfillment
app.get('/fulfillments/:id', (req, res) => {
  const fulfillment = fulfillments.find(f => f.fulfillmentId === req.params.id);
  if (fulfillment) {
    res.json(fulfillment);
  } else {
    res.status(404).json({ error: 'Fulfillment not found' });
  }
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
});
