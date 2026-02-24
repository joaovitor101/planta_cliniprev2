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

router.post("/", async (req, res, next) => {
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json(equipment);
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

