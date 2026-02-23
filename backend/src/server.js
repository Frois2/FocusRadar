require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const registrosRoutes = require('./routes/registros');
const sessoesRoutes = require('./routes/sessoes');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: "*",
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/registros', registrosRoutes);
app.use('/api/sessoes', sessoesRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`FocusRadar API running on port ${PORT}`);
});