const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar todas as lojas
router.get('/', authenticateToken, (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  
  let query = 'SELECT * FROM stores WHERE 1=1';
  let params = [];

  if (search) {
    query += ' AND (name LIKE ? OR city LIKE ? OR responsible LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, stores) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar lojas' });
    }

    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) as total FROM stores WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR city LIKE ? OR responsible LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }

    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao contar lojas' });
      }

      res.json({
        stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count.total,
          pages: Math.ceil(count.total / parseInt(limit))
        }
      });
    });
  });
});

// Buscar loja por ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM stores WHERE id = ?', [id], (err, store) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar loja' });
    }

    if (!store) {
      return res.status(404).json({ message: 'Loja não encontrada' });
    }

    res.json(store);
  });
});

// Criar nova loja
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const {
    name,
    address,
    number,
    neighborhood,
    city,
    cep,
    phone,
    responsible
  } = req.body;

  if (!name || !address || !city) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: nome, endereço e cidade' 
    });
  }

  const query = `
    INSERT INTO stores (
      name, address, number, neighborhood, city, cep, phone, responsible
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    name, address, number, neighborhood, city, cep, phone, responsible
  ], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao criar loja' });
    }

    res.status(201).json({
      message: 'Loja criada com sucesso',
      id: this.lastID
    });
  });
});

// Atualizar loja
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    number,
    neighborhood,
    city,
    cep,
    phone,
    responsible
  } = req.body;

  const query = `
    UPDATE stores SET 
      name = ?, address = ?, number = ?, neighborhood = ?, 
      city = ?, cep = ?, phone = ?, responsible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [
    name, address, number, neighborhood, city, cep, phone, responsible, id
  ], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao atualizar loja' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Loja não encontrada' });
    }

    res.json({ message: 'Loja atualizada com sucesso' });
  });
});

// Deletar loja
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Verificar se há movimentações para esta loja
  db.get('SELECT COUNT(*) as count FROM movements WHERE store_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar movimentações' });
    }

    if (result.count > 0) {
      return res.status(400).json({ 
        message: 'Não é possível deletar loja com movimentações registradas' 
      });
    }

    db.run('DELETE FROM stores WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao deletar loja' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Loja não encontrada' });
      }

      res.json({ message: 'Loja deletada com sucesso' });
    });
  });
});

// Buscar produtos enviados para uma loja específica
router.get('/:id/products', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { start_date, end_date } = req.query;

  let query = `
    SELECT 
      m.*,
      a.name as asset_name,
      a.brand_model,
      a.category,
      a.asset_type,
      s.name as store_name,
      u.username as created_by_username
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    JOIN stores s ON m.store_id = s.id
    JOIN users u ON m.created_by = u.id
    WHERE m.store_id = ? AND m.type = 'Transferência'
  `;
  
  let params = [id];

  if (start_date) {
    query += ' AND DATE(m.movement_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(m.movement_date) <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY m.movement_date DESC';

  db.all(query, params, (err, movements) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar produtos da loja' });
    }

    res.json({ movements });
  });
});

// Buscar inventário completo da unidade
router.get('/:id/inventory', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  // Query para buscar todos os ativos atualmente na unidade
  let assetsQuery = `
    SELECT DISTINCT
      a.*,
      latest_movement.current_user,
      latest_movement.arrival_date,
      a.purchase_value
    FROM assets a
    LEFT JOIN (
      SELECT 
        m1.asset_id,
        m1.employee_name as current_user,
        m1.movement_date as arrival_date,
        m1.store_id
      FROM movements m1
      INNER JOIN (
        SELECT asset_id, MAX(movement_date) as max_date
        FROM movements 
        WHERE store_id = ?
        GROUP BY asset_id
      ) m2 ON m1.asset_id = m2.asset_id AND m1.movement_date = m2.max_date
      WHERE m1.store_id = ?
    ) latest_movement ON a.id = latest_movement.asset_id
    WHERE latest_movement.store_id = ?
  `;

  let params = [id, id, id];

  if (status && status !== 'all') {
    assetsQuery += ' AND a.status = ?';
    params.push(status);
  }

  assetsQuery += ' ORDER BY a.name';

  db.all(assetsQuery, params, (err, assets) => {
    if (err) {
      console.error('Erro ao buscar inventário:', err);
      return res.status(500).json({ message: 'Erro ao buscar inventário da unidade' });
    }

    // Calcular resumo
    const summary = {
      totalItems: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + (asset.purchase_value || 0), 0),
      uniqueAssets: assets.filter(a => a.asset_type === 'unique').length,
      consumables: assets.filter(a => a.asset_type === 'consumable').length,
      available: assets.filter(a => a.status === 'Disponível').length,
      inUse: assets.filter(a => a.status === 'Em Uso').length,
      maintenance: assets.filter(a => a.status === 'Manutenção').length
    };

    res.json({
      assets,
      summary
    });
  });
});

