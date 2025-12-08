const fetch = require('node-fetch');

const daprHost = process.env.DAPR_HTTP_HOST || 'publisher-sidecar';
const daprPort = process.env.DAPR_HTTP_PORT || 3502;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSidecar(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://${daprHost}:${daprPort}/v1.0/metadata`, {
        method: 'GET'
      });
      if (res.ok) {
        console.log('[PUBLISHER] Sidecar is ready');
        return true;
      }
    } catch (e) {
      console.log(`[PUBLISHER] Waiting for sidecar... (${i + 1}/${maxRetries})`);
    }
    await delay(1000);
  }
  throw new Error('Sidecar did not become ready in time');
}

async function publishMessage(messageId) {
  const messageData = {
    orderId: `ORDER-${messageId}`,
    amount: Math.random() * 1000,
    timestamp: new Date().toISOString()
  };

  // Use output binding to send to transformer
  const url = `http://${daprHost}:${daprPort}/v1.0/bindings/http-transformer`;
  console.log(`[PUBLISHER] Sending message ${messageId} through output binding...`);
  console.log(`[PUBLISHER] Message data:`, JSON.stringify(messageData, null, 2));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'post',
      data: messageData,
      metadata: {
        messageId: messageId.toString()
      }
    })
  });

  console.log(`[PUBLISHER] Output binding status for message ${messageId}: ${res.status}`);
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
