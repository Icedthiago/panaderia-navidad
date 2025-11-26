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

            await realizarLogin(email, password);

            registroForm.reset();
            document.getElementById("modal-registro").close();

        } catch (err) {
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

        if (!email) return error.textContent = "Ingresa tu correo";
        if (!email.includes("@")) return error.textContent = "Correo inválido";
        if (password.length < 6) return error.textContent = "Contraseña muy corta";

        await realizarLogin(email, password);
    });
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
const formAgregarProducto = document.getElementById("formAgregarProducto");
if (formAgregarProducto) {
    formAgregarProducto.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formAgregarProducto);

        try {
            const res = await fetch(`${API_URL}/api/producto`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                alert("Producto agregado correctamente");
                formAgregarProducto.reset();
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
const formEditarProducto = document.getElementById("formEditarProducto");
if (formEditarProducto) {
    formEditarProducto.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("edit-id").value;
        const formData = new FormData(formEditarProducto);

        try {
            const res = await fetch(`${API_URL}/api/producto/${id}`, {
                method: "PUT",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                alert("✔ Producto actualizado");
                formEditarProducto.reset();
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

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("usuario"));

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Rellenar la tarjeta con los datos del usuario
  document.querySelector(".front__text-header").textContent = user.nombre;
  document.querySelector(".front__text-para").innerHTML =
      `<i class="fas fa-envelope front-icons"></i> ${user.email}`;

  // Foto de perfil genérica (tu diseño original es una imagen por CSS)
  // Si quieres poner personalizada, aquí se coloca:
  // document.querySelector(".front__face-photo").style.backgroundImage = `url(${RUTA})`;

  // Opcional: si quieres mostrar el rol en la parte trasera:
  const back = document.querySelector(".back");
  const rolTag = document.createElement("p");
  rolTag.style.color = "white";
  rolTag.style.marginTop = "10px";
  rolTag.innerHTML = `<b>Rol:</b> ${user.rol}`;
  back.appendChild(rolTag);
});

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("usuario"));

    const navLoginBtn = document.getElementById("nav-login-btn");
    const navRegistroBtn = document.getElementById("nav-registro-btn");
    const navUsuario = document.getElementById("nav-usuario");
    const navUsuarioNombre = document.getElementById("nav-usuario-nombre");
    const navLogout = document.getElementById("nav-logout");

    if (user) {
        // Ocultar botones login / register
        if (navLoginBtn) navLoginBtn.classList.add("d-none");
        if (navRegistroBtn) navRegistroBtn.classList.add("d-none");

        // Mostrar usuario
        if (navUsuario) navUsuario.classList.remove("d-none");
        if (navLogout) navLogout.classList.remove("d-none");
        if (navUsuarioNombre) navUsuarioNombre.textContent = user.nombre;

        // Mostrar opciones de admin si corresponde
        document.querySelectorAll(".admin-only").forEach(el => {
            if (user.rol === "admin") {
                el.classList.remove("d-none");
            } else {
                el.classList.add("d-none");
            }
        });
    }
});

// ===============================
// VERIFICAR SESIÓN AL CARGAR PÁGINA
// ===============================
async function verificarSesion() {
  try {
    const res = await fetch("/api/session", {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json();

    if (data.loggedIn) {
      // ocultar botones login/registro
      document.getElementById("nav-login-btn").classList.add("d-none");
      document.getElementById("nav-registro-btn").classList.add("d-none");

      // mostrar saludo
      document.getElementById("nav-usuario").classList.remove("d-none");
      document.getElementById("nav-logout").classList.remove("d-none");
      document.getElementById("nav-usuario-nombre").textContent = data.user.nombre;

      // si es admin mostrar botones admin
      if (data.user.rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => el.classList.remove("d-none"));
      }

    } else {
      // sin sesión
      document.getElementById("nav-login-btn").classList.remove("d-none");
      document.getElementById("nav-registro-btn").classList.remove("d-none");
      document.getElementById("nav-usuario").classList.add("d-none");
      document.getElementById("nav-logout").classList.add("d-none");
    }
  } catch (err) {
    console.error("Error al verificar sesión:", err);
  }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", verificarSesion);

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    location.reload();
});

const loginModal = document.getElementById("modal-login");
const registroModal = document.getElementById("modal-registro");

const linkAbrirRegistro = document.getElementById("link-abrir-registro");
const linkAbrirLogin = document.getElementById("link-abrir-login");

if (linkAbrirRegistro && loginModal && registroModal) {
    linkAbrirRegistro.addEventListener("click", e => {
        e.preventDefault();
        loginModal.close();
        registroModal.showModal();
    });
}

if (linkAbrirLogin && loginModal && registroModal) {
    linkAbrirLogin.addEventListener("click", e => {
        e.preventDefault();
        registroModal.close();
        loginModal.showModal();
    });
}

const formAgregar = document.getElementById("formAgregarProducto");

if (formAgregar) {
    formAgregar.addEventListener("submit", async (e) => {
        e.preventDefault();
        subirProducto();
    });
}

const formEditar = document.getElementById("formEditarProducto");

if (formEditar) {
    formEditar.addEventListener("submit", async (e) => {
        e.preventDefault();
        editarProducto();
    });
}