// Buscar histórico de um ativo específico na unidade
router.get('/:storeId/assets/:assetId/history', authenticateToken, (req, res) => {
  const { storeId, assetId } = req.params;

  // Buscar data de chegada na unidade
  const arrivalQuery = `
    SELECT MIN(movement_date) as arrival_date
    FROM movements 
    WHERE asset_id = ? AND store_id = ?
  `;

  db.get(arrivalQuery, [assetId, storeId], (err, arrivalData) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar data de chegada' });
    }

    // Buscar histórico de movimentações na unidade
    const historyQuery = `
      SELECT 
        m.*,
        u.username as created_by_username,
        JULIANDAY('now') - JULIANDAY(m.movement_date) as days_ago
      FROM movements m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.asset_id = ? AND m.store_id = ?
      ORDER BY m.movement_date DESC
    `;

    db.all(historyQuery, [assetId, storeId], (err, movements) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar histórico do ativo' });
      }

      // Calcular dias na unidade
      const daysInUnit = arrivalData?.arrival_date 
        ? Math.floor((new Date() - new Date(arrivalData.arrival_date)) / (1000 * 60 * 60 * 24))
        : null;

      res.json({
        arrivalDate: arrivalData?.arrival_date,
        daysInUnit,
        movements
      });
    });
  });
});

// Exportar inventário da unidade em PDF
router.get('/:id/inventory/export', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Buscar dados da loja
  db.get('SELECT * FROM stores WHERE id = ?', [id], (err, store) => {
    if (err || !store) {
      return res.status(404).json({ message: 'Loja não encontrada' });
    }

    // Buscar inventário
    const inventoryQuery = `
      SELECT DISTINCT
        a.*,
        latest_movement.current_user,
        latest_movement.arrival_date
      FROM assets a
      LEFT JOIN (
        SELECT 
          m1.asset_id,
          m1.employee_name as current_user,
          m1.movement_date as arrival_date,
          m1.store_id
        FROM movements m1
        INNER JOIN (
          SELECT asset_id, MAX(movement_date) as max_date
          FROM movements 
          WHERE store_id = ?
          GROUP BY asset_id
        ) m2 ON m1.asset_id = m2.asset_id AND m1.movement_date = m2.max_date
        WHERE m1.store_id = ?
      ) latest_movement ON a.id = latest_movement.asset_id
      WHERE latest_movement.store_id = ?
      ORDER BY a.category, a.name
    `;

    db.all(inventoryQuery, [id, id, id], (err, assets) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao gerar relatório' });
      }

      // Aqui você implementaria a geração do PDF
      // Por simplicidade, vou retornar um JSON que pode ser convertido em PDF no frontend
      const reportData = {
        store,
        assets,
        generatedAt: new Date().toISOString(),
        summary: {
          totalItems: assets.length,
          totalValue: assets.reduce((sum, asset) => sum + (asset.purchase_value || 0), 0),
          byStatus: {
            'Disponível': assets.filter(a => a.status === 'Disponível').length,
            'Em Uso': assets.filter(a => a.status === 'Em Uso').length,
            'Manutenção': assets.filter(a => a.status === 'Manutenção').length
          }
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="inventario-${store.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(reportData);
    });
  });
});

module.exports = router;