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
    const { nombre, rol } = usuario;

    document.getElementById("nav-login-btn")?.classList.add("d-none");
    document.getElementById("nav-registro-btn")?.classList.add("d-none");

    document.getElementById("nav-usuario-nombre").textContent = nombre;
    document.getElementById("nav-usuario").classList.remove("d-none");
    document.getElementById("nav-logout").classList.remove("d-none");

    if (rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => el.classList.remove("d-none"));
    }

    document.getElementById("nav-carrito-btn").classList.remove("d-none");
actualizarCarritoNav();

}


// -----------------------------------------
// LOGOUT
// -----------------------------------------
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    location.reload();
});


// -----------------------------------------
// CARGAR PRODUCTOS
// -----------------------------------------
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
                    <button class="editar" data-id="${p.id_producto}">✏ Editar</button>
                    <button class="eliminar" data-id="${p.id_producto}">🗑 Eliminar</button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
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


// -----------------------------------------
// INICIO DE LA PÁGINA
// -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    ["modal-login", "modal-registro", "add-producto", "edit-producto"].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) activarCerrarModalFuera(modal);
    });

    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioLocal) mostrarUsuario(usuarioLocal);

    verificarSesion();
    cargarProductos();
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

        // Guardar usuario en localStorage
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // Mostrar en navbar
        mostrarUsuario(data.usuario);

        // Cerrar modal
        const modal = document.getElementById("modal-login");
        if (modal) modal.close();

        return true;

    } catch (err) {
        console.error("Error en login:", err);
        document.getElementById("login-error").textContent =
            "Error de conexión con el servidor";
        return false;
    }
}

// -----------------------------------------
// BOTÓN DE CARRITO EN NAV
// -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const carritoBtn = document.querySelector("[data-open='modal-carrito']");
    if (carritoBtn) {
        carritoBtn.addEventListener("click", () => {
            cargarCarritoEnModal();
            document.getElementById("modal-carrito").showModal();
        });
    }
});

// -----------------------------------------
// AGREGAR PRODUCTO AL CARRITO
// -----------------------------------------
document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("btn-comprar")) return;

    const id_producto = parseInt(e.target.dataset.id);
    const precio = parseFloat(e.target.dataset.precio);
    const nombre = e.target.dataset.nombre;
    const imagen = e.target.dataset.imagen || `${API_URL}/img/default-producto.jpg`;

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const existe = carrito.find(item => item.id_producto === id_producto);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({
            id_producto,
            precio,
            cantidad: 1,
            nombre,
            imagen
        });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarritoNav();
    alert("Producto añadido al carrito 🛒");
});

// -----------------------------------------
// ACTUALIZAR ICONO CANTIDAD EN NAV
// -----------------------------------------
function actualizarCarritoNav() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const span = document.getElementById("carrito-cantidad");
    if (span) span.textContent = carrito.length;
}

// -----------------------------------------
// CARGAR CARRITO EN MODAL
// -----------------------------------------
function cargarCarritoEnModal() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const tbody = document.getElementById("tbodyCarrito");
    const totalSpan = document.getElementById("totalCarrito");

    tbody.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        tbody.innerHTML += `
            <tr>
                <td>${item.id_producto}</td>
                <td><img src="${item.imagen}" width="60"></td>
                <td>${item.nombre}</td>
                <td>$${item.precio}</td>
                <td>${item.cantidad}</td>
                <td>$${subtotal.toFixed(2)}</td>
                <td><button class="btn btn-danger eliminar-carrito" data-id="${item.id_producto}">X</button></td>
            </tr>
        `;
    });

    totalSpan.textContent = total.toFixed(2);
}

// -----------------------------------------
// ELIMINAR PRODUCTO DEL CARRITO
// -----------------------------------------
document.addEventListener("click", e => {
    if (!e.target.classList.contains("eliminar-carrito")) return;

    const id = parseInt(e.target.dataset.id);
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    carrito = carrito.filter(p => p.id_producto !== id);

    localStorage.setItem("carrito", JSON.stringify(carrito));

    cargarCarritoEnModal();
    actualizarCarritoNav();
});

// -----------------------------------------
// CONFIRMAR COMPRA
// -----------------------------------------
document.getElementById("btnPagar")?.addEventListener("click", async () => {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (!usuario) return alert("Debes iniciar sesión.");
    if (carrito.length === 0) return alert("Tu carrito está vacío.");

    const res = await fetch(`${API_URL}/api/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id_usuario: usuario.id_usuario,
            carrito
        })
    });

    const data = await res.json();

    if (data.success) {
        alert("Compra realizada exitosamente 🎉");
        localStorage.removeItem("carrito");
        cargarCarritoEnModal();
        actualizarCarritoNav();
    } else {
        alert("Error al realizar la compra");
    }
});
