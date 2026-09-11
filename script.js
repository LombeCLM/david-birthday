/* ===========================
   DAVID'S BIRTHDAY — script.js
   =========================== */

/* ---- SUPABASE CONFIG ---- */
const SUPABASE_URL = 'https://ehzkmzduwoclgtzkyfbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoemttemR1d29jbGd0emt5ZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTE4MDYsImV4cCI6MjEwNDY2NzgwNn0.Kz58G2ty3Em_dZtNOdMBk8qTM99VAZ-k3zzaAfsd9-Y';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

/* ---- NAV scroll ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ---- ANIMATED NAME ---- */
function animateName(elementId, text, baseDelay) {
  const el = document.getElementById(elementId);
  el.innerHTML = '';
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.classList.add('hero-letter');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.animationDelay = `${baseDelay + i * 0.07}s`;
    el.appendChild(span);
  });
}
animateName('hero-david',    'David',    0.2);
animateName('hero-silwamba', 'Silwamba', 0.7);

/* ---- COUNTDOWN ---- */
function tick() {
  const target = new Date('2026-10-04T15:00:00+02:00');
  const diff = target - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hrs','cd-min','cd-sec'].forEach(id => document.getElementById(id).textContent = '0');
    return;
  }
  document.getElementById('cd-days').textContent = Math.floor(diff / 86400000);
  document.getElementById('cd-hrs').textContent  = Math.floor((diff % 86400000) / 3600000);
  document.getElementById('cd-min').textContent  = Math.floor((diff % 3600000) / 60000);
  document.getElementById('cd-sec').textContent  = Math.floor((diff % 60000) / 1000);
}
tick();
setInterval(tick, 1000);

/* ---- CONFETTI ---- */
(function () {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colours = ['#2a4fa5','#4a6fa5','#7a9fd4','#dce8f8','#ffffff','#ffd700','#ff6b6b','#a8edea'];
  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 10 + 5, h: Math.random() * 6 + 3,
    color: colours[Math.floor(Math.random() * colours.length)],
    speed: Math.random() * 3 + 1.5,
    angle: Math.random() * 360, spin: (Math.random() - 0.5) * 6,
  }));
  let animating = true;
  function draw() {
    if (!animating) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDone = true;
    pieces.forEach(p => {
      p.y += p.speed; p.angle += p.spin;
      if (p.y < canvas.height + 20) allDone = false;
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (allDone) { animating = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    else requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
})();

/* ---- PHOTOS ---- */

// Your 8 photos — put them in a photos/ folder in your project
// and update the filenames below to match your actual files
const MY_PHOTOS = [
  'photos/david1.jpg',
  'photos/david2.jpg',
  'photos/david3.jpg',
  'photos/david4.jpg',
  'photos/david5.jpg',
  'photos/david6.jpg',
  'photos/david7.jpg',
  'photos/david8.jpg',
];

function createPhotoCard(src, isLocal) {
  const frame = document.createElement('div');
  frame.className = 'photo-frame' + (isLocal ? ' photo-frame-mine' : '');
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'David';
  img.loading = 'lazy';
  frame.appendChild(img);
  return frame;
}

async function loadGuestPhotos() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/photos?select=url&order=created_at.desc`,
      { headers }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function renderPhotos() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '';

  // Render Suwi's photos first
  MY_PHOTOS.forEach(src => {
    grid.appendChild(createPhotoCard(src, true));
  });

  // Load and append guest photos
  const guestPhotos = await loadGuestPhotos();
  guestPhotos.forEach(p => {
    grid.appendChild(createPhotoCard(p.url, false));
  });

  // Always show the upload slot at the end
  grid.appendChild(createUploadSlot());
}

function createUploadSlot() {
  const slot = document.createElement('div');
  slot.className = 'photo-upload-slot';
  slot.id = 'uploadSlot';
  slot.innerHTML = `
    <i class="ti ti-camera-plus"></i>
    <span>Add your photo</span>
    <input type="file" accept="image/*" id="photoFileInput">
  `;
  slot.querySelector('input').addEventListener('change', handlePhotoUpload);
  return slot;
}

async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const slot = document.getElementById('uploadSlot');
  slot.classList.add('uploading');
  slot.innerHTML = '<div class="upload-spinner"></div><span>Uploading…</span>';

  try {
    // 1. Upload file to Supabase Storage
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/photos/${filename}`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': file.type,
          'x-upsert': 'true'
        },
        body: file
      }
    );

    if (!uploadRes.ok) throw new Error('Upload failed');

    // 2. Get the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/photos/${filename}`;

    // 3. Save URL to photos table
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/photos`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ url: publicUrl })
    });

    if (!saveRes.ok) throw new Error('Save failed');

    // 4. Reload the photo grid
    await renderPhotos();

    // 5. Show a quick success flash
    showPhotoSuccess();
  } catch (err) {
    console.error(err);
    await renderPhotos(); // re-render to restore the slot
    alert('Photo upload failed — please try again.');
  }
}

function showPhotoSuccess() {
  const toast = document.createElement('div');
  toast.className = 'photo-toast';
  toast.textContent = '📸 Photo added!';
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Load photos on page load
renderPhotos();

/* ---- WISHES WALL ---- */
async function loadWishes() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wishes?select=name,message,created_at&order=created_at.desc`,
      { headers }
    );
    if (!res.ok) return;
    renderWishes(await res.json());
  } catch (err) { console.error('Could not load wishes:', err); }
}

