// app.js CORREGIDO - Servidor Express + PostgreSQL

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

    const result = await pool.query(query, [nombre, email, hashedPassword, rolFinal]);

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
// OBTENER TODOS LOS PRODUCTOS
// --------------------------------------
app.get("/api/productos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_producto,
        nombre,
        descripcion,
        precio,
        stock,
        temporada,
        encode(imagen, 'base64') AS imagen
      FROM producto
      ORDER BY id_producto ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// --------------------------------------
// OBTENER PRODUCTO POR ID
// --------------------------------------
app.get("/api/producto/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        id_producto, nombre, descripcion, precio, stock, temporada,
        encode(imagen, 'base64') AS imagen
       FROM producto
       WHERE id_producto = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    res.json({
      success: true,
      producto: result.rows[0]
    });

  } catch (error) {
    console.error("Error cargando producto:", error);
    res.status(500).json({ success: false, message: "Error en servidor" });
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

        await pool.query(sql, [nombre, descripcion, precio, stock, imagen, temporada]);

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

    const sql = `
      UPDATE producto
      SET nombre=$1,
          descripcion=$2,
          precio=$3,
          stock=$4,
          temporada=$5,
          imagen = COALESCE($6, imagen)
      WHERE id_producto=$7
      RETURNING *;
    `;

    const result = await pool.query(sql, [
      nombre,
      descripcion,
      precio,
      stock,
      temporada,
      imagen,
      id
    ]);

    res.json({
      success: true,
      producto: result.rows[0]
    });

  } catch (err) {
    console.error("Error al actualizar producto:", err);
    res.status(500).json({ success: false, error: "Error al actualizar producto" });
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
// ✅ REGISTRAR VENTA (CORREGIDO)
// --------------------------------------
app.post("/api/ventas", async (req, res) => {
    const { id_usuario, carrito } = req.body;

    if (!id_usuario || !carrito?.length) {
        return res.status(400).json({ success: false, message: "Carrito vacío" });
    }

    try {
        // ✅ CAMBIO: pool en lugar de db
        const venta = await pool.query(
            "INSERT INTO venta (id_usuario) VALUES ($1) RETURNING id_venta",
            [id_usuario]
        );

        const id_venta = venta.rows[0].id_venta;

        for (const item of carrito) {
            await pool.query(
                `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio)
                 VALUES ($1, $2, $3, $4)`,
                [id_venta, item.id_producto, item.cantidad, item.precio]
            );
        }

        res.json({
            success: true,
            id_venta,
            message: "Venta registrada correctamente"
        });

    } catch (error) {
        console.error("Error en venta:", error);
        res.status(500).json({ success: false, message: "Error registrando venta" });
    }
});

// --------------------------------------
// ✅ EDITAR USUARIO (CORREGIDO)
// --------------------------------------
app.put("/api/usuario/editar", upload.single("imagen"), async (req, res) => {
    try {
        const { id_usuario, nombre, email, password } = req.body;

        if (!id_usuario) {
            return res.status(400).json({ error: "Falta id_usuario" });
        }

        let sql = "UPDATE usuario SET ";
        let updates = [];
        let valores = [];
        let index = 1;

        if (nombre) {
            updates.push(`nombre = $${index++}`);
            valores.push(nombre);
        }

        if (email) {
            updates.push(`email = $${index++}`);
            valores.push(email);
        }

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            updates.push(`password = $${index++}`);
            valores.push(hashed);
        }

        if (req.file) {
            updates.push(`imagen = $${index++}`);
            valores.push(req.file.buffer);
        }

        if (updates.length === 0) {
            return res.json({ message: "Nada para actualizar" });
        }

        sql += updates.join(", ") + ` WHERE id_usuario = $${index} RETURNING id_usuario, nombre, email, rol, encode(imagen,'base64') AS imagen`;

        valores.push(id_usuario);

        const result = await pool.query(sql, valores);

        res.json({
            success: true,
            usuario: result.rows[0]
        });

    } catch (err) {
        console.error("Error actualizando usuario:", err);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
}); 

// --------------------------------------
// ✅ OBTENER TODOS LOS USUARIOS (CORREGIDO)
// --------------------------------------
app.get("/api/usuario/todos", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id_usuario, nombre, email, rol FROM usuario ORDER BY id_usuario ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error obteniendo usuarios:", err);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// --------------------------------------
// ✅ ELIMINAR USUARIO (CORREGIDO)
// --------------------------------------
app.delete("/api/usuario/eliminar/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM usuario WHERE id_usuario = $1", [id]);
        res.json({ mensaje: "Usuario eliminado" });
    } catch (err) {
        console.error("Error eliminando usuario:", err);
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

// --------------------------------------
// SESIÓN (SIMULADA)
// --------------------------------------
app.get("/auth/session", (req, res) => {
  res.json({ logged: false });
});

// --------------------------------------
// FALLBACK
// --------------------------------------
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "Ruta no encontrada"
    });
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------------------------
// INICIAR SERVIDOR
// --------------------------------------
app.listen(port, () => {
  console.log("✅ Servidor corriendo en http://localhost:" + port);
});