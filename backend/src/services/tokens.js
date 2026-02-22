const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../database/pool');

// ── Access token ─────────────────────────────────────────────────────
function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

// ── Opaque tokens ─────────────────────────────────────────────────────
function generateOpaqueToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateCode(digits = 6) {
  return String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, '0');
}

// ── Refresh token ─────────────────────────────────────────────────────
async function createRefreshToken(userId) {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return token;
}

async function rotateRefreshToken(oldToken) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT rt.user_id FROM refresh_tokens rt
       WHERE rt.token = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
      [oldToken]
    );
    if (!result.rows[0]) { await client.query('ROLLBACK'); return null; }
    const { user_id } = result.rows[0];
    await client.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [oldToken]);
    const newToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user_id, newToken, expiresAt]
    );
    await client.query('COMMIT');
    return { userId: user_id, newRefreshToken: newToken };
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally {
    client.release();
  }
}

async function revokeRefreshToken(token) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [token]);
}

async function revokeAllUserTokens(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
}

// ── Email verification (6-digit code + token fallback) ────────────────
async function createEmailVerificationToken(userId) {
  const token = generateOpaqueToken(32);
  const code = generateCode(6);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
  await pool.query(
    'INSERT INTO email_verifications (user_id, token, code, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, token, code, expiresAt]
  );
  return { token, code };
}

// ── Password reset ────────────────────────────────────────────────────
async function createPasswordResetToken(userId) {
  const token = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
  await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return token;
}

module.exports = {
  signAccessToken, verifyAccessToken,
  createRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens,
  createEmailVerificationToken, createPasswordResetToken,
};
