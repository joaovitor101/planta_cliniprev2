const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const { connectDb } = require("./lib/db");
const unitRoutes = require("./routes/unitRoutes");
const floorRoutes = require("./routes/floorRoutes");
const areaRoutes = require("./routes/areaRoutes");
const textRoutes = require("./routes/textRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API (DEVE VIR PRIMEIRO)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API Planta Cliniprev v2" });
});

app.use("/api/units", unitRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/texts", textRoutes);
app.use("/api/equipments", equipmentRoutes);



// Servir arquivos estáticos do uploads (DEPOIS DAS ROTAS DE API)
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
  }),
);

// Servir build do Vite em produção
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

// SPA fallback - redirecionar rotas desconhecidas para index.html (DEVE VIR POR ÚLTIMO)
// SPA fallback - SOMENTE para rotas que NÃO começam com /api
app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "Rota da API não encontrada" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API ouvindo na porta ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };

