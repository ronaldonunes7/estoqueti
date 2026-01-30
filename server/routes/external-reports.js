const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Criar novo link externo
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const {
    name,
    scope,
    store_id,
    period,
    password,
    expires_at
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

  try {
    const token = uuidv4();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO external_report_links (
        token, name, scope, store_id, period, password_hash, expires_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      token, name, scope, store_id || null, period, passwordHash, expires_at, req.user.id
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
        url: `${frontendUrl}/view/report/${token}`
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
      s.name as store_name,
      s.city as store_city,
      u.username as created_by_username
    FROM external_report_links erl
    LEFT JOIN stores s ON erl.store_id = s.id
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

      return {
        ...link,
        is_expired: new Date(link.expires_at) < new Date(),
        url: `${frontendUrl}/view/report/${link.token}`
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
    SELECT 
      erl.*,
      s.name as store_name,
      s.city as store_city
    FROM external_report_links erl
    LEFT JOIN stores s ON erl.store_id = s.id
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

module.exports = router;