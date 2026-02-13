const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting para rotas públicas
const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 tentativas por IP
  message: { message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting rigoroso para validação de tokens
const tokenValidationLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 tentativas por IP
  message: { message: 'Muitas tentativas de validação. Tente novamente em 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Criar novo link externo
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const {
    name,
    scope,
    store_id,
    store_ids, // Array de IDs de lojas para multi-store
    period,
    password,
    expires_at,
    show_financial = true
  } = req.body;

  if (!name || !scope || !period || !expires_at) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: name, scope, period, expires_at' 
    });
  }

  if (scope === 'store' && !store_id) {
    return res.status(400).json({ 
      message: 'store_id é obrigatório quando scope é "store"' 
    });
  }

  // Validar escopo multi-loja
  if (scope === 'multi_store' && (!store_ids || !Array.isArray(store_ids) || store_ids.length === 0)) {
    return res.status(400).json({ message: 'Para escopo multi-loja, é necessário informar pelo menos uma loja' });
  }

  try {
    // Gerar token UUID v4 de 32 caracteres (sem hífens)
    const token = uuidv4().replace(/-/g, '');
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO external_report_links (
        token, name, scope, store_ids, period, password_hash, expires_at, show_financial, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Para compatibilidade, usar store_id se for escopo 'store', senão usar store_ids
    const storeIdsJson = scope === 'multi_store' ? JSON.stringify(store_ids) : 
                        scope === 'store' ? JSON.stringify([store_id]) : null;

    db.run(query, [
      token, name, scope, storeIdsJson, period, passwordHash, expires_at, show_financial ? 1 : 0, req.user.id
    ], function(err) {
      if (err) {
        console.error('Erro ao criar link externo:', err);
        return res.status(500).json({ message: 'Erro ao criar link externo' });
      }

      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? `${req.protocol}://${req.get('host')}`
        : 'http://localhost:5173';

      res.json({
        message: 'Link externo criado com sucesso',
        link_id: this.lastID,
        token,
        url: `${frontendUrl}/portal/${token}`
      });
    });
  } catch (error) {
    console.error('Erro ao processar criação de link:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar links externos
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const query = `
    SELECT 
      erl.*,
      u.username as created_by_username
    FROM external_report_links erl
    JOIN users u ON erl.created_by = u.id
    ORDER BY erl.created_at DESC
  `;

  db.all(query, [], (err, links) => {
    if (err) {
      console.error('Erro ao buscar links externos:', err);
      return res.status(500).json({ message: 'Erro ao buscar links externos' });
    }

    const linksWithStatus = links.map(link => {
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? `${req.protocol}://${req.get('host')}`
        : 'http://localhost:5173';

      // Parse store_ids se existir
      let storeNames = null;
      if (link.store_ids) {
        try {
          const storeIds = JSON.parse(link.store_ids);
          // Buscar nomes das lojas (fazer isso de forma síncrona não é ideal, mas funciona para poucos links)
          // TODO: Otimizar com uma query única
          storeNames = storeIds.join(', ');
        } catch (e) {
          console.error('Erro ao parsear store_ids:', e);
        }
      }

      return {
        ...link,
        store_name: storeNames,
        is_expired: new Date(link.expires_at) < new Date(),
        url: `${frontendUrl}/portal/${link.token}`
      };
    });

    res.json({ links: linksWithStatus });
  });
});

// Revogar link externo
router.patch('/:id/revoke', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE external_report_links SET is_active = 0 WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Erro ao revogar link:', err);
        return res.status(500).json({ message: 'Erro ao revogar link' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Link não encontrado' });
      }

      res.json({ message: 'Link revogado com sucesso' });
    }
  );
});

