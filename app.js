// app.js COMPLETO Y CORREGIDO - Servidor Express + PostgreSQL

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
  connectionString: "postgresql://root:V3JWg719Fxxjbc6ahA19vYK7cLGe734p@dpg-d5jem4p5pdvs739cf770-a.oregon-postgres.render.com:5432/navidad_trac",
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 5
});

// Probar conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});

// Probar conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err);
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});

// ==============================================
// RUTAS DE USUARIOS
// ==============================================

// ✅ REGISTRAR USUARIO
// ✅ CORRECTO - Con manejo de errores
app.post("/api/usuarios", async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    // Verificar si el email ya existe
    const emailExiste = await pool.query(
      "SELECT email FROM usuario WHERE email = $1",
      [email]
    );

    if (emailExiste.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado"
      });
    }

    const rolesPermitidos = ["admin", "cliente"];
    const rolFinal = rolesPermitidos.includes(rol) ? rol : "cliente";

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insertar con saldo inicial
    const query = `
      INSERT INTO usuario (nombre, email, password, rol, saldo)
      VALUES ($1, $2, $3, $4, COALESCE($5, 1000.00))
      RETURNING id_usuario, nombre, email, rol, COALESCE(saldo, 0) as saldo;
    `;

    const result = await pool.query(query, [
      nombre, 
      email, 
      hashedPassword, 
      rolFinal,
      1000.00
    ]);

    console.log("✅ Usuario registrado:", result.rows[0]);

    res.json({
      success: true,
      message: "Usuario registrado correctamente con $1000 de saldo inicial",
      usuario: {
        id_usuario: result.rows[0].id_usuario,
        nombre: result.rows[0].nombre,
        email: result.rows[0].email,
        rol: result.rows[0].rol,
        saldo: parseFloat(result.rows[0].saldo)
      }
    });

  } catch (err) {
    console.error("❌ Error completo en registro:", err);
    console.error("Stack:", err.stack);

    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: err.message,
      code: err.code
    });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("📥 Login attempt:", email);

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email y contraseña son requeridos" 
      });
    }

    const result = await pool.query(
      "SELECT * FROM usuario WHERE email = $1",
      [email]
    );

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

    console.log("✅ Login exitoso:", usuario.nombre);

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        saldo: parseFloat(usuario.saldo || 0)
      }
    });

  } catch (err) {
    console.error("❌ Error completo:", err);
    console.error("❌ Stack trace:", err.stack);
    console.error("❌ Error code:", err.code);
    
    res.status(500).json({ 
      success: false, 
      message: "Error en servidor",
      // En desarrollo, incluye más info:
      errorDetail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ OBTENER TODOS LOS USUARIOS (admin)
app.get("/api/usuarios", async (req, res) => {
  console.log("📥 GET /api/usuarios");
  try {
    const result = await pool.query(`
      SELECT 
        id_usuario, 
        nombre, 
        email, 
        rol,
        COALESCE(saldo, 0) as saldo
      FROM usuario
      ORDER BY id_usuario ASC
    `);

    console.log("✅ Usuarios obtenidos:", result.rows.length);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error obteniendo usuarios:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener usuarios: " + err.message 
    });
  }
});

// ✅ OBTENER PERFIL DE USUARIO
app.get("/api/usuario/perfil/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id_usuario, 
        nombre, 
        email, 
        rol,
        COALESCE(saldo, 0) as saldo
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
    console.error("❌ Error obteniendo perfil:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener perfil: " + err.message 
    });
  }
});

// ✅ OBTENER SALDO ACTUAL
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
    console.error("❌ Error obteniendo saldo:", err);
    res.status(500).json({
      success: false,
      message: "Error al obtener saldo: " + err.message
    });
  }
});

// ✅ RECARGAR SALDO
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
    console.error("❌ Error recargando saldo:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al recargar saldo: " + err.message 
    });
  }
});

// ✅ EDITAR USUARIO
app.put("/api/usuario/editar", async (req, res) => {
  try {
    const { id_usuario, nombre, email, password } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ 
        success: false,
        error: "Falta id_usuario" 
      });
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

    if (updates.length === 0) {
      return res.json({ 
        success: false,
        message: "Nada para actualizar" 
      });
    }

    sql += updates.join(", ") + ` WHERE id_usuario = $${index} RETURNING id_usuario, nombre, email, rol, COALESCE(saldo, 0) as saldo`;

    valores.push(id_usuario);

    const result = await pool.query(sql, valores);

    res.json({
      success: true,
      usuario: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al actualizar usuario: " + err.message 
    });
  }
});

// ✅ ELIMINAR USUARIO
app.delete("/api/usuario/eliminar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuario WHERE id_usuario = $1", [id]);
    res.json({ mensaje: "Usuario eliminado" });
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario: " + err.message });
  }
});

