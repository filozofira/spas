const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

// Health endpoint for DAPR sidecar
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Endpoint for transformer-sidecar to invoke
app.post('/incoming', (req, res) => {
  console.log('[SUBSCRIBER] ===== MESSAGE RECEIVED FROM SIDECAR =====');
  console.log('[SUBSCRIBER] Received:', JSON.stringify(req.body, null, 2));
  // ...process message and optionally publish new message via sidecar...
  res.status(200).send('OK');
});

const port = process.env.PORT || 6000;

app.listen(port, () => {
  console.log(`[SUBSCRIBER] Listening on port ${port}`);
});
