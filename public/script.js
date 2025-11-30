// ==============================================
// SCRIPT.JS - VERSIÓN FINAL CONSOLIDADA
// ==============================================

const API_URL = "https://panaderia-navidad.onrender.com";

// ==============================================
// CARRITO (GLOBAL)
// ==============================================
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCantidadCarrito();
}

function actualizarCantidadCarrito() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const elem = document.getElementById("carrito-cantidad");
    if (elem) elem.textContent = total;
}

// ==============================================
// VERIFICACIÓN DE LOGIN (SIN MOLESTAR)
// ==============================================

function requiereLogin(mensaje = "⚠️ Debes iniciar sesión para realizar esta acción") {
    const user = JSON.parse(localStorage.getItem("usuario"));
    
    if (!user) {
        if (confirm(mensaje + "\n\n¿Deseas iniciar sesión ahora?")) {
            const loginModal = document.getElementById("modal-login");
            if (loginModal) loginModal.showModal();
        }
        return false;
    }
    
    return true;
}

// ==============================================
// MOSTRAR USUARIO EN NAVBAR
// ==============================================

function mostrarUsuario(usuario) {
    const { nombre, rol, saldo } = usuario;

    document.getElementById("nav-login-btn")?.classList.add("d-none");
    document.getElementById("nav-registro-btn")?.classList.add("d-none");

    const nombreElem = document.getElementById("nav-usuario-nombre");
    if (nombreElem) nombreElem.textContent = nombre;

    const saldoElem = document.getElementById("nav-usuario-saldo");
    if (saldoElem) saldoElem.textContent = `$${parseFloat(saldo || 0).toFixed(2)}`;

    document.getElementById("nav-usuario")?.classList.remove("d-none");
    document.getElementById("nav-logout")?.classList.remove("d-none");

    if (rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => {
            el.classList.remove("d-none");
        });
    }

    document.getElementById("nav-carrito-btn")?.classList.remove("d-none");
}

// ==============================================
// REGISTRO
// ==============================================

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

            alert("✔ Registro exitoso. Ahora puedes iniciar sesión.");
            registroForm.reset();
            document.getElementById("modal-registro")?.close();
            document.getElementById("modal-login")?.showModal();

        } catch {
            errorMsg.textContent = "Error conectando con el servidor";
        }
    });
}

// ==============================================
// LOGIN
// ==============================================

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

        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!data.success) {
                error.textContent = data.message || "Correo o contraseña incorrectos";
                return;
            }

            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            mostrarUsuario(data.usuario);

            document.getElementById("modal-login")?.close();

            alert(`¡Bienvenido ${data.usuario.nombre}! 💰\n\nTu saldo: $${data.usuario.saldo.toFixed(2)}`);

        } catch (err) {
            console.error("Error en login:", err);
            error.textContent = "Error de conexión con el servidor";
        }
    });
}

// ==============================================
// LOGOUT
// ==============================================

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("carrito");
    location.reload();
});

// ==============================================
// AGREGAR AL CARRITO (CON VERIFICACIÓN)
// ==============================================

function agregarAlCarrito(producto) {
    if (!requiereLogin("⚠️ Debes iniciar sesión para agregar productos al carrito")) {
        return;
    }

    const existe = carrito.find(item => item.id_producto === producto.id_producto);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen
        });
    }

    guardarCarrito();
    alert(`✅ ${producto.nombre} agregado al carrito`);
}

// ==============================================
// MOSTRAR CARRITO
// ==============================================

function mostrarCarrito() {
    const tbody = document.getElementById("tbodyCarrito");
    if (!tbody) return;

    tbody.innerHTML = "";
    let total = 0;

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        tbody.innerHTML += `
            <tr>
                <td>${item.id_producto}</td>
                <td><img src="${item.imagen || 'https://via.placeholder.com/60'}" width="60" 
                         onerror="this.src='https://via.placeholder.com/60'"></td>
                <td>${item.nombre}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="cambiarCantidad(${index}, -1)">−</button>
                    <b style="padding: 0 10px;">${item.cantidad}</b>
                    <button class="btn btn-success btn-sm" onclick="cambiarCantidad(${index}, 1)">+</button>
                </td>
                <td>$${subtotal.toFixed(2)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">🗑️</button></td>
            </tr>
        `;
    });

    const totalElem = document.getElementById("totalCarrito");
    if (totalElem) totalElem.textContent = total.toFixed(2);
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    guardarCarrito();
    mostrarCarrito();
}

