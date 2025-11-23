// app.js unificado para Render
// Servidor Express + archivos estáticos + PostgreSQL

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import multer from "multer";

// --------------------------------------
// CONFIGURACIONES BÁSICAS
// --------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------
// MULTER (para imágenes)
// --------------------------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
    const rolesPermitidos = ["admin", "cliente"];
    const rolFinal = rolesPermitidos.includes(rol) ? rol : "cliente";

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

    res.json({
      success: true,
      message: "Usuario registrado correctamente",
      usuario: result.rows[0]
    });

  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
});

// --------------------------------------
// API: LOGIN
// --------------------------------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM usuario WHERE email = $1",
      [email]
    );

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
        rol: usuario.rol
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error en servidor" });
  }
});

// --------------------------------------
// OBTENER PRODUCTOS
// --------------------------------------
app.get("/api/productos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM producto");

        const productos = result.rows.map(p => ({
            ...p,
            imagen: p.imagen ? Buffer.from(p.imagen).toString("base64") : null
        }));

        res.json(productos);

    } catch (error) {
        console.error("Error obteniendo productos:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --------------------------------------
// AGREGAR PRODUCTO
// --------------------------------------
app.post("/api/producto", upload.single("imagen"), async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, temporada } = req.body;
        const imagen = req.file ? req.file.buffer : null;

        const sql = `
            INSERT INTO producto (nombre, descripcion, precio, stock, imagen, temporada)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await pool.query(sql, [
            nombre,
            descripcion,
            precio,
            stock,
            imagen,
            temporada
        ]);

        res.json({ success: true });

    } catch (error) {
        console.error("Error guardando producto:", error);
        res.status(500).json({ error: "Error al guardar producto" });
    }
});

// --------------------------------------
// ACTUALIZAR PRODUCTO
// --------------------------------------
app.put("/api/producto/:id", upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, temporada } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    const fields = [nombre, descripcion, precio, stock, temporada];
    let query = `
      UPDATE producto
      SET nombre=$1, descripcion=$2, precio=$3, stock=$4, temporada=$5
    `;

    if (imagen) {
      query += `, imagen=$6 WHERE id_producto=$7 RETURNING *`;
      fields.push(imagen, id);
    } else {
      query += ` WHERE id_producto=$6 RETURNING *`;
      fields.push(id);
    }

    const result = await pool.query(query, fields);
    res.json({ success: true, producto: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// --------------------------------------
// ELIMINAR PRODUCTO
// --------------------------------------
app.delete("/api/producto/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM producto WHERE id_producto=$1", [req.params.id]);
    res.json({ success: true, message: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// --------------------------------------
// FALLBACK: SERVIR INDEX
// --------------------------------------
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------------------------
// INICIAR SERVIDOR ✔ (solo una vez)
// --------------------------------------
app.listen(port, () => {
  console.log("Servidor corriendo en http://localhost:" + port);
});
