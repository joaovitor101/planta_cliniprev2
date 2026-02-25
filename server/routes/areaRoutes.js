const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Area = require("../models/Area");

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
    const { unitId, floorId } = req.query;
    const query = {};
    if (unitId) {
      query.unitId = unitId;
    }
    if (floorId) {
      query.floorId = floorId;
    }
    const areas = await Area.find(query).sort({ createdAt: 1 });
    res.json(areas);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const area = await Area.create(req.body);
    res.status(201).json(area);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const area = await Area.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(area);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/image",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "Arquivo de imagem é obrigatório." });
      }

      const relativePath = `/uploads/${req.file.filename}`;

      const area = await Area.findByIdAndUpdate(
        id,
        { imagemUrl: relativePath },
        { new: true },
      );

      res.json(area);
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await Area.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

