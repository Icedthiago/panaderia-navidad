// -----------------------------------------
// CONFIG
// -----------------------------------------
const API_URL = "https://panaderia-navidad.onrender.com";


// -----------------------------------------
// UTILIDAD: Cerrar modal al hacer clic afuera
// -----------------------------------------
function activarCerrarModalFuera(modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.close();
    });
}


// -----------------------------------------
// ABRIR Y CERRAR MODALES
// -----------------------------------------
document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = document.getElementById(btn.dataset.open);
        modal?.showModal();
    });
});

document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = document.getElementById(btn.dataset.close);
        modal?.close();
    });
});


// -----------------------------------------
// REGISTRO
// -----------------------------------------
const registroForm = document.getElementById("registroForm");

if (registroForm) {
    registroForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("reg-nombre").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();
        const rol = document.getElementById("reg-rol").value;
        const errorMsg = document.getElementById("msg-error");

        errorMsg.textContent = "";

        if (nombre.length < 3) return errorMsg.textContent = "El nombre debe tener mínimo 3 caracteres";
        if (!email.includes("@")) return errorMsg.textContent = "Correo inválido";
        if (password.length < 6) return errorMsg.textContent = "La contraseña debe tener mínimo 6 caracteres";

        try {
            const res = await fetch(`${API_URL}/api/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, email, password, rol })
            });

            const data = await res.json();
            if (!res.ok) return errorMsg.textContent = data.message;

            alert("✔ Registro exitoso");
            await realizarLogin(email, password);

            registroForm.reset();
            document.getElementById("modal-registro").close();

        } catch {
            errorMsg.textContent = "Error conectando con el servidor";
        }
    });
}


// -----------------------------------------
// LOGIN MANUAL
// -----------------------------------------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        const error = document.getElementById("login-error");

        error.textContent = "";

        if (!email.includes("@")) return error.textContent = "Correo inválido";
        if (password.length < 6) return error.textContent = "Contraseña muy corta";

        await realizarLogin(email, password);
    });
}


// -----------------------------------------
// MOSTRAR USUARIO EN NAVBAR
// -----------------------------------------
function mostrarUsuario(usuario) {
    const { nombre, rol, saldo } = usuario;

    // Ocultar botones de login/registro
    document.getElementById("nav-login-btn")?.classList.add("d-none");
    document.getElementById("nav-registro-btn")?.classList.add("d-none");

    // Mostrar info del usuario
    const nombreElem = document.getElementById("nav-usuario-nombre");
    if (nombreElem) {
        nombreElem.textContent = nombre;
    }

    // Mostrar saldo
    const saldoElem = document.getElementById("nav-usuario-saldo");
    if (saldoElem) {
        saldoElem.textContent = `$${parseFloat(saldo || 0).toFixed(2)}`;
    }

    document.getElementById("nav-usuario")?.classList.remove("d-none");
    document.getElementById("nav-logout")?.classList.remove("d-none");

    // Mostrar opciones de admin
    if (rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => {
            el.classList.remove("d-none");
        });
    }

    // Mostrar carrito
    document.getElementById("nav-carrito-btn")?.classList.remove("d-none");
    actualizarCantidadCarrito();
}

// -----------------------------------------
// LOGOUT
// -----------------------------------------
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    location.reload();
});


// -----------------------------------------
// CARGAR PRODUCTOS (ADMIN)
// -----------------------------------------
async function cargarProductos(reintento = 0) {
    try {
        const res = await fetch(`${API_URL}/api/productos`);
        if (!res.ok) throw new Error("API dormida");

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

        // Evento EDITAR
        tbody.querySelectorAll(".editar").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;

                const res = await fetch(`${API_URL}/api/producto/${id}`);
                const data = await res.json();

                document.getElementById("edit-id").value = data.id_producto;
                document.getElementById("edit-nombre").value = data.nombre;
                document.getElementById("edit-descripcion").value = data.descripcion;
                document.getElementById("edit-precio").value = data.precio;
                document.getElementById("edit-stock").value = data.stock;
                document.getElementById("edit-temporada").value = data.temporada;

                document.getElementById("edit-producto").showModal();
            });
        });

    } catch (err) {
        if (reintento < 2) {
            console.log("Reintentando cargar productos...");
            return setTimeout(() => cargarProductos(reintento + 1), 1500);
        }
        console.error("Error cargando productos:", err);
    }
}


// -----------------------------------------
// AGREGAR PRODUCTO
// -----------------------------------------
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
                alert("Producto agregado correctamente");
                formAgregar.reset();
                document.getElementById("add-producto").close();
                cargarProductos();
            } else {
                alert("Error: " + data.error);
            }

        } catch (err) {
            console.error("Error:", err);
        }
    });
}


// -----------------------------------------
// ELIMINAR PRODUCTO
// -----------------------------------------
document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("eliminar")) return;

    const id = e.target.dataset.id;
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (res.ok) {
            alert("Producto eliminado");
            cargarProductos();
        } else {
            alert("Error al eliminar: " + (data.message || data.error || "Error desconocido"));
        }

    } catch (err) {
        console.error("Error eliminando:", err);
    }
});


// -----------------------------------------
// EDITAR PRODUCTO
// -----------------------------------------
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
                alert("✔ Producto actualizado");
                formEditar.reset();
                document.getElementById("edit-producto").close();
                cargarProductos();
            } else {
                alert("Error: " + data.error);
            }

        } catch (err) {
            console.error("Error:", err);
        }
    });
}


// -----------------------------------------
// VERIFICAR SESIÓN (UNA SOLA VEZ)
// -----------------------------------------
async function verificarSesion() {
    try {
        const res = await fetch(`${API_URL}/auth/session`, { credentials: "include" });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.logged) return;

        mostrarUsuario(data.usuario);

    } catch (e) {
        console.error("Error verificando sesión:", e);
    }
}

function verificarSesionSilenciosa() {
    const user = JSON.parse(localStorage.getItem("usuario"));
    return user !== null;
}

/*function requiereLogin(mensajePersonalizado = "⚠️ Debes iniciar sesión para realizar esta acción") {
    const user = JSON.parse(localStorage.getItem("usuario"));
    
    if (!user) {
        // Mostrar mensaje personalizado
        if (confirm(mensajePersonalizado + "\n\n¿Deseas iniciar sesión ahora?")) {
            // Abrir modal de login
            const loginModal = document.getElementById("modal-login");
            if (loginModal) {
                loginModal.showModal();
            }
        }
        return false;
    }
    
    return true;
} */

document.addEventListener("DOMContentLoaded", () => {
    
    // Solo verificar sesión si estamos en perfil.html
    if (window.location.pathname.includes("perfil.html")) {
        const user = JSON.parse(localStorage.getItem("usuario"));

        if (!user) {
            // ✅ Preguntar si quiere iniciar sesión
            if (confirm("⚠️ Necesitas iniciar sesión para ver tu perfil.\n\n¿Deseas iniciar sesión ahora?")) {
                window.location.href = "index.html";
            } else {
                window.location.href = "index.html";
            }
            return;
        }

        // Resto del código de perfil...
        document.getElementById("perfil-nombre").textContent = user.nombre;
        document.getElementById("perfil-email").textContent = user.email;
        document.getElementById("perfil-rol").textContent = user.rol;
        
        // Mostrar saldo
        document.getElementById("perfil-saldo").textContent = 
            `$${parseFloat(user.saldo || 0).toFixed(2)}`;

        cargarDatosCompletos(user.id_usuario);
        // Mostrar opciones de admin
        if (user.rol === "admin") {
            document.querySelectorAll(".admin-only").forEach(el => {
                el.classList.remove("d-none");
            });
        }
    }
});

// -----------------------------------------
// FUNCIÓN REAL DE LOGIN
// -----------------------------------------
async function realizarLogin(email, password) {
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!data.success) {
            document.getElementById("login-error").textContent =
                data.message || "Correo o contraseña incorrectos";
            return false;
        }

        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        mostrarUsuario(data.usuario);

        const modal = document.getElementById("modal-login");
        if (modal) modal.close();

        // ✅ Mensaje mejorado con saldo
        alert(`¡Bienvenido ${data.usuario.nombre}! 💰\n\nTu saldo actual: $${data.usuario.saldo.toFixed(2)}`);

        return true;

    } catch (err) {
        console.error("Error en login:", err);
        document.getElementById("login-error").textContent =
            "Error de conexión con el servidor";
        return false;
    }
}

// -----------------------------------------
// CARRITO
// -----------------------------------------
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

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

function actualizarCarritoNav() {
    actualizarCantidadCarrito();
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
                <td><img src="img/default.jpg" width="60"></td>
                <td>${item.nombre}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="cambiarCantidad(${index}, -1)">−</button>
                    <b style="padding: 0 10px;">${item.cantidad}</b>
                    <button class="btn btn-success btn-sm" onclick="cambiarCantidad(${index}, 1)">+</button>
                </td>
                <td>$${subtotal.toFixed(2)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">🗑️</button></td>
            </tr>
        `;
    });

    document.getElementById("totalCarrito").textContent = total.toFixed(2);
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    guardarCarrito();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
}

