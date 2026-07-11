/* =========================================================
   CASA DE HERRERO — sistema de gestión interno
   Vanilla JS · localStorage · Chart.js · Sync opcional con Google Drive
   ========================================================= */

/* ============================================================
   CONFIGURACIÓN DE GOOGLE DRIVE
   Pegá acá tu Client ID de Google Cloud Console (ver guía).
   Mientras diga 'PEGAR_CLIENT_ID_ACA', la app funciona igual
   pero el botón de Google Drive va a avisar que falta configurar.
   ============================================================ */
const GOOGLE_CLIENT_ID = '1063528493037-dr7o3b8uiekadlpm80g8obpdqihc0oev.apps.googleusercontent.com';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GOOGLE_DRIVE_FILENAME = 'cdh_gestion_db.json';

/* ----------------------------- constantes ----------------------------- */

const ACCESORIOS = ['Parrilla','Ganchos','Utensilios largos','Brasero','Disco','Estaca', 'Tabla adosada','Tapa para disco'];
const FORMAS_PAGO = ['Efectivo','Transferencia','Mercado Pago','Tarjeta','QR'];
const ENTREGA_TIPOS = ['Retira','Transporte'];
const ESTADOS_PEDIDO = [
  'Confirmado sin seña',
  'Confirmado con seña',
  'Confirmado con pago total',
  'Entregado',
  'Cancelado'
];
const ESTADO_COLOR = {
  'Confirmado sin seña':'neutral',
  'Confirmado con seña':'info',
  'Confirmado con pago total':'success',
  'En proceso':'warn',
  'Listo para entrega':'rust',
  'Entregado':'success',
  'Cancelado':'danger'
};
const CATEGORIAS_EGRESO = ['Corte láser','Pintura tercerizada','Soldadura tercerizada','Transporte','Publicidad y CM','Insumos de material','Comisión por venta','Otro'];
const CATEGORIAS_INGRESO = ['Venta - Seña','Venta - Saldo','Venta - Pago total','Otro ingreso'];
const STOCK_CATEGORIAS = ['Herrería (varillas / chapas)','Pintura','Discos de corte','Bulones y tornillería','Electrodos','EPP (guantes, etc.)','Otros'];
const STOCK_UNIDADES = ['unidad','kg','m','litro','caja','par'];
const PRODUCTOS_TIPO = ['Fogonero redondo','Fogonero cuadrado','Fogonero rectangular','Fogonero hexagonal','Fogonero a medida','Otro'];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ------------------------------- utils --------------------------------- */

function uid(prefix){ return (prefix||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function money(n){
  n = Number(n)||0;
  return '$ ' + n.toLocaleString('es-AR', {maximumFractionDigits:0});
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso+'T00:00:00');
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function monthKey(iso){ return (iso||'').slice(0,7); }
function monthLabel(key){
  const [y,m] = key.split('-');
  return MESES[parseInt(m,10)-1] + ' ' + y;
}
function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function daysBetween(a,b){
  const d1 = new Date(a+'T00:00:00'), d2 = new Date(b+'T00:00:00');
  return Math.round((d2-d1)/86400000);
}
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

/* ------------------------------ persistencia ---------------------------- */

const DB_KEY = 'cdh_gestion_db_v1';

function seedDB(){
  const hoy = todayISO();
  const back = (n)=>{ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };

  const pedidos = [
    {
      id: uid('ped'), cliente:'Marcos Ibáñez', telefono:'3541455001', localidad:'Unquillo, Córdoba', instagram:'@marcos.iba',
      fechaPedido: back(18), fechaEntrega: back(2), producto:'Fogonero redondo', medidas:'70 cm diámetro', color:'Óxido natural',
      accesorios:['Parrilla','Estaca'], precio:185000, seña:80000, saldo:105000, formaPago:'Transferencia',
      entrega:'Retira', direccion:'', estado:'Entregado', observaciones:'Cliente recurrente, muy conforme con el anterior.'
    },
    {
      id: uid('ped'), cliente:'Julieta Cáceres', telefono:'3512223344', localidad:'Villa Allende, Córdoba', instagram:'@juliceres',
      fechaPedido: back(10), fechaEntrega: back(1), producto:'Fogonero cuadrado', medidas:'60x60 cm', color:'Negro forja',
      accesorios:['Parrilla','Ganchos','Utensilios largos'], precio:210000, seña:100000, saldo:110000, formaPago:'Mercado Pago',
      entrega:'Transporte', direccion:'Belgrano 145, Villa Allende', estado:'Listo para entrega', observaciones:''
    },
    {
      id: uid('ped'), cliente:'Franco Bertolino', telefono:'3517778899', localidad:'La Calera, Córdoba', instagram:'',
      fechaPedido: back(6), fechaEntrega: back(-4), producto:'Fogonero hexagonal', medidas:'80 cm', color:'Óxido natural',
      accesorios:['Brasero','Disco'], precio:245000, seña:245000, saldo:0, formaPago:'Efectivo',
      entrega:'Retira', direccion:'', estado:'En proceso', observaciones:'Pagó todo por adelantado, pidió apurar entrega.'
    },
    {
      id: uid('ped'), cliente:'Sol Medina', telefono:'3515501122', localidad:'Unquillo, Córdoba', instagram:'@sol.medina.deco',
      fechaPedido: back(3), fechaEntrega: back(-9), producto:'Fogonero a medida', medidas:'90x50 cm rectangular', color:'Ocre',
      accesorios:['Parrilla'], precio:198000, seña:0, saldo:198000, formaPago:'Efectivo',
      entrega:'Retira', direccion:'', estado:'Confirmado sin seña', observaciones:'Llegó por Instagram, pidió referencias de color.'
    },
    {
      id: uid('ped'), cliente:'Marcos Ibáñez', telefono:'3541455001', localidad:'Unquillo, Córdoba', instagram:'@marcos.iba',
      fechaPedido: back(1), fechaEntrega: back(-15), producto:'Fogonero redondo', medidas:'50 cm diámetro', color:'Negro forja',
      accesorios:['Estaca'], precio:120000, seña:60000, saldo:60000, formaPago:'Transferencia',
      entrega:'Retira', direccion:'', estado:'Confirmado con seña', observaciones:'Regalo para su hermano.'
    }
  ];

  const caja = [
    {id:uid('cj'), fecha:back(18), tipo:'ingreso', categoria:'Venta - Seña', descripcion:'Seña fogonero redondo — Marcos Ibáñez', monto:80000, formaPago:'Transferencia', pedidoId: pedidos[0].id},
    {id:uid('cj'), fecha:back(2), tipo:'ingreso', categoria:'Venta - Saldo', descripcion:'Saldo fogonero redondo — Marcos Ibáñez', monto:105000, formaPago:'Efectivo', pedidoId: pedidos[0].id},
    {id:uid('cj'), fecha:back(16), tipo:'egreso', categoria:'Insumos de material', descripcion:'Varillas y chapa 2mm', monto:62000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(15), tipo:'egreso', categoria:'Corte láser', descripcion:'Corte de 4 discos base', monto:38000, formaPago:'Transferencia'},
    {id:uid('cj'), fecha:back(10), tipo:'ingreso', categoria:'Venta - Seña', descripcion:'Seña fogonero cuadrado — Julieta Cáceres', monto:100000, formaPago:'Mercado Pago'},
    {id:uid('cj'), fecha:back(9), tipo:'egreso', categoria:'Pintura tercerizada', descripcion:'Pintura negra forja x3 unidades', monto:45000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(7), tipo:'egreso', categoria:'Publicidad y CM', descripcion:'Pauta Instagram + edición mensual', monto:35000, formaPago:'Transferencia'},
    {id:uid('cj'), fecha:back(6), tipo:'ingreso', categoria:'Venta - Pago total', descripcion:'Pago total fogonero hexagonal — Franco Bertolino', monto:245000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(5), tipo:'egreso', categoria:'Soldadura tercerizada', descripcion:'Soldadura de patas y refuerzos', monto:28000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(4), tipo:'egreso', categoria:'Transporte', descripcion:'Flete entrega Villa Allende', monto:15000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(1), tipo:'egreso', categoria:'Insumos de material', descripcion:'Discos de corte y electrodos', monto:22000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(45), tipo:'ingreso', categoria:'Venta - Pago total', descripcion:'Fogonero redondo — cliente ocasional', monto:150000, formaPago:'Efectivo'},
    {id:uid('cj'), fecha:back(40), tipo:'egreso', categoria:'Comisión por venta', descripcion:'Comisión venta por referido', monto:15000, formaPago:'Transferencia'},
    {id:uid('cj'), fecha:back(70), tipo:'ingreso', categoria:'Venta - Pago total', descripcion:'Fogonero cuadrado — cliente ocasional', monto:175000, formaPago:'Transferencia'},
    {id:uid('cj'), fecha:back(75), tipo:'egreso', categoria:'Insumos de material', descripcion:'Compra de varillas mensuales', monto:58000, formaPago:'Efectivo'}
  ];

  const stock = [
    {id:uid('st'), nombre:'Varilla de hierro 6mm', categoria:'Herrería (varillas / chapas)', unidad:'unidad', cantidad:34, stockMinimo:15, costoUnitario:2100, movimientos:[]},
    {id:uid('st'), nombre:'Chapa de hierro 2mm (1x1m)', categoria:'Herrería (varillas / chapas)', unidad:'unidad', cantidad:9, stockMinimo:10, costoUnitario:18500, movimientos:[]},
    {id:uid('st'), nombre:'Disco de corte 14"', categoria:'Discos de corte', unidad:'unidad', cantidad:6, stockMinimo:8, costoUnitario:3400, movimientos:[]},
    {id:uid('st'), nombre:'Disco flap (flapper) grano 60', categoria:'Discos de corte', unidad:'unidad', cantidad:11, stockMinimo:6, costoUnitario:2600, movimientos:[]},
    {id:uid('st'), nombre:'Electrodos 6013 3.2mm', categoria:'Electrodos', unidad:'kg', cantidad:4, stockMinimo:5, costoUnitario:5200, movimientos:[]},
    {id:uid('st'), nombre:'Bulones 1/4" x 1"', categoria:'Bulones y tornillería', unidad:'caja', cantidad:7, stockMinimo:3, costoUnitario:4200, movimientos:[]},
    {id:uid('st'), nombre:'Guantes de trabajo (par)', categoria:'EPP (guantes, etc.)', unidad:'par', cantidad:5, stockMinimo:4, costoUnitario:3800, movimientos:[]},
    {id:uid('st'), nombre:'Pintura antióxido negra', categoria:'Pintura', unidad:'litro', cantidad:3, stockMinimo:4, costoUnitario:9800, movimientos:[]}
  ];

  const clientes = [];

  return { pedidos, caja, stock, clientes, meta:{creado: todayISO()} };
}

function loadDB(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) { const db = seedDB(); saveDB(db); return db; }
    return JSON.parse(raw);
  }catch(e){
    console.error('Error leyendo la base local, se reinicia.', e);
    const db = seedDB(); saveDB(db); return db;
  }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

let DB = loadDB();
function persist(){ saveDB(DB); syncClientesFromPedidos(); saveDB(DB); scheduleDriveAutoSave(); }

/* ------------------------- reglas de negocio ---------------------------- */

function syncClientesFromPedidos(){
  DB.pedidos.forEach(p=>{
    if(!p.telefono) return;
    let c = DB.clientes.find(c=>c.telefono === p.telefono);
    if(!c){
      c = {id:uid('cli'), nombre:p.cliente, telefono:p.telefono, localidad:p.localidad, instagram:p.instagram, notas:'', manual:false};
      DB.clientes.push(c);
    }else{
      // mantener datos más recientes del pedido si el cliente no fue editado manualmente con otro dato
      c.nombre = c.nombre || p.cliente;
      if(!c.localidad) c.localidad = p.localidad;
      if(!c.instagram) c.instagram = p.instagram;
    }
  });
}

function clienteStats(telefono){
  const pedidosCliente = DB.pedidos.filter(p=>p.telefono===telefono);
  const total = pedidosCliente.reduce((s,p)=>s+Number(p.precio||0),0);
  const ultimoPedido = pedidosCliente.reduce((max,p)=> (!max || p.fechaPedido>max) ? p.fechaPedido : max, null);
  return { cantidad: pedidosCliente.length, total, ultimoPedido, pedidos: pedidosCliente };
}

function registrarPago(pedidoId, monto, categoria, formaPago, descripcionExtra){
  const p = DB.pedidos.find(x=>x.id===pedidoId);
  if(!p) return;
  monto = Number(monto)||0;
  DB.caja.push({
    id: uid('cj'), fecha: todayISO(), tipo:'ingreso', categoria, formaPago,
    descripcion: `${categoria} — ${p.producto} — ${p.cliente}${descripcionExtra? ' ('+descripcionExtra+')':''}`,
    monto, pedidoId
  });
  p.seña = Number(p.seña||0) + monto;
  p.saldo = Math.max(0, Number(p.precio||0) - Number(p.seña||0));
  if(p.saldo === 0 && p.estado !== 'Entregado' && p.estado !== 'Cancelado'){
    p.estado = 'Confirmado con pago total';
  } else if(p.seña > 0 && p.estado === 'Confirmado sin seña'){
    p.estado = 'Confirmado con seña';
  }
  persist();
}

function ajustarStock(itemId, delta, motivo){
  const it = DB.stock.find(s=>s.id===itemId);
  if(!it) return;
  delta = Number(delta)||0;
  it.cantidad = Math.max(0, Number(it.cantidad||0) + delta);
  it.movimientos = it.movimientos || [];
  it.movimientos.unshift({fecha: todayISO(), cantidad: delta, motivo: motivo||''});
  persist();
}

/* ------------------------------ métricas --------------------------------- */

function cajaDelMes(key){
  return DB.caja.filter(c=>monthKey(c.fecha)===key);
}
function totalesMes(key){
  const items = cajaDelMes(key);
  const ingresos = items.filter(i=>i.tipo==='ingreso').reduce((s,i)=>s+Number(i.monto||0),0);
  const egresos = items.filter(i=>i.tipo==='egreso').reduce((s,i)=>s+Number(i.monto||0),0);
  return {ingresos, egresos, neto: ingresos-egresos, items};
}
function ultimosNMeses(n){
  const out = [];
  const d = new Date();
  for(let i=n-1;i>=0;i--){
    const dt = new Date(d.getFullYear(), d.getMonth()-i, 1);
    out.push(dt.toISOString().slice(0,7));
  }
  return out;
}

/* -------------------------------- iconos --------------------------------- */

const ICON = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  pedidos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 7l-8-4-8 4v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/></svg>`,
  caja: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 11h20M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  balance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>`,
  stock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>`,
  clientes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.8-3.6 3.4-5.6 6.5-5.6s5.7 2 6.5 5.6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.7 14.7c2.4.2 4.3 2 4.9 4.7"/></svg>`,
  stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>`,
  money: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 .8 3 2c0 3-6 1.5-6 4.5 0 1.2 1.3 2 3 2s3-1.1 3-2.5"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`,
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.8-3.6 3.4-5.6 6.5-5.6s5.7 2 6.5 5.6"/></svg>`,
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v13m0 0l-4-4m4 4l4-4"/><path d="M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4v6h6M20 20v-6h-6"/><path d="M4.5 15a8 8 0 0014.9 2.5M19.5 9A8 8 0 004.6 6.5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 2 .7 3a2 2 0 01-.5 2L8 10a16 16 0 006 6l1.3-1.3a2 2 0 012-.5c1 .4 2 .6 3 .7a2 2 0 011.7 2.1z"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="7" width="14" height="10" rx="1"/><path d="M15 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.4 1.5A4 4 0 007 19h10.5z"/></svg>`
};

