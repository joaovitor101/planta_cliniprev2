const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: true,
    },
    tipo: {
      type: String,
      enum: ["notebook", "desktop", "impressora", "outro", "televisao"],
      default: "notebook",
    },
    proprietario: {
      type: String,
      trim: true,
    },
    nomeMaquina: {
      type: String,
      required: true,
      trim: true,
    },
    usuarioLogado: {
      type: String,
      trim: true,
    },
    anydesk: {
      type: String,
      trim: true,
    },
    kaspersky: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ativo", "inativo"],
      default: "ativo",
    },
    armazenamentoLivre: {
      type: String,
      trim: true,
    },
    observacoes: {
      type: String,
      trim: true,
    },
    modeloTv: {
      type: String,
      trim: true,
    },
    serialTv: {
      type: String,
      trim: true,
    },
    conexaoTv: {
      type: String,
      enum: ["wifi", "cabo", ""],
      default: "",
    },
    hasGautek: {
      type: Boolean,
      default: false,
    },
    serialGautek: {
      type: String,
      trim: true,
    },
    conexaoGautek: {
      type: String,
      enum: ["wifi", "cabo", ""],
      default: "",
    },
    imagemUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Equipment", equipmentSchema);

