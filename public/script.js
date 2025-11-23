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

    if (!loginBtn || !registroBtn || !usuarioDiv || !usuarioNombre || !logoutBtn) {
        console.warn("⚠ Faltan elementos del navbar en el HTML");
        return;
    }

    loginBtn.classList.add("d-none");
    registroBtn.classList.add("d-none");

    usuarioNombre.textContent = nombre;
    usuarioDiv.classList.remove("d-none");
    logoutBtn.classList.remove("d-none");
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
    document.getElementById("nav-logout").classList.add("d-none");

    alert("Sesión cerrada");
});

/* auth.js
   Simple client-side session manager using localStorage.
   - Stores a small `pn_user` object when login/registro forms submit
   - Shows a "Cerrar sesión" button in the navbar when logged in
   - Hides the "Inicio de sesión" / "Registrar" buttons when logged in
*/
(function(){
  const LS_KEY = 'pn_user';

  function getUser(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)); }catch(e){ return null; }
  }
  function setUser(user){ localStorage.setItem(LS_KEY, JSON.stringify(user)); }
  function clearUser(){ localStorage.removeItem(LS_KEY); }

  function createLogoutButton(){
    const nav = document.querySelector('.navbar-nav');
    if(!nav) return null;
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.id = 'nav-logout-li';
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-light ms-2';
    btn.id = 'btn-logout';
    btn.type = 'button';
    btn.textContent = 'Cerrar sesión';
    btn.addEventListener('click', () => {
      clearUser();
      updateNav();
      location.reload();
    });
    li.appendChild(btn);
    return li;
  }

  function updateNav(){
    const user = getUser();
    // toggle open buttons (those that use data-open="...")
    document.querySelectorAll('[data-open]').forEach(el => {
      el.style.display = user ? 'none' : '';
    });

    const existing = document.getElementById('nav-logout-li');
    if(user){
      if(!existing){
        const nav = document.querySelector('.navbar-nav');
        const logoutLi = createLogoutButton();
        if(nav && logoutLi) nav.appendChild(logoutLi);
      }
    } else {
      if(existing) existing.remove();
    }
  }

  function onLoginSubmit(e){
    e.preventDefault();
    const form = e.target;
    const email = (form.querySelector('[name="email"]') || {}).value || '';
    const nombre = email.split('@')[0] || '';
    const user = { email, nombre, rol: 'cliente' };
    setUser(user);
    try{ cerrarModalConAnimacion(document.getElementById('modal-login')); }catch(err){}
    updateNav();
  }

  function onRegistroSubmit(e){
    e.preventDefault();
    const form = e.target;
    const nombre = (form.querySelector('[name="nombre"]') || {}).value || '';
    const email = (form.querySelector('[name="email"]') || {}).value || '';
    const rol = (form.querySelector('[name="rol"]') || {}).value || 'cliente';
    const user = { email, nombre: nombre || email.split('@')[0] || '', rol };
    setUser(user);
    try{ cerrarModalConAnimacion(document.getElementById('modal-registro')); }catch(err){}
    updateNav();
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    const loginForm = document.getElementById('loginForm');
    if(loginForm) loginForm.addEventListener('submit', onLoginSubmit);
    const registroForm = document.getElementById('registroForm');
    if(registroForm) registroForm.addEventListener('submit', onRegistroSubmit);
  });

  window.pnAuth = { getUser, setUser, clearUser, updateNav };
})();
