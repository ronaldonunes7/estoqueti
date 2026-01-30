const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar todos os ativos
router.get('/', authenticateToken, (req, res) => {
  const { search, category, status, status_in, low_stock_only, critical_items, asset_type, page = 1, limit = 50 } = req.query;
  
  let query = 'SELECT * FROM assets WHERE 1=1';
  let params = [];

  if (search) {
    query += ' AND (patrimony_tag LIKE ? OR serial_number LIKE ? OR name LIKE ? OR barcode LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (asset_type) {
    query += ' AND asset_type = ?';
    params.push(asset_type);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  } else if (status_in) {
    // Suporte para múltiplos status (usado no filtro "Apenas em Estoque")
    const statusList = status_in.split(',').map(s => s.trim());
    const placeholders = statusList.map(() => '?').join(',');
    query += ` AND status IN (${placeholders})`;
    params.push(...statusList);
  }

  if (low_stock_only === 'true') {
    query += ' AND asset_type = "consumable" AND stock_quantity <= min_stock AND min_stock > 0';
  }

  if (critical_items === 'true') {
    query += ' AND ((asset_type = "consumable" AND stock_quantity <= min_stock AND min_stock > 0) OR status = "Manutenção")';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, assets) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar ativos' });
    }

    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) as total FROM assets WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ' AND (patrimony_tag LIKE ? OR serial_number LIKE ? OR name LIKE ? OR barcode LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (asset_type) {
      countQuery += ' AND asset_type = ?';
      countParams.push(asset_type);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    } else if (status_in) {
      const statusList = status_in.split(',').map(s => s.trim());
      const placeholders = statusList.map(() => '?').join(',');
      countQuery += ` AND status IN (${placeholders})`;
      countParams.push(...statusList);
    }

    if (low_stock_only === 'true') {
      countQuery += ' AND asset_type = "consumable" AND stock_quantity <= min_stock AND min_stock > 0';
    }

    if (critical_items === 'true') {
      countQuery += ' AND ((asset_type = "consumable" AND stock_quantity <= min_stock AND min_stock > 0) OR status = "Manutenção")';
    }

    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao contar ativos' });
      }

      res.json({
        assets,
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

// Buscar ativo por ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM assets WHERE id = ?', [id], (err, asset) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar ativo' });
    }

    if (!asset) {
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    res.json(asset);
  });
});

// Criar novo ativo
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const {
    name,
    brand_model,
    serial_number,
    patrimony_tag,
    barcode,
    category,
    status = 'Disponível',
    asset_type = 'unique',
    stock_quantity = 1,
    min_stock = 0,
    purchase_date,
    purchase_value,
    warranty_expiry,
    location,
    notes
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: nome e categoria' 
    });
  }

  // Validações específicas por tipo de ativo
  if (asset_type === 'unique') {
    if (!serial_number && !patrimony_tag) {
      return res.status(400).json({ 
        message: 'Ativos únicos devem ter número de série ou tag de patrimônio' 
      });
    }
  } else if (asset_type === 'consumable') {
    if (!stock_quantity || stock_quantity < 0) {
      return res.status(400).json({ 
        message: 'Insumos devem ter quantidade em estoque válida' 
      });
    }
  }

  const query = `
    INSERT INTO assets (
      name, brand_model, serial_number, patrimony_tag, barcode, category, status,
      asset_type, stock_quantity, min_stock, purchase_date, purchase_value, 
      warranty_expiry, location, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    name, brand_model, serial_number || null, patrimony_tag || null, barcode || null, category, status,
    asset_type, stock_quantity, min_stock, purchase_date, purchase_value, 
    warranty_expiry, location, notes
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ 
          message: 'Número de série, tag de patrimônio ou código de barras já existe' 
        });
      }
      return res.status(500).json({ message: 'Erro ao criar ativo' });
    }

    res.status(201).json({
      message: 'Ativo criado com sucesso',
      id: this.lastID
    });
  });
});

// Atualizar ativo
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    name,
    brand_model,
    serial_number,
    patrimony_tag,
    barcode,
    category,
    status,
    asset_type,
    stock_quantity,
    min_stock,
    purchase_date,
    purchase_value,
    warranty_expiry,
    location,
    notes
  } = req.body;

  const query = `
    UPDATE assets SET 
      name = ?, brand_model = ?, serial_number = ?, patrimony_tag = ?, barcode = ?,
      category = ?, status = ?, asset_type = ?, stock_quantity = ?, min_stock = ?,
      purchase_date = ?, purchase_value = ?, warranty_expiry = ?, location = ?, 
      notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [
    name, brand_model, serial_number, patrimony_tag, barcode, category, status,
    asset_type, stock_quantity, min_stock, purchase_date, purchase_value, 
    warranty_expiry, location, notes, id
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ 
          message: 'Número de série, tag de patrimônio ou código de barras já existe' 
        });
      }
      return res.status(500).json({ message: 'Erro ao atualizar ativo' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    res.json({ message: 'Ativo atualizado com sucesso' });
  });
});

// Rota de teste para debug
router.patch('/test/:id', authenticateToken, (req, res) => {
  console.log('Rota de teste - Dados recebidos:', {
    params: req.params,
    body: req.body,
    headers: req.headers
  })
  res.json({ message: 'Teste OK', received: req.body })
})

