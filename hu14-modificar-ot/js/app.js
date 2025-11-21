const App = (() => {
  // Usuario simulado (Admin para poder editar Finalizada)
  const loggedUser = { id: 99, name: "Admin Demo", role: "Admin" };

  let ot = [];
  let historial = {};

  async function init() {
    const res = await fetch('data/ot.json'); 
    ot = await res.json();
    historial = {};
  }

  // LISTADO
  async function listarOT() {
    const tbody = document.getElementById('otBody');
    const vacio = document.getElementById('vacio');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!ot.length) { vacio.hidden = false; return; }
    vacio.hidden = true;

    ot.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${escapeHtml(item.titulo)}</td>
        <td>${escapeHtml(item.estado)}</td>
        <td>${item.fechaInicio}</td>
        <td>${item.fechaFin}</td>
        <td>${item.responsable}</td>
        <td><a class="btn" href="editar.html?id=${item.id}">Editar</a></td>`;
      tbody.appendChild(tr);
    });
  }

  // FORM
  function cargarFormularioDesdeQS() {
    const qs = new URLSearchParams(location.search);
    const id = qs.get('id');
    const item = ot.find(x => String(x.id) === String(id));
    const msg = document.getElementById('msg');

    if (!item) { if (msg) msg.textContent = 'OT no encontrada'; disableForm(true); return; }
    if (item.estado === 'Finalizada' && loggedUser.role !== 'Admin') {
      if (msg) msg.textContent = 'Solo un Administrador puede editar una OT Finalizada.'; 
      disableForm(true);
    }

    setVal('id', item.id); setVal('titulo', item.titulo); setVal('estado', item.estado);
    setVal('fechaInicio', item.fechaInicio); setVal('fechaFin', item.fechaFin); setVal('responsable', item.responsable);
    renderHistorial(id);
  }

  function disableForm(flag){ 
    const f=document.getElementById('formOT'); 
    if(!f)return;
    [...f.querySelectorAll('input,select,button[type="submit"]')].forEach(x=>x.disabled=flag);
  }
  const setVal = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
  const getVal = (id)=>{ const el=document.getElementById(id); return el?el.value:''; };

  function guardar(e){
    e.preventDefault(); 
    const msg=document.getElementById('msg');

    const data={ 
      id:getVal('id'),
      titulo:getVal('titulo').trim(),
      estado:getVal('estado'),
      fechaInicio:getVal('fechaInicio'),
      fechaFin:getVal('fechaFin'),
      responsable:Number(getVal('responsable'))
    };

    if(!data.titulo||!data.estado||!data.fechaInicio||!data.fechaFin||!data.responsable)
      return show(msg,'Completa los campos obligatorios.',true);

    if(data.fechaInicio > data.fechaFin)
      return show(msg,'La fecha de inicio debe ser menor o igual a la fecha de fin.',true);

    const original=ot.find(x=>String(x.id)===String(data.id));
    if(original.estado==='Finalizada' && loggedUser.role!=='Admin')
      return show(msg,'No tienes permisos para editar una OT Finalizada.',true);

    const cambios = diff(original, data);
    Object.assign(original, data);

    // Auditoría simulada
    const log = { fecha:new Date().toISOString(), usuario: loggedUser.name, cambios };
    if(!historial[data.id]) historial[data.id]=[];
    historial[data.id].push(log);

    show(msg,'Cambios guardados correctamente.',false);
    renderHistorial(data.id);
  }

  function diff(a,b){
    const out=[]; 
    for(const k of ['titulo','estado','fechaInicio','fechaFin','responsable']){
      if(String(a[k])!==String(b[k])) out.push({campo:k,antes:a[k],despues:b[k]});
    }
    return out.length?out:['Sin cambios'];
  }

  function renderHistorial(id){
    const ul=document.getElementById('historial'); if(!ul) return;
    ul.innerHTML=''; const logs=historial[id]||[];
    if(!logs.length){ ul.innerHTML='<li class="muted">Sin registros aún.</li>'; return; }
    logs.forEach(l=>{
      const li=document.createElement('li');
      const detalle = Array.isArray(l.cambios)
        ? l.cambios.map(c=>`${c.campo}: “${escapeHtml(String(c.antes))}” → “${escapeHtml(String(c.despues))}”`).join(' | ')
        : l.cambios;
      li.textContent = `${l.fecha} – ${l.usuario} – ${detalle}`;
      ul.appendChild(li);
    });
  }

  const show = (n,t,err)=>{ if(!n)return; n.textContent=t; n.className=err?'error':'ok'; };
  const escapeHtml = (s)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

  return { init, listarOT, cargarFormularioDesdeQS, guardar };
})();

