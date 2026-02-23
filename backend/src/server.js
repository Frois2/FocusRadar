const cors = require("cors");

const allowedOrigins = [
  "https://focus-radar-git-main-frois2s-projects.vercel.app",
  "https://seu-dominio-final.vercel.app", // adicione outros se precisar
  "http://localhost:5173", // para desenvolvimento local
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (ex: Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Bloqueado pelo CORS: origem não permitida"));
    }
  },
  credentials: true, // necessário para cookies/sessões
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Garante que requisições OPTIONS (preflight) sejam respondidas
app.options("*", cors());