function cargarCarritoEnModal() {
    mostrarCarrito();
}

function agregarAlCarrito(producto) {
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

// -----------------------------------------
// ✅ CONFIRMAR COMPRA (SIN ENVIAR IMÁGENES)
// -----------------------------------------
async function confirmarCompra() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (carrito.length === 0) {
        alert("⚠️ Tu carrito está vacío");
        return;
    }

    // Calcular total
    const totalCompra = carrito.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
    }, 0);

    // Verificar saldo
    if (usuario.saldo < totalCompra) {
        alert(`❌ Saldo insuficiente\n\n` +
              `Tu saldo: $${usuario.saldo.toFixed(2)}\n` +
              `Total a pagar: $${totalCompra.toFixed(2)}\n` +
              `Te faltan: $${(totalCompra - usuario.saldo).toFixed(2)}`);
        return;
    }

    // Confirmar compra
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
            // Actualizar saldo
            usuario.saldo = data.nuevoSaldo;
            localStorage.setItem("usuario", JSON.stringify(usuario));

            alert(
                `🎉 ¡Compra realizada exitosamente!\n\n` +
                `Total pagado: $${data.totalCompra.toFixed(2)}\n` +
                `Nuevo saldo: $${data.nuevoSaldo.toFixed(2)}`
            );

            // Actualizar UI
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

