// =========================================
// CONFIG
// =========================================
const API_URL = "https://panaderia-navidad.onrender.com";


// =========================================
// REGISTRO
// =========================================
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

    try {
        const res = await fetch(`${API_URL}/api/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, password, rol })
        });

        const data = await res.json();

        if (!res.ok) return (errorMsg.textContent = data.message);

        alert("✔ Registro exitoso");

        await loginAutomatico(email, password);

        document.getElementById("registroForm").reset();
        document.getElementById("modal-registro").close();
    } catch {
        errorMsg.textContent = "Error conectando con el servidor";
    }
});


// =========================================
// LOGIN
// =========================================
async function loginAutomatico(email, password) {
    await realizarLogin(email, password);
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const error = document.getElementById("login-error");

    error.textContent = "";

    if (!email) return (error.textContent = "Ingresa tu correo");
    if (!email.includes("@")) return (error.textContent = "Correo inválido");
    if (password.length < 6) return (error.textContent = "Contraseña muy corta");

    await realizarLogin(email, password);
});

async function realizarLogin(email, password) {
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("LOGIN:", data);

        if (!data.success)
            return (document.getElementById("login-error").textContent = data.message);

        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        mostrarUsuarioNav(data.usuario.nombre);

        document.getElementById("loginForm").reset();
        document.getElementById("modal-login").close();
    } catch {
        document.getElementById("login-error").textContent = "Error de servidor";
    }
}


// =========================================
// NAVBAR SESIÓN
// =========================================
function mostrarUsuarioNav(nombre) {
    const loginBtn = document.getElementById("nav-login-btn");
    const registroBtn = document.getElementById("nav-registro-btn");
    const usuarioDiv = document.getElementById("nav-usuario");
    const usuarioNombre = document.getElementById("nav-usuario-nombre");
    const logoutLi = document.getElementById("nav-logout");

    if (!loginBtn || !registroBtn || !usuarioDiv || !usuarioNombre || !logoutLi) {
        console.warn("⚠ Elementos faltantes en el navbar");
        return;
    }

    loginBtn.classList.add("d-none");
    registroBtn.classList.add("d-none");

    usuarioNombre.textContent = nombre;
    usuarioDiv.classList.remove("d-none");
    logoutLi.classList.remove("d-none");
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");

    document.getElementById("nav-login-btn").classList.remove("d-none");
    document.getElementById("nav-registro-btn").classList.remove("d-none");

    document.getElementById("nav-usuario").classList.add("d-none");
    document.getElementById("nav-logout").classList.add("d-none");

    alert("Sesión cerrada");
});


// =========================================
// ROLES
// =========================================
function actualizarOpcionesPorRol() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const elementosAdmin = document.querySelectorAll(".admin-only");

    if (!usuario || usuario.rol !== "admin") {
        elementosAdmin.forEach((el) => el.classList.add("d-none"));
    } else {
        elementosAdmin.forEach((el) => el.classList.remove("d-none"));
    }
}


// =========================================
// PRODUCTOS: CARGAR TABLA
// =========================================
async function cargarProductos() {
    const res = await fetch(`${API_URL}/api/productos`);
    const data = await res.json();

    const tbody = document.getElementById("tbodyProductos");
    tbody.innerHTML = "";

    data.forEach((p) => {
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
                    <button class="btn-modal eliminar" data-id="${p.id_producto}">
                        🗑 Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}


// =========================================
// DOMContentLoaded — SOLO UNO
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    // Mostrar usuario si hay sesión
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario?.nombre) mostrarUsuarioNav(usuario.nombre);

    // Cargar productos
    cargarProductos();
    actualizarOpcionesPorRol();

    // ============================
    // AGREGAR PRODUCTO
    // ============================
    const form = document.getElementById("formAgregarProducto");

    if (!form) {
        console.error("ERROR: No existe formAgregarProducto");
        return;
    }

    form.setAttribute("enctype", "multipart/form-data");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const res = await fetch(`${API_URL}/api/producto`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            console.log("Agregar producto:", data);

            if (data.success) {
                alert("Producto agregado correctamente");
                form.reset();
                cargarProductos();
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error en fetch:", error);
        }
    });

    // ============================
    // ELIMINAR PRODUCTO
    // ============================
    document.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("eliminar")) return;

        const id = e.target.dataset.id;
        if (!confirm("¿Eliminar producto?")) return;

        await fetch(`${API_URL}/api/producto/${id}`, { method: "DELETE" });
        cargarProductos();
    });
});