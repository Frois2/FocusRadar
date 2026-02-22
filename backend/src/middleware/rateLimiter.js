const rateLimit = require('express-rate-limit');

// Strict limiter for login/register — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
  skipSuccessfulRequests: true, // only count failed requests
});

// More lenient limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações de redefinição. Aguarde 1 hora.' },
});

module.exports = { authLimiter, passwordResetLimiter };