// ✅ HISTORIAL DE COMPRAS
app.get("/api/usuario/:id/historial-compras", async (req, res) => {
  try {
    const { id } = req.params;

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
    console.error("❌ Error obteniendo historial:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener historial de compras: " + err.message 
    });
  }
});

// ==============================================
// RUTAS DE PRODUCTOS
// ==============================================

// ✅ OBTENER TODOS LOS PRODUCTOS
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
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ error: "Error al obtener productos: " + err.message });
  }
});

// ✅ OBTENER PRODUCTO POR ID
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
      return res.status(404).json({ 
        success: false, 
        message: "Producto no encontrado" 
      });
    }

    res.json({
      success: true,
      producto: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error cargando producto:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error en servidor: " + error.message 
    });
  }
});

// ✅ AGREGAR PRODUCTO
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
    console.error("❌ Error guardando producto:", error);
    res.status(500).json({ error: "Error al guardar producto: " + error.message });
  }
});

// ✅ ACTUALIZAR PRODUCTO
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
      nombre, descripcion, precio, stock, temporada, imagen, id
    ]);

    res.json({
      success: true,
      producto: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    res.status(500).json({ 
      success: false, 
      error: "Error al actualizar producto: " + err.message 
    });
  }
});

// ✅ ELIMINAR PRODUCTO
app.delete("/api/producto/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM producto WHERE id_producto=$1", [req.params.id]);
    res.json({ success: true, message: "Producto eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar producto: " + err.message });
  }
});

// ==============================================
// RUTAS DE VENTAS
// ==============================================

// ✅ REGISTRAR VENTA
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

    const totalCompra = carrito.reduce((sum, item) => {
      return sum + (parseFloat(item.precio) * parseInt(item.cantidad));
    }, 0);

    if (saldoActual < totalCompra) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Saldo insuficiente. Tienes $${saldoActual.toFixed(2)}, necesitas $${totalCompra.toFixed(2)}`,
        saldoActual,
        totalCompra
      });
    }

    const venta = await client.query(
      "INSERT INTO venta (id_usuario, fecha, monto_pagado) VALUES ($1, NOW(), $2) RETURNING id_venta",
      [id_usuario, totalCompra]
    );

    const id_venta = venta.rows[0].id_venta;

    for (const item of carrito) {
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

      await client.query(
        "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)",
        [id_venta, item.id_producto, item.cantidad, item.precio]
      );

      await client.query(
        "UPDATE producto SET stock = stock - $1 WHERE id_producto = $2",
        [item.cantidad, item.id_producto]
      );
    }

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
    console.error("❌ Error en venta:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error registrando venta: " + error.message
    });
  } finally {
    client.release();
  }
});

// ✅ OBTENER TODAS LAS VENTAS
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
    console.error("❌ Error obteniendo ventas:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener ventas: " + err.message 
    });
  }
});

// ✅ DETALLE DE VENTA
app.get("/api/venta/:id/detalle", async (req, res) => {
  try {
    const { id } = req.params;

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

    const detallesRes = await pool.query(`
      SELECT 
        dv.id_detalle,
        dv.cantidad,
        dv.precio,
        dv.id_producto,
        dv.subtotal,
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
        id_venta: ventaRes.rows[0].id_venta,
        fecha: ventaRes.rows[0].fecha,
        monto_pagado: parseFloat(ventaRes.rows[0].monto_pagado),
        id_usuario: ventaRes.rows[0].id_usuario,
        nombre_usuario: ventaRes.rows[0].nombre_usuario,
        email_usuario: ventaRes.rows[0].email_usuario
      },
      detalles: detallesRes.rows.map(d => ({
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
    console.error("❌ Error obteniendo detalle venta:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener detalle: " + err.message 
    });
  }
});

// ==============================================
// ESTADÍSTICAS
// ==============================================

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
    console.error("❌ Error obteniendo productos más vendidos:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas: " + err.message 
    });
  }
});

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
    console.error("❌ Error obteniendo ventas por temporada:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas: " + err.message 
    });
  }
});

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
    console.error("❌ Error obteniendo ingresos totales:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas: " + err.message 
    });
  }
});

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
    console.error("❌ Error obteniendo ventas por mes:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas: " + err.message 
    });
  }
});

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
    console.error("❌ Error obteniendo top clientes:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas: " + err.message 
    });
  }
});

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
    console.error("❌ Error obteniendo productos con stock bajo:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas: " + err.message 
    });
  }
});

// ==============================================
// FALLBACK Y SESIÓN
// ==============================================

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "Ruta no encontrada"
    });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/auth/session", (req, res) => {
  res.json({ logged: false });
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================

app.listen(port, () => {
  console.log("✅ Servidor corriendo en http://localhost:" + port);
});