// -----------------------------------------
// Cargar productos para comprar
// -----------------------------------------
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

        // ✅ Evento agregar - verificará login al hacer clic
        document.querySelectorAll(".btn-comprar").forEach(btn => {
            btn.addEventListener("click", () => {
                const producto = {
                    id_producto: Number(btn.dataset.id),
                    nombre: btn.dataset.nombre,
                    precio: Number(btn.dataset.precio),
                    imagen: btn.dataset.imagen
                };
                agregarAlCarrito(producto); // Esta función ya verifica login
            });
        });

    } catch (err) {
        console.error("Error cargando productos:", err);
    }
}

// -----------------------------------------
// PERFIL
// -----------------------------------------
async function cargarDatosPerfil() {
    try {
        const res = await fetch(`${API_URL}/usuario/perfil`, {
            credentials: "include"
        });

        const user = await res.json();

        document.getElementById("edit-nombre").value = user.nombre;
        document.getElementById("edit-email").value = user.email;
        // Foto de perfil
        document.getElementById("perfil-foto").src =
    user.imagen ? `data:image/jpeg;base64,${user.imagen}` : "default.png";


        const img = document.getElementById("perfil-img");
        if (img && user.imagenBase64) {
            img.src = `data:image/png;base64,${user.imagenBase64}`;
        }

    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}

document.getElementById("edit-imagen")?.addEventListener("change", function () {
    const file = this.files[0];
    const preview = document.getElementById("preview-img");

    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }
});

document.getElementById("btn-editar")?.addEventListener("click", () => {
    const modal = document.getElementById("modal-editar");
    modal?.showModal();
});

document.querySelectorAll("[data-close='modal-editar']").forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById("modal-editar").close();
    });
});

document.getElementById("editarForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const user = JSON.parse(localStorage.getItem("usuario"));
    formData.append("id_usuario", user.id_usuario);

    try {
        const res = await fetch(`${API_URL}/api/usuario/editar`, {
            method: "PUT",
            body: formData,
            credentials: "include"
        });

        if (!res.ok) {
            alert("Error actualizando perfil");
            return;
        }

        alert("✔ Perfil actualizado correctamente");

        user.nombre = formData.get("nombre");
        user.email = formData.get("email");

        localStorage.setItem("usuario", JSON.stringify(user));

        location.reload();

    } catch (err) {
        console.error("Error actualizando perfil:", err);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("inventario.html")) {
        const user = JSON.parse(localStorage.getItem("usuario"));

        if (!user) {
            if (confirm("⚠️ Debes iniciar sesión para acceder al inventario.\n\n¿Deseas iniciar sesión ahora?")) {
                window.location.href = "index.html";
            } else {
                window.location.href = "index.html";
            }
            return;
        }

        if (user.rol !== "admin") {
            alert("❌ No tienes permisos para acceder al inventario");
            window.location.href = "index.html";
            return;
        }
    }
});

