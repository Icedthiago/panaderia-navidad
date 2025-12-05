
// ==============================================
// SCRIPT.JS COMPLETO - PANADERÍA NAVIDEÑA
// Con validaciones de seguridad XSS
// ==============================================

const API_URL = "https://panaderia-navidad.onrender.com";

// ==============================================
// 0. VALIDACIONES DE SEGURIDAD
// ==============================================

function sanitizarTexto(texto) {
    if (!texto) return '';
    
    // Convertir a string
    texto = String(texto);
    
    // Eliminar etiquetas HTML peligrosas
    const tagsProhibidos = /<script|<iframe|<object|<embed|<link|<style|<meta|<marquee|<blink|javascript:|onerror=|onload=/gi;
    
    if (tagsProhibidos.test(texto)) {
        alert('⚠️ Texto no válido: contiene etiquetas o código prohibido');
        return '';
    }
    
    // Reemplazar caracteres especiales HTML
    texto = texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    
    return texto.trim();
}

function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
}

function validarNumero(valor, min = 0, max = Infinity) {
    const num = parseFloat(valor);
    if (isNaN(num)) return false;
    if (num < min || num > max) return false;
    return true;
}

function validarPassword(password) {
    if (password.length < 6) {
        alert('⚠️ La contraseña debe tener al menos 6 caracteres');
        return false;
    }
    return true;
}

// ==============================================
// 1. GESTIÓN DE SESIÓN
// ==============================================

function obtenerUsuario() {
    try {
        const user = localStorage.getItem("usuario");
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Error leyendo usuario:", e);
        return null;
    }
}

function guardarUsuario(usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
    configurarNavbar(usuario);
}

function cerrarSesion() {
    if (!confirm('¿Estás seguro de cerrar sesión?')) return;
    
    localStorage.removeItem("usuario");
    localStorage.removeItem("carrito");
    alert("👋 Sesión cerrada exitosamente");
    window.location.href = "index.html";
}

// ==============================================
// 2. CONFIGURACIÓN DE NAVBAR
// ==============================================

function configurarNavbar(usuario) {
    const btnLogin = document.getElementById("nav-login-btn");
    const btnRegistro = document.getElementById("nav-registro-btn");
    const navUsuario = document.getElementById("nav-usuario");
    const navLogout = document.getElementById("nav-logout");
    const navCarrito = document.getElementById("nav-carrito-btn");
    const adminItems = document.querySelectorAll(".admin-only");

    if (!usuario) {
        btnLogin?.classList.remove("d-none");
        btnRegistro?.classList.remove("d-none");
        navUsuario?.classList.add("d-none");
        navLogout?.classList.add("d-none");
        navCarrito?.classList.add("d-none");
        adminItems.forEach(el => el.classList.add("d-none"));
    } else {
        btnLogin?.classList.add("d-none");
        btnRegistro?.classList.add("d-none");
        navUsuario?.classList.remove("d-none");
        navLogout?.classList.remove("d-none");
        navCarrito?.classList.remove("d-none");

        const nombreElem = document.getElementById("nav-usuario-nombre");
        const saldoElem = document.getElementById("nav-usuario-saldo");
        
        if (nombreElem) nombreElem.textContent = sanitizarTexto(usuario.nombre);
        if (saldoElem) {
            saldoElem.textContent = `$${parseFloat(usuario.saldo || 0).toFixed(2)}`;
        }

        if (usuario.rol === "admin") {
            adminItems.forEach(el => el.classList.remove("d-none"));
        }
    }

    const btnLogout = document.getElementById("logoutBtn");
    if (btnLogout) {
        btnLogout.onclick = cerrarSesion;
    }

    actualizarCantidadCarrito();
}

// ==============================================
// 3. PROTECCIÓN DE PÁGINAS
// ==============================================

function protegerPagina(opciones = {}) {
    const {
        requiereLogin = true,
        soloAdmin = false,
        mensaje = "⚠️ Debes iniciar sesión para acceder a esta página"
    } = opciones;

    const user = obtenerUsuario();

    if (!requiereLogin) {
        return { permitido: true, usuario: user };
    }

    if (!user) {
        const confirma = confirm(mensaje + "\n\n¿Deseas iniciar sesión ahora?");
        if (confirma) {
            window.location.href = "index.html#login";
        } else {
            window.location.href = "index.html";
        }
        return { permitido: false, usuario: null };
    }

    if (soloAdmin && user.rol !== "admin") {
        alert("❌ No tienes permisos de administrador");
        window.location.href = "index.html";
        return { permitido: false, usuario: user };
    }

    return { permitido: true, usuario: user };
}

// ==============================================
// 4. LOGIN Y REGISTRO CON VALIDACIONES
// ==============================================

