const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const configPath = process.env.CONFIG_PATH || path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const transforms = require('./transform');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));


const REDIS_HOST = config.redis.host;
const REDIS_PORT = config.redis.port;
const redisSubClient = redis.createClient({ socket: { host: REDIS_HOST, port: REDIS_PORT } });
const redisPubClient = redis.createClient({ socket: { host: REDIS_HOST, port: REDIS_PORT } });

redisSubClient.on('error', err => console.error('[SIDECAR] Redis SUB error:', err));
redisPubClient.on('error', err => console.error('[SIDECAR] Redis PUB error:', err));

async function subscribeTopics() {
  await redisSubClient.connect();
  for (const sub of config.subscriptions) {
    await redisSubClient.subscribe(sub.topic, async (message) => {
      console.log(`[SIDECAR] Received message on topic '${sub.topic}':`, message);
      let parsed;
      try { parsed = JSON.parse(message); } catch { parsed = message; }
      const transformed = transforms[sub.transform](parsed);
      if (sub.invokeEndpoint) {
        try {
          await fetch(sub.invokeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transformed)
          });
          console.log(`[SIDECAR] Invoked endpoint ${sub.invokeEndpoint}`);
        } catch (err) {
          console.error(`[SIDECAR] Error invoking endpoint:`, err);
        }
      }
    });
    console.log(`[SIDECAR] Subscribed to topic '${sub.topic}'`);
  }
}

async function initPublishClient() {
  await redisPubClient.connect();
}

app.post('/publish/:topic', async (req, res) => {
  const topic = req.params.topic;
  const pub = config.publications.find(p => p.topic === topic);
  if (!pub) return res.status(404).send('Unknown topic');
  const transformed = transforms[pub.transform](req.body);
  await redisPubClient.publish(topic, JSON.stringify(transformed));
  res.status(200).json({ status: 'published', topic });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const port = process.env.PORT || 7000;
app.listen(port, async () => {
  console.log(`[SIDECAR] Listening on port ${port}`);
  await initPublishClient();
  await subscribeTopics();
});
