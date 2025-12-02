// ==============================================
// SCRIPT.JS COMPLETO - PANADERÍA NAVIDEÑA
// ==============================================

const API_URL = "https://panaderia-navidad.onrender.com";

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
    localStorage.removeItem("usuario");
    localStorage.removeItem("carrito");
    alert("👋 Sesión cerrada");
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
        // Usuario NO logueado
        btnLogin?.classList.remove("d-none");
        btnRegistro?.classList.remove("d-none");
        navUsuario?.classList.add("d-none");
        navLogout?.classList.add("d-none");
        navCarrito?.classList.add("d-none");
        adminItems.forEach(el => el.classList.add("d-none"));
    } else {
        // Usuario logueado
        btnLogin?.classList.add("d-none");
        btnRegistro?.classList.add("d-none");
        navUsuario?.classList.remove("d-none");
        navLogout?.classList.remove("d-none");
        navCarrito?.classList.remove("d-none");

        // Mostrar datos
        const nombreElem = document.getElementById("nav-usuario-nombre");
        const saldoElem = document.getElementById("nav-usuario-saldo");
        
        if (nombreElem) nombreElem.textContent = usuario.nombre;
        if (saldoElem) {
            saldoElem.textContent = `$${parseFloat(usuario.saldo || 0).toFixed(2)}`;
        }

        // Mostrar opciones de admin
        if (usuario.rol === "admin") {
            adminItems.forEach(el => el.classList.remove("d-none"));
        }
    }

    // Configurar botón logout
    const btnLogout = document.getElementById("logoutBtn");
    if (btnLogout) {
        btnLogout.onclick = cerrarSesion;
    }

    // Actualizar cantidad del carrito
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
// 4. LOGIN Y REGISTRO
// ==============================================

async function realizarLogin(email, password) {
    try {
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

        alert(`¡Bienvenido ${data.usuario.nombre}! 💰\n\nTu saldo actual: $${data.usuario.saldo.toFixed(2)}`);
        
        location.reload();
        return true;

    } catch (err) {
        console.error("Error en login:", err);
        const errorElem = document.getElementById("login-error");
        if (errorElem) {
            errorElem.textContent = "Error de conexión con el servidor";
        }
        return false;
    }
}

async function realizarRegistro(nombre, email, password, rol) {
    try {
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
            errorElem.textContent = "Error de conexión con el servidor";
        }
        return false;
    }
}

// ==============================================
// 5. CARRITO
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

    const existe = carrito.find(item => item.id_producto === producto.id_producto);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen
        });
    }

    guardarCarrito();
    alert(`✅ ${producto.nombre} agregado al carrito`);
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

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        tbody.innerHTML += `
            <tr>
                <td>${item.id_producto}</td>
                <td><img src="${item.imagen || 'https://via.placeholder.com/60?text=Sin+Imagen'}" 
                         width="60" 
                         onerror="this.src='https://via.placeholder.com/60?text=Error'"></td>
                <td>${item.nombre}</td>
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
            </tr>
        `;
    });

    const totalElem = document.getElementById("totalCarrito");
    if (totalElem) totalElem.textContent = total.toFixed(2);
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
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

        tbody.innerHTML = productos.map(p => `
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
                <td>${p.nombre}</td>
                <td>${p.descripcion}</td>
                <td>$${p.precio}</td>
                <td>${p.temporada}</td>
                <td>
                    <button 
                        class="btn btn-primary btn-comprar"
                        data-id="${p.id_producto}"
                        data-precio="${p.precio}"
                        data-nombre="${p.nombre}"
                        data-imagen="${p.imagen 
                            ? `data:image/jpeg;base64,${p.imagen}` 
                            : 'https://via.placeholder.com/60?text=Sin+Imagen'
                        }"
                    >
                        🛒 Agregar
                    </button>
                </td>
            </tr>
        `).join("");

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
                <td><img src="${p.imagen ? `data:image/jpeg;base64,${p.imagen}` : "https://via.placeholder.com/60"}" width="60"></td>
                <td>${p.nombre}</td>
                <td>${p.descripcion}</td>
                <td>$${p.precio}</td>
                <td>${p.stock}</td>
                <td>${p.temporada}</td>
                <td>
                    <button class="editar btn btn-warning" data-id="${p.id_producto}">✏ Editar</button>
                    <button class="eliminar btn btn-danger" data-id="${p.id_producto}">🗑 Eliminar</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".editar").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
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

                    document.getElementById("edit-producto").showModal();
                }
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
    }
}