// -----------------------------------------
// INICIO GLOBAL (UN SOLO DOMContentLoaded)
// -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {

    ["modal-login", "modal-registro", "add-producto", "edit-producto", "modal-editar", "modal-carrito"]
        .forEach(id => {
            const modal = document.getElementById(id);
            if (modal) activarCerrarModalFuera(modal);
        });

    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioLocal) mostrarUsuario(usuarioLocal);

    verificarSesion();

    cargarProductos();
    cargarProductosParaComprar();

    actualizarCantidadCarrito();
    mostrarCarrito();

    // botón carrito
    const carritoBtn = document.querySelector("[data-open='modal-carrito']");
    carritoBtn?.addEventListener("click", () => {
        mostrarCarrito();
        document.getElementById("modal-carrito").showModal();
    });

    // Perfil
    if (window.location.pathname.includes("perfil.html")) {
        const user = JSON.parse(localStorage.getItem("usuario"));

        if (!user) return window.location.href = "index.html";

        document.getElementById("perfil-nombre").textContent = user.nombre;
        document.getElementById("perfil-email").innerHTML =
            `<i class="fas fa-envelope front-icons"></i> ${user.email}`;
        document.getElementById("perfil-rol").innerHTML =
            `<b>Rol:</b> ${user.rol}`;

        cargarDatosPerfil();

        const modal = document.getElementById("perfilModal");
        modal && new bootstrap.Modal(modal).show();
    }


});
// -----------------------------------------
// ✅ ADMIN: Cargar usuarios (CORREGIDO)
// -----------------------------------------
async function cargarUsuariosAdmin() {
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        
        if (!res.ok) {
            console.error("Error en la respuesta:", res.status);
            return;
        }

        const data = await res.json();
        const tbody = document.getElementById("tablaUsuarios");
        
        if (!tbody) return;

        tbody.innerHTML = "";

        data.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.id_usuario}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td>${u.rol}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

// ✅ Eliminar usuario (CORREGIDO)
async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/eliminar/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            alert("Error eliminando usuario");
            return;
        }

        alert("✅ Usuario eliminado");
        cargarUsuariosAdmin();

    } catch (err) {
        console.error("Error eliminando usuario:", err);
    }
}

// -----------------------------------------
// BOTÓN ADMINISTRAR USUARIOS
// -----------------------------------------
document.querySelector('[data-open="modal-usuario"]')?.addEventListener("click", () => {
    cargarUsuariosAdmin();
    document.getElementById("modal-usuarios")?.showModal();
});

// -----------------------------------------
// CARRITO - FUNCIONES FALTANTES
// -----------------------------------------

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

// ✅ FUNCIÓN FALTANTE: agregarAlCarrito
function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id_producto === producto.id_producto);

    if (existe) {
        existe.cantidad++;
    } else {
        // ✅ Solo guardamos lo necesario + imagen para MOSTRAR
        carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen // Solo para mostrar en el carrito
        });
    }

    guardarCarrito();
    alert(`✅ ${producto.nombre} agregado al carrito`);
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
// -----------------------------------------
// Cambiar cantidad
// -----------------------------------------
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

// Exportar funciones globales para onclick
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.eliminarUsuario = eliminarUsuario;

// -----------------------------------------
// CARGAR DATOS DEL PERFIL AL CARGAR PÁGINA
// -----------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Verificar si hay usuario logueado
    const user = JSON.parse(localStorage.getItem("usuario"));

    if (!user) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    // 2. Mostrar datos básicos desde localStorage
    document.getElementById("perfil-nombre").textContent = user.nombre;
    document.getElementById("perfil-email").textContent = user.email;
    document.getElementById("perfil-rol").textContent = user.rol;

    // 3. Cargar datos completos del servidor (incluyendo imagen)
    await cargarDatosCompletos(user.id_usuario);

    // 4. Configurar botón "Administrar usuarios" (solo admin)
    const btnAdminUsuarios = document.querySelector('[data-open="modal-usuario"]');
    if (user.rol === "admin" && btnAdminUsuarios) {
        btnAdminUsuarios.classList.remove("d-none");
        btnAdminUsuarios.addEventListener("click", () => {
            cargarUsuariosAdmin();
            document.getElementById("modal-usuarios")?.showModal();
        });
    } else if (btnAdminUsuarios) {
        btnAdminUsuarios.style.display = "none";
    }

    // 5. Configurar botón "Editar perfil"
    document.getElementById("btn-editar")?.addEventListener("click", () => {
        prepararFormularioEdicion(user);
        document.getElementById("modal-editar")?.showModal();
    });

    // 6. Preview de imagen al seleccionar archivo
    document.getElementById("edit-imagen")?.addEventListener("change", function() {
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

    // 7. Enviar formulario de edición
    document.getElementById("editarForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await actualizarPerfil(e.target, user);
    });
});

// -----------------------------------------
// FUNCIÓN: Cargar datos completos del servidor
// -----------------------------------------
async function cargarDatosCompletos(id_usuario) {
    try {
        const res = await fetch(`${API_URL}/api/usuario/perfil/${id_usuario}`);
        
        if (!res.ok) {
            console.error("Error cargando perfil completo");
            return;
        }

        const data = await res.json();
        
        if (data.success && data.usuario) {
            const usuario = data.usuario;

            // Actualizar foto de perfil
            const perfilFoto = document.getElementById("perfil-foto");
            if (perfilFoto) {
                if (usuario.imagen) {
                    perfilFoto.src = `data:image/jpeg;base64,${usuario.imagen}`;
                    perfilFoto.onerror = () => {
                        console.error("Error cargando imagen");
                        perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                    };
                } else {
                    perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                }
            }
        }

    } catch (err) {
        console.error("Error al cargar datos completos:", err);
    }
}

