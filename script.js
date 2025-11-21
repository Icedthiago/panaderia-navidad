/*const btnAbrirModal = document.querySelector('#btn-abrir-modal');
const btnCerrarModal = document.querySelector('#btn-cerrar-modal');
const modal = document.querySelector('#modal');

btnAbrirModal.addEventListener('click', () => {
  modal.showModal();
});

btnCerrarModal.addEventListener('click', () => {
  modal.close();
});*/


document.getElementById("registroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre: document.getElementById("reg-nombre").value,
    email: document.getElementById("reg-email").value,
    password: document.getElementById("reg-password").value,
    rol: document.getElementById("reg-rol").value
  };

  const res = await fetch("https://tu-api/render.com/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });

  const data = await res.json();

  alert(data.message);  // 👈 muestra éxito o error
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    email: document.getElementById("login-email").value,
    password: document.getElementById("login-password").value
  };

  const res = await fetch("https://tu-api/render.com/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });

  const data = await res.json();

  alert(data.message);  // 👈 "Inicio exitoso" o "Contraseña incorrecta"

  if (data.success) {
    // redirigir, abrir modal, etc.
  }
});
