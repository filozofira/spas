const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

const SERVICE_NAME = process.env.SERVICE_NAME || 'fulfillment-service';
const SIDECAR_HOST = `${SERVICE_NAME}-sidecar`;
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7002;

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

// Endpoint for fulfillment-service-sidecar to invoke
app.post('/incoming', async (req, res) => {
  const traceId = extractTraceContext(req.body);
  
  console.log('[FULFILLMENT-SERVICE] ===== MESSAGE RECEIVED FROM SIDECAR =====');
  console.log(`[FULFILLMENT-SERVICE] Trace ID: ${traceId}`);
  console.log('[FULFILLMENT-SERVICE] Full Message:', JSON.stringify(req.body, null, 2));
  
  // Extract the actual data from CloudEvents wrapper (nested twice)
  const cloudEventData = req.body.data || req.body;
  const innerData = (cloudEventData.data && cloudEventData.data.data) || cloudEventData.data || cloudEventData;
  console.log('[FULFILLMENT-SERVICE] Order Data:', JSON.stringify(innerData, null, 2));
  
  // Process the order (fulfill it)
  const orderId = innerData.orderId || 'unknown';
  console.log(`[FULFILLMENT-SERVICE] Processing order: ${orderId}`);
  console.log('[FULFILLMENT-SERVICE] Order fulfilled successfully');
  
  // Publish fulfillment event back through sidecar
  try {
    const fulfillmentData = {
      orderId: orderId,
      status: 'fulfilled',
      amount: innerData.amount,
      timestamp: new Date().toISOString()
    };
    
    const publishUrl = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/publish/orders-processed`;
    console.log(`[FULFILLMENT-SERVICE] Publishing fulfillment event to sidecar...`);
    console.log(`[FULFILLMENT-SERVICE] Publishing to: ${publishUrl}`);
    
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'traceparent': traceId,
        'x-service-name': 'fulfillment-service'
      },
      body: JSON.stringify(fulfillmentData)
    });
    
    console.log(`[FULFILLMENT-SERVICE] Sidecar publish status: ${publishRes.status}`);
    if (!publishRes.ok) {
      console.error('[FULFILLMENT-SERVICE] Publish error:', await publishRes.text());
    } else {
      const publishResponse = await publishRes.json();
      console.log('[FULFILLMENT-SERVICE] Fulfillment event published successfully');
      console.log('[FULFILLMENT-SERVICE] Publish response:', JSON.stringify(publishResponse, null, 2));
    }
  } catch (err) {
    console.error('[FULFILLMENT-SERVICE] Error publishing fulfillment event:', err.message);
  }
  
  res.status(200).json({
    status: 'ok',
    processedOrderId: orderId,
    traceparent: traceId
  });
});

const port = process.env.PORT || 5002;

app.listen(port, () => {
  console.log(`[FULFILLMENT-SERVICE] Listening on port ${port}`);
});
