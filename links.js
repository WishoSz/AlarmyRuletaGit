// ---------------- CONFIG ----------------
const REMOTE_JSON = ''; // Pega tu enlace de Drive aquí
const PALETTE_COLORS = ['#8e44ad','#c0392b','#2980b','#9b59b6','#e74c3c','#3498db'];

const q = s => document.querySelector(s);
const carouselItems = q('#carouselItems');
const spinBtn = q('#spinBtn');
const status = q('#status');
const categoriaSelect = q('#categoriaSelect');
const modal = q('#modal');
const modalLabel = q('#modalLabel');
const modalImg = q('#modalImg');
const customSelect = q('#customSelect');
const selectedOption = q('#selectedOption');
const customOptions = q('#customOptions');

let closeModalBtn = q('#closeModalBtn');
if(!closeModalBtn){
  closeModalBtn = document.createElement('button');
  closeModalBtn.id = 'closeModalBtn';
  closeModalBtn.innerHTML = '&times;';
  modal.querySelector('#modalContent').appendChild(closeModalBtn);
}

let items = [];
let spinning = false;
let animationFrame;
let currentIndex = 0;
let autoOpenTimeout = null;
let countdownInterval = null;

// ---------------- Estrellas y cometas globales ----------------
const bgStarsContainer = document.createElement('div');
bgStarsContainer.id = 'backgroundStars';
document.body.appendChild(bgStarsContainer);

// Comet rain controls
let cometSpawnInterval = null;
const activeComets = new Set();
const MAX_ACTIVE_COMETS = 20;      // Máximo cometas simultáneos (ajustable)
const COMET_SPAWN_MS = 350;        // Frecuencia de spawn (ms)
const STAR_COUNT = 200;            // Cantidad de estrellas por defecto

function createBackgroundStars(count = STAR_COUNT){
  bgStarsContainer.innerHTML = '';
  for(let i = 0; i < count; i++){
    const s = document.createElement('div');
    s.className = 'star';
    const size = (Math.random()*2) + 0.8; // 0.8 - 2.8px
    s.style.width = s.style.height = size + 'px';
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    const dur = 10 + Math.random() * 10; // 10 - 20s
    s.style.animation = `floatStars ${dur.toFixed(2)}s ease-in-out ${Math.random()*-dur}s infinite`;
    s.style.opacity = (0.6 + Math.random()*0.45).toFixed(2);
    bgStarsContainer.appendChild(s);
  }
}

// ---------------- Spawn continuo de cometas (con cabeza y cola bien orientadas) ----------------
function spawnComet() {
  if(activeComets.size >= MAX_ACTIVE_COMETS) return;

  const c = document.createElement('div');
  c.className = 'comet';

  // decide origen (top, right, bottom, left)
  const edge = Math.floor(Math.random() * 4);
  const vw = innerWidth;
  const vh = innerHeight;

  let startX, startY, endX, endY;
  const travelMs = 700 + Math.random() * 1300; // 700 - 2000 ms
  const tailLength = 80 + Math.random() * 160; // px

  if (edge === 0) { // top -> down-ish
    startX = Math.random() * vw;
    startY = -20;
    endX = Math.random() * vw + (Math.random() * 200 - 100);
    endY = vh * (0.6 + Math.random() * 0.6);
  } else if (edge === 1) { // right -> leftish
    startX = vw + 20;
    startY = Math.random() * vh;
    endX = - (Math.random() * vw * 0.2 + 60);
    endY = Math.random() * vh + (Math.random() * 200 - 100);
  } else if (edge === 2) { // bottom -> up-ish
    startX = Math.random() * vw;
    startY = vh + 20;
    endX = Math.random() * vw + (Math.random() * 200 - 100);
    endY = - (Math.random() * vh * 0.2 + 60);
  } else { // left -> rightish
    startX = -20;
    startY = Math.random() * vh;
    endX = vw + (Math.random() * vw * 0.2 + 100);
    endY = Math.random() * vh + (Math.random() * 200 - 100);
  }

  // posicion inicial (head estará en el extremo izquierdo del contenedor)
  c.style.left = startX + 'px';
  c.style.top = startY + 'px';

  // tamaño y estilo del "cuerpo" (cola)
  c.style.width = tailLength + 'px';
  const thickness = 1 + Math.random() * 2.5;
  c.style.height = thickness + 'px';
  c.style.opacity = 0.9 - Math.random() * 0.5;

  // origen en el borde izquierdo para que la cabeza quede adelante
  c.style.transformOrigin = '0 50%';

  // crear cabeza como hijo
  const head = document.createElement('div');
  head.className = 'cometHead';
  const headSize = Math.max(4, thickness * 5);
  head.style.width = head.style.height = headSize + 'px';
  head.style.left = '0px';
  head.style.top = '50%';
  head.style.transform = 'translateY(-50%)';
  c.appendChild(head);

  // calcular ángulo y rotar el contenedor
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  c.style.transform = `rotate(${angle}deg)`;

  // transiciones para posición y opacidad
  c.style.transition = `left ${travelMs}ms linear, top ${travelMs}ms linear, opacity ${travelMs}ms linear`;

  document.body.appendChild(c);
  activeComets.add(c);

  // animar a la posición final
  requestAnimationFrame(() => {
    c.style.left = endX + 'px';
    c.style.top = endY + 'px';
    c.style.opacity = 0;
  });

  // limpiar al terminar
  setTimeout(() => {
    if (c && c.parentNode) c.remove();
    activeComets.delete(c);
  }, travelMs + 220);
}

