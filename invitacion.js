(function () {
  'use strict';
  let pending = false;
  function start() {
    const nombre = document.getElementById('boda-familia');
    const saludo = document.getElementById('boda-saludo');
    const pases = document.getElementById('boda-pases');
    const estado = document.getElementById('boda-estado');
    const retry = document.getElementById('boda-reintentar');
    const form = document.querySelector('form.elementor-form');
    const token = new URLSearchParams(location.search).get('invitado');
    // La portada puede abrirse sin datos; el formulario no asigna cupos inventados.
    function bloquear(valor) {
      if (form) form.querySelectorAll('input,select,textarea,button').forEach(el => { el.disabled = valor; });
    }
    bloquear(true);
    document.addEventListener('submit', function(e) {
      if (e.target === form && !window.bodaInvitacion) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    },true);
    async function cargar() {
      if (pending) return;
      pending = true;
      retry.hidden = true;
      estado.textContent = 'Consultando tu invitación…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(),20000);
      try {
        if (!/^[a-f0-9]{32}$/.test(token || '')) throw new Error('Abre el enlace personal que te enviamos para ver tu nombre y tus pases.');
        if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(window.BODA_API_URL || '')) throw new Error('La personalización todavía está en preparación.');
        const url = new URL(window.BODA_API_URL);
        url.searchParams.set('invitado',token);
        // Evitar que una respuesta anterior oculte cambios recientes en la hoja.
        url.searchParams.set('_',String(Date.now()));
        const response = await fetch(url,{signal:controller.signal,credentials:'omit',redirect:'follow'});
        if (!response.ok) throw new Error('No pudimos conectar con la lista de invitados.');
        const data = await response.json();
        if (!data.ok) throw new Error(data.error || 'No encontramos tu invitación.');
        if (typeof data.nombre !== 'string' || !data.nombre.trim() || !Number.isInteger(data.cupos) || data.cupos < 1 || data.cupos > 100) throw new Error('Los datos de esta invitación necesitan revisión.');
        nombre.textContent = data.nombre;
        saludo.textContent = data.cupos === 1 ? 'Estás cordialmente invitado/a a la boda de' : 'Están cordialmente invitados a la boda de';
        const cantidad = document.createElement('strong');
        const numero = document.createElement('span');
        numero.className = 'boda-numero-pases';
        numero.textContent = String(data.cupos);
        cantidad.append(numero, document.createTextNode(data.cupos === 1 ? ' pase' : ' pases'));
        pases.replaceChildren(document.createTextNode('Esta invitación contiene '), cantidad);
        pases.hidden = false;
        estado.textContent = '';
        window.bodaInvitacion = Object.freeze({nombre:data.nombre,cupos:data.cupos});
        // Añadir los campos de acompañantes que no existen en la plantilla.
        if (form) {
          const anchor = form.querySelector('[name*="nombre_2"]')?.closest('.elementor-field-group');
          if (anchor) for (let i=3;i<=data.cupos;i++) {
            if (form.querySelector('[name*="nombre_'+i+'"]')) continue;
            const copy = anchor.cloneNode(true);
            const input = copy.querySelector('input');
            const label = copy.querySelector('label');
            input.name = 'form_fields[nombre_'+i+']'; input.id = 'form-field-nombre_'+i;
            input.value = ''; input.required = false;
            if (label) { label.htmlFor = input.id; label.textContent = 'Nombre completo del acompañante '+(i-1); }
            anchor.parentNode.insertBefore(copy,form.querySelector('[name*="field_51b829f"]')?.closest('.elementor-field-group') || form.querySelector('button[type="submit"]')?.closest('.elementor-field-group') || null);
          }
        }
        bloquear(false);
        document.dispatchEvent(new Event('boda:lista'));
      } catch (error) {
        estado.textContent = error.name === 'AbortError' ? 'La consulta está tardando. Inténtalo nuevamente.' : error.message;
        retry.hidden = !/^[a-f0-9]{32}$/.test(token || '') || !window.BODA_API_URL;
      } finally { clearTimeout(timeout); pending = false; }
    }
    retry.addEventListener('click',cargar);
    cargar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