// -----------------------------------------
// FUNCIÓN: Preparar formulario de edición
// -----------------------------------------
function prepararFormularioEdicion(user) {
    document.getElementById("edit-nombre").value = user.nombre;
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-password").value = "";
    
    const preview = document.getElementById("preview-img");
    if (preview) {
        preview.style.display = "none";
    }
}

// -----------------------------------------
// FUNCIÓN: Actualizar perfil
// -----------------------------------------
async function actualizarPerfil(form, user) {
    const formData = new FormData(form);
    formData.append("id_usuario", user.id_usuario);

    try {
        const res = await fetch(`${API_URL}/api/usuario/editar`, {
            method: "PUT",
            body: formData
        });

        if (!res.ok) {
            alert("❌ Error actualizando perfil");
            return;
        }

        const data = await res.json();

        if (data.success) {
            alert("✅ Perfil actualizado correctamente");

            // Actualizar localStorage
            const usuarioActualizado = {
                id_usuario: user.id_usuario,
                nombre: formData.get("nombre"),
                email: formData.get("email"),
                rol: user.rol
            };

            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

            // Recargar página
            location.reload();
        } else {
            alert("❌ Error: " + (data.message || "Error desconocido"));
        }

    } catch (err) {
        console.error("Error actualizando perfil:", err);
        alert("❌ Error de conexión");
    }
}

// -----------------------------------------
// FUNCIÓN: Cargar usuarios (ADMIN)
// -----------------------------------------
async function cargarUsuariosAdmin() {
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        
        if (!res.ok) {
            console.error("Error cargando usuarios");
            return;
        }

        const usuarios = await res.json();
        const tbody = document.getElementById("tablaUsuarios");
        
        if (!tbody) return;

        tbody.innerHTML = "";

        usuarios.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.id_usuario}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td><span class="badge bg-${u.rol === 'admin' ? 'danger' : 'primary'}">${u.rol}</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">
                            🗑️ Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

// -----------------------------------------
// FUNCIÓN: Eliminar usuario (ADMIN)
// -----------------------------------------
async function eliminarUsuario(id) {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar este usuario?")) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/eliminar/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            alert("❌ Error eliminando usuario");
            return;
        }

        alert("✅ Usuario eliminado correctamente");
        cargarUsuariosAdmin();

    } catch (err) {
        console.error("Error eliminando usuario:", err);
        alert("❌ Error de conexión");
    }
}

// -----------------------------------------
// CERRAR MODALES AL HACER CLIC FUERA
// -----------------------------------------
document.getElementById("modal-editar")?.addEventListener("click", function(e) {
    if (e.target === this) this.close();
});

document.getElementById("modal-usuarios")?.addEventListener("click", function(e) {
    if (e.target === this) this.close();
});

// Exportar funciones globales
window.eliminarUsuario = eliminarUsuario;

// -----------------------------------------
// INICIALIZACIÓN
// -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    
    // Cargar productos si estamos en compra.html
    if (window.location.pathname.includes("compra.html")) {
        cargarProductosParaComprar();
    }
    
    // Actualizar badge del carrito
    actualizarCantidadCarrito();
    
    // Botón para abrir carrito
    const btnCarrito = document.querySelector('[data-open="modal-carrito"]');
    btnCarrito?.addEventListener("click", () => {
        mostrarCarrito();
        document.getElementById("modal-carrito")?.showModal();
    });
    
    // Botón para confirmar compra
    const btnPagar = document.getElementById("btnPagar");
    btnPagar?.addEventListener("click", confirmarCompra);
});

document.getElementById("formRecargarSaldo")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id_usuario = document.getElementById("recargar-id").value;
  const monto = document.getElementById("recargar-monto").value;

  const nuevoSaldo = await recargarSaldo(id_usuario, monto);

  if (nuevoSaldo) {
    e.target.reset();
    document.getElementById("modal-recargar-saldo")?.close();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
    
    const user = JSON.parse(localStorage.getItem("usuario"));

    if (!user) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    // Mostrar datos básicos
    document.getElementById("perfil-nombre").textContent = user.nombre;
    document.getElementById("perfil-email").textContent = user.email;
    document.getElementById("perfil-rol").textContent = user.rol;
    
    // ✅ Mostrar saldo (para todos)
    document.getElementById("perfil-saldo").textContent = 
        `$${parseFloat(user.saldo || 0).toFixed(2)}`;

    // Cargar datos completos del servidor
    await cargarDatosCompletos(user.id_usuario);

    // Mostrar botones de admin si aplica
    if (user.rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => {
            el.classList.remove("d-none");
        });
    }

    // Configurar botones
    document.getElementById("btn-editar")?.addEventListener("click", () => {
        prepararFormularioEdicion(user);
        document.getElementById("modal-editar")?.showModal();
    });

    // Preview de imagen
    document.getElementById("edit-imagen")?.addEventListener("change", function() {
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

    // Form de edición
    document.getElementById("editarForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await actualizarPerfil(e.target, user);
    });
});

