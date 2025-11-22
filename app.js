// app.js unificado para Render
// Servidor Express + archivos estáticos + PostgreSQL

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcrypt";
import cors from "cors";

// --------------------------------------
// CONFIGURACIONES BÁSICAS
// --------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --------------------------------------
// SERVIR ARCHIVOS ESTÁTICOS
// --------------------------------------
app.use(express.static(path.join(__dirname, "public")));


// --------------------------------------
// CONEXIÓN A POSTGRESQL
// --------------------------------------
const { Pool } = pg;

const pool = new Pool({
  user: "root",
  host: "dpg-d4fve0efu37c739k38m0-a.oregon-postgres.render.com",
  database: "panaderia_navidena",
  password: "K4kspDfnESIP2gSkmCcWyqBgw8SpFRgG",
  port: 5432,
  ssl: { rejectUnauthorized: false }
});


// --------------------------------------
// API: REGISTRAR USUARIO
// --------------------------------------
app.post("/api/usuarios", async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    // Validar rol
    const rolesPermitidos = ["admin", "cliente"];
    const rolFinal = rolesPermitidos.includes(rol) ? rol : "admin";

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO usuario (nombre, email, password, rol)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario, nombre, email, rol;
    `;

    const result = await pool.query(query, [
      nombre,
      email,
      hashedPassword,
      rolFinal
    ]);

    const usuario = result.rows[0];

    res.json({
      success: true,
      message: "Usuario registrado correctamente",
      usuario: usuario  // 👈 Enviamos el usuario completo
    });

  } catch (err) {
    console.error(err);

    if (err.code === "23505") { // correo duplicado
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// --------------------------------------
// API: LOGIN
// --------------------------------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM usuario WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.json({ success: false, message: "Contraseña incorrecta" });
    }

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol // 👈 el rol se manda al frontend
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});



// --------------------------------------
// RUTA DE PRUEBA
// --------------------------------------
app.get("/api", (req, res) => {
  res.send("Servidor funcionando con PostgreSQL");
});


// --------------------------------------
// SERVIR INDEX.HTML SI NO EXISTE RUTA
// --------------------------------------
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------------------------
// INICIAR SERVIDOR
// --------------------------------------
app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});