async function realizarLogin(email, password) {
    try {
        // Validaciones
        email = sanitizarTexto(email);
        
        if (!validarEmail(email)) {
            document.getElementById("login-error").textContent = "⚠️ Email no válido";
            return false;
        }

        if (!password || password.length < 1) {
            document.getElementById("login-error").textContent = "⚠️ Ingresa tu contraseña";
            return false;
        }

        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!data.success) {
            const errorElem = document.getElementById("login-error");
            if (errorElem) {
                errorElem.textContent = data.message || "Correo o contraseña incorrectos";
            }
            return false;
        }

        guardarUsuario(data.usuario);
        
        const modal = document.getElementById("modal-login");
        if (modal) modal.close();

        alert(`¡Bienvenido ${sanitizarTexto(data.usuario.nombre)}! 💰\n\nTu saldo actual: $${data.usuario.saldo.toFixed(2)}`);
        
        location.reload();
        return true;

    } catch (err) {
        console.error("Error en login:", err);
        const errorElem = document.getElementById("login-error");
        if (errorElem) {
            errorElem.textContent = "❌ Error de conexión con el servidor";
        }
        return false;
    }
}

async function realizarRegistro(nombre, email, password, rol) {
    try {
        // Validaciones
        nombre = sanitizarTexto(nombre);
        email = sanitizarTexto(email);
        
        if (!nombre || nombre.length < 2) {
            document.getElementById("msg-error").textContent = "⚠️ El nombre debe tener al menos 2 caracteres";
            return false;
        }

        if (!validarEmail(email)) {
            document.getElementById("msg-error").textContent = "⚠️ Email no válido";
            return false;
        }

        if (!validarPassword(password)) {
            return false;
        }

        if (rol !== 'cliente' && rol !== 'admin') {
            document.getElementById("msg-error").textContent = "⚠️ Rol no válido";
            return false;
        }

        const res = await fetch(`${API_URL}/api/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, password, rol })
        });

        const data = await res.json();

        if (!res.ok) {
            const errorElem = document.getElementById("msg-error");
            if (errorElem) {
                errorElem.textContent = data.message || "Error en el registro";
            }
            return false;
        }

        alert("✔ Registro exitoso. Iniciando sesión...");
        await realizarLogin(email, password);
        return true;

    } catch (err) {
        console.error("Error en registro:", err);
        const errorElem = document.getElementById("msg-error");
        if (errorElem) {
            errorElem.textContent = "❌ Error de conexión con el servidor";
        }
        return false;
    }
}

// ==============================================
// 5. CARRITO CON VALIDACIONES
// ==============================================

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function agregarAlCarrito(producto) {
    const user = obtenerUsuario();

    if (!user) {
        const confirma = confirm(
            "🛒 Necesitas iniciar sesión para agregar productos al carrito.\n\n" +
            "¿Deseas iniciar sesión ahora?"
        );
        
        if (confirma) {
            window.location.href = "index.html#login";
        }
        return;
    }

    // Validar producto
    if (!producto.id_producto || !producto.precio || !producto.nombre) {
        alert('⚠️ Producto no válido');
        return;
    }

    const existe = carrito.find(item => item.id_producto === producto.id_producto);

    if (existe) {
        if (existe.cantidad >= 99) {
            alert('⚠️ Cantidad máxima alcanzada para este producto');
            return;
        }
        existe.cantidad++;
    } else {
        carrito.push({
            id_producto: producto.id_producto,
            nombre: sanitizarTexto(producto.nombre),
            precio: parseFloat(producto.precio),
            cantidad: 1,
            imagen: producto.imagen
        });
    }

    guardarCarrito();
    alert(`✅ ${sanitizarTexto(producto.nombre)} agregado al carrito`);
}

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCantidadCarrito();
    mostrarCarrito();
}

function actualizarCantidadCarrito() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const elem = document.getElementById("carrito-cantidad");
    if (elem) elem.textContent = total;
}

function mostrarCarrito() {
    const tbody = document.getElementById("tbodyCarrito");
    if (!tbody) return;

    tbody.innerHTML = "";
    let total = 0;

    if (carrito.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Tu carrito está vacío 🛒</td></tr>';
        const totalElem = document.getElementById("totalCarrito");
        if (totalElem) totalElem.textContent = "0.00";
        return;
    }

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id_producto}</td>
            <td><img src="${item.imagen || 'https://via.placeholder.com/60?text=Sin+Imagen'}" 
                     width="60" 
                     onerror="this.src='https://via.placeholder.com/60?text=Error'"></td>
            <td>${sanitizarTexto(item.nombre)}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="cambiarCantidad(${index}, -1)">−</button>
                <b style="padding: 0 10px;">${item.cantidad}</b>
                <button class="btn btn-success btn-sm" onclick="cambiarCantidad(${index}, 1)">+</button>
            </td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const totalElem = document.getElementById("totalCarrito");
    if (totalElem) totalElem.textContent = total.toFixed(2);
}

function cambiarCantidad(index, cambio) {
    if (index < 0 || index >= carrito.length) return;

    carrito[index].cantidad += cambio;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    } else if (carrito[index].cantidad > 99) {
        carrito[index].cantidad = 99;
        alert('⚠️ Cantidad máxima: 99 unidades');
    }

    guardarCarrito();
}

function eliminarDelCarrito(index) {
    if (confirm("¿Eliminar este producto del carrito?")) {
        carrito.splice(index, 1);
        guardarCarrito();
    }
}

async function confirmarCompra() {
    const usuario = obtenerUsuario();

    if (!usuario) {
        alert("⚠️ Debes iniciar sesión para comprar");
        window.location.href = "index.html#login";
        return;
    }

    if (carrito.length === 0) {
        alert("⚠️ Tu carrito está vacío");
        return;
    }

    const totalCompra = carrito.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
    }, 0);

    if (usuario.saldo < totalCompra) {
        alert(`❌ Saldo insuficiente\n\n` +
              `Tu saldo: $${usuario.saldo.toFixed(2)}\n` +
              `Total a pagar: $${totalCompra.toFixed(2)}\n` +
              `Te faltan: $${(totalCompra - usuario.saldo).toFixed(2)}`);
        return;
    }

    const confirmar = confirm(
        `¿Confirmar compra?\n\n` +
        `Total: $${totalCompra.toFixed(2)}\n` +
        `Tu saldo actual: $${usuario.saldo.toFixed(2)}\n` +
        `Saldo después de compra: $${(usuario.saldo - totalCompra).toFixed(2)}`
    );

    if (!confirmar) return;

    const carritoParaEnviar = carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.precio
    }));

    try {
        const res = await fetch(`${API_URL}/api/ventas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                carrito: carritoParaEnviar
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            usuario.saldo = data.nuevoSaldo;
            localStorage.setItem("usuario", JSON.stringify(usuario));

            alert(
                `🎉 ¡Compra realizada exitosamente!\n\n` +
                `Total pagado: $${data.totalCompra.toFixed(2)}\n` +
                `Nuevo saldo: $${data.nuevoSaldo.toFixed(2)}`
            );

            const saldoElem = document.getElementById("nav-usuario-saldo");
            if (saldoElem) {
                saldoElem.textContent = `$${data.nuevoSaldo.toFixed(2)}`;
            }

            // Actualizar saldo en perfil si estamos ahí
            const perfilSaldo = document.getElementById("perfil-saldo");
            if (perfilSaldo) {
                perfilSaldo.textContent = `$${data.nuevoSaldo.toFixed(2)}`;
            }

            localStorage.removeItem("carrito");
            carrito = [];
            guardarCarrito();

            document.getElementById("modal-carrito")?.close();

        } else {
            alert("❌ " + (data.message || "No se pudo completar la compra"));
        }

    } catch (err) {
        console.error("Error en la compra:", err);
        alert("❌ Error de conexión con el servidor");
    }
}

