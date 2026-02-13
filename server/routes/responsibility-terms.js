const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configurar multer para upload de PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/terms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const termNumber = req.body.termNumber || Date.now();
    cb(null, `termo_${termNumber}.pdf`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Criar novo termo de responsabilidade
router.post('/', authenticateToken, (req, res) => {
  const {
    termNumber,
    movementId,
    recipientName,
    recipientCpf,
    recipientEmail,
    recipientUnit,
    signatureData,
    pdfBlob
  } = req.body;

  if (!termNumber || !movementId || !recipientName || !recipientCpf || !recipientUnit) {
    return res.status(400).json({
      message: 'Dados obrigatórios: termNumber, movementId, recipientName, recipientCpf, recipientUnit'
    });
  }

  // Converter base64 para buffer se pdfBlob foi enviado
  let pdfBuffer = null;
  if (pdfBlob) {
    try {
      // Remove o prefixo data:application/pdf;base64, se existir
      const base64Data = pdfBlob.replace(/^data:application\/pdf;base64,/, '');
      pdfBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      return res.status(400).json({ message: 'Erro ao processar arquivo PDF' });
    }
  }

  const query = `
    INSERT INTO responsibility_terms (
      term_number, movement_id, recipient_name, recipient_cpf, 
      recipient_email, recipient_unit, signature_data, pdf_blob, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    termNumber,
    movementId,
    recipientName,
    recipientCpf,
    recipientEmail || null,
    recipientUnit,
    signatureData || null,
    pdfBuffer,
    req.user.id
  ], function(err) {
    if (err) {
      console.error('Erro ao salvar termo:', err);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ message: 'Número do termo já existe' });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    res.status(201).json({
      message: 'Termo de responsabilidade criado com sucesso',
      termId: this.lastID,
      termNumber
    });
  });
});

// Listar termos por movimentação
router.get('/movement/:movementId', authenticateToken, (req, res) => {
  const { movementId } = req.params;

  const query = `
    SELECT 
      rt.*,
      u.username as created_by_username
    FROM responsibility_terms rt
    LEFT JOIN users u ON rt.created_by = u.id
    WHERE rt.movement_id = ?
    ORDER BY rt.created_at DESC
  `;

  db.all(query, [movementId], (err, terms) => {
    if (err) {
      console.error('Erro ao buscar termos:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    // Remover dados binários da resposta (apenas metadados)
    const termsMetadata = terms.map(term => ({
      ...term,
      pdf_blob: term.pdf_blob ? 'present' : null,
      signature_data: term.signature_data ? 'present' : null
    }));

    res.json(termsMetadata);
  });
});

// Baixar PDF do termo
router.get('/:termId/pdf', authenticateToken, (req, res) => {
  const { termId } = req.params;

  const query = 'SELECT term_number, pdf_blob FROM responsibility_terms WHERE id = ?';

  db.get(query, [termId], (err, term) => {
    if (err) {
      console.error('Erro ao buscar termo:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (!term) {
      return res.status(404).json({ message: 'Termo não encontrado' });
    }

    if (!term.pdf_blob) {
      return res.status(404).json({ message: 'PDF não disponível para este termo' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Termo_${term.term_number}.pdf"`);
    res.send(term.pdf_blob);
  });
});

// Listar todos os termos (com paginação)
router.get('/', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const countQuery = 'SELECT COUNT(*) as total FROM responsibility_terms';
  
  db.get(countQuery, [], (err, countResult) => {
    if (err) {
      console.error('Erro ao contar termos:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    const query = `
      SELECT 
        rt.*,
        u.username as created_by_username,
        m.type as movement_type,
        m.employee_name as movement_employee
      FROM responsibility_terms rt
      LEFT JOIN users u ON rt.created_by = u.id
      LEFT JOIN movements m ON rt.movement_id = m.id
      ORDER BY rt.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [limit, offset], (err, terms) => {
      if (err) {
        console.error('Erro ao buscar termos:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }

      // Remover dados binários da resposta
      const termsMetadata = terms.map(term => ({
        ...term,
        pdf_blob: term.pdf_blob ? 'present' : null,
        signature_data: term.signature_data ? 'present' : null
      }));

      res.json({
        terms: termsMetadata,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Buscar termo específico
router.get('/:termId', authenticateToken, (req, res) => {
  const { termId } = req.params;

  const query = `
    SELECT 
      rt.*,
      u.username as created_by_username,
      m.type as movement_type,
      m.employee_name as movement_employee,
      m.movement_date
    FROM responsibility_terms rt
    LEFT JOIN users u ON rt.created_by = u.id
    LEFT JOIN movements m ON rt.movement_id = m.id
    WHERE rt.id = ?
  `;

  db.get(query, [termId], (err, term) => {
    if (err) {
      console.error('Erro ao buscar termo:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (!term) {
      return res.status(404).json({ message: 'Termo não encontrado' });
    }

    // Remover dados binários da resposta
    const termMetadata = {
      ...term,
      pdf_blob: term.pdf_blob ? 'present' : null,
      signature_data: term.signature_data ? 'present' : null
    };

    res.json(termMetadata);
  });
});

// Deletar termo (apenas admin)
router.delete('/:termId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem deletar termos.' });
  }

  const { termId } = req.params;

  const query = 'DELETE FROM responsibility_terms WHERE id = ?';

  db.run(query, [termId], function(err) {
    if (err) {
      console.error('Erro ao deletar termo:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Termo não encontrado' });
    }

    res.json({ message: 'Termo deletado com sucesso' });
  });
});

// Middleware de tratamento de erros do multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Arquivo muito grande. Máximo 10MB.' });
    }
  }
  
  if (error.message === 'Apenas arquivos PDF são permitidos') {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

module.exports = router;