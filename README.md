# FocusRadar

Sistema inteligente de produtividade com análise macro (dia) e micro (sessões de foco).

## Stack

**Backend** → Node.js · Express · PostgreSQL · JWT  
**Frontend** → React 18 · Vite · Tailwind CSS · Recharts · Zustand


## Setup Backend

### 1. Criar banco de dados PostgreSQL

```sql
CREATE DATABASE focusradar;
```

### 2. Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Instalar dependências e rodar migrations

```bash
npm install
npm run migrate
```

### 4. Iniciar servidor

```bash
npm run dev       # desenvolvimento (nodemon)
npm start         # produção
```

API rodando em `http://localhost:3001`

---

## Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

App rodando em `http://localhost:5174`

---

## API Endpoints

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login → retorna JWT |
| GET | `/api/auth/me` | Dados do usuário logado |
| PATCH | `/api/auth/me` | Atualizar perfil |
| DELETE | `/api/auth/me` | Excluir conta |

### Registros Diários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/registros` | Listar (query: limit, from, to) |
| POST | `/api/registros` | Criar/atualizar (upsert por data) |
| PATCH | `/api/registros/:id` | Atualizar registro |
| DELETE | `/api/registros/:id` | Deletar registro |
| GET | `/api/registros/stats/summary` | Stats para o dashboard |

### Sessões de Foco
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/sessoes` | Listar sessões |
| POST | `/api/sessoes` | Criar sessão |
| DELETE | `/api/sessoes/:id` | Deletar sessão |
| GET | `/api/sessoes/stats/patterns` | Padrões por horário/tipo/dia |

---

## Fórmulas

```
Produtividade diária = (horas_estudo + horas_trabalho) × (foco_geral / 5)

Score de sessão = (foco × 0.5) + (energia × 0.3) − (dificuldade × 0.2)
```
