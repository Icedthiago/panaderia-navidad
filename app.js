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
// ✅ REGISTRAR VENTA
// --------------------------------------
app.post("/api/ventas", async (req, res) => {
    const { id_usuario, carrito } = req.body;

    if (!id_usuario || !carrito?.length) {
        return res.status(400).json({ 
            success: false, 
            message: "Carrito vacío" 
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener saldo del usuario
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

        // 2. Calcular total
        const totalCompra = carrito.reduce((sum, item) => {
            return sum + (parseFloat(item.precio) * parseInt(item.cantidad));
        }, 0);

        // 3. Validar saldo
        if (saldoActual < totalCompra) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Saldo insuficiente. Tienes $${saldoActual.toFixed(2)}, necesitas $${totalCompra.toFixed(2)}`,
                saldoActual,
                totalCompra
            });
        }

        // 4. Crear venta con monto_pagado
        const venta = await client.query(
            "INSERT INTO venta (id_usuario, fecha, monto_pagado) VALUES ($1, NOW(), $2) RETURNING id_venta",
            [id_usuario, totalCompra]
        );

        const id_venta = venta.rows[0].id_venta;

        // 5. Insertar detalles y actualizar stock
        for (const item of carrito) {
            // Verificar stock
            const productoRes = await client.query(
                "SELECT stock, nombre FROM producto WHERE id_producto = $1",
                [item.id_producto]
            );

            if (productoRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Producto ${item.id_producto} no encontrado`
                });
            }

            const { stock, nombre } = productoRes.rows[0];

            if (stock < item.cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para ${nombre}. Disponible: ${stock}, solicitado: ${item.cantidad}`
                });
            }

            // Insertar detalle
            await client.query(
                "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)",
                [id_venta, item.id_producto, item.cantidad, item.precio]
            );

            // Descontar stock
            await client.query(
                "UPDATE producto SET stock = stock - $1 WHERE id_producto = $2",
                [item.cantidad, item.id_producto]
            );
        }

        // 6. Descontar saldo
        const nuevoSaldo = saldoActual - totalCompra;
        await client.query(
            "UPDATE usuario SET saldo = $1 WHERE id_usuario = $2",
            [nuevoSaldo, id_usuario]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            id_venta,
            message: "¡Compra realizada exitosamente!",
            totalCompra,
            saldoAnterior: saldoActual,
            nuevoSaldo
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en venta:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error registrando venta: " + error.message
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
                v.monto_pagado as total,
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
            GROUP BY v.id_venta, v.fecha, v.monto_pagado
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
// ✅ RECARGAR SALDO (CUALQUIER USUARIO)
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
// ✅ OBTENER SALDO ACTUAL
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
                v.fecha,
                v.monto_pagado,
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
                v.fecha,
                v.monto_pagado,
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
                dv.subtotal,
                p.nombre as nombre_producto
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

// ==============================================
// AGREGAR AL FINAL DE app.js (antes de app.listen)
// RUTAS PARA HISTORIAL DE COMPRAS
// ==============================================

// --------------------------------------
// ✅ OBTENER HISTORIAL DE COMPRAS DE UN USUARIO
// --------------------------------------
app.get("/api/usuario/:id/historial-compras", async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener todas las ventas del usuario con información agregada
        const ventasResult = await pool.query(`
            SELECT 
                v.id_venta,
                v.fecha,
                v.monto_pagado as total,
                COUNT(dv.id_detalle) as num_productos
            FROM venta v
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            WHERE v.id_usuario = $1
            GROUP BY v.id_venta, v.fecha, v.monto_pagado
            ORDER BY v.fecha DESC
            LIMIT 100
        `, [id]);

        if (ventasResult.rows.length === 0) {
            return res.json({
                success: true,
                compras: []
            });
        }

        // Para cada venta, obtener los productos
        const comprasConProductos = await Promise.all(
            ventasResult.rows.map(async (venta) => {
                const productosResult = await pool.query(`
                    SELECT 
                        dv.id_detalle,
                        dv.cantidad,
                        dv.precio,
                        dv.subtotal,
                        p.nombre as producto,
                        p.id_producto
                    FROM detalle_venta dv
                    JOIN producto p ON dv.id_producto = p.id_producto
                    WHERE dv.id_venta = $1
                    ORDER BY dv.id_detalle
                `, [venta.id_venta]);

                return {
                    id_venta: venta.id_venta,
                    fecha: venta.fecha,
                    total: parseFloat(venta.total),
                    num_productos: parseInt(venta.num_productos),
                    productos: productosResult.rows.map(p => ({
                        producto: p.producto,
                        cantidad: parseInt(p.cantidad),
                        precio: parseFloat(p.precio),
                        subtotal: parseFloat(p.subtotal)
                    }))
                };
            })
        );

        res.json({
            success: true,
            compras: comprasConProductos
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
// ✅ OBTENER DETALLE DE UNA VENTA ESPECÍFICA
// --------------------------------------
app.get("/api/venta/:id/detalle", async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener información de la venta
        const ventaResult = await pool.query(`
            SELECT 
                v.id_venta,
                v.fecha,
                v.monto_pagado,
                v.id_usuario,
                u.nombre as nombre_usuario,
                u.email as email_usuario
            FROM venta v
            JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.id_venta = $1
        `, [id]);

        if (ventaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Venta no encontrada"
            });
        }

        // Obtener detalles de productos
        const detallesResult = await pool.query(`
            SELECT 
                dv.id_detalle,
                dv.cantidad,
                dv.precio,
                dv.subtotal,
                dv.id_producto,
                p.nombre as nombre_producto,
                p.temporada
            FROM detalle_venta dv
            JOIN producto p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = $1
            ORDER BY dv.id_detalle
        `, [id]);

        res.json({
            success: true,
            venta: {
                id_venta: ventaResult.rows[0].id_venta,
                fecha: ventaResult.rows[0].fecha,
                monto_pagado: parseFloat(ventaResult.rows[0].monto_pagado),
                id_usuario: ventaResult.rows[0].id_usuario,
                nombre_usuario: ventaResult.rows[0].nombre_usuario,
                email_usuario: ventaResult.rows[0].email_usuario
            },
            detalles: detallesResult.rows.map(d => ({
                id_detalle: d.id_detalle,
                cantidad: parseInt(d.cantidad),
                precio: parseFloat(d.precio),
                subtotal: parseFloat(d.subtotal),
                id_producto: d.id_producto,
                nombre_producto: d.nombre_producto,
                temporada: d.temporada
            }))
        });

    } catch (err) {
        console.error("Error obteniendo detalle de venta:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener detalle" 
        });
    }
});

// --------------------------------------
// INICIAR SERVIDOR
// --------------------------------------
app.listen(port, () => {
  console.log("✅ Servidor corriendo en http://localhost:" + port);
});
// --------------------------------------
// ✅ PRODUCTOS MÁS VENDIDOS
// --------------------------------------
app.get("/api/estadisticas/productos-mas-vendidos", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.nombre as producto,
                SUM(dv.cantidad) as total_vendido,
                SUM(dv.subtotal) as ingresos_totales
            FROM detalle_venta dv
            JOIN producto p ON dv.id_producto = p.id_producto
            GROUP BY p.id_producto, p.nombre
            ORDER BY total_vendido DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            productos: result.rows
        });

    } catch (err) {
        console.error("Error obteniendo productos más vendidos:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener estadísticas" 
        });
    }
});

// --------------------------------------
// ✅ VENTAS POR TEMPORADA
// --------------------------------------
app.get("/api/estadisticas/ventas-por-temporada", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.temporada,
                COUNT(DISTINCT dv.id_venta) as num_ventas,
                SUM(dv.cantidad) as productos_vendidos,
                SUM(dv.subtotal) as ingresos
            FROM detalle_venta dv
            JOIN producto p ON dv.id_producto = p.id_producto
            GROUP BY p.temporada
            ORDER BY ingresos DESC
        `);

        res.json({
            success: true,
            temporadas: result.rows
        });

    } catch (err) {
        console.error("Error obteniendo ventas por temporada:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener estadísticas" 
        });
    }
});