// ==============================================
// 8. PERFIL
// ==============================================

async function cargarDatosPerfil(usuario) {
    try {
        document.getElementById("perfil-nombre").textContent = usuario.nombre;
        document.getElementById("perfil-email").textContent = usuario.email;
        document.getElementById("perfil-rol").textContent = usuario.rol;
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

// ==============================================
// 9. MODALES
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

    ["modal-login", "modal-registro", "modal-carrito", "add-producto", "edit-producto", "modal-editar"].forEach(id => {
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
// 10. FORMULARIOS
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
            const formData = new FormData(formAgregar);

            try {
                const res = await fetch(`${API_URL}/api/producto`, {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Producto agregado");
                    formAgregar.reset();
                    document.getElementById("add-producto").close();
                    cargarProductos();
                } else {
                    alert("❌ Error: " + data.error);
                }

            } catch (err) {
                console.error("Error:", err);
            }
        });
    }

    const formEditar = document.getElementById("formEditarProducto");
    if (formEditar) {
        formEditar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-id").value;
            const formData = new FormData(formEditar);

            try {
                const res = await fetch(`${API_URL}/api/producto/${id}`, {
                    method: "PUT",
                    body: formData
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Producto actualizado");
                    formEditar.reset();
                    document.getElementById("edit-producto").close();
                    cargarProductos();
                } else {
                    alert("❌ Error: " + data.error);
                }

            } catch (err) {
                console.error("Error:", err);
            }
        });
    }
}

// ==============================================
// 11. INICIALIZACIÓN
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
        }
    }

    if (ruta.includes("inventario.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            soloAdmin: true,
            mensaje: "⚠️ Solo administradores pueden acceder"
        });
        if (resultado.permitido) {
            cargarProductos();
        }
    }

    if (ruta.includes("ventas.html")) {
        protegerPagina({
            requiereLogin: true,
            soloAdmin: true,
            mensaje: "⚠️ Solo administradores pueden acceder"
        });
    }

    if (ruta.includes("compra.html")) {
        cargarProductosParaComprar();
    }

    // Carrito
    actualizarCantidadCarrito();
    
    const btnCarrito = document.querySelector('[data-open="modal-carrito"]');
    btnCarrito?.addEventListener("click", mostrarCarrito);

    const btnPagar = document.getElementById("btnPagar");
    btnPagar?.addEventListener("click", confirmarCompra);

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

function contieneEtiquetasHTML(texto) {
  const regex = /<[^>]*>/g;  // Detecta <loquesea>
  return regex.test(texto);
}

document.getElementById("editarForm").addEventListener("submit", function (e) {
  const nombre = document.getElementById("edit-nombre").value;
  const email = document.getElementById("edit-email").value;

  if (contieneEtiquetasHTML(nombre) || contieneEtiquetasHTML(email)) {
    e.preventDefault();
    alert("No se permiten etiquetas HTML en los campos.");
    return;
  }
});

function bloquearHTML(req, res, next) {
    const peligrosas = /<script|<\/script|<marquee|<\/marquee|<img|onerror=|onload=/i;

    const body = JSON.stringify(req.body);
    
    if (peligrosas.test(body)) {
        return res.status(400).json({ error: "Entrada no permitida" });
    }

    next();
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