function renderWishes(wishes) {
  const wall = document.getElementById('wishesWall');
  wall.innerHTML = '';
  if (!wishes.length) {
    wall.innerHTML = '<p class="wishes-empty">No messages yet — be the first to wish David! 🎉</p>';
    return;
  }
  wishes.forEach(w => {
    const card = document.createElement('div');
    card.className = 'wish-card';
    card.innerHTML = `<div class="wish-card-name">— ${escapeHtml(w.name)}</div><p class="wish-card-msg">${escapeHtml(w.message)}</p>`;
    wall.appendChild(card);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function submitWish(e) {
  e.preventDefault();
  const name    = document.getElementById('wish-name').value.trim();
  const message = document.getElementById('wish-message').value.trim();
  document.getElementById('err-wish-name').style.display = name    ? 'none' : 'block';
  document.getElementById('err-wish-msg').style.display  = message ? 'none' : 'block';
  if (!name || !message) return;

  const btn = document.querySelector('#wishesForm .submit-btn');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ name, message })
    });
    if (res.ok) {
      await loadWishes();
      document.getElementById('wishesForm').style.display = 'none';
      document.getElementById('wishSuccess').style.display = 'block';
    } else throw new Error();
  } catch {
    btn.textContent = 'Something went wrong — try again';
    btn.style.color = '#f08080';
    btn.disabled = false;
  }
}

function resetWishForm() {
  document.getElementById('wish-name').value = '';
  document.getElementById('wish-message').value = '';
  document.getElementById('wishesForm').style.display = 'block';
  document.getElementById('wishSuccess').style.display = 'none';
  const btn = document.querySelector('#wishesForm .submit-btn');
  btn.innerHTML = 'Send my wish <i class="ti ti-heart"></i>';
  btn.style.color = '';
  btn.disabled = false;
}

document.getElementById('wish-name').addEventListener('input', () => document.getElementById('err-wish-name').style.display = 'none');
document.getElementById('wish-message').addEventListener('input', () => document.getElementById('err-wish-msg').style.display = 'none');

loadWishes();

/* ---- RSVP ---- */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjyvjlqo';
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
  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name, phone,
        attending: rsvpChoice === 'yes' ? 'Yes' : 'No',
        guests: rsvpChoice === 'yes' ? guests : 0,
        _subject: `RSVP from ${name} — David's Birthday`
      })
    });
    if (res.ok) {
      document.getElementById('rsvpForm').style.display = 'none';
      const msg = document.getElementById('successMsg');
      msg.style.display = 'block';
      if (rsvpChoice === 'yes') {
        document.getElementById('successHead').textContent = "We'll see you there!";
        document.getElementById('successSub').textContent = guests > 1
          ? `Thank you, ${name}! We're expecting you and ${guests - 1} guest${guests - 1 > 1 ? 's' : ''}. David can't wait.`
          : `Thank you, ${name}! David can't wait to celebrate with you.`;
      } else {
        document.getElementById('successHead').textContent = "We'll miss you!";
        document.getElementById('successSub').textContent = `Thanks for letting us know, ${name}. We'll celebrate in spirit.`;
      }
    } else throw new Error();
  } catch {
    btn.textContent = 'Something went wrong — try again';
    btn.style.color = '#f08080';
    btn.disabled = false;
  }
}

document.getElementById('rsvp-name').addEventListener('input', () => document.getElementById('err-name').style.display = 'none');
document.getElementById('rsvp-phone').addEventListener('input', () => document.getElementById('err-phone').style.display = 'none');
