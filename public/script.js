// ==============================================
// SISTEMA DE AUTENTICACIÓN MEJORADO
// ==============================================

const API_URL = "https://panaderia-navidad.onrender.com";

// ==============================================
// 1. FUNCIONES DE SESIÓN
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
    mostrarUsuarioEnNav(usuario);
}

function cerrarSesion() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("carrito");
    alert("👋 Sesión cerrada");
    window.location.href = "index.html";
}

// ==============================================
// 2. PROTECCIÓN DE PÁGINAS
// ==============================================

function protegerPagina(opciones = {}) {
    const {
        requiereLogin = true,
        soloAdmin = false,
        mensaje = "⚠️ Debes iniciar sesión para acceder a esta página",
        redirigir = true
    } = opciones;

    const user = obtenerUsuario();

    // No requiere login - acceso libre
    if (!requiereLogin) {
        return { permitido: true, usuario: user };
    }

    // Requiere login pero no hay usuario
    if (!user) {
        if (redirigir) {
            const confirma = confirm(mensaje + "\n\n¿Deseas iniciar sesión ahora?");
            if (confirma) {
                window.location.href = "index.html#login";
            } else {
                window.location.href = "index.html";
            }
        }
        return { permitido: false, usuario: null };
    }

    // Requiere admin pero el usuario no lo es
    if (soloAdmin && user.rol !== "admin") {
        alert("❌ No tienes permisos de administrador");
        if (redirigir) {
            window.location.href = "index.html";
        }
        return { permitido: false, usuario: user };
    }

    return { permitido: true, usuario: user };
}

// ==============================================
// 3. INICIALIZACIÓN POR PÁGINA
// ==============================================

function inicializarPagina() {
    const ruta = window.location.pathname;
    const user = obtenerUsuario();

    // Configurar navbar siempre
    configurarNavbar(user);

    // PÁGINAS PÚBLICAS (no requieren login)
    if (ruta.includes("index.html") || ruta === "/" || ruta === "") {
        console.log("📄 Página pública: index.html");
        return { tipo: "publica", usuario: user };
    }

    // COMPRA.HTML - Público para ver, requiere login para comprar
    if (ruta.includes("compra.html")) {
        console.log("📄 Página semi-pública: compra.html");
        cargarProductosParaComprar();
        return { tipo: "semi-publica", usuario: user };
    }

    // PERFIL.HTML - Requiere login
    if (ruta.includes("perfil.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            mensaje: "⚠️ Necesitas iniciar sesión para ver tu perfil"
        });
        if (resultado.permitido) {
            cargarDatosPerfil(resultado.usuario);
        }
        return resultado;
    }

    // INVENTARIO.HTML - Solo admin
    if (ruta.includes("inventario.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            soloAdmin: true,
            mensaje: "⚠️ Esta página es solo para administradores"
        });
        if (resultado.permitido) {
            cargarProductos();
        }
        return resultado;
    }

    // VENTAS.HTML - Solo admin
    if (ruta.includes("ventas.html")) {
        const resultado = protegerPagina({
            requiereLogin: true,
            soloAdmin: true,
            mensaje: "⚠️ Esta página es solo para administradores"
        });
        return resultado;
    }

    return { tipo: "desconocida", usuario: user };
}

// ==============================================
// 4. CONFIGURAR NAVBAR
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

function mostrarUsuarioEnNav(usuario) {
    configurarNavbar(usuario);
}

// ==============================================
// 5. LOGIN Y REGISTRO
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

        // Guardar usuario
        guardarUsuario(data.usuario);

        // Cerrar modal
        const modal = document.getElementById("modal-login");
        if (modal) modal.close();

        // Mensaje de bienvenida
        alert(`¡Bienvenido ${data.usuario.nombre}! 💰\n\nTu saldo actual: $${data.usuario.saldo.toFixed(2)}`);

        // Recargar página para actualizar UI
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

        // Auto-login después del registro
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
// 6. CARRITO (requiere verificación de login)
// ==============================================

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

    // Usuario logueado - agregar al carrito
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
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

    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCantidadCarrito();
    alert(`✅ ${producto.nombre} agregado al carrito`);
}

function actualizarCantidadCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const elem = document.getElementById("carrito-cantidad");
    if (elem) elem.textContent = total;
}

// ==============================================
// 7. CARGA DE PRODUCTOS (COMPRA.HTML)
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

        // Eventos de agregar al carrito
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
// 8. INICIALIZACIÓN GLOBAL
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    
    // Inicializar página actual
    inicializarPagina();

    // Configurar modales
    configurarModales();

    // Configurar formularios
    configurarFormularios();

    // Si viene con #login, abrir modal
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
// 9. CONFIGURACIÓN DE MODALES Y FORMULARIOS
// ==============================================

function configurarModales() {
    // Botones para abrir modales
    document.querySelectorAll("[data-open]").forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = document.getElementById(btn.dataset.open);
            modal?.showModal();
        });
    });

    // Botones para cerrar modales
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = document.getElementById(btn.dataset.close);
            modal?.close();
        });
    });

    // Cerrar modal al hacer clic fuera
    ["modal-login", "modal-registro", "modal-carrito"].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.close();
            });
        }
    });
}

function configurarFormularios() {
    // Form login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value.trim();
            await realizarLogin(email, password);
        });
    }

    // Form registro
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
}

// ==============================================
// EXPORTAR FUNCIONES GLOBALES
// ==============================================
window.agregarAlCarrito = agregarAlCarrito;
window.obtenerUsuario = obtenerUsuario;
window.cerrarSesion = cerrarSesion;