// ---------------- CONFIG ----------------
const REMOTE_JSON = ''; // Pega tu enlace de Drive aquí
const PALETTE_COLORS = ['#8e44ad','#c0392b','#2980b','#9b59b6','#e74c3c','#3498db'];

//-------------- Colores de fondo ---------------
const bodyEl = document.body;

const NIGHT_BG = 'radial-gradient(ellipse at bottom, #0b1226 0%, #000012 60%), linear-gradient(#020217, #00000a)';
const DAWN_BG = 'radial-gradient(ellipse at bottom, #ffffff 0%, #f2f2f2 60%, #e6e6e6 90%), linear-gradient(#f9f9f9, #eaeaea)';






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

let cometSpawnInterval = null;
const activeComets = new Set();
const MAX_ACTIVE_COMETS = 20;      // Máximo cometas simultáneos
const COMET_SPAWN_MS = 350;        // Frecuencia de spawn (ms)
const STAR_COUNT = 200;            // Cantidad de estrellas por defecto

function createBackgroundStars(count = STAR_COUNT){
  bgStarsContainer.innerHTML = '';
  for(let i = 0; i < count; i++){
    const s = document.createElement('div');
    s.className = 'star';
    // tamaño y posición
    const size = (Math.random()*2) + 0.8; // 0.8 - 2.8px
    s.style.width = s.style.height = size + 'px';
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    // duración entre 10s y 20s (más variación para que no sincronice)
    const dur = 10 + Math.random() * 10;
    s.style.animation = `floatStars ${dur.toFixed(2)}s ease-in-out ${Math.random()*-dur}s infinite`;
    // opacidad aleatoria sutil
    s.style.opacity = (0.6 + Math.random()*0.45).toFixed(2);
    bgStarsContainer.appendChild(s);
  }
}

// ---------------- Spawn continuo de cometas ----------------
function spawnComet() {
  if(activeComets.size >= MAX_ACTIVE_COMETS) return;

  const c = document.createElement('div');
  c.className = 'comet';

  // decide origen (top, bottom, left, right) aleatorio
  const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
  const vw = innerWidth;
  const vh = innerHeight;

  let startX, startY, endX, endY;
  const spread = 1.3; // cuánto beyond viewport terminar

  // velocidad y length
  const travelMs = 700 + Math.random() * 1300; // 700 - 2000 ms
  const tailLength = 80 + Math.random() * 160; // px (visual width)

  if(edge === 0) { // top -> random angle downwards
    startX = Math.random() * vw;
    startY = -20;
    endX = Math.random() * vw + (Math.random()*200 - 100);
    endY = vh * (0.6 + Math.random() * 0.6);
  } else if(edge === 1) { // right -> leftish
    startX = vw + 20;
    startY = Math.random() * vh;
    endX = -vw * (Math.random()*0.3 + 0.1);
    endY = Math.random()*vh + (Math.random()*200 - 100);
  } else if(edge === 2) { // bottom -> upwards
    startX = Math.random() * vw;
    startY = vh + 20;
    endX = Math.random() * vw + (Math.random()*200 - 100);
    endY = -vh * (Math.random()*0.3 + 0.1);
  } else { // left -> rightish
    startX = -20;
    startY = Math.random() * vh;
    endX = vw + (Math.random()*vw*0.2 + 100);
    endY = Math.random()*vh + (Math.random()*200 - 100);
  }

  c.style.left = startX + 'px';
  c.style.top = startY + 'px';

  // estilo aleatorio
  const thickness = 1 + Math.random()*2.5;
  c.style.width = tailLength + 'px';
  c.style.height = thickness + 'px';
  c.style.opacity = 0.95 - Math.random()*0.4;

  // transform to end position using translate
  // compute delta
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  c.style.transform = `rotate(${angle}deg)`; // align
  c.style.transition = `transform ${travelMs}ms linear, opacity ${travelMs}ms linear, left ${travelMs}ms linear, top ${travelMs}ms linear`;

  document.body.appendChild(c);
  activeComets.add(c);

  // animate: use requestAnimationFrame to set end position
  requestAnimationFrame(() => {
    c.style.left = endX + 'px';
    c.style.top = endY + 'px';
    c.style.opacity = 0;
  });

  // cleanup
  setTimeout(() => {
    if(c && c.parentNode) c.remove();
    activeComets.delete(c);
  }, travelMs + 200);
}

function startCometRain() {
  if(cometSpawnInterval) return;
  cometSpawnInterval = setInterval(() => {
    // spawn multiple randomly to create density
    const perTick = 1 + Math.floor(Math.random()*2); // 1-2 per tick
    for(let i=0;i<perTick;i++){
      spawnComet();
    }
  }, COMET_SPAWN_MS);
}

function stopCometRain(){
  if(cometSpawnInterval) {
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
        currentIndex = Math.floor(Math.random() * items.length);
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
  customOptions.innerHTML='';
  [...categoriaSelect.options].forEach(opt=>{
    const div = document.createElement('div');
    div.className = 'customOption';
    div.textContent = opt.textContent;
    div.dataset.value = opt.value;
    div.onclick = () => {
      selectedOption.textContent = div.textContent;
      categoriaSelect.value = div.dataset.value;
      renderCarousel(getFilteredItems());
      customOptions.classList.add('optionsHidden');
      customSelect.classList.remove('selectOpen');
      customSelect.classList.add('selectClosed');
    };
    customOptions.appendChild(div);
  });
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
    div.innerHTML=`<img src="${escapeAttr(it.img)}" alt="${escapeAttr(it.label)}" onerror="this.src='images/NotFound.jpg'"/>
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
  modalImg.onerror = () => { modalImg.src = 'images/NotFound.jpg'; };
modalImg.src = item.img;
  modal.classList.add('active');

  // small burst when modal opens
  createComets(8);
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

    modal.classList.remove('active');
    setBackground(false);  // vuelve noche

  };

    modal.classList.add('active');
    setBackground(true);   // amanecer
}

// ----------------Funcion de cambio de fondo ----------------
function setBackground(toDawn = true){
  bodyEl.style.background = toDawn ? DAWN_BG : NIGHT_BG;
}



// ---------------- Cometas (burst used for modal + kept for compatibility) ----------------
function createComets(count){
  for(let i=0;i<count;i++){
    const c=document.createElement('div');
    c.className='comet';
    c.style.left=(-10+Math.random()*20)+'vw';
    c.style.top=(5+Math.random()*50)+'vh';
    c.style.width=(30 + Math.random()*120)+'px';
    c.style.height=(1 + Math.random()*3)+'px';
    c.style.opacity=0.95;
    c.style.transition='transform 900ms linear, opacity 900ms';
    document.body.appendChild(c);
    requestAnimationFrame(()=>{
      c.style.transform=`translateX(${110+Math.random()*20}vw) translateY(${20+Math.random()*80}vh) rotate(${Math.random()*360}deg)`;
      c.style.opacity=0;
    });
    setTimeout(()=>c.remove(),1000 + Math.random()*800);
  }
}

// ---------------- Helpers ----------------
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

// ---------------- Eventos ----------------
spinBtn.addEventListener('click',spinCarousel);

// Abrir/cerrar custom dropdown
customSelect.addEventListener('click',()=>{
  customOptions.classList.toggle('optionsHidden');
  customSelect.classList.toggle('selectOpen');
  customSelect.classList.toggle('selectClosed');
});

// ---------------- Inicial ----------------
createBackgroundStars(STAR_COUNT);
startCometRain();
tryLoad();
