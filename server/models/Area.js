const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 220,
    },
    height: {
      type: Number,
      default: 120,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Area", areaSchema);

