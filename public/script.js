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
};


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