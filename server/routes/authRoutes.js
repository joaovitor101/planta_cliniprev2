const express = require("express");
const jwt = require("jsonwebtoken");

const { requireAuth } = require("../middlewares/requireAuth");

const router = express.Router();

router.post("/register", async (_req, res) => {
  return res.status(403).json({
    message: "Cadastro desabilitado. Use as credenciais de ADMIN.",
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Senha é obrigatória." });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminPassword) {
      return res.status(500).json({
        message: "ADMIN_PASSWORD não configurado.",
      });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { sub: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    return res.json({
      token,
      user: { id: "admin" },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user || null });
});

module.exports = router;