// ✅ Cargar datos completos (incluye saldo actualizado)
async function cargarDatosCompletos(id_usuario) {
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/perfil/${id_usuario}`);
        
        if (!res.ok) {
            console.error("Error cargando perfil completo");
            return;
        }

        const data = await res.json();
        
        if (data.success && data.usuario) {
            const usuario = data.usuario;

            // Actualizar foto
            const perfilFoto = document.getElementById("perfil-foto");
            if (perfilFoto) {
                if (usuario.imagen) {
                    perfilFoto.src = `data:image/jpeg;base64,${usuario.imagen}`;
                    perfilFoto.onerror = () => {
                        perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                    };
                } else {
                    perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                }
            }

            // ✅ Actualizar saldo desde el servidor
            const saldoActualizado = parseFloat(usuario.saldo || 0);
            document.getElementById("perfil-saldo").textContent = 
                `$${saldoActualizado.toFixed(2)}`;

            // Actualizar localStorage
            const userLocal = JSON.parse(localStorage.getItem("usuario"));
            if (userLocal) {
                userLocal.saldo = saldoActualizado;
                localStorage.setItem("usuario", JSON.stringify(userLocal));
            }
        }

    } catch (err) {
        console.error("Error al cargar datos completos:", err);
    }
}

function prepararFormularioEdicion(user) {
    document.getElementById("edit-nombre").value = user.nombre;
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-password").value = "";
    
    const preview = document.getElementById("preview-img");
    if (preview) {
        preview.style.display = "none";
    }
}

async function actualizarPerfil(form, user) {
    const API_URL = "https://panaderia-navidad.onrender.com";
    const formData = new FormData(form);
    formData.append("id_usuario", user.id_usuario);

    try {
        const res = await fetch(`${API_URL}/api/usuario/editar`, {
            method: "PUT",
            body: formData
        });

        if (!res.ok) {
            alert("❌ Error actualizando perfil");
            return;
        }

        const data = await res.json();

        if (data.success) {
            alert("✅ Perfil actualizado correctamente");

            const usuarioActualizado = {
                id_usuario: user.id_usuario,
                nombre: formData.get("nombre"),
                email: formData.get("email"),
                rol: user.rol,
                saldo: user.saldo // Mantener el saldo
            };

            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
            location.reload();
        }

    } catch (err) {
        console.error("Error actualizando perfil:", err);
        alert("❌ Error de conexión");
    }
}

document.querySelector('[data-open="modal-recargar-saldo"]')?.addEventListener("click", async () => {
    await cargarUsuariosParaRecarga();
});

// ✅ Cargar lista de usuarios
async function cargarUsuariosParaRecarga() {
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        const usuarios = await res.json();

        const tbody = document.getElementById("tablaUsuariosRecarga");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>
                    <span class="badge bg-${u.saldo > 100 ? 'success' : 'warning'}">
                        $${parseFloat(u.saldo || 0).toFixed(2)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="seleccionarUsuario(${u.id_usuario}, '${u.nombre}', ${u.saldo || 0})">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

// ✅ Seleccionar usuario para recarga
function seleccionarUsuario(id, nombre, saldo) {
    document.getElementById("recargar-id").value = id;
    document.getElementById("recargar-nombre").value = nombre;
    document.getElementById("recargar-saldo-actual").value = `$${parseFloat(saldo).toFixed(2)}`;
    document.getElementById("recargar-monto").focus();
}

// ✅ Procesar recarga
document.getElementById("formRecargarSaldo")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const admin = JSON.parse(localStorage.getItem("usuario"));
    
    if (!admin || admin.rol !== 'admin') {
        alert("❌ No tienes permisos para recargar saldo");
        return;
    }

    const id_usuario = document.getElementById("recargar-id").value;
    const monto = parseFloat(document.getElementById("recargar-monto").value);
    const nombre = document.getElementById("recargar-nombre").value;
    const saldoActual = document.getElementById("recargar-saldo-actual").value;

    const confirmar = confirm(
        `¿Confirmar recarga?\n\n` +
        `Usuario: ${nombre}\n` +
        `Saldo actual: ${saldoActual}\n` +
        `Monto a recargar: $${monto.toFixed(2)}\n` +
        `Nuevo saldo: $${(parseFloat(saldoActual.replace('$', '')) + monto).toFixed(2)}`
    );

    if (!confirmar) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/recargar-saldo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario: parseInt(id_usuario),
                monto: monto,
                id_admin: admin.id_usuario
            })
        });

        const data = await res.json();

        if (data.success) {
            alert(`✅ Recarga exitosa\n\nNuevo saldo de ${nombre}: $${data.nuevoSaldo.toFixed(2)}`);
            
            // Recargar tabla de usuarios
            await cargarUsuariosParaRecarga();
            
            // Limpiar formulario
            e.target.reset();
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        console.error("Error recargando saldo:", err);
        alert("❌ Error de conexión");
    }
});

document.addEventListener("DOMContentLoaded", () => {

    // Cerrar modales con clic fuera
    ["modal-login", "modal-registro", "add-producto", "edit-producto", "modal-editar", "modal-carrito"]
        .forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) modal.close();
                });
            }
        });

    // ✅ Mostrar usuario SI existe (sin mensajes molestos)
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioLocal) {
        mostrarUsuario(usuarioLocal);
    }

    // Cargar productos SIEMPRE (no requiere login para ver)
    if (window.location.pathname.includes("compra.html")) {
        cargarProductosParaComprar();
    }

    if (window.location.pathname.includes("inventario.html")) {
        cargarProductos();
    }

    // Actualizar carrito
    actualizarCantidadCarrito();

    // Botón abrir carrito
    const carritoBtn = document.querySelector('[data-open="modal-carrito"]');
    carritoBtn?.addEventListener("click", () => {
        mostrarCarrito();
        document.getElementById("modal-carrito")?.showModal();
    });

    // Botón confirmar compra
    const btnPagar = document.getElementById("btnPagar");
    btnPagar?.addEventListener("click", confirmarCompra);
});

// ============================================
// PERFIL.HTML - SCRIPT MEJORADO (agregar al final de perfil.html)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
    
    const user = JSON.parse(localStorage.getItem("usuario"));

    // ✅ Si no hay usuario, preguntar amablemente
    if (!user) {
        const quiereLogin = confirm(
            "👤 Para ver tu perfil necesitas iniciar sesión.\n\n" +
            "¿Deseas iniciar sesión ahora?"
        );
        
        if (quiereLogin) {
            // Redirigir a index y abrir modal automáticamente
            window.location.href = "index.html#login";
        } else {
            window.location.href = "index.html";
        }
        return;
    }

    // ✅ Usuario logueado - continuar normalmente
    document.getElementById("perfil-nombre").textContent = user.nombre;
    document.getElementById("perfil-email").textContent = user.email;
    document.getElementById("perfil-rol").textContent = user.rol;
    
    // Mostrar saldo
    document.getElementById("perfil-saldo").textContent = 
        `$${parseFloat(user.saldo || 0).toFixed(2)}`;

    // Cargar datos completos
    await cargarDatosCompletos(user.id_usuario);

    // Mostrar botones de admin
    if (user.rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => {
            el.classList.remove("d-none");
        });
    }

    // Configurar botones
    configurarEventosPerfil(user);
});

function configurarEventosPerfil(user) {
    // Botón editar
    document.getElementById("btn-editar")?.addEventListener("click", () => {
        prepararFormularioEdicion(user);
        document.getElementById("modal-editar")?.showModal();
    });

    // Preview imagen
    document.getElementById("edit-imagen")?.addEventListener("change", function() {
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

    // Form edición
    document.getElementById("editarForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await actualizarPerfil(e.target, user);
    });

    // Botón administrar usuarios (admin)
    document.querySelector('[data-open="modal-usuarios"]')?.addEventListener("click", async () => {
        await cargarUsuariosAdmin();
        document.getElementById("modal-usuarios")?.showModal();
    });

    // Botón recargar saldo (admin)
    document.querySelector('[data-open="modal-recargar-saldo"]')?.addEventListener("click", async () => {
        await cargarUsuariosParaRecarga();
        document.getElementById("modal-recargar-saldo")?.showModal();
    });
}

async function cargarDatosCompletos(id_usuario) {
    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/perfil/${id_usuario}`);
        
        if (!res.ok) {
            console.error("Error cargando perfil");
            return;
        }

        const data = await res.json();
        
        if (data.success && data.usuario) {
            const usuario = data.usuario;

            // Actualizar foto
            const perfilFoto = document.getElementById("perfil-foto");
            if (perfilFoto) {
                if (usuario.imagen) {
                    perfilFoto.src = `data:image/jpeg;base64,${usuario.imagen}`;
                    perfilFoto.onerror = () => {
                        perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                    };
                } else {
                    perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                }
            }

            // Actualizar saldo
            const saldoActualizado = parseFloat(usuario.saldo || 0);
            document.getElementById("perfil-saldo").textContent = 
                `$${saldoActualizado.toFixed(2)}`;

            // Actualizar localStorage
            const userLocal = JSON.parse(localStorage.getItem("usuario"));
            if (userLocal) {
                userLocal.saldo = saldoActualizado;
                localStorage.setItem("usuario", JSON.stringify(userLocal));
            }
        }

    } catch (err) {
        console.error("Error al cargar datos:", err);
    }
}