// Rota específica para mudança de status
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  console.log('PATCH /:id/status - Dados recebidos:', {
    params: req.params,
    body: req.body,
    headers: req.headers['content-type']
  })
  
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    console.log('Erro: Status não fornecido')
    return res.status(400).json({ message: 'Status é obrigatório' });
  }

  const validStatuses = ['Disponível', 'Em Uso', 'Manutenção', 'Descartado'];
  if (!validStatuses.includes(status)) {
    console.log('Erro: Status inválido:', status)
    return res.status(400).json({ message: 'Status inválido' });
  }

  const query = 'UPDATE assets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

  db.run(query, [status, id], function(err) {
    if (err) {
      console.error('Erro ao atualizar status:', err)
      return res.status(500).json({ message: 'Erro ao atualizar status do ativo' });
    }

    if (this.changes === 0) {
      console.log('Ativo não encontrado:', id)
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    console.log('Status atualizado com sucesso:', { id, status })
    res.json({ message: 'Status atualizado com sucesso' });
  });
});

// Deletar ativo
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM assets WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao deletar ativo' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    res.json({ message: 'Ativo deletado com sucesso' });
  });
});

// Buscar ativo por código de barras
router.get('/barcode/:barcode', authenticateToken, (req, res) => {
  const { barcode } = req.params;

  if (!barcode) {
    return res.status(400).json({ message: 'Código de barras é obrigatório' });
  }

  const query = `
    SELECT * FROM assets 
    WHERE barcode = ? AND status != 'Descartado'
  `;

  db.get(query, [barcode], (err, asset) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar ativo' });
    }

    if (!asset) {
      return res.status(404).json({ message: 'Ativo não encontrado com este código de barras' });
    }

    res.json(asset);
  });
});

// Buscar histórico de um ativo específico em uma unidade
router.get('/:id/unit-history/:storeId', authenticateToken, (req, res) => {
  const { id: assetId, storeId } = req.params;

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
        JULIANDAY('now') - JULIANDAY(m.movement_date) as days_ago,
        LAG(m.movement_date) OVER (ORDER BY m.movement_date) as previous_date
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

      // Calcular dias de custódia para cada movimento
      const movementsWithCustody = movements.map((movement, index) => {
        let days_in_custody = null;
        
        if (index < movements.length - 1) {
          const currentDate = new Date(movement.movement_date);
          const nextDate = new Date(movements[index + 1].movement_date);
          days_in_custody = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
        } else if (arrivalData?.arrival_date) {
          const currentDate = new Date();
          const movementDate = new Date(movement.movement_date);
          days_in_custody = Math.floor((currentDate - movementDate) / (1000 * 60 * 60 * 24));
        }

        return {
          ...movement,
          days_in_custody
        };
      });

      res.json({
        arrivalDate: arrivalData?.arrival_date,
        daysInUnit,
        movements: movementsWithCustody
      });
    });
  });
});

// Buscar itens com estoque baixo
router.get('/low-stock', authenticateToken, (req, res) => {
  const query = `
    SELECT * FROM assets 
    WHERE asset_type = 'consumable' 
    AND stock_quantity <= min_stock 
    AND stock_quantity > 0
    ORDER BY stock_quantity ASC
  `;

  db.all(query, [], (err, assets) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar itens com estoque baixo' });
    }

    res.json({ assets });
  });
});

// Adicionar estoque (entrada de insumos)
router.post('/add-stock', authenticateToken, requireAdmin, (req, res) => {
  const { asset_id, quantity, unit_value, document, supplier } = req.body;

  if (!asset_id || !quantity || quantity <= 0) {
    return res.status(400).json({ 
      message: 'ID do ativo e quantidade válida são obrigatórios' 
    });
  }

  // Verificar se o ativo existe e é do tipo consumível
  db.get('SELECT * FROM assets WHERE id = ?', [asset_id], (err, asset) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar ativo' });
    }

    if (!asset) {
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    if (asset.asset_type !== 'consumable') {
      return res.status(400).json({ 
        message: 'Apenas insumos (consumíveis) podem ter estoque adicionado' 
      });
    }

    // Calcular novo estoque
    const newStock = asset.stock_quantity + parseInt(quantity);
    
    // Atualizar valor unitário se fornecido
    const updateFields = ['stock_quantity = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateValues = [newStock];
    
    if (unit_value !== undefined && unit_value > 0) {
      updateFields.push('purchase_value = ?');
      updateValues.push(parseFloat(unit_value));
    }
    
    updateValues.push(asset_id);

    // Iniciar transação
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Atualizar estoque do ativo
      db.run(
        `UPDATE assets SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues,
        function(updateErr) {
          if (updateErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Erro ao atualizar estoque' });
          }

          // Criar registro de movimentação
          const movementQuery = `
            INSERT INTO movements (
              asset_id, type, quantity, user_id, employee_name, 
              responsible_technician, observations, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;

          const observations = [
            document ? `Documento: ${document}` : null,
            supplier ? `Fornecedor: ${supplier}` : null,
            unit_value ? `Valor unitário: R$ ${parseFloat(unit_value).toFixed(2)}` : null,
            `Estoque anterior: ${asset.stock_quantity}`,
            `Novo estoque: ${newStock}`
          ].filter(Boolean).join(' | ');

          db.run(movementQuery, [
            asset_id,
            'ENTRADA_ESTOQUE',
            quantity,
            req.user.id,
            'Sistema - Entrada de Estoque',
            req.user.username,
            observations
          ], function(movementErr) {
            if (movementErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Erro ao registrar movimentação' });
            }

            db.run('COMMIT');
            
            res.json({
              message: 'Estoque adicionado com sucesso',
              asset: {
                ...asset,
                stock_quantity: newStock,
                purchase_value: unit_value ? parseFloat(unit_value) : asset.purchase_value
              },
              movement_id: this.lastID,
              previous_stock: asset.stock_quantity,
              added_quantity: quantity,
              new_stock: newStock
            });
          });
        }
      );
    });
  });
});

module.exports = router;