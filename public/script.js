// =========================================================
// CONFIGURACIÓN
// =========================================================
const API_URL = "https://panaderia-navidad.onrender.com";


// =========================================================
// UTILIDADES
// =========================================================

// Cerrar modal al hacer clic fuera
function activarCerrarModalFuera(modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.close();
    });
}

// Obtener usuario local
function getUsuario() {
    return JSON.parse(localStorage.getItem("usuario"));
}


// =========================================================
// MANEJO DE MODALES (GENÉRICO)
// =========================================================

// Abrir modal con data-open="idDelModal"
document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = document.getElementById(btn.dataset.open);
        modal?.showModal();
    });
});

// Cerrar modal con data-close="idDelModal"
document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = document.getElementById(btn.dataset.close);
        modal?.close();
    });
});

// Enlaces Login <-> Registro
const loginModal = document.getElementById("modal-login");
const registroModal = document.getElementById("modal-registro");

document.getElementById("link-abrir-registro")?.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal?.close();
    registroModal?.showModal();
});

document.getElementById("link-abrir-login")?.addEventListener("click", (e) => {
    e.preventDefault();
    registroModal?.close();
    loginModal?.showModal();
});


// =========================================================
// AUTENTICACIÓN
// =========================================================

// ----------------
// REALIZAR LOGIN
// ----------------
async function realizarLogin(email, password) {
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Error en inicio de sesión");
            return;
        }

        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        alert("✔ Sesión iniciada correctamente");
        location.reload();

    } catch (err) {
        alert("Error de servidor");
    }
}

// ----------------
// FORM LOGIN
// ----------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email")?.value.trim();
        const pass = document.getElementById("login-password")?.value.trim();
        const error = document.getElementById("login-error");

        error.textContent = "";

        if (!email) return error.textContent = "Ingresa tu correo";
        if (!email.includes("@")) return error.textContent = "Correo inválido";
        if (pass.length < 6) return error.textContent = "Contraseña muy corta";

        await realizarLogin(email, pass);
    });
}

// ----------------
// FORM REGISTRO
// ----------------
const registroForm = document.getElementById("registroForm");
if (registroForm) {
    registroForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("reg-nombre").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();
        const rol = document.getElementById("reg-rol").value;
        const error = document.getElementById("msg-error");

        error.textContent = "";

        if (nombre.length < 3) return error.textContent = "Nombre muy corto";
        if (!email.includes("@")) return error.textContent = "Correo inválido";
        if (password.length < 6) return error.textContent = "La contraseña es muy corta";

        try {
            const res = await fetch(`${API_URL}/api/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, email, password, rol })
            });

            const data = await res.json();

            if (!res.ok) return error.textContent = data.message;

            alert("✔ Registro exitoso");
            await realizarLogin(email, password);

            registroForm.reset();
            registroModal?.close();

        } catch (err) {
            error.textContent = "Error con el servidor";
        }
    });
}


// =========================================================
// NAVBAR (USUARIO LOGUEADO)
// =========================================================

function actualizarNavbar() {
    const usuario = getUsuario();
    const navLogin = document.getElementById("nav-login-btn");
    const navReg = document.getElementById("nav-registro-btn");
    const navUser = document.getElementById("nav-usuario");
    const navName = document.getElementById("nav-usuario-nombre");
    const navLogout = document.getElementById("nav-logout");

    if (!navLogin || !navReg || !navUser || !navName || !navLogout) return;

    if (usuario) {
        navLogin.classList.add("d-none");
        navReg.classList.add("d-none");
        navUser.classList.remove("d-none");
        navLogout.classList.remove("d-none");
        navName.textContent = usuario.nombre;

        document.querySelectorAll(".admin-only").forEach(el =>
            usuario.rol === "admin"
                ? el.classList.remove("d-none")
                : el.classList.add("d-none")
        );

    } else {
        navLogin.classList.remove("d-none");
        navReg.classList.remove("d-none");
        navUser.classList.add("d-none");
        navLogout.classList.add("d-none");
    }
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    location.reload();
});


// =========================================================
// PRODUCTOS (CRUD)
// =========================================================

// ----------------
// CARGAR PRODUCTOS
// ----------------
async function cargarProductos() {
    const tbody = document.getElementById("tbodyProductos");
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/api/productos`);
        const data = await res.json();

        tbody.innerHTML = "";

        data.forEach(p => {
            const img = p.imagen
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
                </tr>`;
        });

    } catch (err) {
        console.error("Error cargando productos:", err);
    }
}

// ----------------
// AGREGAR PRODUCTO
// ----------------
document.getElementById("formAgregarProducto")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
        const res = await fetch(`${API_URL}/api/producto`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Producto agregado");
            form.reset();
            document.getElementById("add-producto")?.close();
            cargarProductos();
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        alert("Error subiendo producto");
    }
});


// ----------------
// ELIMINAR PRODUCTO
// ----------------
document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("eliminar")) return;

    const id = e.target.dataset.id;

    if (!confirm("¿Eliminar este producto?")) return;

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (res.ok || data.success) {
            alert("Producto eliminado");
            cargarProductos();
        }

    } catch (err) {
        alert("Error eliminando producto");
    }
});

// ----------------
// EDITAR PRODUCTO
// ----------------
document.getElementById("formEditarProducto")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-id").value;
    const form = e.target;
    const formData = new FormData(form);

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`, {
            method: "PUT",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Producto actualizado");
            document.getElementById("edit-producto")?.close();
            cargarProductos();
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        alert("Error actualizando producto");
    }
});


// =========================================================
// INICIALIZACIÓN GLOBAL (EN TODAS LAS PÁGINAS)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    actualizarNavbar();

    ["modal-login", "modal-registro", "add-producto", "edit-producto"]
        .forEach(id => {
            const modal = document.getElementById(id);
            if (modal) activarCerrarModalFuera(modal);
        });

    cargarProductos();

    // Si existe tarjeta del usuario, llenarla
    const user = getUsuario();
    if (user && document.querySelector(".front__text-header")) {
        document.querySelector(".front__text-header").textContent = user.nombre;
        document.querySelector(".front__text-para").innerHTML =
            `<i class="fas fa-envelope"></i> ${user.email}`;

        const back = document.querySelector(".back");
        if (back) {
            const rolTag = document.createElement("p");
            rolTag.style.color = "white";
            rolTag.textContent = `Rol: ${user.rol}`;
            back.appendChild(rolTag);
        }
    }
});