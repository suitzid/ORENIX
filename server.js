require('dotenv').config();

const path = require('path');
const express = require('express');

const app = express();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;

// Проверяем обязательные переменные
const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(
    `Missing environment variables: ${missing.join(', ')}`
  );

  process.exit(1);
}

app.disable('x-powered-by');

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb'
  })
);


// =====================================================
// SUPABASE CONFIG
// =====================================================

// Этот endpoint отдаёт браузеру только публичную конфигурацию.
// SUPABASE_ANON_KEY / publishable key можно использовать на клиенте.
// SERVICE_ROLE KEY сюда НЕ добавлять.
app.get('/config.js', (_req, res) => {
  res
    .type('application/javascript')
    .set('Cache-Control', 'no-store');

  res.send(`
window.__ORX_CONFIG__ = ${JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  })};
`);
});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: process.env.APP_NAME || 'Orenix Messenger',
    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY
    ),
    time: new Date().toISOString()
  });
});


// =====================================================
// STATIC FRONTEND
// =====================================================

app.use(
  express.static(ROOT, {
    index: 'index.html',
    extensions: ['html'],
    maxAge:
      process.env.NODE_ENV === 'production'
        ? '1h'
        : 0
  })
);


// =====================================================
// SPA FALLBACK
// =====================================================

app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.path === '/config.js'
  ) {
    return next();
  }

  res.sendFile(
    path.join(ROOT, 'index.html')
  );
});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    error: 'Internal server error'
  });
});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, HOST, () => {
  console.log(
    `Orenix Messenger: http://localhost:${PORT}`
  );

  console.log(
    `Supabase: ${process.env.SUPABASE_URL}`
  );
});
