const { verifyAccessToken } = require('../services/tokens');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expirado'
      : 'Token inválido';
    return res.status(401).json({ error: message, code: err.name });
  }
}

module.exports = { authenticate };