function eliminarDelCarrito(index) {
    if (confirm("¿Eliminar este producto?")) {
        carrito.splice(index, 1);
        guardarCarrito();
        mostrarCarrito();
    }
}

// ==============================================
// CONFIRMAR COMPRA
// ==============================================

async function confirmarCompra() {
    if (!requiereLogin("⚠️ Debes iniciar sesión para realizar una compra")) {
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (carrito.length === 0) {
        alert("⚠️ Tu carrito está vacío");
        return;
    }

    const totalCompra = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    if (usuario.saldo < totalCompra) {
        alert(`❌ Saldo insuficiente\n\nSaldo: $${usuario.saldo.toFixed(2)}\nTotal: $${totalCompra.toFixed(2)}\nFaltan: $${(totalCompra - usuario.saldo).toFixed(2)}`);
        return;
    }

    const confirmar = confirm(
        `¿Confirmar compra?\n\n` +
        `Total: $${totalCompra.toFixed(2)}\n` +
        `Saldo actual: $${usuario.saldo.toFixed(2)}\n` +
        `Saldo después: $${(usuario.saldo - totalCompra).toFixed(2)}`
    );

    if (!confirmar) return;

    const carritoParaEnviar = carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.precio
    }));

    try {
        const res = await fetch(`${API_URL}/api/ventas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                carrito: carritoParaEnviar
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            usuario.saldo = data.nuevoSaldo;
            localStorage.setItem("usuario", JSON.stringify(usuario));

            alert(`🎉 ¡Compra exitosa!\n\nTotal: $${data.totalCompra.toFixed(2)}\nNuevo saldo: $${data.nuevoSaldo.toFixed(2)}`);

            const saldoElem = document.getElementById("nav-usuario-saldo");
            if (saldoElem) saldoElem.textContent = `$${data.nuevoSaldo.toFixed(2)}`;

            localStorage.removeItem("carrito");
            carrito = [];
            guardarCarrito();
            mostrarCarrito();

            document.getElementById("modal-carrito")?.close();
        } else {
            alert("❌ " + (data.message || "Error en la compra"));
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
}

// ==============================================
// CARGAR PRODUCTOS (SIN LOGIN REQUERIDO)
// ==============================================

async function cargarProductosParaComprar() {
    try {
        const res = await fetch(`${API_URL}/api/productos`);
        const productos = await res.json();

        const tbody = document.getElementById("tbodyCompras");
        if (!tbody) return;

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>${p.id_producto}</td>
                <td><img src="${p.imagen ? `data:image/jpeg;base64,${p.imagen}` : 'https://via.placeholder.com/60'}" 
                         width="60" onerror="this.src='https://via.placeholder.com/60'"></td>
                <td>${p.nombre}</td>
                <td>${p.descripcion}</td>
                <td>$${p.precio}</td>
                <td>${p.temporada}</td>
                <td>
                    <button class="btn btn-primary btn-comprar"
                            data-id="${p.id_producto}"
                            data-precio="${p.precio}"
                            data-nombre="${p.nombre}"
                            data-imagen="${p.imagen ? `data:image/jpeg;base64,${p.imagen}` : ''}">
                        🛒 Agregar
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-comprar").forEach(btn => {
            btn.addEventListener("click", () => {
                agregarAlCarrito({
                    id_producto: Number(btn.dataset.id),
                    nombre: btn.dataset.nombre,
                    precio: Number(btn.dataset.precio),
                    imagen: btn.dataset.imagen
                });
            });
        });

    } catch (err) {
        console.error("Error cargando productos:", err);
    }
}

// ==============================================
// CARGAR PRODUCTOS (ADMIN - INVENTARIO)
// ==============================================

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/api/productos`);
        const data = await res.json();
        const tbody = document.getElementById("tbodyProductos");
        if (!tbody) return;

        tbody.innerHTML = data.map(p => `
            <tr>
                <td>${p.id_producto}</td>
                <td><img src="${p.imagen ? `data:image/jpeg;base64,${p.imagen}` : 'https://via.placeholder.com/60'}" width="60"></td>
                <td>${p.nombre}</td>
                <td>${p.descripcion}</td>
                <td>$${p.precio}</td>
                <td>${p.stock}</td>
                <td>${p.temporada}</td>
                <td>
                    <button class="editar btn btn-warning" data-id="${p.id_producto}">✏ Editar</button>
                    <button class="eliminar btn btn-danger" data-id="${p.id_producto}">🗑 Eliminar</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".editar").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const res = await fetch(`${API_URL}/api/producto/${id}`);
                const data = await res.json();

                document.getElementById("edit-id").value = data.producto.id_producto;
                document.getElementById("edit-nombre").value = data.producto.nombre;
                document.getElementById("edit-descripcion").value = data.producto.descripcion;
                document.getElementById("edit-precio").value = data.producto.precio;
                document.getElementById("edit-stock").value = data.producto.stock;
                document.getElementById("edit-temporada").value = data.producto.temporada;

                document.getElementById("edit-producto")?.showModal();
            });
        });

        tbody.querySelectorAll(".eliminar").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("¿Eliminar este producto?")) return;

                const id = btn.dataset.id;
                const res = await fetch(`${API_URL}/api/producto/${id}`, { method: "DELETE" });
                
                if (res.ok) {
                    alert("Producto eliminado");
                    cargarProductos();
                }
            });
        });

    } catch (err) {
        console.error("Error:", err);
    }
}

// ==============================================
// AGREGAR/EDITAR PRODUCTO (ADMIN)
// ==============================================

document.getElementById("formAgregarProducto")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const res = await fetch(`${API_URL}/api/producto`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Producto agregado");
            e.target.reset();
            document.getElementById("add-producto")?.close();
            cargarProductos();
        }

    } catch (err) {
        console.error("Error:", err);
    }
});

document.getElementById("formEditarProducto")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-id").value;
    const formData = new FormData(e.target);

    try {
        const res = await fetch(`${API_URL}/api/producto/${id}`, {
            method: "PUT",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Producto actualizado");
            e.target.reset();
            document.getElementById("edit-producto")?.close();
            cargarProductos();
        }

    } catch (err) {
        console.error("Error:", err);
    }
});

// ==============================================
// MODALES
// ==============================================

document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modalId = btn.dataset.open;
        
        // Verificar login para carrito
        if (modalId === "modal-carrito") {
            if (!requiereLogin("⚠️ Debes iniciar sesión para ver tu carrito")) {
                return;
            }
            mostrarCarrito();
        }
        
        const modal = document.getElementById(modalId);
        modal?.showModal();
    });
});

document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = document.getElementById(btn.dataset.close);
        modal?.close();
    });
});

// Cerrar con clic fuera
["modal-login", "modal-registro", "add-producto", "edit-producto", "modal-editar", "modal-carrito"].forEach(id => {
    const modal = document.getElementById(id);
    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.close();
    });
});

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    
    // Mostrar usuario si existe (sin mensajes)
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioLocal) {
        mostrarUsuario(usuarioLocal);
    }

    // Cargar productos según la página
    if (window.location.pathname.includes("compra.html")) {
        cargarProductosParaComprar();
    }

    if (window.location.pathname.includes("inventario.html")) {
        const user = JSON.parse(localStorage.getItem("usuario"));
        if (!user || user.rol !== "admin") {
            alert("❌ Acceso denegado");
            window.location.href = "index.html";
            return;
        }
        cargarProductos();
    }

    // Actualizar carrito
    actualizarCantidadCarrito();

    // Botón pagar
    document.getElementById("btnPagar")?.addEventListener("click", confirmarCompra);

    // Auto-abrir login si viene con hash
    if (window.location.hash === "#login") {
        setTimeout(() => {
            document.getElementById("modal-login")?.showModal();
            history.replaceState(null, null, ' ');
        }, 300);
    }
});

// ============================================
// PERFIL.HTML - SCRIPT MEJORADO (agregar al final de perfil.html)
// ============================================

// ==============================================
// PERFIL.HTML - INICIALIZACIÓN
// ==============================================
document.addEventListener("DOMContentLoaded", async () => {
    
    const user = JSON.parse(localStorage.getItem("usuario"));

    // ✅ Si no hay usuario, preguntar amablemente (UNA SOLA VEZ)
    if (!user) {
        const quiereLogin = confirm(
            "👤 Para ver tu perfil necesitas iniciar sesión.\n\n" +
            "¿Deseas iniciar sesión ahora?"
        );
        
        if (quiereLogin) {
            window.location.href = "index.html#login";
        } else {
            window.location.href = "index.html";
        }
        return; // DETENER EJECUCIÓN AQUÍ
    }

    // ✅ Usuario logueado - continuar normalmente
    document.getElementById("perfil-nombre").textContent = user.nombre;
    document.getElementById("perfil-email").textContent = user.email;
    document.getElementById("perfil-rol").textContent = user.rol;
    
    // Mostrar saldo
    document.getElementById("perfil-saldo").textContent = 
        `$${parseFloat(user.saldo || 0).toFixed(2)}`;

    // Cargar datos completos
    await cargarDatosCompletos(user.id_usuario);

    // Mostrar botones de admin
    if (user.rol === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => {
            el.classList.remove("d-none");
        });
    }

    // Configurar botones
    configurarEventosPerfil(user);
});

function configurarEventosPerfil(user) {
    // Botón editar
    document.getElementById("btn-editar")?.addEventListener("click", () => {
        prepararFormularioEdicion(user);
        document.getElementById("modal-editar")?.showModal();
    });

    // Preview imagen
    document.getElementById("edit-imagen")?.addEventListener("change", function() {
        const file = this.files[0];
        const preview = document.getElementById("preview-img");

        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    // Form edición
    document.getElementById("editarForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await actualizarPerfil(e.target, user);
    });

    // Botón administrar usuarios (admin)
    document.querySelector('[data-open="modal-usuarios"]')?.addEventListener("click", async () => {
        await cargarUsuariosAdmin();
        document.getElementById("modal-usuarios")?.showModal();
    });

    // Botón recargar saldo (admin)
    document.querySelector('[data-open="modal-recargar-saldo"]')?.addEventListener("click", async () => {
        await cargarUsuariosParaRecarga();
        document.getElementById("modal-recargar-saldo")?.showModal();
    });
}

async function cargarDatosCompletos(id_usuario) {
    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/perfil/${id_usuario}`);
        
        if (!res.ok) {
            console.error("Error cargando perfil");
            return;
        }

        const data = await res.json();
        
        if (data.success && data.usuario) {
            const usuario = data.usuario;

            // Actualizar foto
            const perfilFoto = document.getElementById("perfil-foto");
            if (perfilFoto) {
                if (usuario.imagen) {
                    perfilFoto.src = `data:image/jpeg;base64,${usuario.imagen}`;
                    perfilFoto.onerror = () => {
                        perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                    };
                } else {
                    perfilFoto.src = "https://via.placeholder.com/120?text=Sin+Foto";
                }
            }

            // Actualizar saldo
            const saldoActualizado = parseFloat(usuario.saldo || 0);
            document.getElementById("perfil-saldo").textContent = 
                `$${saldoActualizado.toFixed(2)}`;

            // Actualizar localStorage
            const userLocal = JSON.parse(localStorage.getItem("usuario"));
            if (userLocal) {
                userLocal.saldo = saldoActualizado;
                localStorage.setItem("usuario", JSON.stringify(userLocal));
            }
        }

    } catch (err) {
        console.error("Error al cargar datos:", err);
    }
}