// --------------------------------------
// ✅ INGRESOS TOTALES
// --------------------------------------
app.get("/api/estadisticas/ingresos-totales", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(monto_pagado), 0) as ingresos_totales,
                COALESCE(AVG(monto_pagado), 0) as promedio_venta,
                COALESCE(MAX(monto_pagado), 0) as venta_maxima,
                COALESCE(MIN(monto_pagado), 0) as venta_minima
            FROM venta
        `);

        res.json({
            success: true,
            estadisticas: result.rows[0]
        });

    } catch (err) {
        console.error("Error obteniendo ingresos totales:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener estadísticas" 
        });
    }
});

// --------------------------------------
// ✅ VENTAS POR MES (últimos 12 meses)
// --------------------------------------
app.get("/api/estadisticas/ventas-por-mes", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM') as mes,
                COUNT(*) as num_ventas,
                COALESCE(SUM(monto_pagado), 0) as ingresos
            FROM venta
            WHERE fecha >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(fecha, 'YYYY-MM')
            ORDER BY mes ASC
        `);

        res.json({
            success: true,
            meses: result.rows
        });

    } catch (err) {
        console.error("Error obteniendo ventas por mes:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener estadísticas" 
        });
    }
});

// --------------------------------------
// ✅ TOP 10 CLIENTES
// --------------------------------------
app.get("/api/estadisticas/top-clientes", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.nombre,
                u.email,
                COUNT(v.id_venta) as num_compras,
                COALESCE(SUM(v.monto_pagado), 0) as total_gastado
            FROM usuario u
            JOIN venta v ON u.id_usuario = v.id_usuario
            GROUP BY u.id_usuario, u.nombre, u.email
            ORDER BY total_gastado DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            clientes: result.rows
        });

    } catch (err) {
        console.error("Error obteniendo top clientes:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener estadísticas" 
        });
    }
});

// --------------------------------------
// ✅ PRODUCTOS CON STOCK BAJO (menos de 10)
// --------------------------------------
app.get("/api/estadisticas/stock-bajo", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_producto,
                nombre,
                stock,
                precio,
                temporada
            FROM producto
            WHERE stock < 10
            ORDER BY stock ASC
            LIMIT 20
        `);

        res.json({
            success: true,
            productos: result.rows
        });

    } catch (err) {
        console.error("Error obteniendo productos con stock bajo:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener estadísticas" 
        });
    }
});