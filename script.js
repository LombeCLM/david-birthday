/* ===========================
   DAVID'S BIRTHDAY — script.js
   =========================== */

const SUPABASE_URL = 'https://ehzkmzduwoclgtzkyfbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoemttemR1d29jbGd0emt5ZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTE4MDYsImV4cCI6MjEwNDY2NzgwNn0.Kz58G2ty3Em_dZtNOdMBk8qTM99VAZ-k3zzaAfsd9-Y';
const SB_HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

/* ---- NAV ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });

/* ---- ANIMATED NAME ---- */
function animateName(id, text, baseDelay) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  [...text].forEach((char, i) => {
    const s = document.createElement('span');
    s.className = 'hero-letter';
    s.textContent = char === ' ' ? '\u00A0' : char;
    s.style.animationDelay = `${baseDelay + i * 0.07}s`;
    el.appendChild(s);
  });
}
animateName('hero-david', 'David', 0.2);
animateName('hero-silwamba', 'Silwamba', 0.7);

/* ---- COUNTDOWN ---- */
function tick() {
  const diff = new Date('2026-10-04T15:00:00+02:00') - new Date();
  if (diff <= 0) { ['cd-days','cd-hrs','cd-min','cd-sec'].forEach(id => document.getElementById(id).textContent = '0'); return; }
  document.getElementById('cd-days').textContent = Math.floor(diff / 86400000);
  document.getElementById('cd-hrs').textContent  = Math.floor((diff % 86400000) / 3600000);
  document.getElementById('cd-min').textContent  = Math.floor((diff % 3600000) / 60000);
  document.getElementById('cd-sec').textContent  = Math.floor((diff % 60000) / 1000);
}
tick(); setInterval(tick, 1000);

