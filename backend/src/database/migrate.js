require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./pool');

const sql = `
  CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(150) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    meta_horas     INTEGER DEFAULT 40,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(64) UNIQUE NOT NULL,
    code       CHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS registros_diarios (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data           DATE NOT NULL,
    horas_estudo   NUMERIC(4,1) NOT NULL DEFAULT 0,
    horas_trabalho NUMERIC(4,1) NOT NULL DEFAULT 0,
    energia        SMALLINT NOT NULL CHECK (energia BETWEEN 1 AND 5),
    humor          SMALLINT NOT NULL CHECK (humor BETWEEN 1 AND 5),
    foco_geral     SMALLINT NOT NULL CHECK (foco_geral BETWEEN 1 AND 5),
    nota           TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data)
  );

  CREATE TABLE IF NOT EXISTS sessoes_foco (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data        DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    duracao     INTEGER NOT NULL CHECK (duracao > 0),
    tipo_tarefa VARCHAR(50) NOT NULL,
    foco        SMALLINT NOT NULL CHECK (foco BETWEEN 1 AND 5),
    energia     SMALLINT NOT NULL CHECK (energia BETWEEN 1 AND 5),
    dificuldade SMALLINT NOT NULL CHECK (dificuldade BETWEEN 1 AND 5),
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add code column if upgrading from old schema
  ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS code CHAR(6);

  CREATE INDEX IF NOT EXISTS idx_registros_user_data ON registros_diarios(user_id, data DESC);
  CREATE INDEX IF NOT EXISTS idx_sessoes_user_data   ON sessoes_foco(user_id, data DESC);
  CREATE INDEX IF NOT EXISTS idx_refresh_token       ON refresh_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_password_reset      ON password_resets(token);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ Migrations applied');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
