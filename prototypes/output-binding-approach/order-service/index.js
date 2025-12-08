const fetch = require('node-fetch');

const SIDECAR_HOST = 'publisher-transformer-sidecar';
const SIDECAR_PORT = 7001;

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
        console.log('[PUBLISHER] Transformer sidecar is ready');
        return true;
      }
    } catch (e) {
      console.log(`[PUBLISHER] Waiting for transformer sidecar... (${i + 1}/${maxRetries})`);
    }
    await delay(1000);
  }
  throw new Error('Transformer sidecar did not become ready in time');
}

async function publishMessage(messageId) {
  const messageData = {
    orderId: `ORDER-${messageId}`,
    amount: Math.random() * 1000,
    timestamp: new Date().toISOString()
  };

  // Send to publisher-transformer-sidecar
  const url = `http://publisher-transformer-sidecar:7001/publish/orders-requested`;
  console.log(`[PUBLISHER] Sending message ${messageId} to transformer-sidecar...`);
  console.log(`[PUBLISHER] Message data:`, JSON.stringify(messageData, null, 2));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  });

  console.log(`[PUBLISHER] Transformer-sidecar publish status for message ${messageId}: ${res.status}`);
  if (!res.ok) {
    console.error('[PUBLISHER] Error:', await res.text());
  } else {
    console.log(`[PUBLISHER] Message ${messageId} sent successfully`);
  }
}

async function main() {
  try {
    await waitForSidecar();
    
    console.log('[PUBLISHER] Starting to publish messages...');
    for (let i = 1; i <= 5; i++) {
      await publishMessage(i);
      await delay(2000);
    }
    
    console.log('[PUBLISHER] Done publishing messages');
  } catch (err) {
    console.error('[PUBLISHER] Fatal error:', err.message);
    process.exit(1);
  }
}

main();
