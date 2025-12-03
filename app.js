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
      INSERT INTO usuario (nombre, email, password, rol, saldo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_usuario, nombre, email, rol, saldo;
    `;

    // ✅ Saldo inicial de $1000 para nuevos usuarios
    const result = await pool.query(query, [
      nombre, 
      email, 
      hashedPassword, 
      rolFinal,
      1000.00 // Saldo inicial
    ]);

    res.json({
      success: true,
      message: "Usuario registrado correctamente con $1000 de saldo inicial",
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

    // ✅ Incluimos el saldo en la respuesta
    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        saldo: parseFloat(usuario.saldo) // ✅ Convertir a número
      }
    });

  } catch (err) {
    console.error("Error en login:", err);
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
        return res.status(400).json({ 
            success: false, 
            message: "Carrito vacío" 
        });
    }

    const client = await pool.connect(); // ✅ Usar transacción

    try {
        await client.query('BEGIN'); // Iniciar transacción

        // 1️⃣ Obtener saldo actual del usuario
        const usuarioRes = await client.query(
            "SELECT saldo FROM usuario WHERE id_usuario = $1",
            [id_usuario]
        );

        if (usuarioRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const saldoActual = parseFloat(usuarioRes.rows[0].saldo);

        // 2️⃣ Calcular total de la compra
        const totalCompra = carrito.reduce((sum, item) => {
            return sum + (item.precio * item.cantidad);
        }, 0);

        console.log(`💰 Saldo actual: $${saldoActual}`);
        console.log(`🛒 Total compra: $${totalCompra}`);

        // 3️⃣ Validar saldo suficiente
        if (saldoActual < totalCompra) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Saldo insuficiente. Tienes $${saldoActual.toFixed(2)} y necesitas $${totalCompra.toFixed(2)}`,
                saldoActual: saldoActual,
                totalCompra: totalCompra,
                faltante: totalCompra - saldoActual
            });
        }

        // 4️⃣ Crear la venta
        const venta = await client.query(
            "INSERT INTO venta (id_usuario, total, fecha) VALUES ($1, $2, NOW()) RETURNING id_venta",
            [id_usuario, totalCompra]
        );

        const id_venta = venta.rows[0].id_venta;

        // 5️⃣ Insertar detalles de la venta
        for (const item of carrito) {
            await client.query(
                `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio)
                 VALUES ($1, $2, $3, $4)`,
                [id_venta, item.id_producto, item.cantidad, item.precio]
            );

            // ✅ Opcional: Descontar stock del producto
            await client.query(
                `UPDATE producto 
                 SET stock = stock - $1 
                 WHERE id_producto = $2`,
                [item.cantidad, item.id_producto]
            );
        }

        // 6️⃣ Descontar saldo del usuario
        const nuevoSaldo = saldoActual - totalCompra;
        await client.query(
            "UPDATE usuario SET saldo = $1 WHERE id_usuario = $2",
            [nuevoSaldo, id_usuario]
        );

        await client.query('COMMIT'); // ✅ Confirmar transacción

        res.json({
            success: true,
            id_venta,
            message: "¡Compra realizada exitosamente!",
            totalCompra: totalCompra,
            saldoAnterior: saldoActual,
            nuevoSaldo: nuevoSaldo
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en venta:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error registrando venta" 
        });
    } finally {
        client.release();
    }
});
// --------------------------------------
// ✅ OBTENER TODOS LOS USUARIOS (ADMIN)
// Esta ruta faltaba y causaba el error 404
// --------------------------------------
app.get("/api/usuarios", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_usuario, 
                nombre, 
                email, 
                rol,
                COALESCE(saldo, 0) as saldo,
                encode(imagen, 'base64') AS imagen
            FROM usuario
            ORDER BY id_usuario ASC
        `);

        res.json(result.rows);

    } catch (err) {
        console.error("Error obteniendo usuarios:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener usuarios" 
        });
    }
});

// --------------------------------------
// ✅ HISTORIAL DE COMPRAS DE UN USUARIO
// --------------------------------------
app.get("/api/usuario/:id/compras", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                v.id_venta,
                v.fecha,
                COALESCE(SUM(dv.cantidad * dv.precio), 0) as total,
                COUNT(dv.id_detalle) as num_productos,
                json_agg(
                    json_build_object(
                        'producto', p.nombre,
                        'cantidad', dv.cantidad,
                        'precio', dv.precio,
                        'subtotal', dv.subtotal
                    ) ORDER BY dv.id_detalle
                ) as productos
            FROM venta v
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            WHERE v.id_usuario = $1
            GROUP BY v.id_venta, v.fecha
            ORDER BY v.fecha DESC
            LIMIT 50
        `, [id]);

        res.json({
            success: true,
            compras: result.rows
        });

    } catch (err) {
        console.error("Error obteniendo historial:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener historial de compras" 
        });
    }
});

