const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔄 Tentativa de login recebida:', { username, password: password ? '***' : 'undefined' });

  if (!username || !password) {
    console.log('❌ Dados incompletos:', { username: !!username, password: !!password });
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    async (err, user) => {
      if (err) {
        console.error('❌ Erro na query:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }

      if (!user) {
        console.log('❌ Usuário não encontrado:', username);
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      console.log('✅ Usuário encontrado:', { id: user.id, username: user.username, role: user.role });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.log('❌ Senha inválida para usuário:', username);
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const token = generateToken(user);
      
      console.log('✅ Login bem-sucedido:', { username: user.username, role: user.role });
      
      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

// Verificar token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Logout (apenas limpa o token no frontend)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;