const express = require('express');
const { resetDatabase } = require('../database/reset');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Endpoint para reset do banco (APENAS DESENVOLVIMENTO)
router.post('/reset-database', authenticateToken, requireAdmin, async (req, res) => {
  // Verificação adicional de segurança
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      message: 'Reset de banco não permitido em produção' 
    });
  }

  try {
    console.log(`🔄 Reset do banco solicitado pelo usuário: ${req.user.username}`);
    
    await resetDatabase();
    
    res.json({
      message: 'Reset do banco de dados concluído com sucesso',
      timestamp: new Date().toISOString(),
      reset_by: req.user.username
    });
    
  } catch (error) {
    console.error('Erro durante reset do banco:', error);
    res.status(500).json({
      message: 'Erro durante reset do banco de dados',
      error: error.message
    });
  }
});

// Endpoint para verificar status do banco
router.get('/database-status', authenticateToken, requireAdmin, (req, res) => {
  const { db } = require('../database/init');
  
  const queries = [
    { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'assets', query: 'SELECT COUNT(*) as count FROM assets' },
    { name: 'stores', query: 'SELECT COUNT(*) as count FROM stores' },
    { name: 'movements', query: 'SELECT COUNT(*) as count FROM movements' },
    { name: 'external_report_links', query: 'SELECT COUNT(*) as count FROM external_report_links' }
  ];

  const results = {};
  let completed = 0;

  queries.forEach(({ name, query }) => {
    db.get(query, (err, row) => {
      if (err) {
        results[name] = { error: err.message };
      } else {
        results[name] = { count: row.count };
      }
      
      completed++;
      if (completed === queries.length) {
        res.json({
          database_status: results,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

module.exports = router;