/* -------------------------------- router --------------------------------- */

const ROUTES = [
  {path:'dashboard', label:'Dashboard', icon:ICON.dashboard},
  {path:'pedidos', label:'Pedidos', icon:ICON.pedidos},
  {path:'caja', label:'Caja', icon:ICON.caja},
  {path:'balance', label:'Balance mensual', icon:ICON.balance},
  {path:'stock', label:'Stock', icon:ICON.stock},
  {path:'clientes', label:'Clientes', icon:ICON.clientes},
  {path:'estadisticas', label:'Estadísticas', icon:ICON.stats},
];

let state = {
  route: 'dashboard',
  chartInstances: {},
  filters: { pedidosEstado:'', pedidosBusca:'', cajaTipo:'', cajaBusca:'', clientesBusca:'', balanceKey: todayISO().slice(0,7) },
};

function navigate(route){
  state.route = route;
  location.hash = '#/' + route;
  render();
}
window.addEventListener('hashchange', ()=>{
  const r = location.hash.replace('#/','') || 'dashboard';
  state.route = r;
  render();
});

function showToast(msg){
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="dot"></span>${escapeHtml(msg)}`;
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 2200);
}

/* -------------------------------- modal ----------------------------------- */

function openModal({title, bodyHtml, footerHtml, onMount, wide}){
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';
  overlay.innerHTML = `
    <div class="modal" style="${wide?'max-width:840px':''}">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" id="modalCloseBtn">${ICON.close}</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(); });
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  if(onMount) onMount(overlay);
}
function closeModal(){
  const el = document.getElementById('modalOverlay');
  if(el) el.remove();
}
function confirmAction(msg, onYes){
  openModal({
    title: 'Confirmar acción',
    bodyHtml: `<p style="font-size:14px;line-height:1.5;">${escapeHtml(msg)}</p>`,
    footerHtml: `<button class="btn btn-ghost" id="cancelConfirm">Cancelar</button><button class="btn btn-danger" id="yesConfirm">Sí, confirmar</button>`,
    onMount: ()=>{
      document.getElementById('cancelConfirm').onclick = closeModal;
      document.getElementById('yesConfirm').onclick = ()=>{ closeModal(); onYes(); };
    }
  });
}

/* -------------------------------- shell ------------------------------------ */