// Validar token e obter configurações do link (para visualização pública)
router.get('/validate/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  const query = `
    SELECT erl.*
    FROM external_report_links erl
    WHERE erl.token = ? AND erl.is_active = 1
  `;

  db.get(query, [token], async (err, link) => {
    if (err) {
      console.error('Erro ao validar token:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (!link) {
      return res.status(404).json({ message: 'Link não encontrado ou inativo' });
    }

    // Verificar se expirou
    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Link expirado' });
    }

    // Verificar senha se necessário
    if (link.password_hash) {
      if (!password) {
        return res.status(401).json({ message: 'Senha necessária', requires_password: true });
      }

      const isValidPassword = await bcrypt.compare(password, link.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }
    }

    // Incrementar contador de cliques
    db.run(
      'UPDATE external_report_links SET click_count = click_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
      [link.id]
    );

    res.json({
      valid: true,
      config: {
        name: link.name,
        scope: link.scope,
        store_id: link.store_id,
        store_name: link.store_name,
        store_city: link.store_city,
        period: link.period
      }
    });
  });
});

// Obter dados do relatório para visualização pública
router.get('/data/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  // Primeiro validar o token
  const linkQuery = `
    SELECT 
      erl.*,
      s.name as store_name,
      s.city as store_city
    FROM external_report_links erl
    LEFT JOIN stores s ON erl.store_id = s.id
    WHERE erl.token = ? AND erl.is_active = 1
  `;

  db.get(linkQuery, [token], async (err, link) => {
    if (err || !link) {
      return res.status(404).json({ message: 'Link não encontrado' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Link expirado' });
    }

    if (link.password_hash && password) {
      const isValidPassword = await bcrypt.compare(password, link.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }
    }

    // Calcular período baseado na configuração
    let startDate, endDate;
    const now = new Date();
    
    switch (link.period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Query base para movimentações
    let movementsQuery = `
      SELECT 
        m.*,
        a.name as asset_name,
        a.patrimony_tag,
        a.serial_number,
        s.name as store_name,
        s.city as store_city
      FROM movements m
      JOIN assets a ON m.asset_id = a.id
      LEFT JOIN stores s ON m.store_id = s.id
      WHERE DATE(m.movement_date) BETWEEN DATE(?) AND DATE(?)
    `;
    
    let params = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];

    // Filtrar por loja se necessário
    if (link.scope === 'store' && link.store_id) {
      movementsQuery += ' AND m.store_id = ?';
      params.push(link.store_id);
    }

    movementsQuery += ' ORDER BY m.movement_date DESC LIMIT 100';

    db.all(movementsQuery, params, (err, movements) => {
      if (err) {
        console.error('Erro ao buscar movimentações:', err);
        return res.status(500).json({ message: 'Erro ao buscar dados' });
      }

      // Calcular KPIs
      const totalReceived = movements.filter(m => 
        m.type === 'Entrada' || m.type === 'Transferência'
      ).length;

      const inTransit = movements.filter(m => 
        m.type === 'Saída' || m.type === 'Transferência'
      ).length;

      res.json({
        config: {
          name: link.name,
          scope: link.scope,
          store_name: link.store_name,
          store_city: link.store_city,
          period: link.period,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        kpis: {
          totalReceived,
          inTransit,
          totalMovements: movements.length
        },
        movements: movements.map(m => ({
          id: m.id,
          date: m.movement_date,
          asset_name: m.asset_name,
          patrimony_tag: m.patrimony_tag,
          type: m.type,
          employee_name: m.employee_name,
          store_name: m.store_name,
          store_city: m.store_city,
          quantity: m.quantity
        }))
      });
    });
  });
});

// ===== NOVAS ROTAS PARA PORTAL PÚBLICO =====

// Validar token para portal público (com rate limiting)
router.get('/public/validate/:token', tokenValidationLimit, async (req, res) => {
  const { token } = req.params;
  const { password } = req.query;

  if (!token || token.length !== 32) {
    return res.status(400).json({ message: 'Token inválido' });
  }

  const linkQuery = `
    SELECT 
      erl.*,
      u.username as created_by_username
    FROM external_report_links erl
    JOIN users u ON erl.created_by = u.id
    WHERE erl.token = ? AND erl.is_active = 1
  `;

  db.get(linkQuery, [token], async (err, link) => {
    if (err || !link) {
      return res.status(404).json({ message: 'Link não encontrado ou inválido' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Link expirado' });
    }

    if (link.password_hash) {
      if (!password) {
        return res.status(401).json({ message: 'Senha necessária', requiresPassword: true });
      }
      
      const isValidPassword = await bcrypt.compare(password, link.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }
    }

    // Incrementar contador de cliques
    db.run(
      'UPDATE external_report_links SET click_count = click_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
      [link.id]
    );

    // Obter lojas permitidas
    let allowedStores = [];
    if (link.scope === 'general') {
      // Buscar todas as lojas
      db.all('SELECT id, name, city FROM stores ORDER BY name', (err, stores) => {
        if (err) {
          console.error('Erro ao buscar lojas:', err);
        } else {
          allowedStores = stores;
        }
        sendResponse();
      });
    } else if (link.scope === 'multi_store' && link.store_ids) {
      // Buscar lojas específicas
      const storeIds = JSON.parse(link.store_ids);
      const placeholders = storeIds.map(() => '?').join(',');
      db.all(`SELECT id, name, city FROM stores WHERE id IN (${placeholders}) ORDER BY name`, storeIds, (err, stores) => {
        if (err) {
          console.error('Erro ao buscar lojas específicas:', err);
        } else {
          allowedStores = stores;
        }
        sendResponse();
      });
    } else {
      sendResponse();
    }

    function sendResponse() {
      res.json({
        valid: true,
        config: {
          name: link.name,
          scope: link.scope,
          period: link.period,
          show_financial: Boolean(link.show_financial),
          allowed_stores: allowedStores,
          created_by: link.created_by_username
        }
      });
    }
  });
});

// Obter dados do dashboard para uma loja específica (portal público)
router.get('/public/dashboard/:token/:storeId', publicRateLimit, async (req, res) => {
  const { token, storeId } = req.params;
  const { password } = req.query;

  if (!token || token.length !== 32) {
    return res.status(400).json({ message: 'Token inválido' });
  }

  // Validar token e permissões
  const linkQuery = `
    SELECT * FROM external_report_links 
    WHERE token = ? AND is_active = 1
  `;

  db.get(linkQuery, [token], async (err, link) => {
    if (err || !link) {
      return res.status(404).json({ message: 'Link não encontrado' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Link expirado' });
    }

    if (link.password_hash && password) {
      const isValidPassword = await bcrypt.compare(password, link.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }
    }

    // Verificar se a loja está permitida
    let isStoreAllowed = false;
    if (link.scope === 'general') {
      isStoreAllowed = true;
    } else if (link.scope === 'multi_store' && link.store_ids) {
      const allowedStoreIds = JSON.parse(link.store_ids);
      isStoreAllowed = allowedStoreIds.includes(parseInt(storeId));
    }

    if (!isStoreAllowed) {
      return res.status(403).json({ message: 'Acesso negado para esta loja' });
    }

    // Buscar dados da loja
    db.get('SELECT * FROM stores WHERE id = ?', [storeId], (err, store) => {
      if (err || !store) {
        return res.status(404).json({ message: 'Loja não encontrada' });
      }

      // Buscar métricas da loja
      const metricsQuery = `
        SELECT 
          COUNT(*) as total_assets,
          COUNT(CASE WHEN status = 'Disponível' THEN 1 END) as available_assets,
          COUNT(CASE WHEN status = 'Em Uso' THEN 1 END) as in_use_assets,
          COUNT(CASE WHEN status = 'Manutenção' THEN 1 END) as maintenance_assets,
          ${link.show_financial ? 'COALESCE(SUM(purchase_value), 0) as total_value' : '0 as total_value'}
        FROM assets a
        LEFT JOIN movements m ON a.id = m.asset_id 
        WHERE m.store_id = ? OR (m.store_id IS NULL AND ? = 1)
      `;

      db.get(metricsQuery, [storeId, link.scope === 'general' ? 1 : 0], (err, metrics) => {
        if (err) {
          return res.status(500).json({ message: 'Erro ao buscar métricas' });
        }

        // Buscar lista de ativos
        const assetsQuery = `
          SELECT 
            a.id,
            a.name,
            a.brand_model,
            a.status,
            a.created_at,
            ${link.show_financial ? 'a.purchase_value' : 'NULL as purchase_value'}
          FROM assets a
          LEFT JOIN movements m ON a.id = m.asset_id
          WHERE m.store_id = ? OR (m.store_id IS NULL AND ? = 1)
          ORDER BY a.created_at DESC
          LIMIT 100
        `;

        db.all(assetsQuery, [storeId, link.scope === 'general' ? 1 : 0], (err, assets) => {
          if (err) {
            return res.status(500).json({ message: 'Erro ao buscar ativos' });
          }

          res.json({
            store,
            metrics: {
              total_assets: metrics.total_assets || 0,
              available_assets: metrics.available_assets || 0,
              in_use_assets: metrics.in_use_assets || 0,
              maintenance_assets: metrics.maintenance_assets || 0,
              total_value: link.show_financial ? (metrics.total_value || 0) : null
            },
            assets: assets || [],
            show_financial: Boolean(link.show_financial)
          });
        });
      });
    });
  });
});

module.exports = router;