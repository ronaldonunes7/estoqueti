const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-inventario-ti-2026',
    { expiresIn: '24h' }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-inventario-ti-2026', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }

    // Buscar dados completos do usuário
    db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      req.user = user;
      next();
    });
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin
};