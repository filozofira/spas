const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'subscription-service';
const SIDECAR_HOST = process.env.SIDECAR_HOST || `${SERVICE_NAME}-sidecar`;
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7011;
const PORT = process.env.PORT || 8080;

// In-memory subscription tracking
const subscriptions = [];

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

// Incoming events from sidecar (OrderCreated in B2B context)
app.post('/incoming', async (req, res) => {
  const event = req.body;
  const traceparent = req.headers['traceparent'];
  const correlationId = req.headers['x-correlation-id'];
  const eventType = req.headers['x-event-type'];

  console.log(`[${SERVICE_NAME}] Received event: ${eventType}`);
  console.log(`[${SERVICE_NAME}] Trace: ${traceparent}`);
  console.log(`[${SERVICE_NAME}] Payload:`, JSON.stringify(event, null, 2));

  // Extract order information from OrderCreated event
  const orderId = event.orderId;
  const customerId = event.customerId;
  const total = event.total;

  if (!orderId || !customerId) {
    console.error(`[${SERVICE_NAME}] Missing orderId or customerId in event`);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Simulate subscription creation (recurring billing setup)
  const subscriptionId = `sub-${Date.now()}`;
  const subscription = {
    subscriptionId,
    orderId,
    customerId,
    amount: total,
    frequency: 'monthly',
    status: 'active',
    activatedAt: new Date().toISOString(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  subscriptions.push(subscription);
  console.log(`[${SERVICE_NAME}] Subscription created: ${subscriptionId} for customer ${customerId}`);

  // Publish SubscriptionActivated event back through sidecar
  try {
    const publishPayload = {
      subscriptionId: subscription.subscriptionId,
      orderId: subscription.orderId,
      customerId: subscription.customerId,
      amount: subscription.amount,
      frequency: subscription.frequency,
      status: subscription.status,
      activatedAt: subscription.activatedAt,
      nextBillingDate: subscription.nextBillingDate
    };

    const sidecarUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/publish`;
    console.log(`[${SERVICE_NAME}] Publishing SubscriptionActivated to ${sidecarUrl}`);

    const response = await fetch(sidecarUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': SERVICE_NAME,
        'x-event-type': 'com.b2b.subscription.activated',
        'traceparent': traceparent || generateTraceParent(),
        'x-correlation-id': correlationId || orderId
      },
      body: JSON.stringify(publishPayload)
    });

    if (!response.ok) {
      console.error(`[${SERVICE_NAME}] Failed to publish event: ${response.status}`);
    } else {
      console.log(`[${SERVICE_NAME}] SubscriptionActivated event published successfully`);
    }
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error publishing event:`, error.message);
  }

  res.json({ status: 'processed', subscriptionId });
});

// Query endpoint - list subscriptions
app.get('/subscriptions', (_req, res) => {
  res.json(subscriptions);
});

// Query endpoint - get specific subscription
app.get('/subscriptions/:id', (req, res) => {
  const subscription = subscriptions.find(s => s.subscriptionId === req.params.id);
  if (subscription) {
    res.json(subscription);
  } else {
    res.status(404).json({ error: 'Subscription not found' });
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
