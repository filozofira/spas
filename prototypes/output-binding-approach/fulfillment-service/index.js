const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

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
app.post('/incoming', (req, res) => {
  const traceId = extractTraceContext(req.body);
  
  console.log('[FULFILLMENT-SERVICE] ===== MESSAGE RECEIVED FROM SIDECAR =====');
  console.log(`[FULFILLMENT-SERVICE] Trace ID: ${traceId}`);
  console.log('[FULFILLMENT-SERVICE] Full Message:', JSON.stringify(req.body, null, 2));
  
  // Extract the actual data from CloudEvents wrapper
  const data = req.body.data || req.body;
  console.log('[FULFILLMENT-SERVICE] Order Data:', JSON.stringify(data, null, 2));
  
  // Process the order (fulfill it)
  const orderId = data.orderId || 'unknown';
  console.log(`[FULFILLMENT-SERVICE] Processing order: ${orderId}`);
  console.log('[FULFILLMENT-SERVICE] Order fulfilled successfully');
  
  // ...process message and optionally publish new message via sidecar...
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