function prepararFormularioEdicion(user) {
    document.getElementById("edit-nombre").value = user.nombre;
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-password").value = "";
    
    const preview = document.getElementById("preview-img");
    if (preview) {
        preview.style.display = "none";
    }
}

async function actualizarPerfil(form, user) {
    const API_URL = "https://panaderia-navidad.onrender.com";
    const formData = new FormData(form);
    formData.append("id_usuario", user.id_usuario);

    try {
        const res = await fetch(`${API_URL}/api/usuario/editar`, {
            method: "PUT",
            body: formData
        });

        if (!res.ok) {
            alert("❌ Error actualizando perfil");
            return;
        }

        const data = await res.json();

        if (data.success) {
            alert("✅ Perfil actualizado correctamente");

            const usuarioActualizado = {
                id_usuario: user.id_usuario,
                nombre: formData.get("nombre"),
                email: formData.get("email"),
                rol: user.rol,
                saldo: user.saldo
            };

            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
            location.reload();
        }

    } catch (err) {
        console.error("Error actualizando perfil:", err);
        alert("❌ Error de conexión");
    }
}

// Funciones de admin (cargar usuarios, recargar saldo, etc.)
async function cargarUsuariosAdmin() {
    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        const usuarios = await res.json();

        const tbody = document.getElementById("tablaUsuarios");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td><span class="badge bg-${u.rol === 'admin' ? 'danger' : 'primary'}">${u.rol}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

async function cargarUsuariosParaRecarga() {
    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        const usuarios = await res.json();

        const tbody = document.getElementById("tablaUsuariosRecarga");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>
                    <span class="badge bg-${u.saldo > 100 ? 'success' : 'warning'}">
                        $${parseFloat(u.saldo || 0).toFixed(2)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="seleccionarUsuario(${u.id_usuario}, '${u.nombre}', ${u.saldo || 0})">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

window.seleccionarUsuario = function(id, nombre, saldo) {
    document.getElementById("recargar-id").value = id;
    document.getElementById("recargar-nombre").value = nombre;
    document.getElementById("recargar-saldo-actual").value = `$${parseFloat(saldo).toFixed(2)}`;
    document.getElementById("recargar-monto").focus();
};

window.eliminarUsuario = async function(id) {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar este usuario?")) return;

    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/eliminar/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            alert("❌ Error eliminando usuario");
            return;
        }

        alert("✅ Usuario eliminado");
        await cargarUsuariosAdmin();

    } catch (err) {
        console.error("Error eliminando usuario:", err);
        alert("❌ Error de conexión");
    }
};

// Form recarga saldo
document.getElementById("formRecargarSaldo")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const API_URL = "https://panaderia-navidad.onrender.com";
    const admin = JSON.parse(localStorage.getItem("usuario"));
    
    if (!admin || admin.rol !== 'admin') {
        alert("❌ No tienes permisos");
        return;
    }

    const id_usuario = parseInt(document.getElementById("recargar-id").value);
    const monto = parseFloat(document.getElementById("recargar-monto").value);
    const nombre = document.getElementById("recargar-nombre").value;

    try {
        const res = await fetch(`${API_URL}/api/usuario/recargar-saldo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario,
                monto,
                id_admin: admin.id_usuario
            })
        });

        const data = await res.json();

        if (data.success) {
            alert(`✅ Recarga exitosa\n\nNuevo saldo de ${nombre}: $${data.nuevoSaldo.toFixed(2)}`);
            await cargarUsuariosParaRecarga();
            e.target.reset();
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Verificar si viene con el hash #login
    if (window.location.hash === "#login") {
        setTimeout(() => {
            const loginModal = document.getElementById("modal-login");
            if (loginModal) {
                loginModal.showModal();
                // Limpiar el hash
                history.replaceState(null, null, ' ');
            }
        }, 300);
    }
});

// ==============================================
// EXPORTAR FUNCIONES GLOBALES
// ==============================================
window.requiereLogin = requiereLogin;
window.verificarSesionSilenciosa = verificarSesionSilenciosa;