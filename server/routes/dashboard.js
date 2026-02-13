const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rota principal do dashboard (GET /) - SEM AUTENTICAÇÃO PARA TESTE
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dashboard API funcionando',
    timestamp: new Date().toISOString(),
    routes: [
      '/health',
      '/counts', 
      '/metrics',
      '/warranty-alerts',
      '/recent-movements',
      '/low-stock-items'
    ]
  });
});

// Endpoint de teste para verificar se a API está funcionando
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Dashboard API funcionando'
  });
});

// Endpoint público para verificar contadores (sem autenticação)
router.get('/counts', (req, res) => {
  const queries = {
    assets: 'SELECT COUNT(*) as count FROM assets',
    stores: 'SELECT COUNT(*) as count FROM stores',
    movements: 'SELECT COUNT(*) as count FROM movements',
    users: 'SELECT COUNT(*) as count FROM users'
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, row) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = row.count;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json({
          status: 'success',
          counts: results,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

// Endpoint para listar ativos (sem autenticação, apenas para debug)
router.get('/assets-debug', (req, res) => {
  db.all('SELECT id, name, asset_type, barcode, category FROM assets LIMIT 10', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      status: 'success',
      assets: rows,
      timestamp: new Date().toISOString()
    });
  });
});

// Endpoint para corrigir tipo de ativo (apenas para debug)
router.post('/fix-asset-type/:id', (req, res) => {
  const { id } = req.params;
  const { asset_type, stock_quantity = 0, min_stock = 5 } = req.body;
  
  db.run(
    'UPDATE assets SET asset_type = ?, stock_quantity = ?, min_stock = ? WHERE id = ?',
    [asset_type, stock_quantity, min_stock, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }
      
      res.json({
        status: 'success',
        message: `Ativo ${id} atualizado para ${asset_type}`,
        changes: this.changes
      });
    }
  );
});

// Endpoint para testar busca de consumíveis
router.get('/search-consumables/:term', (req, res) => {
  const { term } = req.params;
  
  db.all(
    `SELECT id, name, barcode, asset_type, category, stock_quantity, min_stock 
     FROM assets 
     WHERE asset_type = 'consumable' 
     AND (name LIKE ? OR barcode LIKE ?)
     ORDER BY name`,
    [`%${term}%`, `%${term}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        status: 'success',
        term: term,
        found: rows.length,
        consumables: rows,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// Endpoint para testar geração de PDF
router.get('/test-pdf', (req, res) => {
  try {
    console.log('🔍 Testando geração de PDF...');
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="teste.pdf"');
    
    doc.pipe(res);
    
    doc.fontSize(20).text('Teste de PDF', { align: 'center' });
    doc.fontSize(12).text('Este é um teste de geração de PDF', { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    
    doc.end();
    
    console.log('✅ PDF de teste gerado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de teste:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF',
      message: error.message,
      stack: error.stack
    });
  }
});

// Endpoint para testar relatório de ativos (sem autenticação para debug)
router.get('/test-assets-pdf', (req, res) => {
  try {
    console.log('🔍 Testando relatório de ativos...');
    
    db.all('SELECT * FROM assets ORDER BY created_at DESC LIMIT 10', (err, assets) => {
      if (err) {
        console.error('❌ Erro na query:', err);
        return res.status(500).json({ message: 'Erro ao buscar ativos' });
      }

      console.log(`📊 Encontrados ${assets.length} ativos`);

      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `relatorio-ativos-${timestamp}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      // Cabeçalho
      doc.fontSize(20).text('Relatório de Ativos de TI', { align: 'center' });
      doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      doc.moveDown();

      // Resumo
      const statusCount = {};
      assets.forEach(asset => {
        statusCount[asset.status] = (statusCount[asset.status] || 0) + 1;
      });

      doc.fontSize(14).text('Resumo:', { underline: true });
      doc.fontSize(12);
      Object.entries(statusCount).forEach(([status, count]) => {
        doc.text(`${status}: ${count} itens`);
      });
      doc.moveDown();

      // Lista de ativos
      doc.fontSize(14).text('Lista de Ativos:', { underline: true });
      doc.fontSize(10);

      assets.forEach((asset, index) => {
        doc.text(`${index + 1}. ${asset.name}`, { continued: false });
        doc.text(`   Tag: ${asset.patrimony_tag} | Serial: ${asset.serial_number}`);
        doc.text(`   Categoria: ${asset.category} | Status: ${asset.status}`);
        doc.text(`   Marca/Modelo: ${asset.brand_model}`);
        if (asset.location) {
          doc.text(`   Localização: ${asset.location}`);
        }
        doc.moveDown(0.5);
      });

      doc.end();
      console.log('✅ Relatório de ativos gerado com sucesso');
    });
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de ativos:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar relatório',
      message: error.message,
      stack: error.stack
    });
  }
});