function renderShell(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <aside class="sidebar texture-iron">
      <div class="sidebar-brand">
        <img src="logo-light.png" alt="Casa de Herrero">
        <div>
          <div class="name">CASA DE HERRERO</div>
          <div class="tag">Gestión interna</div>
        </div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="drive-status" id="driveStatusBtn"></div>
      <div class="sidebar-footer">
        <span>v1.0 · local</span>
        <button id="btnResetDemo" title="Restaurar datos de ejemplo">${ICON.reset}</button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>
          <h1 id="pageTitle"></h1>
          <div class="sub" id="pageSub"></div>
        </div>
        <div class="topbar-actions" id="topbarActions"></div>
      </header>
      <div class="content" id="pageContent"></div>
    </main>
  `;
  document.getElementById('btnResetDemo').addEventListener('click', ()=>{
    confirmAction('Esto va a borrar los datos actuales y restaurar los datos de ejemplo iniciales. ¿Continuar?', ()=>{
      DB = seedDB(); saveDB(DB); render(); showToast('Datos de ejemplo restaurados');
    });
  });
  renderNav();
  renderDriveStatus();
}

function renderNav(){
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = ROUTES.map(r=>`
    <div class="nav-item ${state.route===r.path?'active':''}" data-route="${r.path}">
      ${r.icon}<span>${r.label}</span>
    </div>`).join('');
  nav.querySelectorAll('.nav-item').forEach(el=>{
    el.addEventListener('click', ()=> navigate(el.dataset.route));
  });
}

const PAGE_META = {
  dashboard: {title:'Dashboard', sub:'Resumen general del negocio'},
  pedidos: {title:'Pedidos', sub:'Seguimiento de pedidos de fogoneros'},
  caja: {title:'Caja', sub:'Ingresos y egresos'},
  balance: {title:'Balance mensual', sub:'Resultado por mes'},
  stock: {title:'Control de stock', sub:'Insumos y componentes'},
  clientes: {title:'Base de clientes', sub:'Historial y contacto'},
  estadisticas: {title:'Estadísticas', sub:'Indicadores automáticos del negocio'},
};

function render(){
  if(!document.getElementById('pageContent')) renderShell();
  else renderNav();
  const meta = PAGE_META[state.route] || PAGE_META.dashboard;
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageSub').textContent = meta.sub;

  const actions = document.getElementById('topbarActions');
  actions.innerHTML = '';

  Object.values(state.chartInstances).forEach(c=>{ try{c.destroy();}catch(e){} });
  state.chartInstances = {};

  switch(state.route){
    case 'pedidos': renderPedidosPage(); break;
    case 'caja': renderCajaPage(); break;
    case 'balance': renderBalancePage(); break;
    case 'stock': renderStockPage(); break;
    case 'clientes': renderClientesPage(); break;
    case 'estadisticas': renderEstadisticasPage(); break;
    default: renderDashboardPage(); break;
  }
}

/* ================================ DASHBOARD ================================ */

function renderDashboardPage(){
  const content = document.getElementById('pageContent');
  const curKey = todayISO().slice(0,7);
  const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth()-1);
  const prevKey = prevDate.toISOString().slice(0,7);

  const cur = totalesMes(curKey);
  const prev = totalesMes(prevKey);
  const deltaIngresos = prev.ingresos ? Math.round(((cur.ingresos-prev.ingresos)/prev.ingresos)*100) : null;
  const deltaEgresos = prev.egresos ? Math.round(((cur.egresos-prev.egresos)/prev.egresos)*100) : null;

  const pendientes = DB.pedidos.filter(p=>!['Entregado','Cancelado'].includes(p.estado)).length;
  const listos = DB.pedidos.filter(p=>p.estado==='Listo para entrega').length;
  const totalClientes = new Set(DB.pedidos.map(p=>p.telefono)).size;
  const stockBajo = DB.stock.filter(s=>Number(s.cantidad) <= Number(s.stockMinimo));

  function deltaHtml(d){
    if(d===null) return `<div class="delta flat">sin datos del mes anterior</div>`;
    if(d===0) return `<div class="delta flat">igual que el mes anterior</div>`;
    return `<div class="delta ${d>0?'up':'down'}">${d>0?'▲':'▼'} ${Math.abs(d)}% vs. mes anterior</div>`;
  }

  content.innerHTML = `
    <div class="grid grid-4">
      <div class="card kpi">
        <div class="icon-badge">${ICON.money}</div>
        <div class="label">Ingresos del mes</div>
        <div class="value">${money(cur.ingresos)}</div>
        ${deltaHtml(deltaIngresos)}
      </div>
      <div class="card kpi">
        <div class="icon-badge">${ICON.down}</div>
        <div class="label">Egresos del mes</div>
        <div class="value">${money(cur.egresos)}</div>
        ${deltaHtml(deltaEgresos)}
      </div>
      <div class="card kpi">
        <div class="icon-badge">${ICON.balance}</div>
        <div class="label">Balance del mes</div>
        <div class="value" style="color:${cur.neto>=0?'var(--success)':'var(--danger)'}">${money(cur.neto)}</div>
        <div class="delta flat">${monthLabel(curKey)}</div>
      </div>
      <div class="card kpi">
        <div class="icon-badge">${ICON.pedidos}</div>
        <div class="label">Pedidos pendientes</div>
        <div class="value">${pendientes}</div>
        <div class="delta flat">${listos} listos para entregar</div>
      </div>
    </div>

    <div class="grid grid-3" style="margin-top:18px;">
      <div class="card kpi">
        <div class="icon-badge">${ICON.users}</div>
        <div class="label">Clientes totales</div>
        <div class="value">${totalClientes}</div>
        <div class="delta flat">${DB.pedidos.length} pedidos históricos</div>
      </div>
      <div class="card kpi">
        <div class="icon-badge">${ICON.box}</div>
        <div class="label">Insumos con stock bajo</div>
        <div class="value" style="color:${stockBajo.length? 'var(--danger)':'var(--ink)'}">${stockBajo.length}</div>
        <div class="delta flat">${stockBajo.length? stockBajo.slice(0,2).map(s=>s.nombre).join(', ') : 'stock en niveles normales'}</div>
      </div>
      <div class="card kpi">
        <div class="icon-badge">${ICON.stats}</div>
        <div class="label">Ticket promedio</div>
        <div class="value">${money(DB.pedidos.length ? DB.pedidos.reduce((s,p)=>s+Number(p.precio||0),0)/DB.pedidos.length : 0)}</div>
        <div class="delta flat">sobre ${DB.pedidos.length} pedidos</div>
      </div>
    </div>

    <div class="two-col" style="margin-top:18px;">
      <div class="card">
        <div class="card-header"><h3>Ingresos vs. egresos — últimos 6 meses</h3></div>
        <div class="chart-box"><canvas id="chartFlujo"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Pedidos por estado</h3></div>
        <div class="chart-box"><canvas id="chartEstados"></canvas></div>
      </div>
    </div>

    <div class="two-col" style="margin-top:18px;">
      <div class="card">
        <div class="card-header"><h3>Productos más vendidos</h3></div>
        <div class="chart-box small"><canvas id="chartProductos"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Formas de pago</h3></div>
        <div class="chart-box small"><canvas id="chartFormasPago"></canvas></div>
      </div>
    </div>

    <div class="section-title-row"><h3>Próximas entregas</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Cliente</th><th>Producto</th><th>Entrega</th><th>Estado</th><th class="num">Saldo</th></tr></thead>
        <tbody>
          ${DB.pedidos.filter(p=>!['Entregado','Cancelado'].includes(p.estado))
              .sort((a,b)=> (a.fechaEntrega||'').localeCompare(b.fechaEntrega||''))
              .slice(0,6)
              .map(p=>`<tr>
                <td>${escapeHtml(p.cliente)}</td>
                <td>${escapeHtml(p.producto)}</td>
                <td>${fmtDate(p.fechaEntrega)}</td>
                <td>${badgeEstado(p.estado)}</td>
                <td class="num">${money(p.saldo)}</td>
              </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:24px;">No hay pedidos pendientes de entrega</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="footer-brand"><img src="logo-dark.png">Casa de Herrero — donde empieza lo bueno</div>
  `;

  // gráfico flujo 6 meses
  const meses6 = ultimosNMeses(6);
  const ingresosArr = meses6.map(k=>totalesMes(k).ingresos);
  const egresosArr = meses6.map(k=>totalesMes(k).egresos);
  state.chartInstances.flujo = new Chart(document.getElementById('chartFlujo'), {
    type:'bar',
    data:{
      labels: meses6.map(k=>monthLabel(k).slice(0,3)+ ' ' + k.slice(2,4)),
      datasets:[
        {label:'Ingresos', data:ingresosArr, backgroundColor:'#a8481f', borderRadius:5, maxBarThickness:26},
        {label:'Egresos', data:egresosArr, backgroundColor:'#c9a961', borderRadius:5, maxBarThickness:26},
      ]
    },
    options: chartBaseOptions({legend:true, money:true})
  });

  // pedidos por estado
  const estadoCounts = ESTADOS_PEDIDO.map(e=>DB.pedidos.filter(p=>p.estado===e).length);
  state.chartInstances.estados = new Chart(document.getElementById('chartEstados'), {
    type:'doughnut',
    data:{
      labels: ESTADOS_PEDIDO,
      datasets:[{ data: estadoCounts, backgroundColor:['#c9c1ae','#8ba4c2','#7fa563','#d9a441','#d97a3f','#55703f','#9c3a2b'], borderWidth:0 }]
    },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'right', labels:{boxWidth:10, font:{size:11}, color:'#6b5f51'}}} }
  });

  // productos más vendidos
  const prodCount = {};
  DB.pedidos.forEach(p=>{ prodCount[p.producto] = (prodCount[p.producto]||0)+1; });
  const prodEntries = Object.entries(prodCount).sort((a,b)=>b[1]-a[1]);
  state.chartInstances.productos = new Chart(document.getElementById('chartProductos'), {
    type:'bar',
    data:{ labels: prodEntries.map(e=>e[0]), datasets:[{ data: prodEntries.map(e=>e[1]), backgroundColor:'#a8481f', borderRadius:5, maxBarThickness:22 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ ticks:{precision:0, color:'#6b5f51'}, grid:{color:'#efe6d6'} }, y:{ ticks:{color:'#6b5f51', font:{size:11.5}}, grid:{display:false} } } }
  });

  // formas de pago (sobre ingresos)
  const fpCount = {};
  DB.caja.filter(c=>c.tipo==='ingreso').forEach(c=>{ fpCount[c.formaPago] = (fpCount[c.formaPago]||0) + Number(c.monto||0); });
  const fpEntries = Object.entries(fpCount);
  state.chartInstances.formasPago = new Chart(document.getElementById('chartFormasPago'), {
    type:'pie',
    data:{ labels: fpEntries.map(e=>e[0]), datasets:[{ data: fpEntries.map(e=>e[1]), backgroundColor:['#a8481f','#d97a3f','#b8965a','#7fa563','#8ba4c2'], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'right', labels:{boxWidth:10, font:{size:11}, color:'#6b5f51'}}} }
  });
}

function chartBaseOptions({legend, money:isMoney}={}){
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ display: !!legend, position:'top', align:'end', labels:{boxWidth:10, font:{size:11.5}, color:'#6b5f51'} },
      tooltip:{ callbacks: isMoney ? { label: (ctx)=> ` ${ctx.dataset.label}: ${money(ctx.raw)}` } : {} }
    },
    scales:{
      x:{ grid:{display:false}, ticks:{color:'#6b5f51', font:{size:11}} },
      y:{ grid:{color:'#efe6d6'}, ticks:{ color:'#6b5f51', font:{size:11}, callback:(v)=> isMoney ? '$'+(v/1000)+'k' : v } }
    }
  };
}

function badgeEstado(estado){
  const cls = ESTADO_COLOR[estado] || 'neutral';
  return `<span class="badge badge-${cls}"><span class="dot" style="background:currentColor"></span>${escapeHtml(estado)}</span>`;
}

/* ================================ PEDIDOS ================================ */

