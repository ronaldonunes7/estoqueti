const express = require('express')
const router = express.Router()
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { authenticateToken } = require('../middleware/auth')

const dbPath = path.join(__dirname, '../database.sqlite')
const db = new sqlite3.Database(dbPath)

/**
 * Sistema de Limpeza Premium do Banco de Dados
 * Seguindo padrões de Clean Architecture e segurança OWASP
 */

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Acesso negado. Apenas administradores podem executar limpeza do banco.' 
    })
  }
  next()
}

// Configuração das tabelas para limpeza
const CLEANUP_CONFIG = {
  // Tabelas de dados transacionais (podem ser limpas)
  transactional: [
    {
      name: 'movements',
      description: 'Histórico de movimentações de ativos',
      dependencies: []
    },
    {
      name: 'notifications',
      description: 'Notificações do sistema',
      dependencies: []
    }
  ],
  
  // Tabelas de logs e auditoria
  logs: [
    {
      name: 'activity_logs',
      description: 'Logs de atividades do sistema',
      dependencies: []
    },
    {
      name: 'audit_logs',
      description: 'Logs de auditoria',
      dependencies: []
    }
  ],
  
  // Tabelas que devem ser preservadas
  preserve: [
    'users',
    'stores', 
    'assets'
  ]
}

/**
 * GET /api/cleanup/status
 * Verificar status das tabelas antes da limpeza
 */
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  const queries = [
    "SELECT COUNT(*) as count FROM movements",
    "SELECT COUNT(*) as count FROM assets", 
    "SELECT COUNT(*) as count FROM stores",
    "SELECT COUNT(*) as count FROM users",
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ]
  
  const results = {}
  let completed = 0
  
  // Contar registros em cada tabela
  db.get(queries[0], (err, result) => {
    results.movements = err ? 0 : result.count
    if (++completed === 4) sendResponse()
  })
  
  db.get(queries[1], (err, result) => {
    results.assets = err ? 0 : result.count
    if (++completed === 4) sendResponse()
  })
  
  db.get(queries[2], (err, result) => {
    results.stores = err ? 0 : result.count
    if (++completed === 4) sendResponse()
  })
  
  db.get(queries[3], (err, result) => {
    results.users = err ? 0 : result.count
    if (++completed === 4) sendResponse()
  })
  
  // Listar todas as tabelas
  db.all(queries[4], (err, tables) => {
    results.tables = err ? [] : tables.map(t => t.name)
    if (++completed === 4) sendResponse()
  })
  
  function sendResponse() {
    if (completed === 4) {
      res.json({
        status: 'success',
        data: {
          counts: {
            movements: results.movements,
            assets: results.assets,
            stores: results.stores,
            users: results.users
          },
          tables: results.tables,
          canCleanup: results.movements > 0,
          warnings: results.movements > 100 ? ['Muitas movimentações serão perdidas'] : []
        }
      })
    }
  }
})

/**
 * POST /api/cleanup/execute
 * Executar limpeza completa do banco
 */
