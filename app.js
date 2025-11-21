import http from "http";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Necesario porque __dirname no existe en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function serveStatic(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 - Not Found");
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 - Internal Server Error");
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  const safePath = path
    .normalize(decodeURIComponent(req.url))
    .replace(/^\.+/, "");

  let requested = safePath.split("?")[0];
  if (requested === "/" || requested === "") requested = "/index.html";

  const filePath = path.join(__dirname, "public", requested);
  serveStatic(filePath, res);
});

// ----------------------------
//   EXPRESS + POSTGRES
// ----------------------------

import express from "express";
import pg from "pg";
import cors from "cors";

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// CONEXIÓN A POSTGRESQL
const pool = new Pool({
  user: "root",
  host: "dpg-d4fve0efu37c739k38m0-a.oregon-postgres.render.com",
  database: "panaderia_navidena",
  password: "K4kspDfnESIP2gSkmCcWyqBgw8SpFRgG",
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

//metodos de SQL
// REGISTRARSE
app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    // Encriptar contraseña
    const hash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO usuario (nombre, email, password, rol)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario;
    `;

    const result = await pool.query(query, [nombre, email, hash, rol]);

    res.json({
      success: true,
      message: "Usuario registrado correctamente",
      id_usuario: result.rows[0].id_usuario
    });

  } catch (err) {

    // correo duplicado (postgres error code 23505)
    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado"
      });
    }

    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario"
    });
  }
});

// INICIAR SESIÓN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM usuario WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const usuario = result.rows[0];

    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.json({
        success: false,
        message: "Contraseña incorrecta"
      });
    }

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      nombre: usuario.nombre,
      rol: usuario.rol
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// RUTA DE PRUEBA
app.get("/api", (req, res) => {
  res.send("Servidor funcionando con PostgreSQL");
});

// INICIAR EXPRESS
app.listen(4000, () => {
  console.log("API corriendo en http://localhost:4000");
});

// INICIAR SERVIDOR DE ARCHIVOS
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});