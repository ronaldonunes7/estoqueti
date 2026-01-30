const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const movementsRoutes = require('./routes/movements');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const storesRoutes = require('./routes/stores');
const externalReportsRoutes = require('./routes/external-reports');
const responsibilityTermsRoutes = require('./routes/responsibility-terms');

const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

// Middleware para debug de JSON
app.use((req, res, next) => {
  if (req.method === 'PATCH' && req.url.includes('/status')) {
    console.log('PATCH request detected:', {
      url: req.url,
      method: req.method,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    })
  }
  next()
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de debug para capturar erros de JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Erro de JSON parsing:');
    console.error('URL:', req.url);
    console.error('Method:', req.method);
    console.error('Headers:', req.headers);
    console.error('Raw body:', req.body);
    return res.status(400).json({ message: 'JSON inválido' });
  }
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/external-reports', externalReportsRoutes);
app.use('/api/responsibility-terms', responsibilityTermsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sistema de Inventário TI - Backend funcionando',
    timestamp: new Date().toISOString(),
    endpoints: {
      frontend: 'http://localhost:5173',
      api: 'http://localhost:3001/api',
      health: 'http://localhost:3001/health'
    }
  });
});

// Rota raiz com informações
app.get('/', (req, res) => {
  res.json({
    name: 'Sistema de Inventário TI - API',
    version: '1.0.0',
    status: 'running',
    message: 'Acesse a aplicação em http://localhost:5173',
    endpoints: {
      frontend: 'http://localhost:5173',
      api: 'http://localhost:3001/api',
      health: 'http://localhost:3001/health'
    }
  });
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // Em desenvolvimento, redirecionar rotas públicas para o frontend
  app.get('/view/report/*', (req, res) => {
    res.redirect(`http://localhost:5173${req.path}`);
  });
}

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Inicializar banco de dados e servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Erro ao inicializar banco de dados:', err);
  process.exit(1);
});