// Dashboard com métricas principais
router.get('/metrics', authenticateToken, (req, res) => {
  const queries = {
    totalAssets: 'SELECT COUNT(*) as count FROM assets',
    availableAssets: 'SELECT COUNT(*) as count FROM assets WHERE status = "Disponível"',
    inUseAssets: 'SELECT COUNT(*) as count FROM assets WHERE status = "Em Uso"',
    maintenanceAssets: 'SELECT COUNT(*) as count FROM assets WHERE status = "Manutenção"',
    discardedAssets: 'SELECT COUNT(*) as count FROM assets WHERE status = "Descartado"',
    lowStockItems: 'SELECT COUNT(*) as count FROM assets WHERE asset_type = "consumable" AND stock_quantity <= min_stock AND stock_quantity > 0',
    recentMovements: `
      SELECT COUNT(*) as count 
      FROM movements 
      WHERE type IN ('Saída', 'Transferência') 
      AND movement_date >= datetime('now', '-30 days')
    `,
    // Queries financeiras
    totalValue: `
      SELECT COALESCE(SUM(purchase_value), 0) as value 
      FROM assets 
      WHERE purchase_value IS NOT NULL AND status != 'Descartado'
    `,
    maintenanceValue: `
      SELECT COALESCE(SUM(purchase_value), 0) as value 
      FROM assets 
      WHERE status = 'Manutenção' AND purchase_value IS NOT NULL
    `,
    availableValue: `
      SELECT COALESCE(SUM(purchase_value), 0) as value 
      FROM assets 
      WHERE status = 'Disponível' AND purchase_value IS NOT NULL
    `,
    inUseValue: `
      SELECT COALESCE(SUM(purchase_value), 0) as value 
      FROM assets 
      WHERE status = 'Em Uso' AND purchase_value IS NOT NULL
    `,
    // Alertas de BI
    itemsInTransitOver48h: `
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE status = 'Em Trânsito' 
      AND updated_at <= datetime('now', '-2 days')
    `,
    categoryBreakdown: `
      SELECT category, COUNT(*) as count 
      FROM assets 
      GROUP BY category
    `,
    statusBreakdown: `
      SELECT status, COUNT(*) as count 
      FROM assets 
      WHERE asset_type = 'unique'
      GROUP BY status
    `,
    dailyMovements: `
      SELECT 
        DATE(movement_date) as date,
        type,
        COUNT(*) as count
      FROM movements 
      WHERE movement_date >= datetime('now', '-30 days')
      GROUP BY DATE(movement_date), type
      ORDER BY date DESC
    `
  };

  const results = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`Erro na query ${key}:`, err);
        results[key] = key.includes('Breakdown') || key === 'dailyMovements' ? [] : { count: 0 };
      } else {
        if (key.includes('Breakdown') || key === 'dailyMovements') {
          results[key] = rows;
        } else {
          results[key] = rows[0] || { count: 0 };
        }
      }

      completedQueries++;
      if (completedQueries === totalQueries) {
        // Processar dados para gráficos
        const chartData = processChartData(results.dailyMovements);
        
        res.json({
          metrics: {
            totalAssets: results.totalAssets.count,
            availableAssets: results.availableAssets.count,
            inUseAssets: results.inUseAssets.count,
            maintenanceAssets: results.maintenanceAssets.count,
            discardedAssets: results.discardedAssets.count,
            lowStockItems: results.lowStockItems.count,
            recentCheckouts: results.recentMovements.count,
            // Valores financeiros
            totalValue: results.totalValue.value,
            maintenanceValue: results.maintenanceValue.value,
            availableValue: results.availableValue.value,
            inUseValue: results.inUseValue.value,
            // Alertas de BI
            itemsInTransitOver48h: results.itemsInTransitOver48h.count
          },
          breakdowns: {
            category: results.categoryBreakdown,
            status: results.statusBreakdown
          },
          chartData
        });
      }
    });
  });
});