// ==============================================
// 6. PRODUCTOS (COMPRA)
// ==============================================

async function cargarProductosParaComprar() {
    try {
        const res = await fetch(`${API_URL}/api/productos`);
        const productos = await res.json();

        const tbody = document.getElementById("tbodyCompras");
        if (!tbody) return;

        tbody.innerHTML = productos.map(p => {
            const nombreSeguro = sanitizarTexto(p.nombre);
            const descSegura = sanitizarTexto(p.descripcion);
            
            return `
                <tr>
                    <td>${p.id_producto}</td>
                    <td>
                        <img src="${p.imagen 
                            ? `data:image/jpeg;base64,${p.imagen}` 
                            : 'https://via.placeholder.com/60?text=Sin+Imagen'
                        }" 
                        width="60"
                        onerror="this.src='https://via.placeholder.com/60?text=Error'">
                    </td>
                    <td>${nombreSeguro}</td>
                    <td>${descSegura}</td>
                    <td>$${parseFloat(p.precio).toFixed(2)}</td>
                    <td>${sanitizarTexto(p.temporada)}</td>
                    <td>
                        <button 
                            class="btn btn-primary btn-comprar"
                            data-id="${p.id_producto}"
                            data-precio="${p.precio}"
                            data-nombre="${nombreSeguro}"
                            data-imagen="${p.imagen 
                                ? `data:image/jpeg;base64,${p.imagen}` 
                                : 'https://via.placeholder.com/60?text=Sin+Imagen'
                            }"
                        >
                            🛒 Agregar
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        document.querySelectorAll(".btn-comprar").forEach(btn => {
            btn.addEventListener("click", () => {
                const producto = {
                    id_producto: Number(btn.dataset.id),
                    nombre: btn.dataset.nombre,
                    precio: Number(btn.dataset.precio),
                    imagen: btn.dataset.imagen
                };
                agregarAlCarrito(producto);
            });
        });

    } catch (err) {
        console.error("Error cargando productos:", err);
        alert("❌ Error al cargar productos");
    }
}

// ==============================================
// 7. PRODUCTOS (INVENTARIO - ADMIN)
// ==============================================

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/api/productos`);
        const data = await res.json();
        const tbody = document.getElementById("tbodyProductos");
        if (!tbody) return;

        tbody.innerHTML = data.map(p => `
            <tr>
                <td>${p.id_producto}</td>
                <td><img src="${p.imagen ? `data:image/jpeg;base64,${p.imagen}` : "https://via.placeholder.com/60"}" width="60" onerror="this.src='https://via.placeholder.com/60?text=Error'"></td>
                <td>${sanitizarTexto(p.nombre)}</td>
                <td>${sanitizarTexto(p.descripcion)}</td>
                <td>$${parseFloat(p.precio).toFixed(2)}</td>
                <td>${p.stock}</td>
                <td>${sanitizarTexto(p.temporada)}</td>
                <td>
                    <button class="editar btn btn-warning" data-id="${p.id_producto}">✏ Editar</button>
                    <button class="eliminar btn btn-danger" data-id="${p.id_producto}">🗑 Eliminar</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".editar").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                await abrirModalEditarProducto(id);
            });
        });

        tbody.querySelectorAll(".eliminar").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("¿Eliminar este producto?")) return;

                const id = btn.dataset.id;
                const res = await fetch(`${API_URL}/api/producto/${id}`, { method: "DELETE" });
                const data = await res.json();

                if (res.ok) {
                    alert("✅ Producto eliminado");
                    cargarProductos();
                } else {
                    alert("❌ Error al eliminar");
                }
            });
        });

    } catch (err) {
        console.error("Error cargando productos:", err);
        alert("❌ Error al cargar productos");
    }
}

async function abrirModalEditarProducto(id) {
    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`);
        const data = await res.json();

        if (data.success) {
            const producto = data.producto;
            document.getElementById("edit-id").value = producto.id_producto;
            document.getElementById("edit-nombre").value = producto.nombre;
            document.getElementById("edit-descripcion").value = producto.descripcion;
            document.getElementById("edit-precio").value = producto.precio;
            document.getElementById("edit-stock").value = producto.stock;
            document.getElementById("edit-temporada").value = producto.temporada;

            document.getElementById("edit-producto")?.showModal();
        }
    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error al cargar producto");
    }
}

// ==============================================
// 8. PERFIL CON VALIDACIONES
// ==============================================

async function cargarDatosPerfil(usuario) {
    try {
        document.getElementById("perfil-nombre").textContent = sanitizarTexto(usuario.nombre);
        document.getElementById("perfil-email").textContent = sanitizarTexto(usuario.email);
        document.getElementById("perfil-rol").textContent = sanitizarTexto(usuario.rol);
        document.getElementById("perfil-saldo").textContent = 
            `$${parseFloat(usuario.saldo || 0).toFixed(2)}`;

        const res = await fetch(`${API_URL}/api/usuario/perfil/${usuario.id_usuario}`);
        const data = await res.json();

        if (data.success && data.usuario) {
            const perfilFoto = document.getElementById("perfil-foto");
            if (perfilFoto && data.usuario.imagen) {
                perfilFoto.src = `data:image/jpeg;base64,${data.usuario.imagen}`;
            }

            const saldoActualizado = parseFloat(data.usuario.saldo || 0);
            document.getElementById("perfil-saldo").textContent = 
                `$${saldoActualizado.toFixed(2)}`;

            usuario.saldo = saldoActualizado;
            localStorage.setItem("usuario", JSON.stringify(usuario));
        }

    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}

async function abrirModalEditarPerfil() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/perfil/${usuario.id_usuario}`);
        const data = await res.json();

        if (data.success && data.usuario) {
            document.getElementById("modal-edit-nombre").value = data.usuario.nombre;
            document.getElementById("modal-edit-email").value = data.usuario.email;
            
            document.getElementById("modal-editar")?.showModal();
        }
    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error al cargar datos del perfil");
    }
}

async function actualizarPerfil() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    const nombre = sanitizarTexto(document.getElementById("modal-edit-nombre").value);
    const email = sanitizarTexto(document.getElementById("modal-edit-email").value);
    const password = document.getElementById("modal-edit-password").value;
    const imagenInput = document.getElementById("modal-edit-imagen");

    // Validaciones
    if (!nombre || nombre.length < 2) {
        alert("⚠️ El nombre debe tener al menos 2 caracteres");
        return;
    }

    if (!validarEmail(email)) {
        alert("⚠️ Email no válido");
        return;
    }

    if (password && !validarPassword(password)) {
        return;
    }

    const formData = new FormData();
    formData.append("id_usuario", usuario.id_usuario);
    formData.append("nombre", nombre);
    formData.append("email", email);
    if (password) formData.append("password", password);
    if (imagenInput.files[0]) formData.append("imagen", imagenInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/api/usuario/editar`, {
            method: "PUT",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Perfil actualizado exitosamente");
            
            usuario.nombre = nombre;
            usuario.email = email;
            guardarUsuario(usuario);

            document.getElementById("modal-editar")?.close();
            
            // Recargar datos del perfil
            await cargarDatosPerfil(usuario);
        } else {
            alert("❌ " + (data.message || "Error al actualizar perfil"));
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
}

async function abrirModalRecargarSaldo() {
    document.getElementById("modal-recargar-saldo")?.showModal();
}

async function recargarSaldo() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    const montoInput = document.getElementById("monto-recarga").value;
    
    if (!validarNumero(montoInput, 1, 10000)) {
        alert("⚠️ El monto debe estar entre $1 y $10,000");
        return;
    }

    const monto = parseFloat(montoInput);

    if (!confirm(`¿Recargar $${monto.toFixed(2)} a tu cuenta?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/recargar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                monto: monto
            })
        });

        const data = await res.json();

        if (data.success) {
            usuario.saldo = data.nuevoSaldo;
            guardarUsuario(usuario);

            alert(`✅ Recarga exitosa\n\nNuevo saldo: $${data.nuevoSaldo.toFixed(2)}`);
            
            document.getElementById("perfil-saldo").textContent = 
                `$${data.nuevoSaldo.toFixed(2)}`;
            
            document.getElementById("modal-recargar-saldo")?.close();
            document.getElementById("monto-recarga").value = "";

        } else {
            alert("❌ " + (data.message || "Error al recargar saldo"));
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
}

// ==============================================
// 9. VENTAS (ADMIN)
// ==============================================

async function cargarVentas() {
    try {
        const res = await fetch(`${API_URL}/api/ventas`);
        const ventas = await res.json();
        
        const tbody = document.getElementById("tbodyVentas");
        if (!tbody) return;

        tbody.innerHTML = ventas.map(v => `
            <tr>
                <td>${v.id_venta}</td>
                <td>${sanitizarTexto(v.nombre_usuario)}</td>
                <td>${new Date(v.fecha).toLocaleString('es-MX')}</td>
                <td>$${parseFloat(v.total).toFixed(2)}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="verDetalleVenta(${v.id_venta})">
                        👁️ Ver Detalle
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando ventas:", err);
        alert("❌ Error al cargar ventas");
    }
}

async function verDetalleVenta(idVenta) {
    try {
        const res = await fetch(`${API_URL}/api/venta/${idVenta}`);
        const data = await res.json();

        if (!data.success) {
            alert("❌ Error al cargar detalles");
            return;
        }

        const detalle = data.detalles.map(d => 
            `• ${sanitizarTexto(d.nombre_producto)} - Cantidad: ${d.cantidad} - Precio: ${d.precio.toFixed(2)} - Subtotal: ${d.subtotal.toFixed(2)}`
        ).join('\n');

        alert(
            `📋 DETALLE DE VENTA #${idVenta}\n\n` +
            `Cliente: ${sanitizarTexto(data.venta.nombre_usuario)}\n` +
            `Fecha: ${new Date(data.venta.fecha).toLocaleString('es-MX')}\n\n` +
            `PRODUCTOS:\n${detalle}\n\n` +
            `TOTAL: ${parseFloat(data.venta.total).toFixed(2)}`
        );

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error al cargar detalles de venta");
    }
}

// ==============================================
// 10. ADMIN - GESTIÓN DE USUARIOS
// ==============================================

async function cargarUsuariosAdmin() {
    try {
        const res = await fetch(`${API_URL}/api/usuarios`);
        
        if (!res.ok) {
            console.error("Error en la respuesta:", res.status);
            alert("❌ Error al cargar usuarios");
            return;
        }

        const data = await res.json();
        const tbody = document.getElementById("tablaUsuarios");
        if (!tbody) return;

        // Si data es un array directamente
        const usuarios = Array.isArray(data) ? data : (data.usuarios || []);

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${sanitizarTexto(u.nombre)}</td>
                <td>${sanitizarTexto(u.email)}</td>
                <td><span class="badge bg-${u.rol === 'admin' ? 'danger' : 'primary'}">${sanitizarTexto(u.rol)}</span></td>
                <td>${parseFloat(u.saldo || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando usuarios:", err);
        alert("❌ Error al cargar usuarios");
    }
}

async function eliminarUsuario(idUsuario) {
    const usuarioActual = obtenerUsuario();
    
    if (usuarioActual.id_usuario === idUsuario) {
        alert("❌ No puedes eliminar tu propia cuenta");
        return;
    }

    if (!confirm("⚠️ ¿Estás seguro de eliminar este usuario?\n\nEsta acción no se puede deshacer.")) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/usuario/eliminar/${idUsuario}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("✅ Usuario eliminado exitosamente");
            await cargarUsuariosAdmin();
        } else {
            alert("❌ Error al eliminar usuario");
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
}

async function cargarUsuariosParaRecarga() {
    try {
        const res = await fetch(`${API_URL}/api/usuarios`);
        
        if (!res.ok) {
            console.error("Error en la respuesta:", res.status);
            alert("❌ Error al cargar usuarios");
            return;
        }

        const data = await res.json();
        const tbody = document.getElementById("tablaUsuariosRecarga");
        if (!tbody) return;

        // Si data es un array directamente
        const usuarios = Array.isArray(data) ? data : (data.usuarios || []);

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${sanitizarTexto(u.nombre)}</td>
                <td>${sanitizarTexto(u.email)}</td>
                <td>
                    <span class="badge bg-${u.saldo > 100 ? 'success' : 'warning'}">
                        ${parseFloat(u.saldo || 0).toFixed(2)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="seleccionarUsuarioRecarga(${u.id_usuario}, '${sanitizarTexto(u.nombre)}', ${u.saldo || 0})">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error al cargar usuarios");
    }
}

function seleccionarUsuarioRecarga(id, nombre, saldo) {
    document.getElementById("recargar-id").value = id;
    document.getElementById("recargar-nombre").value = nombre;
    document.getElementById("recargar-saldo-actual").value = `${parseFloat(saldo).toFixed(2)}`;
    document.getElementById("recargar-monto").focus();
}

async function procesarRecargaAdmin() {
    const admin = obtenerUsuario();
    
    if (!admin || admin.rol !== 'admin') {
        alert("❌ No tienes permisos para recargar saldo");
        return;
    }

    const idUsuario = parseInt(document.getElementById("recargar-id").value);
    const montoInput = document.getElementById("recargar-monto").value;
    const nombre = document.getElementById("recargar-nombre").value;
    const saldoActual = parseFloat(document.getElementById("recargar-saldo-actual").value.replace(',', ''));

    if (!idUsuario || isNaN(idUsuario)) {
        alert("⚠️ Selecciona un usuario primero");
        return;
    }

    if (!validarNumero(montoInput, 0.01, 100000)) {
        alert("⚠️ El monto debe estar entre $0.01 y $100,000");
        return;
    }

    const monto = parseFloat(montoInput);
    const nuevoSaldo = saldoActual + monto;

    const confirmar = confirm(
        `¿Confirmar recarga?\n\n` +
        `Usuario: ${nombre}\n` +
        `Saldo actual: ${saldoActual.toFixed(2)}\n` +
        `Monto a recargar: ${monto.toFixed(2)}\n` +
        `Nuevo saldo: ${nuevoSaldo.toFixed(2)}`
    );

    if (!confirmar) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/recargar-saldo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario: idUsuario,
                monto: monto,
                id_admin: admin.id_usuario
            })
        });

        const data = await res.json();

        if (data.success) {
            alert(`✅ Recarga exitosa\n\nNuevo saldo de ${nombre}: ${data.nuevoSaldo.toFixed(2)}`);
            
            await cargarUsuariosParaRecarga();
            
            document.getElementById("formRecargarSaldo").reset();
        } else {
            alert("❌ " + (data.message || "Error al recargar saldo"));
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
}

// ==============================================
// 11. MODALES
// ==============================================

function configurarModales() {
    document.querySelectorAll("[data-open]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute("data-open");
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.showModal();
            }
        });
    });

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute("data-close");
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.close();
            }
        });
    });

    ["modal-login", "modal-registro", "modal-carrito", "add-producto", "edit-producto", "modal-editar", "modal-usuarios", "modal-recargar-saldo"].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.close();
            });
        }
    });

    const linkRegistro = document.getElementById("link-abrir-registro");
    if (linkRegistro) {
        linkRegistro.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("modal-login")?.close();
            setTimeout(() => {
                document.getElementById("modal-registro")?.showModal();
            }, 100);
        });
    }

    const linkLogin = document.getElementById("link-abrir-login");
    if (linkLogin) {
        linkLogin.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("modal-registro")?.close();
            setTimeout(() => {
                document.getElementById("modal-login")?.showModal();
            }, 100);
        });
    }
}

