const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

const sessaoValidation = [
  body('data').isDate(),
  body('hora_inicio').matches(/^\d{2}:\d{2}$/),
  body('duracao').isInt({ min: 1 }),
  body('tipo_tarefa').trim().notEmpty(),
  body('foco').isInt({ min: 1, max: 5 }),
  body('energia').isInt({ min: 1, max: 5 }),
  body('dificuldade').isInt({ min: 1, max: 5 }),
];

// GET /api/sessoes?limit=50&from=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { limit = 50, from, to } = req.query;

  let sql = `
    SELECT id, data, hora_inicio, duracao, tipo_tarefa, foco, energia, dificuldade, created_at
    FROM sessoes_foco
    WHERE user_id = $1
  `;
  const values = [req.userId];
  let idx = 2;

  if (from) { sql += ` AND data >= $${idx++}`; values.push(from); }
  if (to)   { sql += ` AND data <= $${idx++}`; values.push(to); }

  sql += ` ORDER BY data DESC, hora_inicio DESC LIMIT $${idx}`;
  values.push(Math.min(Number(limit), 500));

  try {
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
});

// POST /api/sessoes
router.post('/', sessaoValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { data, hora_inicio, duracao, tipo_tarefa, foco, energia, dificuldade } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO sessoes_foco (user_id, data, hora_inicio, duracao, tipo_tarefa, foco, energia, dificuldade)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.userId, data, hora_inicio, duracao, tipo_tarefa, foco, energia, dificuldade]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao criar sessão' });
  }
});

// DELETE /api/sessoes/:id
router.delete('/:id', param('id').isInt(), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM sessoes_foco WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Sessão não encontrada' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar sessão' });
  }
});

// GET /api/sessoes/stats/patterns — padrões de foco para analytics
router.get('/stats/patterns', async (req, res) => {
  try {
    const [byHour, byTipo, byWeekday, correlation] = await Promise.all([
      pool.query(
        `SELECT EXTRACT(HOUR FROM hora_inicio)::int AS hora,
                ROUND(AVG((foco * 0.5 + energia * 0.3 - dificuldade * 0.2)::numeric), 2) AS avg_score,
                COUNT(*) AS total
         FROM sessoes_foco
         WHERE user_id = $1
         GROUP BY hora ORDER BY hora`,
        [req.userId]
      ),
      pool.query(
        `SELECT tipo_tarefa,
                ROUND(AVG((foco * 0.5 + energia * 0.3 - dificuldade * 0.2)::numeric), 2) AS avg_score,
                ROUND(AVG(foco::numeric), 2) AS avg_foco,
                COUNT(*) AS total
         FROM sessoes_foco
         WHERE user_id = $1
         GROUP BY tipo_tarefa ORDER BY avg_score DESC`,
        [req.userId]
      ),
      pool.query(
        `SELECT EXTRACT(DOW FROM data)::int AS dia_semana,
                ROUND(AVG((foco * 0.5 + energia * 0.3 - dificuldade * 0.2)::numeric), 2) AS avg_score
         FROM sessoes_foco
         WHERE user_id = $1
         GROUP BY dia_semana ORDER BY dia_semana`,
        [req.userId]
      ),
      pool.query(
        `SELECT energia, foco FROM sessoes_foco WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [req.userId]
      ),
    ]);

    res.json({
      byHour: byHour.rows,
      byTipo: byTipo.rows,
      byWeekday: byWeekday.rows,
      correlation: correlation.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao calcular padrões' });
  }
});

module.exports = router;
