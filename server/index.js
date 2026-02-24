const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const { connectDb } = require("./lib/db");
const unitRoutes = require("./routes/unitRoutes");
const floorRoutes = require("./routes/floorRoutes");
const areaRoutes = require("./routes/areaRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API Planta Cliniprev v2" });
});

app.use("/api/units", unitRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/equipments", equipmentRoutes);

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

