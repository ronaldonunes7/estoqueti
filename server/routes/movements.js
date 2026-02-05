const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Buscar movimentação específica com ativos
router.get('/:id/with-assets', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Buscar dados da movimentação
  const movementQuery = `
    SELECT 
      m.*,
      s.name as store_name,
      s.city as store_city,
      u.username as created_by_username
    FROM movements m
    LEFT JOIN stores s ON m.store_id = s.id
    JOIN users u ON m.created_by = u.id
    WHERE m.id = ?
  `;

  db.get(movementQuery, [id], (err, movement) => {
    if (err) {
      console.error('Erro ao buscar movimentação:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (!movement) {
      return res.status(404).json({ message: 'Movimentação não encontrada' });
    }

    // Buscar ativo relacionado
    const assetQuery = `
      SELECT 
        a.*
      FROM assets a
      WHERE a.id = ?
    `;

    db.get(assetQuery, [movement.asset_id], (err, asset) => {
      if (err) {
        console.error('Erro ao buscar ativo:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }

      // Adicionar ativo à movimentação
      const result = {
        ...movement,
        collaborator: movement.employee_name,
        technician: movement.responsible_technician,
        assets: asset ? [asset] : []
      };

      res.json(result);
    });
  });
});

// Listar movimentações com filtros avançados
router.get('/', authenticateToken, (req, res) => {
  const { 
    asset_id, 
    type, 
    store_id, 
    technician, 
    start_date, 
    end_date, 
    page = 1, 
    limit = 20 
  } = req.query;
  
  let query = `
    SELECT 
      m.*,
      a.name as asset_name,
      a.patrimony_tag,
      a.serial_number,
      a.category,
      a.asset_type,
      a.purchase_value,
      s.name as store_name,
      s.city as store_city,
      u.username as created_by_username
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    LEFT JOIN stores s ON m.store_id = s.id
    JOIN users u ON m.created_by = u.id
    WHERE 1=1
  `;
  let params = [];

  if (asset_id) {
    query += ' AND m.asset_id = ?';
    params.push(asset_id);
  }

  if (type) {
    query += ' AND m.type = ?';
    params.push(type);
  }

  if (store_id) {
    query += ' AND m.store_id = ?';
    params.push(store_id);
  }

  if (technician) {
    query += ' AND m.responsible_technician LIKE ?';
    params.push(`%${technician}%`);
  }

  if (start_date) {
    query += ' AND DATE(m.movement_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(m.movement_date) <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY m.movement_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, movements) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar movimentações' });
    }

    // Contar total para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM movements m
      JOIN assets a ON m.asset_id = a.id
      LEFT JOIN stores s ON m.store_id = s.id
      JOIN users u ON m.created_by = u.id
      WHERE 1=1
    `;
    let countParams = [];

    if (asset_id) {
      countQuery += ' AND m.asset_id = ?';
      countParams.push(asset_id);
    }

    if (type) {
      countQuery += ' AND m.type = ?';
      countParams.push(type);
    }

    if (store_id) {
      countQuery += ' AND m.store_id = ?';
      countParams.push(store_id);
    }

    if (technician) {
      countQuery += ' AND m.responsible_technician LIKE ?';
      countParams.push(`%${technician}%`);
    }

    if (start_date) {
      countQuery += ' AND DATE(m.movement_date) >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND DATE(m.movement_date) <= ?';
      countParams.push(end_date);
    }

    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao contar movimentações' });
      }

      res.json({
        movements,
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

// Check-out (Saída de ativo)
router.post('/checkout', authenticateToken, (req, res) => {
  const {
    asset_id,
    employee_name,
    destination,
    responsible_technician,
    observations
  } = req.body;

  if (!asset_id || !employee_name || !responsible_technician) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: ativo, colaborador e técnico responsável' 
    });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Verificar se o ativo está disponível
    db.get('SELECT * FROM assets WHERE id = ? AND status = "Disponível"', [asset_id], (err, asset) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Erro ao verificar ativo' });
      }

      if (!asset) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'Ativo não encontrado ou não disponível' });
      }

      // Atualizar status do ativo para "Em Uso"
      db.run('UPDATE assets SET status = "Em Uso", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [asset_id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Erro ao atualizar status do ativo' });
        }

        // Registrar movimentação
        const movementQuery = `
          INSERT INTO movements (asset_id, type, employee_name, destination, responsible_technician, observations, created_by)
          VALUES (?, 'Saída', ?, ?, ?, ?, ?)
        `;

        db.run(movementQuery, [
          asset_id, employee_name, destination, responsible_technician, observations, req.user.id
        ], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Erro ao registrar movimentação' });
          }

          db.run('COMMIT');
          res.json({
            message: 'Check-out realizado com sucesso',
            movement_id: this.lastID
          });
        });
      });
    });
  });
});

// Check-in (Entrada de ativo)
router.post('/checkin', authenticateToken, (req, res) => {
  const {
    asset_id,
    employee_name,
    responsible_technician,
    observations,
    status = 'Disponível'
  } = req.body;

  if (!asset_id || !employee_name || !responsible_technician) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: ativo, colaborador e técnico responsável' 
    });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Verificar se o ativo está em uso
    db.get('SELECT * FROM assets WHERE id = ? AND status = "Em Uso"', [asset_id], (err, asset) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Erro ao verificar ativo' });
      }

      if (!asset) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'Ativo não encontrado ou não está em uso' });
      }

      // Atualizar status do ativo
      db.run('UPDATE assets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, asset_id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Erro ao atualizar status do ativo' });
        }

        // Registrar movimentação
        const movementQuery = `
          INSERT INTO movements (asset_id, type, employee_name, responsible_technician, observations, created_by)
          VALUES (?, 'Entrada', ?, ?, ?, ?)
        `;

        db.run(movementQuery, [
          asset_id, employee_name, responsible_technician, observations, req.user.id
        ], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Erro ao registrar movimentação' });
          }

          db.run('COMMIT');
          res.json({
            message: 'Check-in realizado com sucesso',
            movement_id: this.lastID
          });
        });
      });
    });
  });
});

// Transferência para loja (Nova funcionalidade)
router.post('/transfer', authenticateToken, (req, res) => {
  console.log('Dados recebidos para transferência:', req.body);
  
  const {
    asset_id,
    store_id,
    quantity = 1,
    responsible_technician,
    employee_name, // Nome do colaborador que está recebendo o ativo
    observations
  } = req.body;

  if (!asset_id || !store_id || !responsible_technician) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: ativo, loja de destino e técnico responsável' 
    });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let finalQuantity = quantity; // Definir finalQuantity no início

    // Verificar se o ativo existe e tem estoque suficiente
    db.get('SELECT * FROM assets WHERE id = ?', [asset_id], (err, asset) => {
      if (err) {
        console.error('Erro ao verificar ativo:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Erro ao verificar ativo' });
      }

      if (!asset) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'Ativo não encontrado' });
      }

      console.log('Ativo encontrado:', asset);

      // VALIDAÇÃO RIGOROSA: Verificar se o ativo pode ser transferido
      if (asset.asset_type === 'consumable') {
        // Insumos: verificar estoque disponível
        if (asset.stock_quantity <= 0) {
          db.run('ROLLBACK');
          return res.status(400).json({ 
            message: `Insumo não possui estoque disponível. Estoque atual: ${asset.stock_quantity}` 
          });
        }
        
        if (asset.stock_quantity < quantity) {
          db.run('ROLLBACK');
          return res.status(400).json({ 
            message: `Estoque insuficiente. Disponível: ${asset.stock_quantity}, solicitado: ${quantity}` 
          });
        }
      } else if (asset.asset_type === 'unique') {
        // Ativos únicos: APENAS status 'Disponível' pode ser transferido
        if (asset.status !== 'Disponível') {
          db.run('ROLLBACK');
          return res.status(400).json({ 
            message: `Ativo único não pode ser transferido. Status atual: '${asset.status}'. Apenas itens com status 'Disponível' podem ser transferidos.` 
          });
        }
        finalQuantity = 1; // Forçar quantidade 1 para ativos únicos
      }

      // Verificar se a loja existe
      db.get('SELECT * FROM stores WHERE id = ?', [store_id], (err, store) => {
        if (err) {
          console.error('Erro ao verificar loja:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Erro ao verificar loja' });
        }

        if (!store) {
          db.run('ROLLBACK');
          return res.status(400).json({ message: 'Loja não encontrada' });
        }

        console.log('Loja encontrada:', store);

        // Atualizar estoque/status do ativo
        let updateQuery, updateParams;
        
        if (asset.asset_type === 'consumable') {
          updateQuery = 'UPDATE assets SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          updateParams = [quantity, asset_id];
        } else {
          // Ativos únicos vão para 'Em Trânsito' durante transferência
          updateQuery = 'UPDATE assets SET status = "Em Trânsito", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          updateParams = [asset_id];
        }

        db.run(updateQuery, updateParams, (err) => {
          if (err) {
            console.error('Erro ao atualizar ativo:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Erro ao atualizar ativo' });
          }

          console.log('Ativo atualizado com sucesso');

          // Registrar movimentação
          const movementQuery = `
            INSERT INTO movements (
              asset_id, type, employee_name, destination, store_id, quantity, 
              responsible_technician, observations, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const movementParams = [
            asset_id, 
            'Transferência', 
            employee_name || 'Transferência', // Nome do colaborador ou padrão
            store.name, 
            store_id, 
            finalQuantity, // Agora finalQuantity está definida
            responsible_technician, 
            observations || '', 
            req.user.id
          ];

          console.log('Executando query de movimentação:', movementQuery);
          console.log('Parâmetros:', movementParams);

          db.run(movementQuery, movementParams, function(err) {
            if (err) {
              console.error('Erro ao registrar movimentação:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Erro ao registrar movimentação: ' + err.message });
            }

            console.log('Movimentação registrada com sucesso, ID:', this.lastID);
            db.run('COMMIT');
            res.json({
              message: 'Transferência realizada com sucesso',
              movement_id: this.lastID
            });
          });
        });
      });
    });
  });
});

// KPIs para dashboard de movimentações
router.get('/kpis', authenticateToken, (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  let params = [];
  
  if (start_date && end_date) {
    dateFilter = 'AND DATE(m.movement_date) BETWEEN ? AND ?';
    params = [start_date, end_date];
  } else {
    // Padrão: mês atual
    dateFilter = 'AND DATE(m.movement_date) >= DATE("now", "start of month")';
  }

  const queries = {
    totalSaidas: `
      SELECT COUNT(*) as count, COALESCE(SUM(a.purchase_value * m.quantity), 0) as value
      FROM movements m
      JOIN assets a ON m.asset_id = a.id
      WHERE m.type IN ('Saída', 'Transferência') ${dateFilter}
    `,
    
    itensManutencao: `
      SELECT COUNT(*) as count
      FROM assets a
      WHERE a.status = 'Manutenção'
    `,
    
    valorTotalMovimentacao: `
      SELECT COALESCE(SUM(a.purchase_value * m.quantity), 0) as value
      FROM movements m
      JOIN assets a ON m.asset_id = a.id
      WHERE 1=1 ${dateFilter}
    `,
    
    movimentacoesPorTipo: `
      SELECT m.type, COUNT(*) as count
      FROM movements m
      WHERE 1=1 ${dateFilter}
      GROUP BY m.type
    `,
    
    tecnicosMaisAtivos: `
      SELECT m.responsible_technician, COUNT(*) as count
      FROM movements m
      WHERE 1=1 ${dateFilter}
      GROUP BY m.responsible_technician
      ORDER BY count DESC
      LIMIT 5
    `
  };

  const results = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Erro na query ${key}:`, err);
        results[key] = key.includes('count') ? { count: 0 } : [];
      } else {
        results[key] = rows;
      }

      completedQueries++;
      if (completedQueries === totalQueries) {
        res.json({
          totalSaidas: results.totalSaidas[0] || { count: 0, value: 0 },
          itensManutencao: results.itensManutencao[0] || { count: 0 },
          valorTotalMovimentacao: results.valorTotalMovimentacao[0] || { value: 0 },
          movimentacoesPorTipo: results.movimentacoesPorTipo || [],
          tecnicosMaisAtivos: results.tecnicosMaisAtivos || []
        });
      }
    });
  });
});

// Gerar comprovante de movimentação em PDF
router.get('/:id/comprovante', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      m.*,
      a.name as asset_name,
      a.patrimony_tag,
      a.serial_number,
      a.brand_model,
      a.category,
      a.purchase_value,
      s.name as store_name,
      s.address as store_address,
      s.city as store_city,
      s.responsible as store_responsible,
      u.username as created_by_username,
      u.email as created_by_email
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    LEFT JOIN stores s ON m.store_id = s.id
    JOIN users u ON m.created_by = u.id
    WHERE m.id = ?
  `;

  db.get(query, [id], (err, movement) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar movimentação' });
    }

    if (!movement) {
      return res.status(404).json({ message: 'Movimentação não encontrada' });
    }

    // Gerar PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comprovante-${id}.pdf"`);
    
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).text('COMPROVANTE DE MOVIMENTAÇÃO', { align: 'center' });
    doc.moveDown();
    
    // Informações da empresa
    doc.fontSize(12).text('Sistema de Inventário TI', { align: 'center' });
    doc.text(`Comprovante #${movement.id}`, { align: 'center' });
    doc.text(`Data: ${new Date(movement.movement_date).toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Detalhes da movimentação
    doc.fontSize(14).text('DETALHES DA MOVIMENTAÇÃO', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Tipo: ${movement.type}`);
    doc.text(`Data/Hora: ${new Date(movement.movement_date).toLocaleString('pt-BR')}`);
    doc.text(`Técnico Responsável: ${movement.responsible_technician}`);
    doc.text(`Colaborador: ${movement.employee_name}`);
    if (movement.observations) {
      doc.text(`Observações: ${movement.observations}`);
    }
    doc.moveDown();

    // Detalhes do ativo
    doc.fontSize(14).text('ATIVO MOVIMENTADO', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Nome: ${movement.asset_name}`);
    doc.text(`Marca/Modelo: ${movement.brand_model}`);
    if (movement.patrimony_tag) {
      doc.text(`Tag Patrimônio: ${movement.patrimony_tag}`);
    }
    if (movement.serial_number) {
      doc.text(`Número de Série: ${movement.serial_number}`);
    }
    doc.text(`Categoria: ${movement.category}`);
    doc.text(`Quantidade: ${movement.quantity}`);
    if (movement.purchase_value) {
      doc.text(`Valor Unitário: R$ ${parseFloat(movement.purchase_value).toFixed(2)}`);
      doc.text(`Valor Total: R$ ${(parseFloat(movement.purchase_value) * movement.quantity).toFixed(2)}`);
    }
    doc.moveDown();

    // Destino (se aplicável)
    if (movement.store_name) {
      doc.fontSize(14).text('DESTINO', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Loja: ${movement.store_name}`);
      doc.text(`Cidade: ${movement.store_city}`);
      doc.text(`Endereço: ${movement.store_address}`);
      doc.text(`Responsável: ${movement.store_responsible}`);
      doc.moveDown();
    }

    // Rodapé
    doc.fontSize(10);
    doc.text('_'.repeat(80), { align: 'center' });
    doc.text(`Gerado por: ${movement.created_by_username} (${movement.created_by_email})`, { align: 'center' });
    doc.text(`Sistema de Inventário TI - ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

    doc.end();
  });
});

// Histórico detalhado de um ativo específico
router.get('/asset/:id/history', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Buscar informações do ativo
  const assetQuery = `
    SELECT 
      a.*,
      s.name as current_store_name,
      s.city as current_store_city
    FROM assets a
    LEFT JOIN (
      SELECT DISTINCT 
        m1.asset_id,
        s.name,
        s.city
      FROM movements m1
      JOIN stores s ON m1.store_id = s.id
      WHERE m1.movement_date = (
        SELECT MAX(m2.movement_date)
        FROM movements m2
        WHERE m2.asset_id = m1.asset_id
        AND m2.store_id IS NOT NULL
      )
    ) s ON a.id = s.asset_id
    WHERE a.id = ?
  `;

  // Buscar histórico de movimentações
  const historyQuery = `
    SELECT 
      m.*,
      s.name as store_name,
      s.city as store_city,
      s.address as store_address,
      s.responsible as store_responsible,
      u.username as created_by_username,
      u.email as created_by_email,
      LAG(m.movement_date) OVER (ORDER BY m.movement_date DESC) as previous_date
    FROM movements m
    LEFT JOIN stores s ON m.store_id = s.id
    JOIN users u ON m.created_by = u.id
    WHERE m.asset_id = ?
    ORDER BY m.movement_date DESC
  `;

  db.get(assetQuery, [id], (err, asset) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar ativo' });
    }

    if (!asset) {
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    db.all(historyQuery, [id], (err, movements) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar histórico' });
      }

      // Calcular dias de permanência
      const movementsWithDuration = movements.map((movement, index) => {
        let daysInLocation = null;
        
        if (index < movements.length - 1) {
          const currentDate = new Date(movement.movement_date);
          const nextDate = new Date(movements[index + 1].movement_date);
          const diffTime = currentDate - nextDate;
          daysInLocation = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          // Para a primeira movimentação, calcular até hoje
          const currentDate = new Date(movement.movement_date);
          const today = new Date();
          const diffTime = today - currentDate;
          daysInLocation = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          ...movement,
          daysInLocation
        };
      });

      res.json({
        asset,
        movements: movementsWithDuration,
        totalMovements: movements.length
      });
    });
  });
});

// Gerar laudo completo do ativo em PDF
router.get('/asset/:id/laudo', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Reutilizar a query do histórico
  const assetQuery = `
    SELECT 
      a.*,
      s.name as current_store_name,
      s.city as current_store_city
    FROM assets a
    LEFT JOIN (
      SELECT DISTINCT 
        m1.asset_id,
        s.name,
        s.city
      FROM movements m1
      JOIN stores s ON m1.store_id = s.id
      WHERE m1.movement_date = (
        SELECT MAX(m2.movement_date)
        FROM movements m2
        WHERE m2.asset_id = m1.asset_id
        AND m2.store_id IS NOT NULL
      )
    ) s ON a.id = s.asset_id
    WHERE a.id = ?
  `;

  const historyQuery = `
    SELECT 
      m.*,
      s.name as store_name,
      s.city as store_city,
      u.username as created_by_username
    FROM movements m
    LEFT JOIN stores s ON m.store_id = s.id
    JOIN users u ON m.created_by = u.id
    WHERE m.asset_id = ?
    ORDER BY m.movement_date DESC
  `;

  db.get(assetQuery, [id], (err, asset) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar ativo' });
    }

    if (!asset) {
      return res.status(404).json({ message: 'Ativo não encontrado' });
    }

    db.all(historyQuery, [id], (err, movements) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao buscar histórico' });
      }

      // Gerar PDF do laudo
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="laudo-${asset.patrimony_tag || asset.id}.pdf"`);
      
      doc.pipe(res);

      // Cabeçalho
      doc.fontSize(20).text('LAUDO DE HISTÓRICO DE ATIVO', { align: 'center' });
      doc.moveDown();
      
      // Informações da empresa
      doc.fontSize(12).text('Sistema de Inventário TI', { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);

      // Informações do ativo
      doc.fontSize(16).text('INFORMAÇÕES DO ATIVO', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Nome: ${asset.name}`);
      doc.text(`Marca/Modelo: ${asset.brand_model}`);
      if (asset.patrimony_tag) {
        doc.text(`Tag Patrimônio: ${asset.patrimony_tag}`);
      }
      if (asset.serial_number) {
        doc.text(`Número de Série: ${asset.serial_number}`);
      }
      doc.text(`Categoria: ${asset.category}`);
      doc.text(`Status Atual: ${asset.status}`);
      if (asset.current_store_name) {
        doc.text(`Localização Atual: ${asset.current_store_name} - ${asset.current_store_city}`);
      }
      if (asset.purchase_value) {
        doc.text(`Valor de Compra: R$ ${parseFloat(asset.purchase_value).toFixed(2)}`);
      }
      doc.moveDown(2);

      // Histórico de movimentações
      doc.fontSize(16).text('HISTÓRICO DE MOVIMENTAÇÕES', { underline: true });
      doc.moveDown();
      
      doc.fontSize(10);
      movements.forEach((movement, index) => {
        if (index > 0 && index % 15 === 0) {
          doc.addPage();
        }

        doc.fontSize(12).text(`${index + 1}. ${movement.type}`, { continued: false });
        doc.fontSize(10);
        doc.text(`   Data: ${new Date(movement.movement_date).toLocaleString('pt-BR')}`);
        doc.text(`   Colaborador: ${movement.employee_name}`);
        doc.text(`   Técnico: ${movement.responsible_technician}`);
        if (movement.store_name) {
          doc.text(`   Destino: ${movement.store_name} - ${movement.store_city}`);
        }
        if (movement.destination) {
          doc.text(`   Local: ${movement.destination}`);
        }
        doc.text(`   Quantidade: ${movement.quantity}`);
        if (movement.observations) {
          doc.text(`   Observações: ${movement.observations}`);
        }
        doc.text(`   Registrado por: ${movement.created_by_username}`);
        doc.moveDown(0.5);
      });

      // Rodapé
      doc.fontSize(8);
      doc.text('_'.repeat(100), { align: 'center' });
      doc.text(`Total de movimentações: ${movements.length}`, { align: 'center' });
      doc.text(`Sistema de Inventário TI - ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

      doc.end();
    });
  });
});
// Alteração de status com registro de movimentação
router.post('/status-change', authenticateToken, (req, res) => {
  const {
    asset_id,
    old_status,
    new_status,
    observations,
    type
  } = req.body;

  if (!asset_id || !new_status || !observations) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: asset_id, new_status, observations' 
    });
  }

  // Registrar movimentação sem transação manual
  const movementQuery = `
    INSERT INTO movements (
      asset_id, type, employee_name, destination, responsible_technician, 
      observations, created_by, quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(movementQuery, [
    asset_id, 
    type || 'Alteração de Status',
    'Sistema', // employee_name
    `Status alterado: ${old_status} → ${new_status}`, // destination
    req.user.username, // responsible_technician
    observations,
    req.user.id,
    1
  ], function(err) {
    if (err) {
      console.error('Erro ao registrar movimentação:', err);
      return res.status(500).json({ message: 'Erro ao registrar movimentação' });
    }

    res.json({
      message: 'Status alterado e movimentação registrada com sucesso',
      movement_id: this.lastID
    });
  });
});

// Listar transferências pendentes de recebimento
router.get('/pending-receipts', authenticateToken, (req, res) => {
  const { store_id } = req.query;
  
  let query = `
    SELECT 
      m.id,
      m.asset_id,
      a.name as asset_name,
      a.brand_model as asset_brand_model,
      a.barcode as asset_barcode,
      m.quantity,
      origin_store.name as origin_store,
      dest_store.name as destination_store,
      m.employee_name,
      m.responsible_technician,
      m.movement_date as transfer_date,
      m.observations
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    LEFT JOIN stores origin_store ON m.store_id = origin_store.id
    LEFT JOIN stores dest_store ON m.store_id = dest_store.id
    WHERE m.type = 'Transferência' 
    AND (a.status = 'Em Trânsito' OR (a.asset_type = 'consumable' AND m.quantity > 0))
  `;
  
  let params = [];
  
  if (store_id) {
    query += ' AND m.store_id = ?';
    params.push(store_id);
  }
  
  query += ' ORDER BY m.movement_date DESC';
  
  db.all(query, params, (err, transfers) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar transferências pendentes' });
    }
    
    res.json({ transfers });
  });
});

// Confirmar recebimento de transferência
router.post('/confirm-receipt', authenticateToken, (req, res) => {
  const {
    asset_id,
    transfer_id,
    received_quantity,
    observations,
    has_divergence = false,
    divergence_type,
    divergence_description
  } = req.body;

  if (!asset_id || !transfer_id) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios: asset_id, transfer_id' 
    });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Buscar informações do ativo e da transferência
    db.get(`
      SELECT a.*, m.quantity as transfer_quantity, m.store_id
      FROM assets a
      JOIN movements m ON a.id = m.asset_id
      WHERE a.id = ? AND m.id = ?
    `, [asset_id, transfer_id], (err, asset) => {
      if (err) {
        console.error('Erro ao buscar ativo:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Erro ao buscar ativo' });
      }

      if (!asset) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'Ativo ou transferência não encontrada' });
      }

      // Atualizar status do ativo
      let updateQuery, updateParams;
      
      if (asset.asset_type === 'unique') {
        // Ativo único volta para 'Disponível' na loja de destino
        updateQuery = 'UPDATE assets SET status = "Disponível", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        updateParams = [asset_id];
      } else {
        // Insumo: adicionar quantidade recebida ao estoque
        const quantityToAdd = received_quantity || asset.transfer_quantity;
        updateQuery = 'UPDATE assets SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        updateParams = [quantityToAdd, asset_id];
      }

      db.run(updateQuery, updateParams, (err) => {
        if (err) {
          console.error('Erro ao atualizar ativo:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Erro ao atualizar ativo' });
        }

        // Registrar movimentação de recebimento
        const receiptMovementQuery = `
          INSERT INTO movements (
            asset_id, type, employee_name, destination, responsible_technician, 
            observations, created_by, quantity, store_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const receiptObservations = has_divergence 
          ? `RECEBIMENTO COM DIVERGÊNCIA: ${divergence_description || divergence_type}. ${observations || ''}`
          : `Recebimento confirmado. ${observations || ''}`;

        db.run(receiptMovementQuery, [
          asset_id,
          'Recebimento',
          req.user.username,
          'Confirmação de recebimento',
          req.user.username,
          receiptObservations.trim(),
          req.user.id,
          received_quantity || asset.transfer_quantity,
          asset.store_id
        ], function(err) {
          if (err) {
            console.error('Erro ao registrar recebimento:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Erro ao registrar recebimento' });
          }

          db.run('COMMIT');
          res.json({
            message: 'Recebimento confirmado com sucesso',
            receipt_id: this.lastID,
            has_divergence
          });
        });
      });
    });
  });
});

