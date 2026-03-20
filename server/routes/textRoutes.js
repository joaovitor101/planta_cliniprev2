const express = require("express");
const Texto = require("../models/Texto");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { unitId, floorId } = req.query;
    const query = {};
    if (unitId) query.unitId = unitId;
    if (floorId) query.floorId = floorId;

    const textos = await Texto.find(query).sort({ createdAt: 1 });
    res.json(textos);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const texto = await Texto.create(req.body);
    res.status(201).json(texto);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const texto = await Texto.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(texto);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await Texto.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

