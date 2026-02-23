const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  signAccessToken, createRefreshToken, rotateRefreshToken,
  revokeRefreshToken, revokeAllUserTokens,
  createEmailVerificationToken, createPasswordResetToken,
} = require('../services/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/mailer');

const router = express.Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número'),
];

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ error: errors.array()[0].msg }); return false; }
  return true;
}

function safe(user) { const { password, ...rest } = user; return rest; }

// POST /api/auth/register
router.post('/register', authLimiter, registerRules, async (req, res) => {
  if (!validate(req, res)) return;
  const { name, email, password } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Este e-mail já está cadastrado' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id,name,email,meta_horas,email_verified,created_at',
      [name, email, hashed]
    );
    const user = result.rows[0];

    try {
      const { token, code } = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(email, { token, code });
    } catch (e) { console.error('Mail error:', e.message); }

    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);
    res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Erro interno ao criar conta' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  if (!validate(req, res)) return;
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id,name,email,password,meta_horas,email_verified,created_at FROM users WHERE email=$1', [email]
    );
    const user = result.rows[0];
    const hash = user ? user.password : '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const valid = await bcrypt.compare(password, hash);
    if (!user || !valid) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);
    res.json({ accessToken, refreshToken, user: safe(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token não fornecido' });
  try {
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) return res.status(401).json({ error: 'Token inválido ou expirado' });
    const accessToken = signAccessToken(rotated.userId);
    res.json({ accessToken, refreshToken: rotated.newRefreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken).catch(() => {});
  res.status(204).end();
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,name,email,meta_horas,email_verified,created_at FROM users WHERE id=$1', [req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro interno' }); }
});

// PATCH /api/auth/me
router.patch('/me', authenticate, async (req, res) => {
  const { name, email, meta_horas, password } = req.body;
  const updates = []; const values = []; let idx = 1;
  if (name)       { updates.push(`name=$${idx++}`);       values.push(name.trim()); }
  if (email)      { updates.push(`email=$${idx++}`);      values.push(email.toLowerCase()); }
  if (meta_horas) { updates.push(`meta_horas=$${idx++}`); values.push(Number(meta_horas)); }
  if (password) {
    const hashed = await bcrypt.hash(password, 12);
    updates.push(`password=$${idx++}`); values.push(hashed);
    await revokeAllUserTokens(req.userId).catch(() => {});
  }
  if (!updates.length) return res.status(400).json({ error: 'Nada para atualizar' });
  updates.push('updated_at=NOW()'); values.push(req.userId);
  try {
    const result = await pool.query(
      `UPDATE users SET ${updates.join(',')} WHERE id=$${idx} RETURNING id,name,email,meta_horas,email_verified,created_at`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail já em uso' });
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// DELETE /api/auth/me
router.delete('/me', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.userId]);
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: 'Erro ao excluir conta' }); }
});

// POST /api/auth/verify-email  — accepts { code } OR { token }
router.post('/verify-email', async (req, res) => {
  const { token, code, userId } = req.body;
  if (!token && !code) return res.status(400).json({ error: 'Forneça o código ou o token' });
  try {
    let result;
    if (code) {
      if (!userId) return res.status(400).json({ error: 'userId é obrigatório com código' });
      result = await pool.query(
        'SELECT user_id FROM email_verifications WHERE user_id=$1 AND code=$2 AND expires_at>NOW()',
        [userId, String(code).padStart(6, '0')]
      );
    } else {
      result = await pool.query(
        'SELECT user_id FROM email_verifications WHERE token=$1 AND expires_at>NOW()', [token]
      );
    }
    if (!result.rows[0]) return res.status(400).json({ error: 'Código inválido ou expirado' });
    const uid = result.rows[0].user_id;
    await pool.query('UPDATE users SET email_verified=TRUE WHERE id=$1', [uid]);
    await pool.query('DELETE FROM email_verifications WHERE user_id=$1', [uid]);
    res.json({ message: 'E-mail verificado com sucesso' });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authLimiter, authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id,email,email_verified FROM users WHERE id=$1', [req.userId]);
    const user = result.rows[0];
    
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.email_verified) return res.status(400).json({ error: 'E-mail já verificado' });
    
    const { token, code } = await createEmailVerificationToken(user.id);
    
    await sendVerificationEmail(user.email, { token, code });
    
    res.json({ message: 'Código reenviado' });
  } catch (err) {
    console.error('ERRO DETALHADO NO REENVIO:', err); 
    
    res.status(500).json({ error: 'Erro ao reenviar' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });
  try {
    const result = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (result.rows[0]) {
      const resetToken = await createPasswordResetToken(result.rows[0].id);
      await sendPasswordResetEmail(email, resetToken);
    }
    res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });
  } catch (err) { res.json({ message: 'Se o e-mail existir, você receberá as instruções.' }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
], async (req, res) => {
  if (!validate(req, res)) return;
  const { token, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT user_id FROM password_resets WHERE token=$1 AND used=FALSE AND expires_at>NOW()', [token]
    );
    if (!result.rows[0]) return res.status(400).json({ error: 'Token inválido ou expirado' });
    const uid = result.rows[0].user_id;
    const hashed = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password=$1,updated_at=NOW() WHERE id=$2', [hashed, uid]);
    await pool.query('UPDATE password_resets SET used=TRUE WHERE token=$1', [token]);
    await revokeAllUserTokens(uid);
    res.json({ message: 'Senha redefinida. Faça login com a nova senha.' });
  } catch (err) { res.status(500).json({ error: 'Erro ao redefinir senha' }); }
});

module.exports = router;
