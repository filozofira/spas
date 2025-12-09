const fetch = require('node-fetch');
const { randomBytes } = require('crypto');

const SIDECAR_HOST = process.env.SIDECAR_HOST || 'order-service-sidecar';
const SIDECAR_PORT = process.env.SIDECAR_PORT || 7001;

// Generate W3C Trace Context compliant traceparent
function generateTraceContext() {
  const version = '00';
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  const traceFlags = '01'; // sampled
  return `${version}-${traceId}-${spanId}-${traceFlags}`;
}

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
        console.log('[ORDER-CLIENT] Order service sidecar is ready');
        return true;
      }
    } catch (e) {
      console.log(`[ORDER-CLIENT] Waiting for sidecar... (${i + 1}/${maxRetries})`);
    }
    await delay(1000);
  }
  throw new Error('Order service sidecar did not become ready in time');
}

async function invokeCommand(commandName, orderData) {
  const traceparent = generateTraceContext();
  
  console.log(`[ORDER-CLIENT] Invoking command '${commandName}'...`);
  console.log(`[ORDER-CLIENT] Trace ID: ${traceparent}`);
  console.log(`[ORDER-CLIENT] Order data:`, JSON.stringify(orderData, null, 2));

  const url = `http://${SIDECAR_HOST}:${SIDECAR_PORT}/invoke/${commandName}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'traceparent': traceparent,
        'x-service-name': 'order-client'
      },
      body: JSON.stringify(orderData)
    });

    console.log(`[ORDER-CLIENT] Command status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[ORDER-CLIENT] Error:', errorText);
      return;
    }
    
    const response = await res.json();
    console.log(`[ORDER-CLIENT] Command response:`, JSON.stringify(response, null, 2));
    console.log(`[ORDER-CLIENT] ✅ Command '${commandName}' executed successfully`);
    
  } catch (err) {
    console.error(`[ORDER-CLIENT] Failed to invoke command:`, err.message);
  }
}

async function main() {
  try {
    await waitForSidecar();
    
    console.log('[ORDER-CLIENT] Starting to invoke create-order commands...\n');
    
    // Invoke 3 create-order commands
    for (let i = 1; i <= 3; i++) {
      const orderData = {
        orderId: `ORDER-${i}`,
        amount: Math.round(Math.random() * 1000 * 100) / 100,
        timestamp: new Date().toISOString()
      };
      
      await invokeCommand('create-order', orderData);
      console.log(''); // blank line for readability
      
      if (i < 3) {
        await delay(2000); // Wait between commands
      }
    }
    
    console.log('[ORDER-CLIENT] All commands invoked. Exiting in 5 seconds...');
    await delay(5000);
    console.log('[ORDER-CLIENT] Done.');
    process.exit(0);
    
  } catch (err) {
    console.error('[ORDER-CLIENT] Fatal error:', err.message);
    process.exit(1);
  }
}

main();
