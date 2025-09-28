const REMOTE_JSON = ''; // ID de tu archivo JSON en Drive
const q = s => document.querySelector(s);
const reel = q('#reel');
const spinBtn = q('#spinBtn');
const categoriaSelect = q('#categoriaSelect');
const winnerModal = q('#winnerModal');
const winnerLabel = q('#winnerLabel');
const openLinkBtn = q('#openLinkBtn');

let items = [];
let spinning = false;

// Carga JSON
async function loadJSON() {
    const urls = [];
    if(REMOTE_JSON) urls.push(REMOTE_JSON);
    urls.push('links.json');

    for (const u of urls) {
        try {
            const res = await fetch(u);
            const data = await res.json();
            if (Array.isArray(data)) {
                items = data;
                populateCategorySelect();
                renderReel();
                return;
            }
        } catch(e){ console.warn('No se pudo cargar JSON desde', u); }
    }
}

// Categorías
function populateCategorySelect() {
    const cats = new Set();
    items.forEach(it => it.categorias?.forEach(c=>cats.add(c)));
    const opts = ['<option value="Todas">Todas las categorías</option>'];
    Array.from(cats).sort().forEach(cat => opts.push(`<option value="${cat}">${cat}</option>`));
    categoriaSelect.innerHTML = opts.join('');
}

// Render horizontal con imágenes
function renderReel(filterCategory) {
    reel.innerHTML = '';
    const filtered = filterCategory && filterCategory !== 'Todas'
        ? items.filter(it => it.categorias?.includes(filterCategory))
        : items;

    filtered.forEach(it => {
        const div = document.createElement('div');
        div.className = 'reel-item';

        const img = document.createElement('img');
        img.src = it.img || 'default.jpg'; // tu JSON debe tener campo "img"
        div.appendChild(img);

        const label = document.createElement('div');
        label.textContent = it.label;
        div.appendChild(label);

        div.dataset.url = it.url;
        reel.appendChild(div);
    });
}

// Giro horizontal tipo slot
function spin() {
    if (spinning) return;
    spinning = true;

    const filtered = categoriaSelect.value === 'Todas'
        ? items
        : items.filter(it => it.categorias?.includes(categoriaSelect.value));

    if (!filtered.length) { alert('No hay items'); spinning=false; return; }

    const totalItems = filtered.length;
    const stopIndex = Math.floor(Math.random()*totalItems);
    const itemWidth = 130; // ancho + margin
    const extraRounds = 5;
    const finalX = -(stopIndex*itemWidth + extraRounds*itemWidth*totalItems);

    reel.style.transition = 'transform 4s cubic-bezier(.15,.9,.24,1)';
    reel.style.transform = `translateX(${finalX}px)`;

    playSound();

    reel.addEventListener('transitionend', function onEnd(){
        reel.removeEventListener('transitionend', onEnd);
        spinning=false;
        const winner = filtered[stopIndex];
        showWinnerModal(winner);
    });
}

function showWinnerModal(item){
    winnerLabel.textContent = item.label;
    openLinkBtn.onclick = ()=>window.open(item.url,'_blank');
    winnerModal.classList.remove('hidden');
    createConfetti(); // animación estrellas/cometas
}

spinBtn.addEventListener('click', spin);
categoriaSelect.addEventListener('change', ()=>renderReel(categoriaSelect.value));
winnerModal.addEventListener('click', ()=>winnerModal.classList.add('hidden'));

// === Fondo animado ===
const canvas = q('#backgroundCanvas');
const ctx = canvas.getContext('2d');
let stars = [], comets = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createStars(count=200){
    stars = [];
    for(let i=0;i<count;i++){
        stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*1.5+0.5, speed:Math.random()*0.5+0.1});
    }
}
function createComets(count=30){
    comets = [];
    for(let i=0;i<count;i++){
        comets.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height/2, vx:Math.random()*2+1, vy:Math.random()*1+0.5});
    }
}

function animateBackground(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s=>{
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle='white';
        ctx.fill();
        s.y += s.speed;
        if(s.y>canvas.height) s.y=0;
    });
    comets.forEach(c=>{
        ctx.beginPath();
        ctx.arc(c.x,c.y,2,0,Math.PI*2);
        ctx.fillStyle='yellow';
        ctx.fill();
        c.x += c.vx;
        c.y += c.vy;
        if(c.x>canvas.width || c.y>canvas.height) { c.x=0; c.y=Math.random()*canvas.height/2; }
    });
    requestAnimationFrame(animateBackground);
}

createStars(300);
createComets(50);
animateBackground();

// JSON load
loadJSON();
