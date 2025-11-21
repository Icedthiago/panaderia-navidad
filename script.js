const API_URL = "https://dpg-d4fve0efu37c739k38m0-a.oregon-postgres.render.com"; // <-- PON AQUÍ LA REAL

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
    console.log("Respuesta registro:", data);

    alert(data.message || "Registro completado");
  } catch (err) {
    alert("Error conectando con el servidor");
  }
});


document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    email: document.getElementById("login-email").value,
    password: document.getElementById("login-password").value
  };

  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const data = await res.json();
    console.log("Respuesta login:", data);

    alert(data.message);

    if (data.success) {
      console.log("Bienvenido", data.nombre);
    }
  } catch (err) {
    alert("Error conectando con el servidor");
  }
});