router.post('/execute', authenticateToken, requireAdmin, (req, res) => {
  const { 
    cleanMovements = true,
    cleanLogs = true,
    resetSequences = true,
    preserveAssets = true,
    preserveStores = true,
    preserveUsers = true,
    confirmationCode 
  } = req.body
  
  // Validação de segurança
  if (confirmationCode !== 'LIMPAR_BANCO_DADOS') {
    return res.status(400).json({
      message: 'Código de confirmação inválido. Use: LIMPAR_BANCO_DADOS'
    })
  }
  
  console.log(`🧹 Iniciando limpeza do banco de dados por ${req.user.username}`)
  
  const operations = []
  const results = {
    cleaned: [],
    preserved: [],
    errors: [],
    sequences_reset: []
  }
  
  db.serialize(() => {
    // Iniciar transação
    db.run('BEGIN TRANSACTION')
    
    try {
      // 1. Limpar movimentações
      if (cleanMovements) {
        db.run('DELETE FROM movements', function(err) {
          if (err) {
            results.errors.push(`Erro ao limpar movements: ${err.message}`)
          } else {
            results.cleaned.push(`movements (${this.changes} registros removidos)`)
            console.log(`✅ Movements limpos: ${this.changes} registros`)
          }
        })
      }
      
      // 2. Limpar logs (se existirem)
      const logTables = ['activity_logs', 'audit_logs', 'notifications', 'logs']
      if (cleanLogs) {
        logTables.forEach(table => {
          db.run(`DELETE FROM ${table}`, function(err) {
            if (err && !err.message.includes('no such table')) {
              results.errors.push(`Erro ao limpar ${table}: ${err.message}`)
            } else if (!err) {
              results.cleaned.push(`${table} (${this.changes} registros removidos)`)
              console.log(`✅ ${table} limpos: ${this.changes} registros`)
            }
          })
        })
      }
      
      // 3. Reset de sequências (auto-increment)
      if (resetSequences) {
        const sequencesToReset = []
        if (cleanMovements) sequencesToReset.push('movements')
        if (cleanLogs) sequencesToReset.push(...logTables)
        
        sequencesToReset.forEach(table => {
          db.run(`DELETE FROM sqlite_sequence WHERE name = ?`, [table], function(err) {
            if (err) {
              results.errors.push(`Erro ao resetar sequência ${table}: ${err.message}`)
            } else if (this.changes > 0) {
              results.sequences_reset.push(table)
              console.log(`🔄 Sequência resetada: ${table}`)
            }
          })
        })
      }
      
      // 4. Verificar tabelas preservadas
      if (preserveUsers) results.preserved.push('users')
      if (preserveAssets) results.preserved.push('assets')  
      if (preserveStores) results.preserved.push('stores')
      
      // Commit da transação
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('❌ Erro no commit:', err)
          db.run('ROLLBACK')
          return res.status(500).json({
            message: 'Erro ao executar limpeza',
            error: err.message
          })
        }
        
        console.log('✅ Limpeza do banco concluída com sucesso!')
        
        // Log de auditoria
        const auditLog = {
          user: req.user.username,
          action: 'DATABASE_CLEANUP',
          timestamp: new Date().toISOString(),
          details: results
        }
        
        console.log('📋 Auditoria:', JSON.stringify(auditLog, null, 2))
        
        res.json({
          status: 'success',
          message: 'Limpeza do banco executada com sucesso',
          results: {
            ...results,
            timestamp: new Date().toISOString(),
            executed_by: req.user.username
          }
        })
      })
      
    } catch (error) {
      console.error('❌ Erro durante limpeza:', error)
      db.run('ROLLBACK')
      res.status(500).json({
        message: 'Erro durante execução da limpeza',
        error: error.message
      })
    }
  })
})

/**
 * POST /api/cleanup/reset-demo-data
 * Resetar para dados de demonstração
 */
router.post('/reset-demo-data', authenticateToken, requireAdmin, (req, res) => {
  console.log(`🎭 Resetando para dados de demonstração por ${req.user.username}`)
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION')
    
    try {
      // Limpar dados existentes
      db.run('DELETE FROM movements')
      db.run('DELETE FROM sqlite_sequence WHERE name = "movements"')
      
      // Resetar status dos ativos para "Disponível"
      db.run(`UPDATE assets SET status = 'Disponível' WHERE status != 'Descartado'`, function(err) {
        if (err) {
          console.error('Erro ao resetar status dos ativos:', err)
        } else {
          console.log(`✅ Status de ativos normalizados: ${this.changes} ativos`)
        }
      })
      
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('❌ Erro no commit:', err)
          db.run('ROLLBACK')
          return res.status(500).json({
            message: 'Erro ao resetar dados demo',
            error: err.message
          })
        }
        
        console.log('✅ Dados de demonstração resetados!')
        
        res.json({
          status: 'success',
          message: 'Sistema resetado para dados de demonstração',
          timestamp: new Date().toISOString(),
          executed_by: req.user.username
        })
      })
      
    } catch (error) {
      console.error('❌ Erro durante reset:', error)
      db.run('ROLLBACK')
      res.status(500).json({
        message: 'Erro durante reset dos dados demo',
        error: error.message
      })
    }
  })
})

/**
 * GET /api/cleanup/backup
 * Criar backup antes da limpeza
 */
router.get('/backup', authenticateToken, requireAdmin, (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupName = `backup_${timestamp}`
  
  // Criar backup das tabelas principais
  const backupQueries = [
    `CREATE TABLE ${backupName}_movements AS SELECT * FROM movements`,
    `CREATE TABLE ${backupName}_assets AS SELECT * FROM assets`,
    `CREATE TABLE ${backupName}_stores AS SELECT * FROM stores`
  ]
  
  let completed = 0
  const results = []
  
  backupQueries.forEach((query, index) => {
    db.run(query, function(err) {
      if (err) {
        results.push({ table: query.split('_')[2].split(' ')[0], error: err.message })
      } else {
        results.push({ table: query.split('_')[2].split(' ')[0], success: true })
      }
      
      if (++completed === backupQueries.length) {
        res.json({
          status: 'success',
          message: 'Backup criado com sucesso',
          backup_name: backupName,
          results,
          timestamp: new Date().toISOString()
        })
      }
    })
  })
})

module.exports = router