// ==============================================
// 12. FORMULARIOS
// ==============================================

function configurarFormularios() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value.trim();
            await realizarLogin(email, password);
        });
    }

    const registroForm = document.getElementById("registroForm");
    if (registroForm) {
        registroForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nombre = document.getElementById("reg-nombre").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const password = document.getElementById("reg-password").value.trim();
            const rol = document.getElementById("reg-rol").value;
            await realizarRegistro(nombre, email, password, rol);
        });
    }

    const formAgregar = document.getElementById("formAgregarProducto");
    if (formAgregar) {
        formAgregar.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const nombre = sanitizarTexto(document.getElementById("nombreProducto").value);
            const descripcion = sanitizarTexto(document.getElementById("descripcionProducto").value);
            const precio = document.getElementById("precioProducto").value;
            const stock = document.getElementById("stockProducto").value;
            const temporada = document.getElementById("temporadaProducto").value;
            const imagen = document.getElementById("imagenProducto").files[0];

            // Validaciones
            if (!nombre || nombre.length < 2) {
                alert("⚠️ El nombre debe tener al menos 2 caracteres");
                return;
            }

            if (!validarNumero(precio, 0.01, 100000)) {
                alert("⚠️ El precio debe estar entre $0.01 y $100,000");
                return;
            }

            if (!validarNumero(stock, 0, 10000)) {
                alert("⚠️ El stock debe estar entre 0 y 10,000 unidades");
                return;
            }

            if (!temporada) {
                alert("⚠️ Selecciona una temporada");
                return;
            }

            const formData = new FormData();
            formData.append("nombre", nombre);
            formData.append("descripcion", descripcion);
            formData.append("precio", precio);
            formData.append("stock", stock);
            formData.append("temporada", temporada);
            if (imagen) formData.append("imagen", imagen);

            try {
                const res = await fetch(`${API_URL}/api/producto`, {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Producto agregado exitosamente");
                    formAgregar.reset();
                    document.getElementById("add-producto").close();
                    cargarProductos();
                } else {
                    alert("❌ Error: " + data.error);
                }

            } catch (err) {
                console.error("Error:", err);
                alert("❌ Error de conexión");
            }
        });
    }

    const formEditar = document.getElementById("formEditarProducto");
    if (formEditar) {
        formEditar.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const id = document.getElementById("edit-id").value;
            const nombre = sanitizarTexto(document.getElementById("edit-nombre").value);
            const descripcion = sanitizarTexto(document.getElementById("edit-descripcion").value);
            const precio = document.getElementById("edit-precio").value;
            const stock = document.getElementById("edit-stock").value;
            const temporada = document.getElementById("edit-temporada").value;
            const imagen = document.getElementById("edit-imagen").files[0];

            // Validaciones
            if (!nombre || nombre.length < 2) {
                alert("⚠️ El nombre debe tener al menos 2 caracteres");
                return;
            }

            if (!validarNumero(precio, 0.01, 100000)) {
                alert("⚠️ El precio debe estar entre $0.01 y $100,000");
                return;
            }

            if (!validarNumero(stock, 0, 10000)) {
                alert("⚠️ El stock debe estar entre 0 y 10,000 unidades");
                return;
            }

            const formData = new FormData();
            formData.append("nombre", nombre);
            formData.append("descripcion", descripcion);
            formData.append("precio", precio);
            formData.append("stock", stock);
            formData.append("temporada", temporada);
            if (imagen) formData.append("imagen", imagen);

            try {
                const res = await fetch(`${API_URL}/api/producto/${id}`, {
                    method: "PUT",
                    body: formData
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Producto actualizado exitosamente");
                    formEditar.reset();
                    document.getElementById("edit-producto").close();
                    cargarProductos();
                } else {
                    alert("❌ Error: " + data.error);
                }

            } catch (err) {
                console.error("Error:", err);
                alert("❌ Error de conexión");
            }
        });
    }

    // Form recargar saldo (admin)
    const formRecargar = document.getElementById("formRecargarSaldo");
    if (formRecargar) {
        formRecargar.addEventListener("submit", async (e) => {
            e.preventDefault();
            await procesarRecargaAdmin();
        });
    }

    // Preview de imagen en perfil
    const imagenPerfil = document.getElementById("modal-edit-imagen");
    if (imagenPerfil) {
        imagenPerfil.addEventListener("change", function() {
            const file = this.files[0];
            const preview = document.getElementById("preview-img");

            if (file && preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// ==============================================
// 13. INICIALIZACIÓN
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    const ruta = window.location.pathname;
    const user = obtenerUsuario();

    // Configurar navbar SIEMPRE
    configurarNavbar(user);

    // Configurar modales y formularios
    configurarModales();
    configurarFormularios();

    // Proteger páginas según corresponda
    if (ruta.includes("perfil.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            mensaje: "⚠️ Necesitas iniciar sesión para ver tu perfil"
        });
        if (resultado.permitido) {
            cargarDatosPerfil(resultado.usuario);
            
            // Botón editar perfil
            const btnEditar = document.getElementById("btn-editar");
            if (btnEditar) {
                btnEditar.addEventListener("click", abrirModalEditarPerfil);
            }

            // Botón guardar cambios perfil
            const btnGuardarPerfil = document.getElementById("btn-guardar-perfil");
            if (btnGuardarPerfil) {
                btnGuardarPerfil.addEventListener("click", actualizarPerfil);
            }

            // Botón actualizar saldo
            const btnActualizarSaldo = document.querySelector('[onclick="actualizarSaldoUsuario()"]');
            if (btnActualizarSaldo) {
                btnActualizarSaldo.addEventListener("click", async () => {
                    await cargarDatosPerfil(user);
                    alert("✅ Saldo actualizado");
                });
            }

            // Botones admin
            if (user.rol === "admin") {
                const btnUsuarios = document.querySelector('[data-open="modal-usuarios"]');
                if (btnUsuarios) {
                    btnUsuarios.addEventListener("click", cargarUsuariosAdmin);
                }

                const btnRecargar = document.querySelector('[data-open="modal-recargar-saldo"]');
                if (btnRecargar) {
                    btnRecargar.addEventListener("click", cargarUsuariosParaRecarga);
                }
            }
        }
    }

    if (ruta.includes("inventario.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            soloAdmin: true,
            mensaje: "⚠️ Solo administradores pueden acceder al inventario"
        });
        if (resultado.permitido) {
            cargarProductos();
        }
    }

    if (ruta.includes("ventas.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            soloAdmin: true,
            mensaje: "⚠️ Solo administradores pueden acceder a ventas"
        });
        if (resultado.permitido) {
            cargarVentas();
        }
    }

    if (ruta.includes("historial.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            mensaje: "⚠️ Debes iniciar sesión para ver tu historial"
        });
        if (resultado.permitido) {
            cargarHistorialCompras(resultado.usuario);
        }
    }

    if (ruta.includes("compra.html")) {
        cargarProductosParaComprar();
    }

    // Carrito
    actualizarCantidadCarrito();
    
    const btnCarrito = document.querySelector('[data-open="modal-carrito"]');
    if (btnCarrito) {
        btnCarrito.addEventListener("click", mostrarCarrito);
    }

    const btnPagar = document.getElementById("btnPagar");
    if (btnPagar) {
        btnPagar.addEventListener("click", confirmarCompra);
    }

    // Abrir modal login si viene con #login
    if (window.location.hash === "#login") {
        setTimeout(() => {
            const modal = document.getElementById("modal-login");
            if (modal) {
                modal.showModal();
                history.replaceState(null, null, ' ');
            }
        }, 300);
    }
});

