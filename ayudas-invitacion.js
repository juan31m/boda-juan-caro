(function () {
  'use strict';
  // GUÍA OPCIONAL DE SCROLL: cambiar true por false para quitar la manito.
  const MOSTRAR_GUIA_DESLIZAR = true;
  let guiada = false, animado = false;
  function animarBoton() {
    const portada = document.querySelector('.boda-portada');
    const overlay = document.querySelector('.pantalla-inicio');
    if (animado || !portada || portada.dataset.estado === 'cargando' || overlay?.classList.contains('is-hidden')) return;
    animado = true;
    setTimeout(function () {
      if (overlay.classList.contains('is-hidden')) return;
      const boton = overlay.querySelector('.btn-abrir a');
      if (!boton) return;
      boton.classList.add('boda-pulso');

    }, 1200);
  }
  document.addEventListener('boda:portada-lista', animarBoton);
  document.addEventListener('boda:abierta', function () {
    document.querySelector('.boda-pulso')?.classList.remove('boda-pulso');
    if (!MOSTRAR_GUIA_DESLIZAR || guiada) return;
    guiada = true;
    const ayuda = document.createElement('div');
    ayuda.id = 'boda-guia-scroll';
    ayuda.setAttribute('aria-hidden', 'true');
    ayuda.innerHTML = '<svg viewBox="0 0 48 60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 13V3m-5 5 5-5 5 5"/><path d="M17 40V23c0-5 7-5 7 0v13-5c0-4 6-4 6 0v6-3c0-4 6-4 6 0v5-2c0-4 6-4 6 0v9c0 5-3 10-7 12H22c-3-3-5-5-7-9l-5-8c-2-4 3-7 6-3l3 4"/></svg><span>Desliza para descubrir</span>';
    document.body.appendChild(ayuda);
    const eventos = ['wheel','touchmove','scroll'];
    function quitar() { ayuda.remove(); eventos.forEach(e=>window.removeEventListener(e,quitar)); clearTimeout(timer); }
    const timer = setTimeout(quitar, 5000);
    eventos.forEach(e=>window.addEventListener(e,quitar,{passive:true,once:true}));
  });
  // Enlace interno: evitar que Elementor lo interprete como una pestaña desplegable.
  document.addEventListener('click', function (e) {
    const enlace = e.target.closest('.e-n-menu a[href="#confirmacion"]');
    if (!enlace) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const toggle = enlace.closest('nav').querySelector('.e-n-menu-toggle');
    if (toggle?.getAttribute('aria-expanded') === 'true') toggle.click();
    document.getElementById('confirmacion')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',animarBoton); else animarBoton();
})();

