const express = require("express");
const Floor = require("../models/Floor");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { unitId } = req.query;
    const query = {};
    if (unitId) {
      query.unitId = unitId;
    }
    const floors = await Floor.find(query).sort({ order: 1 });
    res.json(floors);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const floor = await Floor.create(req.body);
    res.status(201).json(floor);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