function startCometRain() {
  if (cometSpawnInterval) return;
  cometSpawnInterval = setInterval(() => {
    const perTick = 1 + Math.floor(Math.random() * 2); // 1-2 per tick
    for (let i = 0; i < perTick; i++) spawnComet();
  }, COMET_SPAWN_MS);
}

function stopCometRain() {
  if (cometSpawnInterval) {
    clearInterval(cometSpawnInterval);
    cometSpawnInterval = null;
  }
}

// ---------------- Carga JSON ----------------
async function tryLoad(){
  status.textContent='Cargando lista desde JSON...';
  const urlsToTry=[];
  if(REMOTE_JSON) urlsToTry.push(REMOTE_JSON);
  urlsToTry.push('links.json');
  for(const u of urlsToTry){
    try{
      const stamped = u+(u.includes('?')?'&':'?')+'t='+Date.now();
      const res=await fetch(stamped,{cache:'no-store',mode:'cors'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const parsed=await res.json();
      if(Array.isArray(parsed) && parsed.length>0){
        items=parsed.map(it=>({
          label:String(it.label||it.name||'').trim()||'Sin nombre',
          artist:String(it.artist||'').trim(),
          url:String(it.url||it.link||'').trim(),
          img:String(it.img||'images/Default.jpg'),
          categorias:Array.isArray(it.categorias)?it.categorias.map(c=>String(c)):[] 
        })).filter(it=>it.url);
        updateCategoriaSelect();
        status.textContent=`Lista cargada — ${items.length} items`;
        renderCarousel(items);
        return;
      }
    }catch(err){ console.warn('No se pudo cargar JSON desde',u,err.message); }
  }
  items=[];
  updateCategoriaSelect();
  status.textContent='No se encontró links.json; lista vacía.';
  renderCarousel(items);
}

// ---------------- Render ----------------
function updateCategoriaSelect(){
  const categoriasUnicas=new Set();
  items.forEach(it=>{
    if(Array.isArray(it.categorias)) it.categorias.forEach(c=>categoriasUnicas.add(c));
  });
  // Llenar el select oculto
  const opts=['<option value="Todas">Everything at once</option>'];
  Array.from(categoriasUnicas).sort().forEach(cat=>opts.push(`<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`));
  categoriaSelect.innerHTML=opts.join('');

  // Llenar el custom dropdown
  if (customOptions) {
    customOptions.innerHTML='';
    [...categoriaSelect.options].forEach(opt=>{
      const div = document.createElement('div');
      div.className = 'customOption';
      div.textContent = opt.textContent;
      div.dataset.value = opt.value;
      div.onclick = () => {
        if (selectedOption) selectedOption.textContent = div.textContent;
        categoriaSelect.value = div.dataset.value;
        renderCarousel(getFilteredItems());
        customOptions.classList.add('optionsHidden');
        if (customSelect) {
          customSelect.classList.remove('selectOpen');
          customSelect.classList.add('selectClosed');
        }
      };
      customOptions.appendChild(div);
    });
  }
}

function getFilteredItems(){
  const sel = categoriaSelect.value;
  return sel==='Todas'?items:items.filter(it=>Array.isArray(it.categorias)&&it.categorias.includes(sel));
}

function renderCarousel(list){
  carouselItems.innerHTML='';
  if(!list || list.length===0){
    const placeholder=document.createElement('div');
    placeholder.className='carouselItem';
    placeholder.innerHTML=`<div class="label">No hay items</div>`;
    carouselItems.appendChild(placeholder);
    return;
  }
  const total = list.length;
  for(let i=-2;i<=2;i++){
    const div = document.createElement('div');
    div.className='carouselItem';
    const idx = (currentIndex + i + total) % total;
    const it = list[idx];
    div.innerHTML=`<img src="${escapeAttr(it.img)}" alt="${escapeAttr(it.label)}" onerror="this.src='images/Default.jpg'"/>
                     <div class="label">${escapeHtml(it.label)}</div>
                     <div class="artist">${escapeHtml(it.artist)}</div>`;
    carouselItems.appendChild(div);
  }
  applyCentering();
}

function applyCentering(){
  const children = Array.from(carouselItems.children);
  if(children.length===0) return;
  children.forEach(ch=>ch.classList.remove('center','highlight'));
  const middleIndex = Math.floor(children.length/2);
  if(children[middleIndex]){
    children[middleIndex].classList.add('center','highlight');
  }
  carouselItems.classList.add('centered');
}

// ---------------- Giro con requestAnimationFrame ----------------
function spinCarousel(){
  if(spinning) return;
  spinning = true;
  const filtered = getFilteredItems();
  if(!filtered || filtered.length===0){ alert('No hay links en esta categoría'); spinning=false; return; }

  const totalSteps = 50 + Math.floor(Math.random()*30);
  let step = 0;
  let delay = 60;

  if(window.audioStartSpin) window.audioStartSpin();

  function frame(){
    step++;
    if(step>totalSteps*0.6) delay = Math.min(400, delay+6);
    currentIndex = (currentIndex + 1) % filtered.length;
    renderCarousel(filtered);
    if(step>=totalSteps){
      spinning=false;
      if(window.audioStopSpin) window.audioStopSpin();
      const chosen = filtered[currentIndex];
      showModal(chosen);
      cancelAnimationFrame(animationFrame);
      return;
    }
    animationFrame = requestAnimationFrame(()=>setTimeout(frame, delay));
  }

  frame();
}

// ---------------- Modal ----------------
function showModal(item){
  modalLabel.textContent=item.label;
  modalImg.src=item.img;
  modal.classList.add('active');

  // small burst when modal opens (use comet-shaped elements)
  createCometBurst(8);
  if(window.audioPlayVictory) window.audioPlayVictory();

  // Limpiar timeout e interval previos
  if(autoOpenTimeout) clearTimeout(autoOpenTimeout);
  if(countdownInterval) clearInterval(countdownInterval);

  // Crear label de cuenta regresiva
  let countdownLabel = document.createElement('div');
  countdownLabel.id = 'countdownLabel';
  countdownLabel.style.marginTop = '8px';
  modal.querySelector('#modalContent').appendChild(countdownLabel);

  let countdown = 5.3;
  countdownLabel.textContent = `Autoplay en ${countdown.toFixed(1)}...`;

  countdownInterval = setInterval(() => {
    countdown -= 0.1;
    if(countdown <= 0){
      countdown = 0;
      clearInterval(countdownInterval);
    }
    countdownLabel.textContent = `Autoplay en ${countdown.toFixed(1)}...`;
  }, 100);

  autoOpenTimeout = setTimeout(() => {
    if(item.url) {
      try { window.open(item.url,'_blank'); } catch(e){ location.href = item.url; }
    }
    countdownLabel.remove();
  }, 5300);

  closeModalBtn.onclick = () => {
    modal.classList.remove('active');
    if(autoOpenTimeout) clearTimeout(autoOpenTimeout);
    if(countdownInterval) clearInterval(countdownInterval);
    countdownLabel.remove();
    document.querySelectorAll('.comet').forEach(e=>e.remove());
  };
}

// ---------------- burst de cometas para modal (usa misma idea: contenedor + head) ----------------
function createCometBurst(count){
  for(let i=0;i<count;i++){
    // crear contenedor igual que spawnComet pero con tiempos más cortos y posiciones centradas
    const c = document.createElement('div');
    c.className = 'comet';
    const vw = innerWidth, vh = innerHeight;
    // origen aleatorio cercano al centro
    const startX = vw * (0.45 + Math.random()*0.1);
    const startY = vh * (0.35 + Math.random()*0.3);

    // dirección aleatoria
    const angleRad = (Math.random() * Math.PI * 2);
    const distance = 200 + Math.random()*400;
    const endX = startX + Math.cos(angleRad) * distance;
    const endY = startY + Math.sin(angleRad) * distance;

    const travelMs = 600 + Math.random()*700;
    const tailLength = 60 + Math.random()*120;
    const thickness = 1 + Math.random()*3;

    c.style.left = startX + 'px';
    c.style.top = startY + 'px';
    c.style.width = tailLength + 'px';
    c.style.height = thickness + 'px';
    c.style.opacity = 0.95;

    c.style.transformOrigin = '0 50%';

    const head = document.createElement('div');
    head.className = 'cometHead';
    const headSize = Math.max(5, thickness * 5);
    head.style.width = head.style.height = headSize + 'px';
    head.style.left = '0px';
    head.style.top = '50%';
    head.style.transform = 'translateY(-50%)';
    c.appendChild(head);

    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    c.style.transform = `rotate(${angle}deg)`;
    c.style.transition = `left ${travelMs}ms cubic-bezier(.2,.9,.2,1), top ${travelMs}ms cubic-bezier(.2,.9,.2,1), opacity ${travelMs}ms linear`;

    document.body.appendChild(c);
    // animate
    requestAnimationFrame(()=> {
      c.style.left = endX + 'px';
      c.style.top = endY + 'px';
      c.style.opacity = 0;
    });
    setTimeout(()=>{ if(c && c.parentNode) c.remove(); }, travelMs + 220);
  }
}

// ---------------- Helpers ----------------
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

// ---------------- Eventos ----------------
spinBtn.addEventListener('click',spinCarousel);

// Abrir/cerrar custom dropdown (si existe)
if(customSelect){
  customSelect.addEventListener('click',()=>{
    if(customOptions) customOptions.classList.toggle('optionsHidden');
    customSelect.classList.toggle('selectOpen');
    customSelect.classList.toggle('selectClosed');
  });
}

// ---------------- Inicial ----------------
createBackgroundStars(STAR_COUNT);
startCometRain();
tryLoad();
