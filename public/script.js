// -----------------------------------------
// CONFIG
// -----------------------------------------
const API_URL = "https://panaderia-navidad.onrender.com";


// -----------------------------------------
// UTILIDAD: Cerrar modal al hacer clic afuera
// -----------------------------------------
function activarCerrarModalFuera(modal) {
    modal.addEventListener("click", (e) => {
        const dialog = e.target.closest("dialog");
        if (e.target === dialog) dialog.close();
    });
}


// -----------------------------------------
// ABRIR MODALES
// -----------------------------------------
document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open");
        const modal = document.getElementById(id);
        modal.showModal();
    });
});


// -----------------------------------------
// CERRAR MODALES
// -----------------------------------------
document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close");
        const modal = document.getElementById(id);
        modal.close();
    });
});


// -----------------------------------------
// REGISTRO
// -----------------------------------------
document.getElementById("registroForm").addEventListener("submit", async (e) => {
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

    const datos = { nombre, email, password, rol };

    try {
        const res = await fetch(`${API_URL}/api/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        if (!res.ok) return (errorMsg.textContent = data.message);

        alert("✔ Registro exitoso");

        // Login automático
        await realizarLogin(email, password);

        document.getElementById("registroForm").reset();
        document.getElementById("modal-registro").close();

    } catch (err) {
        errorMsg.textContent = "Error conectando con el servidor";
    }
});


// -----------------------------------------
// LOGIN MANUAL
// -----------------------------------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const error = document.getElementById("login-error");

    error.textContent = "";

    if (!email) return error.textContent = "Ingresa tu correo";
    if (!email.includes("@")) return error.textContent = "Correo inválido";
    if (password.length < 6) return error.textContent = "Contraseña muy corta";

    await realizarLogin(email, password);
});


// -----------------------------------------
// FUNCIÓN REAL DE LOGIN
// -----------------------------------------
async function realizarLogin(email, password) {
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!data.success) {
            document.getElementById("login-error").textContent = data.message;
            return;
        }

        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        mostrarUsuarioNav(data.usuario.nombre);
        actualizarOpcionesPorRol();

        document.getElementById("loginForm").reset();
        document.getElementById("modal-login").close();

    } catch (err) {
        document.getElementById("login-error").textContent = "Error de servidor";
    }
}


// -----------------------------------------
// MOSTRAR USUARIO EN NAVBAR
// -----------------------------------------
function mostrarUsuarioNav(nombre) {
    document.getElementById("nav-login-btn").classList.add("d-none");
    document.getElementById("nav-registro-btn").classList.add("d-none");

    document.getElementById("nav-usuario-nombre").textContent = nombre;
    document.getElementById("nav-usuario").classList.remove("d-none");
    document.getElementById("nav-logout").classList.remove("d-none");
}


// -----------------------------------------
// ACTUALIZAR UI POR ROL
// -----------------------------------------
function actualizarOpcionesPorRol() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const adminElements = document.querySelectorAll(".admin-only");

    if (usuario?.rol === "admin") {
        adminElements.forEach(el => el.classList.remove("d-none"));
    } else {
        adminElements.forEach(el => el.classList.add("d-none"));
    }
}


// -----------------------------------------
// LOGOUT
// -----------------------------------------
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");

    document.getElementById("nav-login-btn").classList.remove("d-none");
    document.getElementById("nav-registro-btn").classList.remove("d-none");

    document.getElementById("nav-usuario").classList.add("d-none");
    document.getElementById("nav-logout").classList.add("d-none");

    alert("Sesión cerrada");
});


// -----------------------------------------
// CARGAR PRODUCTOS
// -----------------------------------------
async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/api/productos`);
        const data = await res.json();

        const tbody = document.getElementById("tbodyProductos");
        tbody.innerHTML = "";

        data.forEach(p => {
            let img = p.imagen
                ? `data:image/jpeg;base64,${p.imagen}`
                : "https://via.placeholder.com/60";

            tbody.innerHTML += `
                <tr>
                    <td>${p.id_producto}</td>
                    <td><img src="${img}" width="60"></td>
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
            `;
        });

    } catch (err) {
        console.error("Error cargando productos:", err);
    }
}


// -----------------------------------------
// AGREGAR PRODUCTO
// -----------------------------------------
document.getElementById("formAgregarProducto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = document.getElementById("formAgregarProducto");
    const formData = new FormData(form);

    try {
        const res = await fetch(`${API_URL}/api/producto`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Producto agregado correctamente");
            form.reset();
            document.getElementById("add-producto").close();
            cargarProductos();
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        console.error("Error:", err);
    }
});


// -----------------------------------------
// ELIMINAR PRODUCTO
// -----------------------------------------
document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("eliminar")) return;

    const id = e.target.dataset.id;

    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (data.success || res.ok) {
            alert("Producto eliminado");
            cargarProductos();
        } else {
            alert("Error al eliminar: " + (data.message || data.error || "Error desconocido"));
        }
    } catch (err) {
        console.error("Error eliminando:", err);
        alert("Error de conexión al eliminar");
    }
});


// -----------------------------------------
// AL INICIAR LA PÁGINA
// -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const registrarModales = ["modal-login", "modal-registro", "add-producto"];

    registrarModales.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) activarCerrarModalFuera(modal);
    });

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) mostrarUsuarioNav(usuario.nombre);

    actualizarOpcionesPorRol();
    cargarProductos();
});

// -----------------------------------------
// EDITAR PRODUCTO – ABRIR MODAL CON DATOS
// -----------------------------------------
document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("editar")) return;

    const id = e.target.dataset.id;

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
            console.error("Error al cargar producto:", data);
            alert("Error cargando producto");
            return;
        }

        const p = data.producto;

        document.getElementById("edit-id").value = p.id_producto;
        document.getElementById("edit-nombre").value = p.nombre;
        document.getElementById("edit-descripcion").value = p.descripcion;
        document.getElementById("edit-precio").value = p.precio;
        document.getElementById("edit-stock").value = p.stock;
        document.getElementById("edit-temporada").value = p.temporada;

        document.getElementById("edit-producto").showModal();

    } catch (error) {
        console.error("Error en editar:", error);
        alert("Error de conexión");
    }
});

// -----------------------------------------
// GUARDAR CAMBIOS DEL PRODUCTO
// -----------------------------------------
document.getElementById("formEditarProducto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = document.getElementById("formEditarProducto");
    const formData = new FormData(form);

    const id = document.getElementById("edit-id").value;

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`, {
            method: "PUT",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("✔ Producto actualizado");
            form.reset();
            document.getElementById("edit-producto").close();
            cargarProductos();
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        console.error("Error:", err);
    }
});