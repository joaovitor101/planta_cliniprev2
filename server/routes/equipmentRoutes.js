const express = require("express");
const Equipment = require("../models/Equipment");

const router = express.Router();

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

