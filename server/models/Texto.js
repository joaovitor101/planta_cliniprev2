const mongoose = require("mongoose");

const textoSchema = new mongoose.Schema(
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
    text: {
      type: String,
      required: true,
      default: "",
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
      default: 60,
    },
    fontSize: {
      type: Number,
      default: 14,
    },
    color: {
      type: String,
      default: "#f59e0b", // amber-500
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Texto", textoSchema);