// --------------------------------------
// ✅ ACTUALIZAR SALDO (VERIFICACIÓN)
// --------------------------------------
app.get("/api/usuario/:id/saldo-actual", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT COALESCE(saldo, 0) as saldo FROM usuario WHERE id_usuario = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            saldo: parseFloat(result.rows[0].saldo)
        });

    } catch (err) {
        console.error("Error obteniendo saldo:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener saldo"
        });
    }
});

// --------------------------------------
// ✅ RECARGAR SALDO (AUTO-RECARGA CLIENTE)
// --------------------------------------
app.post("/api/usuario/recargar", async (req, res) => {
    const { id_usuario, monto } = req.body;

    if (!id_usuario || !monto || monto <= 0 || monto > 100000) {
        return res.status(400).json({
            success: false,
            message: "Monto inválido. Debe estar entre $0.01 y $100,000"
        });
    }

    try {
        const result = await pool.query(
            `UPDATE usuario 
             SET saldo = COALESCE(saldo, 0) + $1 
             WHERE id_usuario = $2
             RETURNING saldo`,
            [monto, id_usuario]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            message: `Se recargaron $${parseFloat(monto).toFixed(2)} correctamente`,
            nuevoSaldo: parseFloat(result.rows[0].saldo)
        });

    } catch (err) {
        console.error("Error recargando saldo:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al recargar saldo" 
        });
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
app.get("/api/usuario/perfil/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                id_usuario, 
                nombre, 
                email, 
                rol,
                saldo,
                encode(imagen, 'base64') AS imagen
             FROM usuario 
             WHERE id_usuario = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }

        res.json({
            success: true,
            usuario: {
                ...result.rows[0],
                saldo: parseFloat(result.rows[0].saldo)
            }
        });

    } catch (err) {
        console.error("Error obteniendo perfil:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener perfil" 
        });
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
// ✅ OBTENER PERFIL DE USUARIO POR ID
// --------------------------------------
app.get("/api/usuario/perfil/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                id_usuario, 
                nombre, 
                email, 
                rol,
                encode(imagen, 'base64') AS imagen
             FROM usuario 
             WHERE id_usuario = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }

        res.json({
            success: true,
            usuario: result.rows[0]
        });

    } catch (err) {
        console.error("Error obteniendo perfil:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener perfil" 
        });
    }
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
// SESIÓN (SIMULADA)
// --------------------------------------
app.get("/auth/session", (req, res) => {
  res.json({ logged: false });
});

// --------------------------------------
// ✅ RECARGAR SALDO (cualquier rol)
// --------------------------------------
app.post("/api/usuario/recargar-saldo", async (req, res) => {
    const { id_usuario, monto, id_admin } = req.body;

    try {
        // Verificar que quien recarga es admin
        const adminRes = await pool.query(
            "SELECT rol FROM usuario WHERE id_usuario = $1",
            [id_admin]
        );

        if (adminRes.rows.length === 0 || adminRes.rows[0].rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para recargar saldo"
            });
        }

        // Recargar saldo
        const result = await pool.query(
            `UPDATE usuario 
             SET saldo = saldo + $1 
             WHERE id_usuario = $2
             RETURNING saldo`,
            [monto, id_usuario]
        );

        res.json({
            success: true,
            message: `Se recargaron $${monto} correctamente`,
            nuevoSaldo: parseFloat(result.rows[0].saldo)
        });

    } catch (err) {
        console.error("Error recargando saldo:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al recargar saldo" 
        });
    }
});

