const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Middleware para log de todas as requisições de relatórios
router.use((req, res, next) => {
  console.log(`📡 [REPORTS] ${req.method} ${req.path}`);
  console.log(`📡 [REPORTS] Query:`, req.query);
  console.log(`📡 [REPORTS] Headers:`, {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  next();
});

// Exportar relatório de ativos em CSV (temporariamente sem autenticação)
router.get('/assets/csv', (req, res) => {
  const { status, category } = req.query;
  
  let query = 'SELECT * FROM assets WHERE 1=1';
  let params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, assets) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao gerar relatório' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `relatorio-ativos-${timestamp}.csv`;
    const filepath = path.join(__dirname, '../temp', filename);

    // Criar diretório temp se não existir
    const tempDir = path.dirname(filepath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Nome' },
        { id: 'brand_model', title: 'Marca/Modelo' },
        { id: 'serial_number', title: 'Número de Série' },
        { id: 'patrimony_tag', title: 'Tag Patrimônio' },
        { id: 'category', title: 'Categoria' },
        { id: 'status', title: 'Status' },
        { id: 'purchase_date', title: 'Data Compra' },
        { id: 'purchase_value', title: 'Valor Compra' },
        { id: 'warranty_expiry', title: 'Vencimento Garantia' },
        { id: 'location', title: 'Localização' },
        { id: 'created_at', title: 'Criado em' }
      ]
    });

    csvWriter.writeRecords(assets)
      .then(() => {
        res.download(filepath, filename, (err) => {
          if (err) {
            console.error('Erro ao enviar arquivo:', err);
          }
          // Limpar arquivo temporário
          fs.unlink(filepath, (unlinkErr) => {
            if (unlinkErr) console.error('Erro ao deletar arquivo temporário:', unlinkErr);
          });
        });
      })
      .catch(error => {
        console.error('Erro ao escrever CSV:', error);
        res.status(500).json({ message: 'Erro ao gerar arquivo CSV' });
      });
  });
});

// Exportar relatório de movimentações em CSV
router.get('/movements/csv', authenticateToken, (req, res) => {
  const { start_date, end_date, type } = req.query;
  
  let query = `
    SELECT 
      m.*,
      a.name as asset_name,
      a.patrimony_tag,
      a.serial_number,
      u.username as created_by_username
    FROM movements m
    JOIN assets a ON m.asset_id = a.id
    JOIN users u ON m.created_by = u.id
    WHERE 1=1
  `;
  let params = [];

  if (start_date) {
    query += ' AND DATE(m.movement_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(m.movement_date) <= ?';
    params.push(end_date);
  }

  if (type) {
    query += ' AND m.type = ?';
    params.push(type);
  }

  query += ' ORDER BY m.movement_date DESC';

  db.all(query, params, (err, movements) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao gerar relatório' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `relatorio-movimentacoes-${timestamp}.csv`;
    const filepath = path.join(__dirname, '../temp', filename);

    // Criar diretório temp se não existir
    const tempDir = path.dirname(filepath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'asset_name', title: 'Nome do Ativo' },
        { id: 'patrimony_tag', title: 'Tag Patrimônio' },
        { id: 'serial_number', title: 'Número de Série' },
        { id: 'type', title: 'Tipo' },
        { id: 'employee_name', title: 'Colaborador' },
        { id: 'destination', title: 'Destino' },
        { id: 'responsible_technician', title: 'Técnico Responsável' },
        { id: 'observations', title: 'Observações' },
        { id: 'movement_date', title: 'Data/Hora' },
        { id: 'created_by_username', title: 'Criado por' }
      ]
    });

    csvWriter.writeRecords(movements)
      .then(() => {
        res.download(filepath, filename, (err) => {
          if (err) {
            console.error('Erro ao enviar arquivo:', err);
          }
          // Limpar arquivo temporário
          fs.unlink(filepath, (unlinkErr) => {
            if (unlinkErr) console.error('Erro ao deletar arquivo temporário:', unlinkErr);
          });
        });
      })
      .catch(error => {
        console.error('Erro ao escrever CSV:', error);
        res.status(500).json({ message: 'Erro ao gerar arquivo CSV' });
      });
  });
});

// Exportar relatório em PDF (temporariamente sem autenticação para debug)
router.get('/assets/pdf', (req, res) => {
  console.log('🔍 Gerando relatório PDF de ativos...');
  console.log('📊 Filtros recebidos:', req.query);
  console.log('🔑 Headers:', req.headers.authorization ? 'Token presente' : 'Sem token');
  
  const { status, category } = req.query;
  
  let query = 'SELECT * FROM assets WHERE 1=1';
  let params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, assets) => {
    if (err) {
      console.error('❌ Erro na query de ativos:', err);
      return res.status(500).json({ message: 'Erro ao gerar relatório' });
    }

    console.log(`📊 Encontrados ${assets.length} ativos para o relatório`);

    try {
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
        if (index > 0 && index % 20 === 0) {
          doc.addPage();
        }

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
      console.log('✅ Relatório PDF gerado com sucesso');
    } catch (pdfError) {
      console.error('❌ Erro ao gerar PDF:', pdfError);
      res.status(500).json({ 
        message: 'Erro ao gerar PDF',
        error: pdfError.message
      });
    }
  });
});

// Endpoint temporário para testar PDF sem autenticação
router.get('/assets/pdf-test', (req, res) => {
  console.log('🔍 [DEBUG] Gerando relatório PDF sem autenticação...');
  console.log('📊 [DEBUG] Filtros recebidos:', req.query);
  
  const { status, category } = req.query;
  
  let query = 'SELECT * FROM assets WHERE 1=1';
  let params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, assets) => {
    if (err) {
      console.error('❌ [DEBUG] Erro na query de ativos:', err);
      return res.status(500).json({ message: 'Erro ao gerar relatório', error: err.message });
    }

    console.log(`📊 [DEBUG] Encontrados ${assets.length} ativos para o relatório`);

    try {
      const doc = new PDFDocument();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `relatorio-ativos-debug-${timestamp}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      // Cabeçalho
      doc.fontSize(20).text('Relatório de Ativos de TI (DEBUG)', { align: 'center' });
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
        if (index > 0 && index % 20 === 0) {
          doc.addPage();
        }

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
      console.log('✅ [DEBUG] Relatório PDF gerado com sucesso');
    } catch (pdfError) {
      console.error('❌ [DEBUG] Erro ao gerar PDF:', pdfError);
      res.status(500).json({ 
        message: 'Erro ao gerar PDF',
        error: pdfError.message,
        stack: pdfError.stack
      });
    }
  });
});

// Endpoint de teste simples para verificar se as rotas estão funcionando
router.get('/test', (req, res) => {
  console.log('📡 [REPORTS] Endpoint de teste acessado');
  res.json({ 
    message: 'Rotas de relatórios funcionando!',
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api/reports/assets/csv',
      'GET /api/reports/assets/pdf',
      'GET /api/reports/assets/pdf-test'
    ]
  });
});

module.exports = router;