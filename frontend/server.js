const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 8004);
const services = {
  '/api/restaurant': process.env.RESTAURANT_API_URL || 'http://restaurant-service:8001',
  '/api/menu': process.env.MENU_API_URL || 'http://menu-service:8002',
  '/api/order': process.env.ORDER_API_URL || 'http://order-service:8003'
};

// Same-origin API proxy avoids browser CORS errors and works with Kubernetes DNS.
for (const [prefix, target] of Object.entries(services)) {
  app.use(prefix, async (req, res) => {
    try {
      const upstreamUrl = `${target}${req.originalUrl.slice(prefix.length) || '/'}`;
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      const init = { method: req.method, headers, redirect: 'manual' };
      if (!['GET', 'HEAD'].includes(req.method)) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        if (chunks.length) init.body = Buffer.concat(chunks);
      }
      const upstream = await fetch(upstreamUrl, init);
      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection', 'content-encoding'].includes(key.toLowerCase())) res.setHeader(key, value);
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.end(body);
    } catch (err) {
      console.error(`Proxy error for ${prefix}:`, err.message);
      res.status(502).json({ error: `Backend service unavailable for ${prefix}. Check Kubernetes service health.` });
    }
  });
}

app.get('/health', (_req, res) => res.json({ service: 'Food Ordering Frontend', status: 'UP' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('*path', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Frontend listening on port ${PORT}`));