app.get("/api/usuario/saldo/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT saldo FROM usuario WHERE id_usuario = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            saldo: parseFloat(result.rows[0].saldo)
        });

    } catch (err) {
        console.error("Error obteniendo saldo:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener saldo"
        });
    }
});

// --------------------------------------
// ✅ OBTENER TODOS LOS USUARIOS (para admin)
// --------------------------------------
app.get("/api/usuarios", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_usuario, 
                nombre, 
                email, 
                rol,
                COALESCE(saldo, 0) as saldo,
                encode(imagen, 'base64') AS imagen
            FROM usuario
            ORDER BY id_usuario ASC
        `);

        res.json(result.rows);

    } catch (err) {
        console.error("Error obteniendo usuarios:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener usuarios" 
        });
    }
});

// --------------------------------------
// ✅ OBTENER TODAS LAS VENTAS (para admin)
// --------------------------------------
app.get("/api/ventas", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                v.id_venta,
                v.id_usuario,
                v.total,
                v.fecha,
                u.nombre as nombre_usuario,
                u.email as email_usuario
            FROM venta v
            JOIN usuario u ON v.id_usuario = u.id_usuario
            ORDER BY v.fecha DESC
            LIMIT 100
        `);

        res.json(result.rows);

    } catch (err) {
        console.error("Error obteniendo ventas:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener ventas" 
        });
    }
});

// --------------------------------------
// ✅ OBTENER DETALLE DE UNA VENTA
// --------------------------------------
app.get("/api/venta/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener venta
        const ventaRes = await pool.query(`
            SELECT 
                v.id_venta,
                v.total,
                v.fecha,
                v.id_usuario,
                u.nombre as nombre_usuario,
                u.email as email_usuario
            FROM venta v
            JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.id_venta = $1
        `, [id]);

        if (ventaRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Venta no encontrada"
            });
        }

        // Obtener detalles
        const detallesRes = await pool.query(`
            SELECT 
                dv.id_detalle,
                dv.cantidad,
                dv.precio,
                dv.id_producto,
                p.nombre as nombre_producto,
                (dv.cantidad * dv.precio) as subtotal
            FROM detalle_venta dv
            JOIN producto p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = $1
            ORDER BY dv.id_detalle
        `, [id]);

        res.json({
            success: true,
            venta: ventaRes.rows[0],
            detalles: detallesRes.rows
        });

    } catch (err) {
        console.error("Error obteniendo detalle venta:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener detalle" 
        });
    }
});

// --------------------------------------
// ✅ RECARGAR SALDO (auto-recarga para clientes)
// --------------------------------------
app.post("/api/usuario/recargar", async (req, res) => {
    const { id_usuario, monto } = req.body;

    if (!id_usuario || !monto || monto <= 0 || monto > 100000) {
        return res.status(400).json({
            success: false,
            message: "Monto inválido. Debe estar entre $0.01 y $100,000"
        });
    }

    try {
        const result = await pool.query(
            `UPDATE usuario 
             SET saldo = COALESCE(saldo, 0) + $1 
             WHERE id_usuario = $2
             RETURNING saldo`,
            [monto, id_usuario]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            message: `Se recargaron ${parseFloat(monto).toFixed(2)} correctamente`,
            nuevoSaldo: parseFloat(result.rows[0].saldo)
        });

    } catch (err) {
        console.error("Error recargando saldo:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al recargar saldo" 
        });
    }
});

// --------------------------------------
// ✅ ACTUALIZAR SALDO USUARIO (solo para debugging)
// --------------------------------------
app.get("/api/usuario/:id/actualizar-saldo", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT saldo FROM usuario WHERE id_usuario = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            saldo: parseFloat(result.rows[0].saldo)
        });

    } catch (err) {
        console.error("Error obteniendo saldo:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener saldo"
        });
    }
});

// --------------------------------------
// INICIAR SERVIDOR
// --------------------------------------
app.listen(port, () => {
  console.log("✅ Servidor corriendo en http://localhost:" + port);
});