// Buscar ativo por código de barras para recebimento
router.get('/pending-receipt/:barcode', authenticateToken, (req, res) => {
  const { barcode } = req.params;
  const { store_id } = req.query;

  if (!barcode) {
    return res.status(400).json({ message: 'Código de barras é obrigatório' });
  }

  const query = `
    SELECT 
      m.id as transfer_id,
      m.asset_id,
      a.name as asset_name,
      a.brand_model as asset_brand_model,
      a.barcode,
      a.status,
      a.asset_type,
      m.quantity,
      m.employee_name,
      m.responsible_technician,
      m.movement_date as transfer_date,
      m.observations,
      dest_store.name as destination_store
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    LEFT JOIN stores dest_store ON m.store_id = dest_store.id
    WHERE a.barcode = ? 
    AND m.type = 'Transferência'
    AND (a.status = 'Em Trânsito' OR (a.asset_type = 'consumable' AND m.quantity > 0))
    ${store_id ? 'AND m.store_id = ?' : ''}
    ORDER BY m.movement_date DESC
    LIMIT 1
  `;

  const params = store_id ? [barcode, store_id] : [barcode];

  db.get(query, params, (err, transfer) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar transferência' });
    }

    if (!transfer) {
      return res.status(404).json({ 
        message: 'Nenhuma transferência pendente encontrada para este código de barras' 
      });
    }

    res.json(transfer);
  });
});

module.exports = router;