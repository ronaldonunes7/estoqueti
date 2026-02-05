const express = require('express');
const { db, initDatabase } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Função para resetar o banco de dados
async function resetDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Iniciando reset do banco de dados...');
    
    // Lista de todas as tabelas para limpar
    const tables = [
      'movements',
      'responsibility_terms', 
      'external_report_links',
      'assets',
      'stores',
      'users'
    ];
    
    db.serialize(async () => {
      try {
        // 1. Desabilitar foreign keys temporariamente
        db.run('PRAGMA foreign_keys = OFF');
        
        // 2. Limpar todas as tabelas
        console.log('🗑️ Limpando tabelas...');
        for (const table of tables) {
          await new Promise((resolveTable, rejectTable) => {
            db.run(`DELETE FROM ${table}`, (err) => {
              if (err && !err.message.includes('no such table')) {
                console.error(`Erro ao limpar tabela ${table}:`, err.message);
                rejectTable(err);
              } else {
                console.log(`✅ Tabela ${table} limpa`);
                resolveTable();
              }
            });
          });
        }
        
        // 3. Resetar sequences (auto increment)
        console.log('🔄 Resetando sequences...');
        for (const table of tables) {
          await new Promise((resolveSeq, rejectSeq) => {
            db.run(`DELETE FROM sqlite_sequence WHERE name = ?`, [table], (err) => {
              if (err && !err.message.includes('no such table')) {
                console.error(`Erro ao resetar sequence ${table}:`, err.message);
                rejectSeq(err);
              } else {
                console.log(`✅ Sequence ${table} resetada`);
                resolveSeq();
              }
            });
          });
        }
        
        // 4. Reabilitar foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // 5. Criar flag de reset para reinicializar com dados de exemplo
        const flagPath = path.join(__dirname, '../database/.reset_flag');
        try {
          // Criar diretório se não existir
          const flagDir = path.dirname(flagPath);
          if (!fs.existsSync(flagDir)) {
            fs.mkdirSync(flagDir, { recursive: true });
          }
          fs.writeFileSync(flagPath, new Date().toISOString());
          console.log('🚩 Flag de reset criada');
        } catch (flagError) {
          console.warn('Aviso: Não foi possível criar flag de reset:', flagError.message);
        }
        
        // 6. Reinicializar banco com dados padrão
        console.log('🔄 Reinicializando banco com dados padrão...');
        await initDatabase();
        
        console.log('✅ Reset do banco concluído com sucesso!');
        resolve();
        
      } catch (error) {
        console.error('❌ Erro durante reset do banco:', error);
        reject(error);
      }
    });
  });
}

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