function prepararFormularioEdicion(user) {
    document.getElementById("edit-nombre").value = user.nombre;
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-password").value = "";
    
    const preview = document.getElementById("preview-img");
    if (preview) {
        preview.style.display = "none";
    }
}

async function actualizarPerfil(form, user) {
    const API_URL = "https://panaderia-navidad.onrender.com";
    const formData = new FormData(form);
    formData.append("id_usuario", user.id_usuario);

    try {
        const res = await fetch(`${API_URL}/api/usuario/editar`, {
            method: "PUT",
            body: formData
        });

        if (!res.ok) {
            alert("❌ Error actualizando perfil");
            return;
        }

        const data = await res.json();

        if (data.success) {
            alert("✅ Perfil actualizado correctamente");

            const usuarioActualizado = {
                id_usuario: user.id_usuario,
                nombre: formData.get("nombre"),
                email: formData.get("email"),
                rol: user.rol,
                saldo: user.saldo
            };

            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
            location.reload();
        }

    } catch (err) {
        console.error("Error actualizando perfil:", err);
        alert("❌ Error de conexión");
    }
}

// Funciones de admin (cargar usuarios, recargar saldo, etc.)
async function cargarUsuariosAdmin() {
    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        const usuarios = await res.json();

        const tbody = document.getElementById("tablaUsuarios");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td><span class="badge bg-${u.rol === 'admin' ? 'danger' : 'primary'}">${u.rol}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

async function cargarUsuariosParaRecarga() {
    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/todos`);
        const usuarios = await res.json();

        const tbody = document.getElementById("tablaUsuariosRecarga");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>
                    <span class="badge bg-${u.saldo > 100 ? 'success' : 'warning'}">
                        $${parseFloat(u.saldo || 0).toFixed(2)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="seleccionarUsuario(${u.id_usuario}, '${u.nombre}', ${u.saldo || 0})">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

window.seleccionarUsuario = function(id, nombre, saldo) {
    document.getElementById("recargar-id").value = id;
    document.getElementById("recargar-nombre").value = nombre;
    document.getElementById("recargar-saldo-actual").value = `$${parseFloat(saldo).toFixed(2)}`;
    document.getElementById("recargar-monto").focus();
};

window.eliminarUsuario = async function(id) {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar este usuario?")) return;

    const API_URL = "https://panaderia-navidad.onrender.com";
    
    try {
        const res = await fetch(`${API_URL}/api/usuario/eliminar/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            alert("❌ Error eliminando usuario");
            return;
        }

        alert("✅ Usuario eliminado");
        await cargarUsuariosAdmin();

    } catch (err) {
        console.error("Error eliminando usuario:", err);
        alert("❌ Error de conexión");
    }
};

// Form recarga saldo
document.getElementById("formRecargarSaldo")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const API_URL = "https://panaderia-navidad.onrender.com";
    const admin = JSON.parse(localStorage.getItem("usuario"));
    
    if (!admin || admin.rol !== 'admin') {
        alert("❌ No tienes permisos");
        return;
    }

    const id_usuario = parseInt(document.getElementById("recargar-id").value);
    const monto = parseFloat(document.getElementById("recargar-monto").value);
    const nombre = document.getElementById("recargar-nombre").value;

    try {
        const res = await fetch(`${API_URL}/api/usuario/recargar-saldo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_usuario,
                monto,
                id_admin: admin.id_usuario
            })
        });

        const data = await res.json();

        if (data.success) {
            alert(`✅ Recarga exitosa\n\nNuevo saldo de ${nombre}: $${data.nuevoSaldo.toFixed(2)}`);
            await cargarUsuariosParaRecarga();
            e.target.reset();
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error de conexión");
    }
});

// Exportar funciones globales
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.mostrarCarrito = mostrarCarrito;