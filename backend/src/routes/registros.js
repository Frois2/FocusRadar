const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

const registroValidation = [
  body('data').isDate().withMessage('Data inválida'),
  body('horas_estudo').isFloat({ min: 0, max: 24 }).withMessage('Horas inválidas'),
  body('horas_trabalho').isFloat({ min: 0, max: 24 }).withMessage('Horas inválidas'),
  body('energia').isInt({ min: 1, max: 5 }),
  body('humor').isInt({ min: 1, max: 5 }),
  body('foco_geral').isInt({ min: 1, max: 5 }),
];

// GET /api/registros?limit=30&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { limit = 30, from, to } = req.query;

  let sql = `
    SELECT id, data, horas_estudo, horas_trabalho, energia, humor, foco_geral, nota, created_at
    FROM registros_diarios
    WHERE user_id = $1
  `;
  const values = [req.userId];
  let idx = 2;

  if (from) { sql += ` AND data >= $${idx++}`; values.push(from); }
  if (to)   { sql += ` AND data <= $${idx++}`; values.push(to); }

  sql += ` ORDER BY data DESC LIMIT $${idx}`;
  values.push(Math.min(Number(limit), 365));

  try {
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar registros' });
  }
});

// GET /api/registros/:id
router.get('/:id', param('id').isInt(), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM registros_diarios WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/registros
router.post('/', registroValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { data, horas_estudo, horas_trabalho, energia, humor, foco_geral, nota } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO registros_diarios (user_id, data, horas_estudo, horas_trabalho, energia, humor, foco_geral, nota)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id, data) DO UPDATE
         SET horas_estudo = EXCLUDED.horas_estudo,
             horas_trabalho = EXCLUDED.horas_trabalho,
             energia = EXCLUDED.energia,
             humor = EXCLUDED.humor,
             foco_geral = EXCLUDED.foco_geral,
             nota = EXCLUDED.nota
       RETURNING *`,
      [req.userId, data, horas_estudo, horas_trabalho, energia, humor, foco_geral, nota || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao salvar registro' });
  }
});

// PATCH /api/registros/:id
router.patch('/:id', param('id').isInt(), async (req, res) => {
  const allowed = ['horas_estudo', 'horas_trabalho', 'energia', 'humor', 'foco_geral', 'nota'];
  const updates = [];
  const values = [];
  let idx = 1;

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${idx++}`);
      values.push(req.body[field]);
    }
  });

  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

  values.push(req.params.id, req.userId);

  try {
    const result = await pool.query(
      `UPDATE registros_diarios SET ${updates.join(', ')}
       WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// DELETE /api/registros/:id
router.delete('/:id', param('id').isInt(), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM registros_diarios WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Registro não encontrado' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

// GET /api/registros/stats/summary — stats para o dashboard
router.get('/stats/summary', async (req, res) => {
  try {
    const [last7, prev7, allTime] = await Promise.all([
      pool.query(
        `SELECT AVG(horas_estudo + horas_trabalho) AS avg_horas,
                AVG(energia) AS avg_energia,
                AVG(humor) AS avg_humor,
                AVG(foco_geral) AS avg_foco,
                AVG((horas_estudo + horas_trabalho) * (foco_geral::float / 5)) AS avg_prod,
                COUNT(*) AS total
         FROM registros_diarios
         WHERE user_id = $1 AND data >= CURRENT_DATE - INTERVAL '7 days'`,
        [req.userId]
      ),
      pool.query(
        `SELECT AVG((horas_estudo + horas_trabalho) * (foco_geral::float / 5)) AS avg_prod
         FROM registros_diarios
         WHERE user_id = $1
           AND data >= CURRENT_DATE - INTERVAL '14 days'
           AND data < CURRENT_DATE - INTERVAL '7 days'`,
        [req.userId]
      ),
      pool.query(
        'SELECT COUNT(*) AS total_registros FROM registros_diarios WHERE user_id = $1',
        [req.userId]
      ),
    ]);

    res.json({
      last7: last7.rows[0],
      prev7: prev7.rows[0],
      allTime: allTime.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular stats' });
  }
});

module.exports = router;