// ==============================================
// 14. HISTORIAL DE COMPRAS
// ==============================================

async function cargarHistorialCompras(usuario) {
    try {
        const res = await fetch(`${API_URL}/api/usuario/${usuario.id_usuario}/compras`);
        const data = await res.json();

        const listaCompras = document.getElementById("lista-compras");
        const mensajeSinCompras = document.getElementById("mensaje-sin-compras");

        if (!data.success || !data.compras || data.compras.length === 0) {
            if (mensajeSinCompras) {
                mensajeSinCompras.classList.remove("d-none");
            }
            if (listaCompras) {
                listaCompras.innerHTML = "";
            }
            return;
        }

        if (mensajeSinCompras) {
            mensajeSinCompras.classList.add("d-none");
        }

        listaCompras.innerHTML = data.compras.map(compra => {
            const productos = compra.productos || [];
            const productosHTML = productos.map(p => `
                <div class="producto-item">
                    <div class="producto-info">
                        <strong>${sanitizarTexto(p.producto)}</strong>
                        <br>
                        <small>Cantidad: ${p.cantidad} x ${parseFloat(p.precio).toFixed(2)}</small>
                    </div>
                    <div class="producto-precio">
                        ${parseFloat(p.subtotal).toFixed(2)}
                    </div>
                </div>
            `).join("");

            return `
                <div class="compra-card">
                    <div class="compra-header">
                        <div>
                            <h5>🛒 Compra #${compra.id_venta}</h5>
                            <small><i class="fas fa-calendar"></i> ${new Date(compra.fecha).toLocaleString('es-MX')}</small>
                        </div>
                        <div class="compra-total">
                            ${parseFloat(compra.total).toFixed(2)}
                        </div>
                    </div>
                    <div class="compra-productos">
                        <h6><i class="fas fa-box"></i> Productos (${compra.num_productos}):</h6>
                        ${productosHTML}
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error cargando historial:", err);
        alert("❌ Error al cargar historial de compras");
    }
}

async function actualizarSaldoUsuario() {
    const usuario = obtenerUsuario();
    if (!usuario) {
        alert("⚠️ Debes iniciar sesión primero");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/usuario/${usuario.id_usuario}/saldo-actual`);
        const data = await res.json();

        if (data.success) {
            usuario.saldo = data.saldo;
            guardarUsuario(usuario);

            // Actualizar en navbar
            const saldoNav = document.getElementById("nav-usuario-saldo");
            if (saldoNav) {
                saldoNav.textContent = `${data.saldo.toFixed(2)}`;
            }

            // Actualizar en perfil si existe
            const saldoPerfil = document.getElementById("perfil-saldo");
            if (saldoPerfil) {
                saldoPerfil.textContent = `${data.saldo.toFixed(2)}`;
            }

            alert(`✅ Saldo actualizado: ${data.saldo.toFixed(2)}`);
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        console.error("Error actualizando saldo:", err);
        alert("❌ Error al actualizar saldo");
    }
}


// ==============================================
// EXPORTAR FUNCIONES GLOBALES
// ==============================================
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.confirmarCompra = confirmarCompra;
window.obtenerUsuario = obtenerUsuario;
window.cerrarSesion = cerrarSesion;
window.eliminarUsuario = eliminarUsuario;
window.seleccionarUsuarioRecarga = seleccionarUsuarioRecarga;
window.verDetalleVenta = verDetalleVenta;
window.abrirModalEditarPerfil = abrirModalEditarPerfil;
window.actualizarPerfil = actualizarPerfil;
window.sanitizarTexto = sanitizarTexto;
window.actualizarSaldoUsuario = actualizarSaldoUsuario;
window.abrirModalHistorial = abrirModalHistorial;
window.verDetalleCompra = verDetalleCompra;
window.volverAHistorial = volverAHistorial;
window.abrirModalRecargarSaldo = abrirModalRecargarSaldo;
window.procesarRecargaSaldo = procesarRecargaSaldo;