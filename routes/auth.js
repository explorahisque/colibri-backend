const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const { verificarToken } = require('../middlewares/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

/**
 * 📌 REGISTRO DE USUARIO
 */
router.post("/register", [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("email").isEmail().withMessage("Debe ser un email válido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("rol").optional().isIn(["estudiante", "administrador"]).withMessage("El rol debe ser estudiante o administrador")
], async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

  let { nombre, email, password, rol } = req.body;
  rol = rol || 'estudiante'; // Valor por defecto si no llega

  try {
    const usuarioExistente = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await db.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
      [nombre, email, hashedPassword, rol]
    );

    res.status(201).json(nuevoUsuario.rows[0]);
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

/**
 * 📌 INICIO DE SESIÓN
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "El correo y la contraseña son obligatorios." });

    const result = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Credenciales incorrectas." });

    // Comparar la contraseña usando bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Credenciales incorrectas." });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" } // Utiliza el tiempo de expiración definido en producción
    );

    res.json({
      token,
      usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

/**
 * 📌 PERFIL DEL USUARIO (restringido)
 */
router.get('/perfil', verificarToken, (req, res) => {
  res.json({
    id: req.usuario.id,
    email: req.usuario.email,
    rol: req.usuario.rol
  });
});

module.exports = router;