function renderPedidosPage(){
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = `<button class="btn btn-primary" id="btnNuevoPedido">${ICON.plus}Nuevo pedido</button>`;
  actions.querySelector('#btnNuevoPedido').onclick = ()=> openPedidoForm();

  const content = document.getElementById('pageContent');
  const f = state.filters;

  let list = DB.pedidos.slice().sort((a,b)=> (b.fechaPedido||'').localeCompare(a.fechaPedido||''));
  if(f.pedidosEstado) list = list.filter(p=>p.estado===f.pedidosEstado);
  if(f.pedidosBusca){
    const q = f.pedidosBusca.toLowerCase();
    list = list.filter(p=> (p.cliente+p.producto+p.localidad+p.telefono).toLowerCase().includes(q));
  }

  content.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">${ICON.search}<input type="text" id="fPedidosBusca" placeholder="Buscar cliente, producto, localidad..." value="${escapeHtml(f.pedidosBusca)}"></div>
        <select class="select-filter" id="fPedidosEstado">
          <option value="">Todos los estados</option>
          ${ESTADOS_PEDIDO.map(e=>`<option value="${e}" ${f.pedidosEstado===e?'selected':''}>${e}</option>`).join('')}
        </select>
      </div>
      <div class="toolbar-left" style="color:var(--text-dim);font-size:12.5px;">${list.length} pedido${list.length!==1?'s':''}</div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Cliente</th><th>Producto</th><th>Fecha pedido</th><th>Entrega</th><th>Estado</th>
          <th class="num">Precio</th><th class="num">Seña</th><th class="num">Saldo</th><th></th>
        </tr></thead>
        <tbody>
          ${list.map(p=>`
            <tr>
              <td>
                <div class="client-name-cell">
                  <div class="avatar-letter">${escapeHtml((p.cliente||'?').charAt(0).toUpperCase())}</div>
                  <div class="meta"><span>${escapeHtml(p.cliente)}</span><span class="sub">${escapeHtml(p.localidad||'')}</span></div>
                </div>
              </td>
              <td>${escapeHtml(p.producto)}<div class="timeline-hint">${escapeHtml(p.medidas||'')} · ${escapeHtml(p.color||'')}</div></td>
              <td>${fmtDate(p.fechaPedido)}</td>
              <td>${fmtDate(p.fechaEntrega)}</td>
              <td>${badgeEstado(p.estado)}</td>
              <td class="num">${money(p.precio)}</td>
              <td class="num">${money(p.seña)}</td>
              <td class="num" style="color:${p.saldo>0?'var(--danger)':'var(--success)'};font-weight:700;">${money(p.saldo)}</td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" data-view="${p.id}" title="Ver detalle">${ICON.eye}</button>
                  <button class="icon-btn" data-edit="${p.id}" title="Editar">${ICON.edit}</button>
                  <button class="icon-btn danger" data-del="${p.id}" title="Eliminar">${ICON.trash}</button>
                </div>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="9"><div class="empty-state">${ICON.pedidos}<div class="title">No se encontraron pedidos</div><p>Probá con otro filtro o creá un nuevo pedido.</p></div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  content.querySelector('#fPedidosBusca').addEventListener('input', (e)=>{ f.pedidosBusca = e.target.value; renderPedidosPage(); });
  content.querySelector('#fPedidosEstado').addEventListener('change', (e)=>{ f.pedidosEstado = e.target.value; renderPedidosPage(); });
  content.querySelectorAll('[data-view]').forEach(b=> b.onclick = ()=> viewPedido(b.dataset.view));
  content.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> openPedidoForm(b.dataset.edit));
  content.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=>{
    const p = DB.pedidos.find(x=>x.id===b.dataset.del);
    confirmAction(`¿Eliminar el pedido de "${p.cliente}" (${p.producto})? Esta acción no se puede deshacer.`, ()=>{
      DB.pedidos = DB.pedidos.filter(x=>x.id!==b.dataset.del);
      persist(); renderPedidosPage(); showToast('Pedido eliminado');
    });
  });
}

function accesoriosChips(selected, editable){
  return `<div class="checkbox-group" id="accesoriosGroup">
    ${ACCESORIOS.map(a=>`<div class="chip-toggle ${selected.includes(a)?'on':''}" data-acc="${a}">${a}</div>`).join('')}
  </div>`;
}

function openPedidoForm(id){
  const editing = !!id;
  const p = editing ? DB.pedidos.find(x=>x.id===id) : {
    cliente:'', telefono:'', localidad:'', instagram:'', fechaPedido: todayISO(), fechaEntrega:'',
    producto: PRODUCTOS_TIPO[0], medidas:'', color:'', accesorios:[], precio:0, seña:0, saldo:0,
    formaPago: FORMAS_PAGO[0], entrega:'Retira', direccion:'', estado:ESTADOS_PEDIDO[0], observaciones:''
  };
  let accSel = p.accesorios ? p.accesorios.slice() : [];

  const body = `
    <div class="section-title-row" style="margin-top:0;"><h3>Datos del cliente</h3></div>
    <div class="form-grid">
      <div class="field"><label>Nombre del cliente</label><input id="pf_cliente" value="${escapeHtml(p.cliente)}" placeholder="Nombre y apellido"></div>
      <div class="field"><label>Teléfono</label><input id="pf_telefono" value="${escapeHtml(p.telefono)}" placeholder="Ej: 3541455001"></div>
      <div class="field"><label>Localidad</label><input id="pf_localidad" value="${escapeHtml(p.localidad)}" placeholder="Ciudad / barrio"></div>
      <div class="field"><label>Instagram (si llega por redes)</label><input id="pf_instagram" value="${escapeHtml(p.instagram)}" placeholder="@usuario"></div>
    </div>

    <div class="section-title-row"><h3>Detalle del pedido</h3></div>
    <div class="form-grid">
      <div class="field"><label>Fecha del pedido</label><input type="date" id="pf_fechaPedido" value="${p.fechaPedido||''}"></div>
      <div class="field"><label>Fecha de entrega</label><input type="date" id="pf_fechaEntrega" value="${p.fechaEntrega||''}"></div>
      <div class="field"><label>Producto</label>
        <select id="pf_producto">${PRODUCTOS_TIPO.map(t=>`<option ${p.producto===t?'selected':''}>${t}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Medidas</label><input id="pf_medidas" value="${escapeHtml(p.medidas)}" placeholder="Ej: 70 cm diámetro"></div>
      <div class="field"><label>Color</label><input id="pf_color" value="${escapeHtml(p.color)}" placeholder="Ej: óxido natural"></div>
      <div class="field"><label>Estado</label>
        <select id="pf_estado">${ESTADOS_PEDIDO.map(e=>`<option ${p.estado===e?'selected':''}>${e}</option>`).join('')}</select>
      </div>
      <div class="field span-2"><label>Accesorios</label>${accesoriosChips(accSel)}</div>
    </div>

    <div class="section-title-row"><h3>Pago y entrega</h3></div>
    <div class="form-grid cols-3">
      <div class="field"><label>Precio total</label><input type="number" id="pf_precio" value="${p.precio||0}"></div>
      <div class="field"><label>Seña / pagado</label><input type="number" id="pf_seña" value="${p.seña||0}" ${editing? 'readonly title="Para registrar cobros usá el botón Registrar pago desde el detalle del pedido."':''}></div>
      <div class="field"><label>Saldo</label><input type="number" id="pf_saldo" value="${p.saldo||0}" readonly></div>
      <div class="field"><label>Forma de pago</label>
        <select id="pf_formaPago">${FORMAS_PAGO.map(fp=>`<option ${p.formaPago===fp?'selected':''}>${fp}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Entrega</label>
        <select id="pf_entrega">${ENTREGA_TIPOS.map(t=>`<option ${p.entrega===t?'selected':''}>${t}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Dirección de envío</label><input id="pf_direccion" value="${escapeHtml(p.direccion)}" placeholder="Si corresponde"></div>
    </div>

    <div class="form-grid cols-1" style="margin-top:14px;">
      <div class="field"><label>Observaciones</label><textarea id="pf_observaciones" placeholder="Notas internas del pedido...">${escapeHtml(p.observaciones||'')}</textarea></div>
    </div>
  `;

  openModal({
    title: editing ? 'Editar pedido' : 'Nuevo pedido',
    wide: true,
    bodyHtml: body,
    footerHtml: `<button class="btn btn-ghost" id="pfCancel">Cancelar</button><button class="btn btn-primary" id="pfSave">${editing?'Guardar cambios':'Crear pedido'}</button>`,
    onMount: (overlay)=>{
      overlay.querySelectorAll('[data-acc]').forEach(chip=>{
        chip.addEventListener('click', ()=>{
          const a = chip.dataset.acc;
          if(accSel.includes(a)) accSel = accSel.filter(x=>x!==a); else accSel.push(a);
          chip.classList.toggle('on');
        });
      });
      const precioEl = overlay.querySelector('#pf_precio');
      const señaEl = overlay.querySelector('#pf_seña');
      const saldoEl = overlay.querySelector('#pf_saldo');
      function recalcSaldo(){ saldoEl.value = Math.max(0, (Number(precioEl.value)||0) - (Number(señaEl.value)||0)); }
      precioEl.addEventListener('input', recalcSaldo);
      if(!editing) señaEl.addEventListener('input', recalcSaldo);

      overlay.querySelector('#pfCancel').onclick = closeModal;
      overlay.querySelector('#pfSave').onclick = ()=>{
        const cliente = overlay.querySelector('#pf_cliente').value.trim();
        if(!cliente){ showToast('Ingresá el nombre del cliente'); return; }
        const data = {
          cliente, telefono: overlay.querySelector('#pf_telefono').value.trim(),
          localidad: overlay.querySelector('#pf_localidad').value.trim(),
          instagram: overlay.querySelector('#pf_instagram').value.trim(),
          fechaPedido: overlay.querySelector('#pf_fechaPedido').value,
          fechaEntrega: overlay.querySelector('#pf_fechaEntrega').value,
          producto: overlay.querySelector('#pf_producto').value,
          medidas: overlay.querySelector('#pf_medidas').value.trim(),
          color: overlay.querySelector('#pf_color').value.trim(),
          accesorios: accSel,
          precio: Number(precioEl.value)||0,
          seña: Number(señaEl.value)||0,
          saldo: Number(saldoEl.value)||0,
          formaPago: overlay.querySelector('#pf_formaPago').value,
          entrega: overlay.querySelector('#pf_entrega').value,
          direccion: overlay.querySelector('#pf_direccion').value.trim(),
          estado: overlay.querySelector('#pf_estado').value,
          observaciones: overlay.querySelector('#pf_observaciones').value.trim(),
        };
        if(editing){
          Object.assign(p, data);
        } else {
          data.id = uid('ped');
          DB.pedidos.push(data);
        }
        persist();
        closeModal();
        renderPedidosPage();
        showToast(editing ? 'Pedido actualizado' : 'Pedido creado');
      };
    }
  });
}

function viewPedido(id){
  const p = DB.pedidos.find(x=>x.id===id);
  if(!p) return;
  const pagos = DB.caja.filter(c=>c.pedidoId===id);
  const body = `
    <div class="detail-grid">
      <div class="item"><div class="k">Cliente</div><div class="v">${escapeHtml(p.cliente)}</div></div>
      <div class="item"><div class="k">Teléfono</div><div class="v">${escapeHtml(p.telefono)||'—'}</div></div>
      <div class="item"><div class="k">Localidad</div><div class="v">${escapeHtml(p.localidad)||'—'}</div></div>
      <div class="item"><div class="k">Instagram</div><div class="v">${escapeHtml(p.instagram)||'—'}</div></div>
      <div class="item"><div class="k">Producto</div><div class="v">${escapeHtml(p.producto)}</div></div>
      <div class="item"><div class="k">Medidas / color</div><div class="v">${escapeHtml(p.medidas)} · ${escapeHtml(p.color)}</div></div>
      <div class="item"><div class="k">Accesorios</div><div class="v">${(p.accesorios||[]).map(a=>`<span class="tag-chip">${a}</span>`).join('') || '—'}</div></div>
      <div class="item"><div class="k">Estado</div><div class="v">${badgeEstado(p.estado)}</div></div>
      <div class="item"><div class="k">Fecha pedido</div><div class="v">${fmtDate(p.fechaPedido)}</div></div>
      <div class="item"><div class="k">Fecha entrega</div><div class="v">${fmtDate(p.fechaEntrega)}</div></div>
      <div class="item"><div class="k">Entrega</div><div class="v">${escapeHtml(p.entrega)}${p.direccion? ' — '+escapeHtml(p.direccion):''}</div></div>
      <div class="item"><div class="k">Forma de pago</div><div class="v">${escapeHtml(p.formaPago)}</div></div>
    </div>
    <div class="section-title-row"><h3>Pago</h3></div>
    <div class="detail-grid">
      <div class="item"><div class="k">Precio total</div><div class="v">${money(p.precio)}</div></div>
      <div class="item"><div class="k">Pagado (seña / total)</div><div class="v">${money(p.seña)}</div></div>
      <div class="item"><div class="k">Saldo pendiente</div><div class="v" style="color:${p.saldo>0?'var(--danger)':'var(--success)'};font-weight:700;">${money(p.saldo)}</div></div>
    </div>
    <div class="progress-bar" style="margin-top:8px;"><div style="width:${p.precio? clamp((p.seña/p.precio)*100,0,100):0}%"></div></div>

    ${p.observaciones ? `<div class="section-title-row"><h3>Observaciones</h3></div><p style="font-size:13.5px;color:var(--text-dim);line-height:1.5;">${escapeHtml(p.observaciones)}</p>` : ''}

    <div class="section-title-row"><h3>Historial de pagos</h3></div>
    ${pagos.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Forma de pago</th><th class="num">Monto</th></tr></thead><tbody>
      ${pagos.map(c=>`<tr><td>${fmtDate(c.fecha)}</td><td>${escapeHtml(c.categoria)}</td><td>${escapeHtml(c.formaPago)}</td><td class="num">${money(c.monto)}</td></tr>`).join('')}
    </tbody></table></div>` : `<p style="color:var(--text-faint);font-size:13px;">Todavía no se registraron pagos para este pedido.</p>`}
  `;

  openModal({
    title: `Pedido — ${p.cliente}`,
    wide:true,
    bodyHtml: body,
    footerHtml: p.saldo>0 ? `<button class="btn btn-ghost" id="pvClose">Cerrar</button><button class="btn btn-primary" id="pvPagar">${ICON.money} Registrar pago</button>` : `<button class="btn btn-ghost" id="pvClose">Cerrar</button>`,
    onMount:(overlay)=>{
      overlay.querySelector('#pvClose').onclick = closeModal;
      const pagarBtn = overlay.querySelector('#pvPagar');
      if(pagarBtn) pagarBtn.onclick = ()=> openRegistrarPagoForm(p.id);
    }
  });
}

function openRegistrarPagoForm(pedidoId){
  const p = DB.pedidos.find(x=>x.id===pedidoId);
  const esTotal = (monto)=> Number(monto) >= p.saldo;
  const body = `
    <div class="form-grid cols-1">
      <div class="field"><label>Monto a registrar</label><input type="number" id="rp_monto" value="${p.saldo}"></div>
      <div class="field"><label>Categoría</label>
        <select id="rp_categoria">${CATEGORIAS_INGRESO.filter(c=>c!=='Otro ingreso').map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Forma de pago</label>
        <select id="rp_formaPago">${FORMAS_PAGO.map(fp=>`<option ${p.formaPago===fp?'selected':''}>${fp}</option>`).join('')}</select>
      </div>
    </div>
    <p class="timeline-hint">Saldo pendiente actual: ${money(p.saldo)}. Este movimiento se va a sumar automáticamente a Caja.</p>
  `;
  openModal({
    title:'Registrar pago',
    bodyHtml: body,
    footerHtml: `<button class="btn btn-ghost" id="rpCancel">Cancelar</button><button class="btn btn-primary" id="rpSave">Registrar</button>`,
    onMount:(overlay)=>{
      overlay.querySelector('#rpCancel').onclick = closeModal;
      overlay.querySelector('#rpSave').onclick = ()=>{
        const monto = Number(overlay.querySelector('#rp_monto').value)||0;
        if(monto<=0){ showToast('Ingresá un monto válido'); return; }
        const categoria = overlay.querySelector('#rp_categoria').value;
        const formaPago = overlay.querySelector('#rp_formaPago').value;
        registrarPago(pedidoId, monto, categoria, formaPago);
        closeModal();
        renderPedidosPage();
        showToast('Pago registrado en Caja');
      };
    }
  });
}

/* ================================ CAJA ================================ */

function renderCajaPage(){
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = `<button class="btn btn-primary" id="btnNuevoMov">${ICON.plus}Nuevo movimiento</button>`;
  actions.querySelector('#btnNuevoMov').onclick = ()=> openCajaForm();

  const content = document.getElementById('pageContent');
  const f = state.filters;
  let list = DB.caja.slice().sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||''));
  if(f.cajaTipo) list = list.filter(c=>c.tipo===f.cajaTipo);
  if(f.cajaBusca){
    const q = f.cajaBusca.toLowerCase();
    list = list.filter(c=> (c.descripcion+c.categoria).toLowerCase().includes(q));
  }
  const totIngresos = list.filter(c=>c.tipo==='ingreso').reduce((s,c)=>s+Number(c.monto||0),0);
  const totEgresos = list.filter(c=>c.tipo==='egreso').reduce((s,c)=>s+Number(c.monto||0),0);

  content.innerHTML = `
    <div class="grid grid-3">
      <div class="card kpi"><div class="label">Ingresos (filtro actual)</div><div class="value" style="color:var(--success)">${money(totIngresos)}</div></div>
      <div class="card kpi"><div class="label">Egresos (filtro actual)</div><div class="value" style="color:var(--danger)">${money(totEgresos)}</div></div>
      <div class="card kpi"><div class="label">Neto</div><div class="value">${money(totIngresos-totEgresos)}</div></div>
    </div>

    <div class="toolbar" style="margin-top:22px;">
      <div class="toolbar-left">
        <div class="search-box">${ICON.search}<input type="text" id="fCajaBusca" placeholder="Buscar movimiento..." value="${escapeHtml(f.cajaBusca)}"></div>
        <select class="select-filter" id="fCajaTipo">
          <option value="">Todos</option>
          <option value="ingreso" ${f.cajaTipo==='ingreso'?'selected':''}>Ingresos</option>
          <option value="egreso" ${f.cajaTipo==='egreso'?'selected':''}>Egresos</option>
        </select>
      </div>
      <div class="toolbar-left" style="color:var(--text-dim);font-size:12.5px;">${list.length} movimiento${list.length!==1?'s':''}</div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Forma de pago</th><th class="num">Monto</th><th></th></tr></thead>
        <tbody>
          ${list.map(c=>`
            <tr>
              <td>${fmtDate(c.fecha)}</td>
              <td><span class="badge badge-${c.tipo==='ingreso'?'success':'danger'}"><span class="dot" style="background:currentColor"></span>${c.tipo==='ingreso'?'Ingreso':'Egreso'}</span></td>
              <td>${escapeHtml(c.categoria)}</td>
              <td>${escapeHtml(c.descripcion)}${c.pedidoId?' <span class="tag-chip">vinculado a pedido</span>':''}</td>
              <td>${escapeHtml(c.formaPago)}</td>
              <td class="num" style="color:${c.tipo==='ingreso'?'var(--success)':'var(--danger)'};font-weight:700;">${c.tipo==='ingreso'?'+':'-'} ${money(c.monto)}</td>
              <td><div class="row-actions">
                <button class="icon-btn" data-edit="${c.id}" title="Editar">${ICON.edit}</button>
                <button class="icon-btn danger" data-del="${c.id}" title="Eliminar">${ICON.trash}</button>
              </div></td>
            </tr>`).join('') || `<tr><td colspan="7"><div class="empty-state">${ICON.caja}<div class="title">Sin movimientos</div><p>Registrá un ingreso o egreso para empezar.</p></div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  content.querySelector('#fCajaBusca').addEventListener('input', e=>{ f.cajaBusca=e.target.value; renderCajaPage(); });
  content.querySelector('#fCajaTipo').addEventListener('change', e=>{ f.cajaTipo=e.target.value; renderCajaPage(); });
  content.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> openCajaForm(b.dataset.edit));
  content.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=>{
    confirmAction('¿Eliminar este movimiento de caja?', ()=>{
      DB.caja = DB.caja.filter(x=>x.id!==b.dataset.del);
      persist(); renderCajaPage(); showToast('Movimiento eliminado');
    });
  });
}

function openCajaForm(id){
  const editing = !!id;
  const c = editing ? DB.caja.find(x=>x.id===id) : { fecha: todayISO(), tipo:'ingreso', categoria: CATEGORIAS_INGRESO[0], descripcion:'', monto:0, formaPago:FORMAS_PAGO[0] };

  const body = `
    <div class="form-grid">
      <div class="field"><label>Tipo</label>
        <select id="cf_tipo">
          <option value="ingreso" ${c.tipo==='ingreso'?'selected':''}>Ingreso</option>
          <option value="egreso" ${c.tipo==='egreso'?'selected':''}>Egreso</option>
        </select>
      </div>
      <div class="field"><label>Fecha</label><input type="date" id="cf_fecha" value="${c.fecha}"></div>
      <div class="field span-2"><label>Categoría</label><select id="cf_categoria"></select></div>
      <div class="field span-2"><label>Descripción</label><input id="cf_descripcion" value="${escapeHtml(c.descripcion)}" placeholder="Detalle del movimiento"></div>
      <div class="field"><label>Monto</label><input type="number" id="cf_monto" value="${c.monto}"></div>
      <div class="field"><label>Forma de pago</label><select id="cf_formaPago">${FORMAS_PAGO.map(fp=>`<option ${c.formaPago===fp?'selected':''}>${fp}</option>`).join('')}</select></div>
    </div>
  `;
  openModal({
    title: editing ? 'Editar movimiento' : 'Nuevo movimiento de caja',
    bodyHtml: body,
    footerHtml: `<button class="btn btn-ghost" id="cfCancel">Cancelar</button><button class="btn btn-primary" id="cfSave">${editing?'Guardar':'Registrar'}</button>`,
    onMount:(overlay)=>{
      const tipoEl = overlay.querySelector('#cf_tipo');
      const catEl = overlay.querySelector('#cf_categoria');
      function fillCategorias(){
        const cats = tipoEl.value==='ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
        catEl.innerHTML = cats.map(x=>`<option ${c.categoria===x?'selected':''}>${x}</option>`).join('');
      }
      fillCategorias();
      tipoEl.addEventListener('change', fillCategorias);
      overlay.querySelector('#cfCancel').onclick = closeModal;
      overlay.querySelector('#cfSave').onclick = ()=>{
        const data = {
          tipo: tipoEl.value, fecha: overlay.querySelector('#cf_fecha').value,
          categoria: catEl.value, descripcion: overlay.querySelector('#cf_descripcion').value.trim(),
          monto: Number(overlay.querySelector('#cf_monto').value)||0,
          formaPago: overlay.querySelector('#cf_formaPago').value
        };
        if(!data.descripcion){ showToast('Ingresá una descripción'); return; }
        if(editing){ Object.assign(c, data); } else { data.id = uid('cj'); DB.caja.push(data); }
        persist(); closeModal(); renderCajaPage();
        showToast(editing ? 'Movimiento actualizado' : 'Movimiento registrado');
      };
    }
  });
}

/* ================================ BALANCE MENSUAL ================================ */

function renderBalancePage(){
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = `<button class="btn btn-ghost" id="btnImprimir">${ICON.print}Imprimir / PDF</button>`;
  actions.querySelector('#btnImprimir').onclick = ()=> window.print();

  const content = document.getElementById('pageContent');
  const f = state.filters;
  const mesesDisponibles = Array.from(new Set(DB.caja.map(c=>monthKey(c.fecha)))).sort().reverse();
  if(!mesesDisponibles.includes(f.balanceKey)) mesesDisponibles.unshift(f.balanceKey);

  const t = totalesMes(f.balanceKey);
  const porCategoriaIngreso = {};
  const porCategoriaEgreso = {};
  t.items.forEach(i=>{
    const bucket = i.tipo==='ingreso' ? porCategoriaIngreso : porCategoriaEgreso;
    bucket[i.categoria] = (bucket[i.categoria]||0) + Number(i.monto||0);
  });

  content.innerHTML = `
    <div class="toolbar no-print">
      <div class="toolbar-left">
        <select class="select-filter" id="fBalanceMes">
          ${mesesDisponibles.map(k=>`<option value="${k}" ${f.balanceKey===k?'selected':''}>${monthLabel(k)}</option>`).join('')}
        </select>
      </div>
    </div>

    <h2 style="margin-bottom:18px;">${monthLabel(f.balanceKey)}</h2>

    <div class="grid grid-3">
      <div class="card kpi"><div class="label">Total ingresos</div><div class="value" style="color:var(--success)">${money(t.ingresos)}</div></div>
      <div class="card kpi"><div class="label">Total egresos</div><div class="value" style="color:var(--danger)">${money(t.egresos)}</div></div>
      <div class="card kpi"><div class="label">Resultado neto</div><div class="value" style="color:${t.neto>=0?'var(--success)':'var(--danger)'}">${money(t.neto)}</div></div>
    </div>

    <div class="two-col" style="margin-top:20px;">
      <div class="card">
        <div class="card-header"><h3>Ingresos por categoría</h3></div>
        ${Object.keys(porCategoriaIngreso).length ? Object.entries(porCategoriaIngreso).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>`
          <div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${k}</div><span class="val">${money(v)}</span></div>
        `).join('') : `<p style="color:var(--text-faint);font-size:13px;">Sin ingresos este mes.</p>`}
      </div>
      <div class="card">
        <div class="card-header"><h3>Egresos por categoría</h3></div>
        ${Object.keys(porCategoriaEgreso).length ? Object.entries(porCategoriaEgreso).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>`
          <div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${k}</div><span class="val">${money(v)}</span></div>
        `).join('') : `<p style="color:var(--text-faint);font-size:13px;">Sin egresos este mes.</p>`}
      </div>
    </div>

    <div class="section-title-row"><h3>Detalle de movimientos del mes</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th class="num">Monto</th></tr></thead>
        <tbody>
          ${t.items.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(c=>`
            <tr>
              <td>${fmtDate(c.fecha)}</td>
              <td><span class="badge badge-${c.tipo==='ingreso'?'success':'danger'}">${c.tipo==='ingreso'?'Ingreso':'Egreso'}</span></td>
              <td>${escapeHtml(c.categoria)}</td>
              <td>${escapeHtml(c.descripcion)}</td>
              <td class="num" style="color:${c.tipo==='ingreso'?'var(--success)':'var(--danger)'}">${c.tipo==='ingreso'?'+':'-'} ${money(c.monto)}</td>
            </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:24px;">Sin movimientos registrados este mes</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="footer-brand"><img src="logo-dark.png">Casa de Herrero — balance generado el ${fmtDate(todayISO())}</div>
  `;
  content.querySelector('#fBalanceMes').addEventListener('change', e=>{ f.balanceKey = e.target.value; renderBalancePage(); });
}

/* ================================ STOCK ================================ */

function renderStockPage(){
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = `<button class="btn btn-primary" id="btnNuevoStock">${ICON.plus}Nuevo insumo</button>`;
  actions.querySelector('#btnNuevoStock').onclick = ()=> openStockForm();

  const content = document.getElementById('pageContent');
  const list = DB.stock.slice().sort((a,b)=> a.nombre.localeCompare(b.nombre));
  const bajos = list.filter(s=>Number(s.cantidad) <= Number(s.stockMinimo));

  content.innerHTML = `
    ${bajos.length ? `<div class="card" style="border-color:#e3c3b8;background:#fdf6f2;margin-bottom:18px;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="color:var(--danger);flex-shrink:0;">${ICON.alert}</div>
        <div>
          <strong style="color:var(--danger);">Stock bajo en ${bajos.length} insumo${bajos.length!==1?'s':''}</strong>
          <p style="font-size:13px;color:var(--text-dim);margin-top:3px;">${bajos.map(b=>b.nombre).join(' · ')}</p>
        </div>
      </div>
    </div>` : ''}

    <div class="table-wrap">
      <table>
        <thead><tr><th>Insumo</th><th>Categoría</th><th class="num">Cantidad</th><th>Unidad</th><th class="num">Mínimo</th><th class="num">Costo unit.</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${list.map(s=>{
            const bajo = Number(s.cantidad) <= Number(s.stockMinimo);
            return `<tr>
              <td>${escapeHtml(s.nombre)}</td>
              <td>${escapeHtml(s.categoria)}</td>
              <td class="num" style="font-weight:700;">${s.cantidad}</td>
              <td>${escapeHtml(s.unidad)}</td>
              <td class="num">${s.stockMinimo}</td>
              <td class="num">${money(s.costoUnitario)}</td>
              <td>${bajo ? `<span class="badge badge-danger">${ICON.alert} Bajo</span>` : `<span class="badge badge-success">OK</span>`}</td>
              <td><div class="row-actions">
                <button class="icon-btn" data-adj="${s.id}" title="Ajustar cantidad">±</button>
                <button class="icon-btn" data-edit="${s.id}" title="Editar">${ICON.edit}</button>
                <button class="icon-btn danger" data-del="${s.id}" title="Eliminar">${ICON.trash}</button>
              </div></td>
            </tr>`;
          }).join('') || `<tr><td colspan="8"><div class="empty-state">${ICON.stock}<div class="title">Sin insumos cargados</div></div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  content.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> openStockForm(b.dataset.edit));
  content.querySelectorAll('[data-adj]').forEach(b=> b.onclick = ()=> openAjusteStock(b.dataset.adj));
  content.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=>{
    confirmAction('¿Eliminar este insumo del stock?', ()=>{
      DB.stock = DB.stock.filter(x=>x.id!==b.dataset.del);
      persist(); renderStockPage(); showToast('Insumo eliminado');
    });
  });
}

function openStockForm(id){
  const editing = !!id;
  const s = editing ? DB.stock.find(x=>x.id===id) : { nombre:'', categoria: STOCK_CATEGORIAS[0], unidad: STOCK_UNIDADES[0], cantidad:0, stockMinimo:0, costoUnitario:0, movimientos:[] };
  const body = `
    <div class="form-grid">
      <div class="field span-2"><label>Nombre del insumo</label><input id="sf_nombre" value="${escapeHtml(s.nombre)}" placeholder="Ej: Varilla de hierro 6mm"></div>
      <div class="field"><label>Categoría</label><select id="sf_categoria">${STOCK_CATEGORIAS.map(c=>`<option ${s.categoria===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Unidad</label><select id="sf_unidad">${STOCK_UNIDADES.map(u=>`<option ${s.unidad===u?'selected':''}>${u}</option>`).join('')}</select></div>
      <div class="field"><label>Cantidad actual</label><input type="number" id="sf_cantidad" value="${s.cantidad}"></div>
      <div class="field"><label>Stock mínimo (alerta)</label><input type="number" id="sf_min" value="${s.stockMinimo}"></div>
      <div class="field"><label>Costo unitario</label><input type="number" id="sf_costo" value="${s.costoUnitario}"></div>
    </div>
  `;
  openModal({
    title: editing ? 'Editar insumo' : 'Nuevo insumo',
    bodyHtml: body,
    footerHtml: `<button class="btn btn-ghost" id="sfCancel">Cancelar</button><button class="btn btn-primary" id="sfSave">${editing?'Guardar':'Agregar'}</button>`,
    onMount:(overlay)=>{
      overlay.querySelector('#sfCancel').onclick = closeModal;
      overlay.querySelector('#sfSave').onclick = ()=>{
        const nombre = overlay.querySelector('#sf_nombre').value.trim();
        if(!nombre){ showToast('Ingresá el nombre del insumo'); return; }
        const data = {
          nombre, categoria: overlay.querySelector('#sf_categoria').value, unidad: overlay.querySelector('#sf_unidad').value,
          cantidad: Number(overlay.querySelector('#sf_cantidad').value)||0,
          stockMinimo: Number(overlay.querySelector('#sf_min').value)||0,
          costoUnitario: Number(overlay.querySelector('#sf_costo').value)||0
        };
        if(editing){ Object.assign(s, data); } else { data.id = uid('st'); data.movimientos=[]; DB.stock.push(data); }
        persist(); closeModal(); renderStockPage();
        showToast(editing ? 'Insumo actualizado' : 'Insumo agregado');
      };
    }
  });
}

function openAjusteStock(id){
  const s = DB.stock.find(x=>x.id===id);
  const body = `
    <div class="form-grid">
      <div class="field"><label>Cantidad actual</label><input value="${s.cantidad} ${s.unidad}" readonly></div>
      <div class="field"><label>Ajuste (+ entrada / - salida)</label><input type="number" id="aj_delta" value="0" placeholder="Ej: 10 o -5"></div>
      <div class="field span-2"><label>Motivo</label><input id="aj_motivo" placeholder="Ej: compra, uso en pedido, merma..."></div>
    </div>
    ${s.movimientos && s.movimientos.length ? `
      <div class="section-title-row"><h3>Últimos movimientos</h3></div>
      <div class="table-wrap"><table><thead><tr><th>Fecha</th><th class="num">Cantidad</th><th>Motivo</th></tr></thead><tbody>
        ${s.movimientos.slice(0,6).map(m=>`<tr><td>${fmtDate(m.fecha)}</td><td class="num" style="color:${m.cantidad>=0?'var(--success)':'var(--danger)'}">${m.cantidad>=0?'+':''}${m.cantidad}</td><td>${escapeHtml(m.motivo)}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
  `;
  openModal({
    title: `Ajustar stock — ${s.nombre}`,
    bodyHtml: body,
    footerHtml: `<button class="btn btn-ghost" id="ajCancel">Cancelar</button><button class="btn btn-primary" id="ajSave">Aplicar ajuste</button>`,
    onMount:(overlay)=>{
      overlay.querySelector('#ajCancel').onclick = closeModal;
      overlay.querySelector('#ajSave').onclick = ()=>{
        const delta = Number(overlay.querySelector('#aj_delta').value)||0;
        const motivo = overlay.querySelector('#aj_motivo').value.trim();
        if(delta===0){ showToast('Ingresá una cantidad distinta de 0'); return; }
        ajustarStock(id, delta, motivo || (delta>0?'Ingreso de stock':'Salida de stock'));
        closeModal(); renderStockPage();
        showToast('Stock actualizado');
      };
    }
  });
}

/* ================================ CLIENTES ================================ */

function renderClientesPage(){
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = `<button class="btn btn-primary" id="btnNuevoCliente">${ICON.plus}Nuevo cliente</button>`;
  actions.querySelector('#btnNuevoCliente').onclick = ()=> openClienteForm();

  const content = document.getElementById('pageContent');
  const f = state.filters;
  let list = DB.clientes.slice();
  if(f.clientesBusca){
    const q = f.clientesBusca.toLowerCase();
    list = list.filter(c=> (c.nombre+c.telefono+c.localidad).toLowerCase().includes(q));
  }
  list = list.map(c=>({...c, stats: clienteStats(c.telefono)})).sort((a,b)=>b.stats.total-a.stats.total);

  content.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left"><div class="search-box">${ICON.search}<input type="text" id="fClientesBusca" placeholder="Buscar cliente..." value="${escapeHtml(f.clientesBusca)}"></div></div>
      <div class="toolbar-left" style="color:var(--text-dim);font-size:12.5px;">${list.length} cliente${list.length!==1?'s':''}</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Cliente</th><th>Teléfono</th><th>Localidad</th><th class="num">Pedidos</th><th class="num">Total comprado</th><th>Último pedido</th><th></th></tr></thead>
        <tbody>
          ${list.map(c=>`
            <tr>
              <td>
                <div class="client-name-cell">
                  <div class="avatar-letter">${escapeHtml((c.nombre||'?').charAt(0).toUpperCase())}</div>
                  <div class="meta"><span>${escapeHtml(c.nombre)}</span><span class="sub">${escapeHtml(c.instagram||'')}</span></div>
                </div>
              </td>
              <td>${escapeHtml(c.telefono)||'—'}</td>
              <td>${escapeHtml(c.localidad)||'—'}</td>
              <td class="num">${c.stats.cantidad}</td>
              <td class="num" style="font-weight:700;">${money(c.stats.total)}</td>
              <td>${c.stats.ultimoPedido ? fmtDate(c.stats.ultimoPedido) : '—'}</td>
              <td><div class="row-actions">
                <button class="icon-btn" data-view="${c.id}" title="Ver historial">${ICON.eye}</button>
                <button class="icon-btn" data-edit="${c.id}" title="Editar">${ICON.edit}</button>
                <button class="icon-btn danger" data-del="${c.id}" title="Eliminar">${ICON.trash}</button>
              </div></td>
            </tr>`).join('') || `<tr><td colspan="7"><div class="empty-state">${ICON.clientes}<div class="title">Sin clientes cargados</div></div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  content.querySelector('#fClientesBusca').addEventListener('input', e=>{ f.clientesBusca=e.target.value; renderClientesPage(); });
  content.querySelectorAll('[data-view]').forEach(b=> b.onclick = ()=> viewCliente(b.dataset.view));
  content.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> openClienteForm(b.dataset.edit));
  content.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=>{
    confirmAction('¿Eliminar este cliente de la base? (No elimina sus pedidos históricos)', ()=>{
      DB.clientes = DB.clientes.filter(x=>x.id!==b.dataset.del);
      persist(); renderClientesPage(); showToast('Cliente eliminado');
    });
  });
}

function viewCliente(id){
  const c = DB.clientes.find(x=>x.id===id);
  if(!c) return;
  const st = clienteStats(c.telefono);
  const body = `
    <div class="detail-grid">
      <div class="item"><div class="k">Teléfono</div><div class="v">${escapeHtml(c.telefono)||'—'}</div></div>
      <div class="item"><div class="k">Localidad</div><div class="v">${escapeHtml(c.localidad)||'—'}</div></div>
      <div class="item"><div class="k">Instagram</div><div class="v">${escapeHtml(c.instagram)||'—'}</div></div>
      <div class="item"><div class="k">Total comprado</div><div class="v" style="font-weight:700;">${money(st.total)}</div></div>
    </div>
    ${c.notas ? `<div class="section-title-row"><h3>Notas</h3></div><p style="font-size:13px;color:var(--text-dim);">${escapeHtml(c.notas)}</p>` : ''}
    <div class="section-title-row"><h3>Historial de pedidos</h3></div>
    <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Estado</th><th class="num">Precio</th><th class="num">Saldo</th></tr></thead><tbody>
      ${st.pedidos.sort((a,b)=>b.fechaPedido.localeCompare(a.fechaPedido)).map(p=>`
        <tr><td>${fmtDate(p.fechaPedido)}</td><td>${escapeHtml(p.producto)}</td><td>${badgeEstado(p.estado)}</td><td class="num">${money(p.precio)}</td><td class="num">${money(p.saldo)}</td></tr>
      `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:20px;">Sin pedidos registrados</td></tr>`}
    </tbody></table></div>
  `;
  openModal({ title:`Cliente — ${c.nombre}`, wide:true, bodyHtml: body, footerHtml:`<button class="btn btn-ghost" id="cvClose">Cerrar</button>`, onMount:(o)=>{ o.querySelector('#cvClose').onclick=closeModal; } });
}

function openClienteForm(id){
  const editing = !!id;
  const c = editing ? DB.clientes.find(x=>x.id===id) : { nombre:'', telefono:'', localidad:'', instagram:'', notas:'' };
  const body = `
    <div class="form-grid">
      <div class="field"><label>Nombre</label><input id="clf_nombre" value="${escapeHtml(c.nombre)}"></div>
      <div class="field"><label>Teléfono</label><input id="clf_telefono" value="${escapeHtml(c.telefono)}"></div>
      <div class="field"><label>Localidad</label><input id="clf_localidad" value="${escapeHtml(c.localidad)}"></div>
      <div class="field"><label>Instagram</label><input id="clf_instagram" value="${escapeHtml(c.instagram)}"></div>
      <div class="field span-2"><label>Notas</label><textarea id="clf_notas">${escapeHtml(c.notas||'')}</textarea></div>
    </div>
  `;
  openModal({
    title: editing?'Editar cliente':'Nuevo cliente', bodyHtml: body,
    footerHtml: `<button class="btn btn-ghost" id="clfCancel">Cancelar</button><button class="btn btn-primary" id="clfSave">${editing?'Guardar':'Agregar'}</button>`,
    onMount:(overlay)=>{
      overlay.querySelector('#clfCancel').onclick = closeModal;
      overlay.querySelector('#clfSave').onclick = ()=>{
        const nombre = overlay.querySelector('#clf_nombre').value.trim();
        if(!nombre){ showToast('Ingresá el nombre'); return; }
        const data = { nombre, telefono: overlay.querySelector('#clf_telefono').value.trim(), localidad: overlay.querySelector('#clf_localidad').value.trim(), instagram: overlay.querySelector('#clf_instagram').value.trim(), notas: overlay.querySelector('#clf_notas').value.trim() };
        if(editing){ Object.assign(c,data); } else { data.id=uid('cli'); data.manual=true; DB.clientes.push(data); }
        persist(); closeModal(); renderClientesPage();
        showToast(editing?'Cliente actualizado':'Cliente agregado');
      };
    }
  });
}

/* ================================ ESTADÍSTICAS ================================ */

function renderEstadisticasPage(){
  const content = document.getElementById('pageContent');

  const porCliente = {};
  DB.pedidos.forEach(p=>{ porCliente[p.cliente] = (porCliente[p.cliente]||0) + Number(p.precio||0); });
  const topClientes = Object.entries(porCliente).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const porProducto = {};
  DB.pedidos.forEach(p=>{ porProducto[p.producto] = (porProducto[p.producto]||0)+1; });
  const topProductos = Object.entries(porProducto).sort((a,b)=>b[1]-a[1]);

  const porColor = {};
  DB.pedidos.forEach(p=>{ if(p.color) porColor[p.color] = (porColor[p.color]||0)+1; });
  const topColores = Object.entries(porColor).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const porAccesorio = {};
  DB.pedidos.forEach(p=> (p.accesorios||[]).forEach(a=>{ porAccesorio[a]=(porAccesorio[a]||0)+1; }));
  const topAccesorios = Object.entries(porAccesorio).sort((a,b)=>b[1]-a[1]);

  const porFormaPago = {};
  DB.caja.filter(c=>c.tipo==='ingreso').forEach(c=>{ porFormaPago[c.formaPago]=(porFormaPago[c.formaPago]||0)+1; });
  const topFormaPago = Object.entries(porFormaPago).sort((a,b)=>b[1]-a[1]);

  const porLocalidad = {};
  DB.pedidos.forEach(p=>{ if(p.localidad) porLocalidad[p.localidad]=(porLocalidad[p.localidad]||0)+1; });
  const topLocalidades = Object.entries(porLocalidad).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const ticketProm = DB.pedidos.length ? DB.pedidos.reduce((s,p)=>s+Number(p.precio||0),0)/DB.pedidos.length : 0;
  const conSeña = DB.pedidos.filter(p=>p.seña>0 && p.seña<p.precio).length;
  const pagoTotal = DB.pedidos.filter(p=>p.saldo===0).length;
  const sinSeña = DB.pedidos.length - conSeña - pagoTotal;

  const entregasCompletas = DB.pedidos.filter(p=>p.estado==='Entregado' && p.fechaEntrega && p.fechaPedido);
  const tiempoProm = entregasCompletas.length ? Math.round(entregasCompletas.reduce((s,p)=>s+daysBetween(p.fechaPedido,p.fechaEntrega),0)/entregasCompletas.length) : null;

  content.innerHTML = `
    <div class="grid grid-4">
      <div class="card kpi"><div class="label">Ticket promedio</div><div class="value">${money(ticketProm)}</div></div>
      <div class="card kpi"><div class="label">Tiempo promedio de entrega</div><div class="value">${tiempoProm!==null ? tiempoProm+' días' : '—'}</div><div class="delta flat">sobre pedidos entregados</div></div>
      <div class="card kpi"><div class="label">Producto más vendido</div><div class="value" style="font-size:17px;">${topProductos[0]? escapeHtml(topProductos[0][0]) : '—'}</div></div>
      <div class="card kpi"><div class="label">Forma de pago más usada</div><div class="value" style="font-size:17px;">${topFormaPago[0]? escapeHtml(topFormaPago[0][0]) : '—'}</div></div>
    </div>

    <div class="section-title-row"><h3>Cómo se financian los pedidos</h3></div>
    <div class="card">
      <div style="display:flex;gap:26px;flex-wrap:wrap;">
        <div style="flex:1;min-width:160px;"><div class="label" style="font-size:11px;color:var(--text-dim);text-transform:uppercase;font-weight:700;">Pago total anticipado</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;">${pagoTotal}</div></div>
        <div style="flex:1;min-width:160px;"><div class="label" style="font-size:11px;color:var(--text-dim);text-transform:uppercase;font-weight:700;">Con seña</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;">${conSeña}</div></div>
        <div style="flex:1;min-width:160px;"><div class="label" style="font-size:11px;color:var(--text-dim);text-transform:uppercase;font-weight:700;">Sin seña</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;">${Math.max(0,sinSeña)}</div></div>
      </div>
    </div>

    <div class="two-col" style="margin-top:22px;">
      <div class="card">
        <div class="card-header"><h3>Top 5 clientes por facturación</h3></div>
        ${topClientes.map(([nombre,total],i)=>`<div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${escapeHtml(nombre)}</div><span class="val">${money(total)}</span></div>`).join('') || '<p style="color:var(--text-faint);font-size:13px;">Sin datos.</p>'}
      </div>
      <div class="card">
        <div class="card-header"><h3>Productos por cantidad de pedidos</h3></div>
        ${topProductos.map(([nombre,cant],i)=>`<div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${escapeHtml(nombre)}</div><span class="val">${cant}</span></div>`).join('') || '<p style="color:var(--text-faint);font-size:13px;">Sin datos.</p>'}
      </div>
    </div>

    <div class="two-col" style="margin-top:18px;">
      <div class="card">
        <div class="card-header"><h3>Colores más pedidos</h3></div>
        ${topColores.map(([nombre,cant],i)=>`<div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${escapeHtml(nombre)}</div><span class="val">${cant}</span></div>`).join('') || '<p style="color:var(--text-faint);font-size:13px;">Sin datos.</p>'}
      </div>
      <div class="card">
        <div class="card-header"><h3>Accesorios más solicitados</h3></div>
        ${topAccesorios.map(([nombre,cant],i)=>`<div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${escapeHtml(nombre)}</div><span class="val">${cant}</span></div>`).join('') || '<p style="color:var(--text-faint);font-size:13px;">Sin datos.</p>'}
      </div>
    </div>

    <div class="section-title-row"><h3>Localidades principales</h3></div>
    <div class="card">
      ${topLocalidades.map(([nombre,cant],i)=>`<div class="stat-line"><div class="name-row"><span class="rank">${i+1}</span>${escapeHtml(nombre)}</div><span class="val">${cant} pedido${cant!==1?'s':''}</span></div>`).join('') || '<p style="color:var(--text-faint);font-size:13px;">Sin datos.</p>'}
    </div>

    <div class="footer-brand"><img src="logo-dark.png">Casa de Herrero — estadísticas calculadas automáticamente sobre los datos cargados</div>
  `;
}

/* ================================ INIT ================================ */

document.addEventListener('DOMContentLoaded', ()=>{
  renderShell();
  const initialRoute = location.hash.replace('#/','') || 'dashboard';
  state.route = initialRoute;
  render();
});

/* ================================ GOOGLE DRIVE SYNC ================================
   Guarda y lee un único archivo JSON (cdh_gestion_db.json) en la carpeta
   privada "appDataFolder" de Google Drive del usuario logueado. Esa carpeta
   no se ve en el Drive normal del usuario (es de uso exclusivo de esta app),
   así que no ensucia ni interfiere con sus archivos.
   ==================================================================== */

let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let driveAccessToken = null;
let driveFileId = null;
let driveSyncState = 'idle'; // idle | saving | saved | error
let driveAutoSaveTimer = null;
let driveLastSyncTime = null;

const DRIVE_FLAG_KEY = 'cdh_drive_was_connected';
const DRIVE_AUTOSAVE_DELAY = 1800;

function driveConfigured(){
  return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.indexOf('PEGAR_CLIENT_ID_ACA') === -1;
}

function gapiLoad(cb){
  if(window.gapi && gapiInited){ cb(); return; }
  if(!window.gapi){ setTimeout(()=>gapiLoad(cb), 300); return; }
  gapi.load('client', async ()=>{
    await gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
    gapiInited = true;
    cb();
  });
}

function gisEnsureInit(){
  if(gisInited) return;
  if(!window.google || !google.accounts){ return; }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_DRIVE_SCOPE,
    callback: '' // se define en cada llamado
  });
  gisInited = true;
}

function driveConnect(silent){
  if(!driveConfigured()){
    showToast('Falta configurar el Client ID de Google en app.js');
    return;
  }
  gapiLoad(()=>{
    gisEnsureInit();
    if(!tokenClient){ setTimeout(()=>driveConnect(silent), 400); return; }
    tokenClient.callback = async (resp)=>{
      if(resp.error){
        if(!silent) showToast('No se pudo conectar con Google Drive');
        return;
      }
      driveAccessToken = resp.access_token;
      gapi.client.setToken({access_token: driveAccessToken});
      localStorage.setItem(DRIVE_FLAG_KEY, '1');
      renderDriveStatus();
      if(!silent) showToast('Conectado a Google Drive');
    };
    tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
  });
}

function driveDisconnect(){
  if(driveAccessToken && window.google){
    google.accounts.oauth2.revoke(driveAccessToken, ()=>{});
  }
  driveAccessToken = null;
  driveFileId = null;
  localStorage.removeItem(DRIVE_FLAG_KEY);
  renderDriveStatus();
  showToast('Google Drive desconectado');
}

async function driveFindFile(){
  const res = await gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name, modifiedTime)',
    q: `name='${GOOGLE_DRIVE_FILENAME}'`
  });
  const files = res.result.files || [];
  return files[0] || null;
}

async function driveSave(silent){
  if(!driveAccessToken){ if(!silent) showToast('Conectá Google Drive primero'); return; }
  driveSyncState = 'saving';
  renderDriveStatus();
  try{
    const existing = await driveFindFile();
    const content = JSON.stringify(DB);
    const boundary = 'cdh_boundary_' + Date.now();
    const metadata = existing ? {} : { name: GOOGLE_DRIVE_FILENAME, parents: ['appDataFolder'] };
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;

    const url = existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
    const method = existing ? 'PATCH' : 'POST';

    const resp = await fetch(url, {
      method,
      headers: { 'Authorization': 'Bearer ' + driveAccessToken, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body
    });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    driveFileId = data.id;
    driveSyncState = 'saved';
    driveLastSyncTime = new Date();
    if(!silent) showToast('Datos guardados en Google Drive');
    renderDriveStatus();
  }catch(e){
    console.error(e);
    driveSyncState = 'error';
    if(!silent) showToast('Error al guardar en Google Drive');
    renderDriveStatus();
  }
}

function scheduleDriveAutoSave(){
  if(!driveAccessToken) return;
  driveSyncState = 'pending';
  renderDriveStatus();
  clearTimeout(driveAutoSaveTimer);
  driveAutoSaveTimer = setTimeout(()=> driveSave(true), DRIVE_AUTOSAVE_DELAY);
}

async function driveLoadConfirm(){
  if(!driveAccessToken){ showToast('Conectá Google Drive primero'); return; }
  confirmAction('Esto va a reemplazar los datos actuales en este dispositivo por los que están guardados en Google Drive. ¿Continuar?', driveLoad);
}

async function driveLoad(){
  try{
    const existing = await driveFindFile();
    if(!existing){ showToast('Todavía no hay datos guardados en Google Drive'); return; }
    const resp = await gapi.client.drive.files.get({ fileId: existing.id, alt: 'media' });
    const remote = typeof resp.result === 'string' ? JSON.parse(resp.result) : resp.result;
    DB = remote;
    saveDB(DB);
    driveFileId = existing.id;
    driveSyncState = 'saved';
    driveLastSyncTime = new Date();
    render();
    showToast('Datos cargados desde Google Drive');
  }catch(e){
    console.error(e);
    showToast('Error al cargar desde Google Drive');
  }
}

function driveSyncLabel(){
  if(!driveConfigured()) return 'Google Drive (sin configurar)';
  if(!driveAccessToken) return 'Conectar Google Drive';
  switch(driveSyncState){
    case 'saving': return 'Guardando en Drive...';
    case 'pending': return 'Cambios sin guardar...';
    case 'error': return 'Error al sincronizar';
    case 'saved': return driveLastSyncTime ? `Sincronizado ${driveLastSyncTime.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}` : 'Sincronizado';
    default: return 'Google Drive conectado';
  }
}

function renderDriveStatus(){
  const el = document.getElementById('driveStatusBtn');
  if(!el) return;
  const connected = !!driveAccessToken;
  const busy = driveSyncState === 'saving' || driveSyncState === 'pending';
  const hasError = driveSyncState === 'error';
  el.innerHTML = `
    <div class="drive-pill ${connected?'on':''} ${busy?'busy':''} ${hasError?'err':''}" id="driveOpenBtn">
      ${ICON.cloud}
      <span>${driveSyncLabel()}</span>
    </div>`;
  el.querySelector('#driveOpenBtn').onclick = openDriveModal;
}

function openDriveModal(){
  const connected = !!driveAccessToken;
  const configured = driveConfigured();
  const body = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div class="icon-badge" style="background:${connected?'var(--success-bg)':'var(--parchment-2)'};color:${connected?'var(--success)':'var(--rust)'};">${ICON.cloud}</div>
      <div>
        <strong>${connected ? 'Conectado a Google Drive' : configured ? 'No conectado' : 'Falta configurar'}</strong>
        <div class="timeline-hint">${connected ? 'Guardado automático activado — cada cambio se sube solo, unos segundos después de hacerlo.' : configured ? 'Conectá tu cuenta de Google para sincronizar entre dispositivos.' : 'Todavía falta pegar el Client ID de Google en app.js (ver guía).'}</div>
      </div>
    </div>
    <p style="font-size:12.5px;color:var(--text-dim);line-height:1.6;">
      Los datos se guardan como un único archivo privado en tu Drive, dentro de una carpeta especial de la app
      (no se mezcla con tus archivos ni carpetas normales). Al abrir la app en otro dispositivo, tocá
      "Cargar desde Drive" para traer lo último — después, cada cambio que hagas en ese dispositivo se va a
      guardar solo.
    </p>
    ${connected ? `<p style="font-size:12px;color:var(--text-faint);margin-top:8px;">Estado actual: <strong>${driveSyncLabel()}</strong></p>` : ''}
  `;
  const footer = !configured
    ? `<button class="btn btn-ghost" id="dmClose">Cerrar</button>`
    : connected
      ? `<button class="btn btn-ghost" id="dmDisconnect">Desconectar</button><button class="btn btn-ghost" id="dmLoad">${ICON.download} Cargar desde Drive</button><button class="btn btn-primary" id="dmSave">${ICON.cloud} Guardar ahora</button>`
      : `<button class="btn btn-ghost" id="dmClose">Cerrar</button><button class="btn btn-primary" id="dmConnect">Conectar con Google</button>`;

  openModal({
    title: 'Sincronización con Google Drive',
    bodyHtml: body,
    footerHtml: footer,
    onMount:(overlay)=>{
      const close = overlay.querySelector('#dmClose'); if(close) close.onclick = closeModal;
      const conn = overlay.querySelector('#dmConnect'); if(conn) conn.onclick = ()=>{ driveConnect(false); closeModal(); };
      const disc = overlay.querySelector('#dmDisconnect'); if(disc) disc.onclick = ()=>{ driveDisconnect(); closeModal(); };
      const save = overlay.querySelector('#dmSave'); if(save) save.onclick = ()=>{ driveSave(false); closeModal(); };
      const load = overlay.querySelector('#dmLoad'); if(load) load.onclick = ()=>{ closeModal(); driveLoadConfirm(); };
    }
  });
}

// intento de reconexión silenciosa si ya se había conectado antes en este navegador
window.addEventListener('load', ()=>{
  if(driveConfigured() && localStorage.getItem(DRIVE_FLAG_KEY) === '1'){
    setTimeout(()=> driveConnect(true), 800);
  }
});
