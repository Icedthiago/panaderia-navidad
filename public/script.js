// -----------------------------------------
// CONFIG
// -----------------------------------------
const API_URL = "https://panaderia-navidad.onrender.com";


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

        if (!res.ok) {
            errorMsg.textContent = data.message;
            return;
        }

        alert("✔ Registro exitoso");

        // Login automático
        await loginAutomatico(email, password);

        document.getElementById("registroForm").reset();
        document.getElementById("modal-registro").close();

    } catch (err) {
        errorMsg.textContent = "Error conectando con el servidor";
    }
});


// -----------------------------------------
// LOGIN AUTOMATICO
// -----------------------------------------
async function loginAutomatico(email, password) {
    await realizarLogin(email, password);
}


// -----------------------------------------
// LOGIN NORMAL
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
// FUNCION REAL LOGIN
// -----------------------------------------
async function realizarLogin(email, password) {
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("LOGIN:", data);

        if (!data.success) {
            document.getElementById("login-error").textContent = data.message;
            return;
        }

        // Guardar sesión
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // Mostrar navbar
        mostrarUsuarioNav(data.usuario.nombre);

        // Cerrar modal
        document.getElementById("loginForm").reset();
        document.getElementById("modal-login").close();

    } catch (err) {
        console.error(err);
        document.getElementById("login-error").textContent = "Error de servidor";
    }
}


// -----------------------------------------
// MOSTRAR USUARIO EN NAVBAR
// -----------------------------------------
function mostrarUsuarioNav(nombre) {
    const loginBtn = document.getElementById("nav-login-btn");
    const registroBtn = document.getElementById("nav-registro-btn");
    const usuarioDiv = document.getElementById("nav-usuario");
    const usuarioNombre = document.getElementById("nav-usuario-nombre");
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutLi = document.getElementById("nav-logout"); // ← AÑADIDO

    if (!loginBtn || !registroBtn || !usuarioDiv || !usuarioNombre || !logoutBtn || !logoutLi) {
        console.warn("⚠ Faltan elementos del navbar en el HTML");
        return;
    }

    loginBtn.classList.add("d-none");
    registroBtn.classList.add("d-none");

    usuarioNombre.textContent = nombre;
    usuarioDiv.classList.remove("d-none");

    // Mostrar el <li> completo del botón
    logoutLi.classList.remove("d-none");
}


// -----------------------------------------
// CARGAR SESIÓN AL ENTRAR
// -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (usuario && usuario.nombre) {
        mostrarUsuarioNav(usuario.nombre);
    }
});


// -----------------------------------------
// LOGOUT
// -----------------------------------------
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");

    document.getElementById("nav-login-btn").classList.remove("d-none");
    document.getElementById("nav-registro-btn").classList.remove("d-none");

    document.getElementById("nav-usuario").classList.add("d-none");
    document.getElementById("nav-logout").classList.add("d-none"); // ← AÑADIDO

    alert("Sesión cerrada");
});

function actualizarOpcionesPorRol() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    const elementosAdmin = document.querySelectorAll(".admin-only");

    if (!usuario || usuario.rol !== "admin") {
        elementosAdmin.forEach(el => el.classList.add("d-none"));
    } else {
        elementosAdmin.forEach(el => el.classList.remove("d-none"));
    }
}

// --------------------------------------
// CARGAR PRODUCTOS EN TABLA
// --------------------------------------
async function cargarProductos() {
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
                    <button class="btn-modal eliminar" data-id="${p.id_producto}">🗑 Eliminar</button>
                </td>
            </tr>
        `;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar: cargar productos y actualizar UI según rol
    cargarProductos().catch(err => console.error('Error cargando productos:', err));
    actualizarOpcionesPorRol();

    document.getElementById("formAgregarProducto")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = document.getElementById("formAgregarProducto");
    const formData = new FormData(form);

    try {
        const response = await fetch("https://panaderia-navidad.onrender.com/api/producto", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        console.log("Respuesta servidor:", data);

        if (data.success) {
            alert("Producto agregado correctamente");
            form.reset();
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("Error en fetch:", err);
    }
});

document.addEventListener("click", async e => {
    if (!e.target.classList.contains("eliminar")) return;

    const id = e.target.dataset.id;

    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    await fetch(`${API_URL}/api/productos/${id}`, { method: "DELETE" });

    cargarProductos();
});
});

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formAgregarProducto");
    if (!form) {
        console.error("ERROR: No se encontró el formulario formAgregarProducto");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const response = await fetch("https://panaderia-navidad.onrender.com/api/producto", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            if (data.success) {
                alert("Producto agregado correctamente");
                form.reset();
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            console.error("Error en fetch:", err);
        }
    });

});
