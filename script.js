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
