(function () {
 'use strict';
 function iniciar() {
  const form=document.querySelector('form.elementor-form');
  if(!form) return;
  const get=id=>document.getElementById('form-field-'+id);
  const select=get('asistencia_select'),responde=get('respondedor_nombre');
  const restricciones=get('field_51b829f'),mensaje=get('message');
  const button=form.querySelector('button[type="submit"]');
  const label=button.querySelector('.elementor-button-text') || button;
  const status=document.createElement('p');status.id='boda-confirmacion-estado';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  form.appendChild(status);
  const fields=document.createElement('div');fields.id='boda-asistentes';
  select.closest('.elementor-field-group').after(fields);
  form.noValidate=true;
  select.required=true;responde.maxLength=200;restricciones.maxLength=2000;mensaje.maxLength=2000;
  let busy=false,lastPayload='',lastId='',prepared=false;
  function mostrar(estado,texto){status.dataset.estado=estado;status.textContent=texto;}
  function adaptar() {
   const n=Number(select.value);
   fields.querySelectorAll('input').forEach((input,i)=>{
    const visible=select.value!=='' && i<n;
    input.closest('.elementor-field-group').hidden=!visible;
    input.disabled=!visible;input.required=visible;
   });
  }
  function preparar() {
   if(prepared || !window.bodaInvitacion)return;
   prepared=true;
   select.replaceChildren(new Option('Selecciona una opción',''));
   select.options[0].disabled=true;
   for(let i=1;i<=window.bodaInvitacion.cupos;i++)select.add(new Option(i+(i===1?' persona':' personas'),String(i)));
   select.add(new Option('No podremos asistir','0'));
   for(let i=1;i<=window.bodaInvitacion.cupos;i++){
    const group=document.createElement('div');group.className='elementor-field-group elementor-column elementor-col-100';
    const title=document.createElement('label');title.htmlFor='boda-asistente-'+i;title.textContent='Nombre y apellido del asistente '+i;title.className='elementor-field-label';
    const input=document.createElement('input');input.id=title.htmlFor;input.type='text';input.name='asistente_'+i;input.maxLength=200;
    input.className='elementor-field elementor-field-textual elementor-size-sm';input.autocomplete='off';
    group.append(title,input);fields.appendChild(group);
   }
   adaptar();
   mostrar('listo','Puedes confirmar tu asistencia o indicar que no podrás asistir. Si envías otra respuesta, se actualizará la anterior.');
  }
  select.addEventListener('change',adaptar);
  if(window.bodaInvitacion)preparar();else document.addEventListener('boda:lista',preparar,{once:true});
  async function json(url,options={}){
   const control=new AbortController(),timer=setTimeout(()=>control.abort(),30000);
   try{
    const response=await fetch(url,{...options,signal:control.signal,credentials:'omit',redirect:'follow'});
    if(!response.ok)throw new Error('No pudimos conectar con Google.');
    return await response.json();
   }finally{clearTimeout(timer);}
  }
  async function recibo(codigo,envio){
   const url=new URL(window.BODA_API_URL);
   url.searchParams.set('invitado',codigo);url.searchParams.set('accion','estado');url.searchParams.set('envio',envio);url.searchParams.set('_',String(Date.now()));
   const data=await json(url);return data.ok===true && data.saved===true && data.envio===envio ? data : null;
  }
  document.addEventListener('submit',async e=>{
   if(e.target!==form)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(busy)return;
   if(!window.bodaInvitacion){mostrar('error','Abre tu enlace personal y espera a que carguen tus pases.');return;}
   if(!form.reportValidity())return;
   const count=Number(select.value);
   if(select.value==='' || !Number.isInteger(count) || count<0 || count>window.bodaInvitacion.cupos){mostrar('error','Selecciona cuántas personas asistirán.');return;}
   const nombres=Array.from(fields.querySelectorAll('input')).slice(0,count).map(el=>el.value.trim());
   if(!responde.value.trim() || nombres.some(n=>!n)){mostrar('error','Completa los nombres obligatorios.');return;}
   const codigo=new URLSearchParams(location.search).get('invitado');
   const payload={codigo,asistentes:count,responde:responde.value.trim(),nombres,restricciones:restricciones.value.trim(),mensaje:mensaje.value.trim()};
   const serialized=JSON.stringify(payload);
   if(serialized!==lastPayload){lastPayload=serialized;lastId=crypto.randomUUID().replace(/-/g,'');}
   payload.envio=lastId;
   busy=true;
   const previous=Array.from(form.elements).map(el=>[el,el.disabled]);
   previous.forEach(([el])=>{el.disabled=true;});
   form.setAttribute('aria-busy','true');label.textContent='Guardando…';mostrar('guardando','Estamos guardando tu respuesta.');
   try{
    let result;
    try{
     result=await json(window.BODA_API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload)});
    }catch(networkError){
     mostrar('guardando','Verificando si Google recibió tu respuesta…');
     let receipt=null;try{receipt=await recibo(codigo,lastId);}catch(_){}
     if(!receipt)throw new Error('No pudimos verificar el guardado. Conservamos tus datos; pulsa Enviar confirmación para intentarlo nuevamente.');
     result=receipt;
    }
    if(result.ok!==true || result.saved!==true || result.envio!==lastId)throw new Error(result.error || 'Google no confirmó el guardado. Inténtalo nuevamente.');
    mostrar('guardado',result.posterior?'Este envío ya se había registrado. Hay una respuesta posterior de tu familia, que se conserva.':count===0?'Tu respuesta quedó guardada: no podrás asistir. Gracias por avisarnos.':'¡Tu confirmación quedó guardada! Asistentes: '+count+'.');
   }catch(error){mostrar('error',error.message || 'No se pudo guardar. Inténtalo nuevamente.');}
   finally{busy=false;previous.forEach(([el,disabled])=>{el.disabled=disabled;});form.removeAttribute('aria-busy');label.textContent='Enviar confirmación';}
  },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