/* ---- CONFETTI ---- */
(function() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colours = ['#2a4fa5','#4a6fa5','#7a9fd4','#dce8f8','#ffffff','#ffd700','#ff6b6b','#a8edea'];
  const pieces = Array.from({length:160}, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height - canvas.height,
    w: Math.random()*10+5, h: Math.random()*6+3,
    color: colours[Math.floor(Math.random()*colours.length)],
    speed: Math.random()*3+1.5, angle: Math.random()*360, spin: (Math.random()-0.5)*6
  }));
  let going = true;
  (function draw() {
    if (!going) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let done = true;
    pieces.forEach(p => {
      p.y += p.speed; p.angle += p.spin;
      if (p.y < canvas.height+20) done = false;
      ctx.save(); ctx.translate(p.x+p.w/2, p.y+p.h/2); ctx.rotate(p.angle*Math.PI/180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if (done) { going=false; ctx.clearRect(0,0,canvas.width,canvas.height); } else requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; });
})();

/* ==============================
   PHOTO STACK
   ============================== */
const MY_PHOTOS = [
  { src: 'photos/david1.jpg', label: '' },
  { src: 'photos/david2.jpg', label: '' },
  { src: 'photos/david3.jpg', label: '' },
  { src: 'photos/david4.jpg', label: '' },
  { src: 'photos/david5.jpg', label: '' },
  { src: 'photos/david6.jpg', label: '' },
  { src: 'photos/david7.jpg', label: '' },
  { src: 'photos/david8.jpg', label: '' },
];

// Random tilt angles for the stack feel
const TILTS = [-6, 4, -3, 7, -5, 3, -8, 5, -4, 6, -2, 8];

let allPhotos = [];
let currentIdx = 0;
let isDragging = false, startX = 0, dragX = 0;

async function loadGuestPhotos() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/photos?select=url&order=created_at.asc`, { headers: SB_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(p => ({ src: p.url, label: 'Guest photo' }));
  } catch { return []; }
}

async function initStack() {
  const guestPhotos = await loadGuestPhotos();
  allPhotos = [...MY_PHOTOS, ...guestPhotos];
  currentIdx = 0;
  renderStack();
}

function renderStack() {
  const stack = document.getElementById('photoStack');
  stack.innerHTML = '';
  const total = allPhotos.length;
  if (!total) return;

  // Render cards back-to-front so front card is on top
  for (let i = Math.min(currentIdx + 3, total - 1); i >= currentIdx; i--) {
    const offset = i - currentIdx; // 0 = front, 1 = second, etc.
    const card = document.createElement('div');
    card.className = 'stack-card' + (offset === 0 ? ' is-front' : '');
    const tilt = TILTS[i % TILTS.length];
    const scale = 1 - offset * 0.04;
    const yOffset = offset * 10;
    card.style.transform = `rotate(${tilt}deg) scale(${scale}) translateY(${yOffset}px)`;
    card.style.zIndex = 10 - offset;

    const img = document.createElement('img');
    img.src = allPhotos[i].src;
    img.alt = 'David';
    img.loading = 'lazy';
    card.appendChild(img);

    if (allPhotos[i].label) {
      const label = document.createElement('div');
      label.className = 'stack-card-label';
      label.textContent = allPhotos[i].label;
      card.appendChild(label);
    }

    // Swipe support on front card
    if (offset === 0) {
      card.addEventListener('mousedown', onDragStart);
      card.addEventListener('touchstart', onDragStart, { passive: true });
    }

    stack.appendChild(card);
  }

  updateCounter();
}

function updateCounter() {
  document.getElementById('stackCounter').textContent = `${currentIdx + 1} / ${allPhotos.length}`;
}

function goNext() {
  if (currentIdx < allPhotos.length - 1) { currentIdx++; renderStack(); }
}

function goPrev() {
  if (currentIdx > 0) { currentIdx--; renderStack(); }
}

document.getElementById('stackNext').addEventListener('click', goNext);
document.getElementById('stackPrev').addEventListener('click', goPrev);

// Drag / swipe
function onDragStart(e) {
  isDragging = true;
  startX = e.touches ? e.touches[0].clientX : e.clientX;
  dragX = 0;
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchmove', onDragMove, { passive: true });
  window.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
  if (!isDragging) return;
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  dragX = x - startX;
  const front = document.querySelector('.stack-card.is-front');
  if (front) {
    const tilt = TILTS[currentIdx % TILTS.length];
    front.style.transform = `rotate(${tilt + dragX * 0.05}deg) translateX(${dragX}px)`;
  }
}

function onDragEnd() {
  isDragging = false;
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('touchend', onDragEnd);

  if (dragX > 60) goPrev();
  else if (dragX < -60) goNext();
  else renderStack(); // snap back
}

/* ---- PHOTO UPLOAD ---- */
document.getElementById('photoFileInput').addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;

  const btn = document.getElementById('photoAddBtn');
  const label = document.getElementById('photoAddLabel');
  btn.classList.add('uploading');
  label.textContent = 'Uploading…';
  this.disabled = true;

  try {
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${filename}`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Content-Type': file.type, 'x-upsert': 'true' },
      body: file
    });
    if (!uploadRes.ok) throw new Error('Upload failed');

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/photos/${filename}`;
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/photos`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ url: publicUrl })
    });
    if (!saveRes.ok) throw new Error('Save failed');

    // Add to stack and jump to it
    allPhotos.push({ src: publicUrl, label: 'Guest photo' });
    currentIdx = allPhotos.length - 1;
    renderStack();
    showToast('📸 Photo added!');
  } catch {
    showToast('Upload failed — try again');
  } finally {
    btn.classList.remove('uploading');
    label.textContent = 'Add your photo';
    this.value = '';
    this.disabled = false;
  }
});

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'photo-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2500);
}

// Init on load
initStack();

