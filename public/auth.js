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
