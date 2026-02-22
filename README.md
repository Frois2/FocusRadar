# FocusRadar

Sistema inteligente de produtividade com análise macro (dia) e micro (sessões de foco).

## Stack

**Backend** → Node.js · Express · PostgreSQL · JWT  
**Frontend** → React 18 · Vite · Tailwind CSS · Recharts · Zustand

---

## Estrutura

```
focusradar/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── pool.js          # Conexão PostgreSQL
│   │   │   └── migrate.js       # Migrations (cria tabelas)
│   │   ├── middleware/
│   │   │   └── authenticate.js  # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # Register, login, me
│   │   │   ├── registros.js     # CRUD registros diários
│   │   │   └── sessoes.js       # CRUD sessões de foco
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui.jsx           # Design system (Card, Input, Modal, etc.)
    │   │   ├── Sidebar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── layouts/
    │   │   └── AppLayout.jsx
    │   ├── lib/
    │   │   ├── api.js           # Axios client com interceptors JWT
    │   │   ├── analytics.js     # Funções de cálculo (produtividade, score)
    │   │   └── chartTheme.js    # Tema Recharts
    │   ├── pages/
    │   │   ├── Auth.jsx         # Login + Cadastro
    │   │   ├── Dashboard.jsx    # Visão macro + insights
    │   │   ├── RegistroDiario.jsx
    │   │   ├── SessoesFoco.jsx
    │   │   ├── Analytics.jsx    # Heatmap, tendências, correlações
    │   │   └── Perfil.jsx
    │   ├── store/
    │   │   └── auth.js          # Zustand store
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

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

App rodando em `http://localhost:5173`

> O Vite está configurado com proxy: chamadas para `/api` são redirecionadas para `localhost:3001`.

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
