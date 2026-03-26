const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { requireAuth } = require("../middlewares/requireAuth");

const router = express.Router();

router.post("/register", async (_req, res) => {
  return res.status(403).json({
    message: "Cadastro desabilitado. Use as credenciais de ADMIN.",
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Senha é obrigatória." });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    // Login único de admin (sem cadastro no banco): senha deve bater com ADMIN_PASSWORD.
    if (adminPassword) {
      if (password === adminPassword) {
        const token = jwt.sign(
          { sub: "admin", email: adminEmail || "" },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
        );
        return res.json({
          token,
          user: { id: "admin", email: adminEmail || "" },
        });
      }
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Fallback: login em usuário do banco (caso você não tenha configurado ADMIN_PASSWORD).
    if (!email || typeof email !== "string" || !email.trim()) {
      return res
        .status(400)
        .json({ message: "Email é obrigatório no modo fallback." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    res.json({ token, user: { id: user._id.toString(), email: user.email } });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user || null });
});

module.exports = router;