/* ---- WISHES ---- */
async function loadWishes() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes?select=name,message,created_at&order=created_at.desc`, { headers: SB_HEADERS });
    if (!res.ok) return;
    renderWishes(await res.json());
  } catch {}
}

function renderWishes(wishes) {
  const wall = document.getElementById('wishesWall');
  wall.innerHTML = '';
  if (!wishes.length) { wall.innerHTML = '<p class="wishes-empty">No messages yet — be the first to wish David! 🎉</p>'; return; }
  wishes.forEach(w => {
    const card = document.createElement('div');
    card.className = 'wish-card';
    card.innerHTML = `<div class="wish-card-name">— ${esc(w.name)}</div><p class="wish-card-msg">${esc(w.message)}</p>`;
    wall.appendChild(card);
  });
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function submitWish(e) {
  e.preventDefault();
  const name = document.getElementById('wish-name').value.trim();
  const message = document.getElementById('wish-message').value.trim();
  document.getElementById('err-wish-name').style.display = name    ? 'none' : 'block';
  document.getElementById('err-wish-msg').style.display  = message ? 'none' : 'block';
  if (!name || !message) return;
  const btn = document.querySelector('#wishesForm .submit-btn');
  btn.textContent = 'Sending…'; btn.disabled = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ name, message })
    });
    if (res.ok) {
      await loadWishes();
      document.getElementById('wishesForm').style.display = 'none';
      document.getElementById('wishSuccess').style.display = 'block';
    } else throw new Error();
  } catch { btn.textContent = 'Something went wrong — try again'; btn.style.color = '#f08080'; btn.disabled = false; }
}

function resetWishForm() {
  document.getElementById('wish-name').value = '';
  document.getElementById('wish-message').value = '';
  document.getElementById('wishesForm').style.display = 'block';
  document.getElementById('wishSuccess').style.display = 'none';
  const btn = document.querySelector('#wishesForm .submit-btn');
  btn.innerHTML = 'Send my wish <i class="ti ti-heart"></i>'; btn.style.color = ''; btn.disabled = false;
}

document.getElementById('wish-name').addEventListener('input', () => document.getElementById('err-wish-name').style.display = 'none');
document.getElementById('wish-message').addEventListener('input', () => document.getElementById('err-wish-msg').style.display = 'none');
loadWishes();

/* ---- RSVP ---- */
const FORMSPREE = 'https://formspree.io/f/mjyvjlqo';
let rsvpChoice = null;

function selectRsvp(choice) {
  rsvpChoice = choice;
  document.getElementById('choice-yes').classList.toggle('selected', choice === 'yes');
  document.getElementById('choice-no').classList.toggle('selected', choice === 'no');
  document.getElementById('err-choice').style.display = 'none';
  document.getElementById('guest-group').style.display = choice === 'yes' ? 'block' : 'none';
}

async function submitRsvp(e) {
  e.preventDefault();
  const name   = document.getElementById('rsvp-name').value.trim();
  const phone  = document.getElementById('rsvp-phone').value.trim();
  const guests = parseInt(document.getElementById('rsvp-guests').value, 10) || 1;
  document.getElementById('err-name').style.display   = name       ? 'none' : 'block';
  document.getElementById('err-phone').style.display  = phone      ? 'none' : 'block';
  document.getElementById('err-choice').style.display = rsvpChoice ? 'none' : 'block';
  if (!name || !phone || !rsvpChoice) return;
  const btn = document.querySelector('#rsvpForm .submit-btn');
  btn.textContent = 'Sending…'; btn.disabled = true;
  try {
    const res = await fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, phone, attending: rsvpChoice === 'yes' ? 'Yes' : 'No', guests: rsvpChoice === 'yes' ? guests : 0, _subject: `RSVP from ${name} — David's Birthday` })
    });
    if (res.ok) {
      document.getElementById('rsvpForm').style.display = 'none';
      document.getElementById('successMsg').style.display = 'block';
      if (rsvpChoice === 'yes') {
        document.getElementById('successHead').textContent = "We'll see you there!";
        document.getElementById('successSub').textContent = guests > 1 ? `Thank you, ${name}! We're expecting you and ${guests-1} guest${guests-1>1?'s':''}. David can't wait.` : `Thank you, ${name}! David can't wait to celebrate with you.`;
      } else {
        document.getElementById('successHead').textContent = "We'll miss you!";
        document.getElementById('successSub').textContent = `Thanks for letting us know, ${name}. We'll celebrate in spirit.`;
      }
    } else throw new Error();
  } catch { btn.textContent = 'Something went wrong — try again'; btn.style.color = '#f08080'; btn.disabled = false; }
}

document.getElementById('rsvp-name').addEventListener('input', () => document.getElementById('err-name').style.display = 'none');
document.getElementById('rsvp-phone').addEventListener('input', () => document.getElementById('err-phone').style.display = 'none');
