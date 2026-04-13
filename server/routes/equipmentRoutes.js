const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Equipment = require("../models/Equipment");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");




if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.get("/", async (req, res, next) => {
  try {
    const { areaId } = req.query;
    const query = {};
    if (areaId) {
      query.areaId = areaId;
    }
    const equipments = await Equipment.find(query).sort({ createdAt: 1 });
    res.json(equipments);
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { q, by } = req.query;

    if (!q || !q.trim()) {
      return res.json([]);
    }

    const regex = new RegExp(q.trim(), "i");

    let query = {};

    if (by === "usuario") {
      query = { usuarioLogado: regex };
    } else if (by === "maquina") {
      query = { nomeMaquina: regex };
    } else {
      query = {
        $or: [{ usuarioLogado: regex }, { nomeMaquina: regex }, { proprietario: regex }],
      };
    }

    const equipments = await Equipment.find(query).sort({ createdAt: 1 });
    res.json(equipments);
  } catch (error) {
    next(error);
  }
});

router.get("/export/csv", async (req, res, next) => {
  try {
    // 1. Buscamos todos os equipamentos populando a Árvore de Localização (Área -> Andar / Unidade)
    const equipments = await Equipment.find()
      .populate({
        path: "areaId",
        populate: [
          { path: "unitId", select: "name" },
          { path: "floorId", select: "name" },
        ],
      })
      .sort({ createdAt: 1 });

    // 2. Definimos os Cabeçalhos Organizadinhos
    const headers = [
      "ID",
      "Unidade",
      "Andar",
      "Área",
      "Tipo",
      "Nome da Máquina",
      "Proprietário",
      "Usuário Logado",
      "Anydesk",
      "Kaspersky",
      "Armazenamento Livre",
      "Status",
      "Observações",
      "Data de Cadastro"
    ];

    // Função utilitária para garantir que quebras de linha e ponto-e-vírgulas no texto não quebrem o Excel
    const escapeCsv = (text) => {
      if (!text) return "";
      const str = String(text).replace(/"/g, '""');
      return `"${str}"`;
    };

    // 3. Montamos as Linhas do Relatório
    const rows = equipments.map(eq => {
      const area = eq.areaId || {};
      const unitName = area.unitId ? area.unitId.name : "N/A";
      const floorName = area.floorId ? area.floorId.name : "N/A";
      const areaName = area.name || "N/A";
      const dataCriacao = eq.createdAt ? new Date(eq.createdAt).toLocaleDateString("pt-BR") : "";

      return [
        eq._id.toString(),
        escapeCsv(unitName),
        escapeCsv(floorName),
        escapeCsv(areaName),
        escapeCsv(eq.tipo),
        escapeCsv(eq.nomeMaquina),
        escapeCsv(eq.proprietario),
        escapeCsv(eq.usuarioLogado),
        escapeCsv(eq.anydesk),
        escapeCsv(eq.kaspersky),
        escapeCsv(eq.armazenamentoLivre),
        escapeCsv(eq.status),
        escapeCsv(eq.observacoes),
        escapeCsv(dataCriacao)
      ].join(";");
    });

    // 4. Montamos o CSV em UTF-8 com BOM (\uFEFF) para forçar o Excel a reconhecer os acentos
    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");

    // 5. Retornamos o arquivo de download para requisição
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=inventario_equipamentos.csv");
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipamento não encontrado" });
    }

    res.json(equipment);
  } catch (error) {
    next(error);
  }
});


router.post("/", async (req, res, next) => {
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json(equipment);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/image", (req, res, next) => {
  upload.single("file")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Imagem muito grande. Máximo permitido: 5MB.",
        });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: "Erro no upload." });
    }

    next();
  });
}, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo de imagem é obrigatório.",
      });
    }

    const relativePath = `/uploads/${req.file.filename}`;

    const equipment = await Equipment.findByIdAndUpdate(
      id,
      { imagemUrl: relativePath },
      { new: true }
    );

    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await Equipment.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