// Processar dados para gráfico de movimentações dos últimos 30 dias
function processChartData(movements) {
  const last30Days = [];
  const today = new Date();
  
  // Gerar últimos 30 dias
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    last30Days.push({
      date: dateStr,
      saidas: 0,
      entradas: 0
    });
  }

  // Preencher com dados reais
  movements.forEach(movement => {
    const dayIndex = last30Days.findIndex(day => day.date === movement.date);
    if (dayIndex !== -1) {
      if (movement.type === 'Saída') {
        last30Days[dayIndex].saidas = movement.count;
      } else if (movement.type === 'Entrada') {
        last30Days[dayIndex].entradas = movement.count;
      }
    }
  });

  return last30Days;
}

// Ativos com vencimento de garantia próximo
router.get('/warranty-alerts', authenticateToken, (req, res) => {
  const query = `
    SELECT id, name, patrimony_tag, warranty_expiry, 
           julianday(warranty_expiry) - julianday('now') as days_until_expiry
    FROM assets 
    WHERE warranty_expiry IS NOT NULL 
    AND warranty_expiry > date('now')
    AND julianday(warranty_expiry) - julianday('now') <= 90
    ORDER BY warranty_expiry ASC
  `;

  db.all(query, [], (err, assets) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar alertas de garantia' });
    }

    res.json({ assets });
  });
});

// Relatório de movimentações recentes
router.get('/recent-movements', authenticateToken, (req, res) => {
  const { limit = 10 } = req.query;

  const query = `
    SELECT 
      m.*,
      a.name as asset_name,
      a.patrimony_tag,
      u.username as created_by_username
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    JOIN users u ON m.created_by = u.id
    ORDER BY m.movement_date DESC
    LIMIT ?
  `;

  db.all(query, [parseInt(limit)], (err, movements) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar movimentações recentes' });
    }

    res.json({ movements });
  });
});

// Itens com estoque baixo (detalhado)
router.get('/low-stock-items', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      brand_model,
      category,
      stock_quantity,
      min_stock,
      (min_stock - stock_quantity) as deficit,
      location,
      updated_at
    FROM assets 
    WHERE asset_type = 'consumable' 
    AND stock_quantity <= min_stock 
    AND min_stock > 0
    ORDER BY (stock_quantity / CAST(min_stock AS FLOAT)) ASC, stock_quantity ASC
  `;

  db.all(query, [], (err, items) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar itens com estoque baixo' });
    }

    res.json({ items });
  });
});

// Valor patrimonial por loja
router.get('/stores-value', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      s.id,
      s.name,
      s.city,
      COALESCE(SUM(a.purchase_value), 0) as total_value,
      COUNT(DISTINCT a.id) as asset_count
    FROM stores s
    LEFT JOIN (
      SELECT 
        m1.store_id,
        m1.asset_id,
        a.purchase_value
      FROM movements m1
      INNER JOIN (
        SELECT asset_id, MAX(movement_date) as max_date
        FROM movements 
        WHERE store_id IS NOT NULL
        GROUP BY asset_id
      ) m2 ON m1.asset_id = m2.asset_id AND m1.movement_date = m2.max_date
      INNER JOIN assets a ON m1.asset_id = a.id
      WHERE m1.store_id IS NOT NULL AND a.status != 'Descartado'
    ) a ON s.id = a.store_id
    GROUP BY s.id, s.name, s.city
    ORDER BY total_value DESC
  `;

  db.all(query, [], (err, stores) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar valor por loja' });
    }

    res.json({ stores });
  });
});

module.exports = router;