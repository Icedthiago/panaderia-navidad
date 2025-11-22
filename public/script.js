//Script.js

// URL del backend en Render
const API_URL = "https://panaderia-navidad.onrender.com";

// ---------------- REGISTRO ----------------
document.getElementById("registroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre: document.getElementById("reg-nombre").value,
    email: document.getElementById("reg-email").value,
    password: document.getElementById("reg-password").value,
    rol: document.getElementById("reg-rol").value
  };

  try {
    const res = await fetch(`${API_URL}/api/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (res.ok) {
      alert("✔ Usuario registrado correctamente");
      document.getElementById("registroForm").reset();

      // OPCIONAL: login automático
      await loginAutomatico(datos.email, datos.password);

    } else {
      alert("❌ " + data.message);
    }

  } catch (err) {
    alert("Error de conexión con el servidor");
    console.error(err);
  }
});

// ------------ LOGIN AUTOMÁTICO ------------
async function loginAutomatico(email, password) {
  const datos = { email, password };

  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });

  const data = await res.json();

  if (res.ok) {
    alert("🎉 Sesión iniciada automáticamente como: " + data.usuario.nombre);
  } else {
    alert("No se pudo iniciar sesión automáticamente");
  }
}

document.getElementById("registroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const rol = document.getElementById("reg-rol").value;

  const errorMsg = document.getElementById("msg-error");
  errorMsg.textContent = ""; // limpiar errores

  // -------------------------------------
  // VALIDACIONES
  // -------------------------------------

  // 1. Nombre
  if (nombre.length < 3) {
    errorMsg.textContent = "El nombre debe tener al menos 3 caracteres";
    return;
  }

  // 2. Email válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorMsg.textContent = "Ingresa un email válido";
    return;
  }

  // 3. Password mínimo 6 caracteres
  if (password.length < 6) {
    errorMsg.textContent = "La contraseña debe tener mínimo 6 caracteres";
    return;
  }

  // 4. Rol válido
  if (!["admin", "cliente"].includes(rol)) {
    errorMsg.textContent = "Rol inválido";
    return;
  }

  // -------------------------------------
  // SI LAS VALIDACIONES PASAN → ENVIAR AL SERVIDOR
  // -------------------------------------
  const datos = { nombre, email, password, rol };

  try {
    const res = await fetch("https://panaderia-navidad.onrender.com/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (data.success) {
      alert("✔ Usuario registrado correctamente");
      document.getElementById("registroForm").reset();  
    } else {
      errorMsg.textContent = "❌ " + data.message;
    }

  } catch (err) {
    console.error(err);
    errorMsg.textContent = "❌ Error al conectar con el servidor";
  }
});

// ---------- VALIDACIÓN DE INICIO DE SESIÓN ---------- //
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const error = document.getElementById("login-error");

  // Reset mensaje
  error.textContent = "";

  // Validaciones básicas
  if (!email) {
    error.textContent = "El correo es obligatorio";
    return;
  }

  if (!email.includes("@")) {
    error.textContent = "Correo inválido";
    return;
  }

  if (password.length < 6) {
    error.textContent = "La contraseña debe tener al menos 6 caracteres";
    return;
  }

  // Enviar al backend
  try {
    const res = await fetch("https://panaderia-navidad.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("LOGIN:", data);

    if (!data.success) {
      error.textContent = data.message || "Credenciales incorrectas";
      return;
    }

    // Login correcto → cerrar modal o redirigir
    alert("Inicio de sesión exitoso 🎉");

    // opcional: guardar sesión
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    document.getElementById("loginForm").reset();
    document.getElementById("modal-login").close();

  } catch (err) {
    console.error(err);
    error.textContent = "Error de conexión con el servidor";
  }
});