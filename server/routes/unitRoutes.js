const express = require("express");
const Unit = require("../models/Unit");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const units = await Unit.find().sort({ name: 1 });
    res.json(units);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const unit = await Unit.create(req.body);
    res.status(201).json(unit);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

