/* ===========================
   DAVID'S BIRTHDAY — script.js
   =========================== */

/* ---- NAV: add .scrolled class on scroll ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ---- COUNTDOWN to 4 Oct 2026 15:00 hrs CAT (UTC+2) ---- */
function tick() {
  const target = new Date('2026-10-04T15:00:00+02:00');
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    ['cd-days','cd-hrs','cd-min','cd-sec'].forEach(id => {
      document.getElementById(id).textContent = '0';
    });
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

  const colours = ['#2a4fa5', '#4a6fa5', '#7a9fd4', '#dce8f8', '#f4f5f7', '#ffd700', '#ff6b6b', '#a8edea'];
  const pieces = [];
  const count = 160;
  let animating = true;

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colours[Math.floor(Math.random() * colours.length)],
      speed: Math.random() * 3 + 1.5,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 6,
      opacity: 1
    });
  }

  function draw() {
    if (!animating) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDone = true;

    pieces.forEach(p => {
      p.y += p.speed;
      p.angle += p.spin;
      if (p.y < canvas.height + 20) allDone = false;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (allDone) {
      animating = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      requestAnimationFrame(draw);
    }
  }

  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();

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

  const btn = document.querySelector('.submit-btn');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  const payload = {
    name,
    phone,
    attending: rsvpChoice === 'yes' ? 'Yes' : 'No',
    guests: rsvpChoice === 'yes' ? guests : 0,
    _subject: `RSVP from ${name} — David's Birthday`
  };

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('rsvpForm').style.display = 'none';
      const successMsg = document.getElementById('successMsg');
      successMsg.style.display = 'block';

      if (rsvpChoice === 'yes') {
        document.getElementById('successHead').textContent = "We'll see you there!";
        document.getElementById('successSub').textContent = guests > 1
          ? `Thank you, ${name}! We're expecting you and ${guests - 1} guest${guests - 1 > 1 ? 's' : ''}. David can't wait.`
          : `Thank you, ${name}! David can't wait to celebrate with you.`;
      } else {
        document.getElementById('successHead').textContent = "We'll miss you!";
        document.getElementById('successSub').textContent  = `Thanks for letting us know, ${name}. We'll celebrate in spirit.`;
      }
    } else {
      throw new Error('Server error');
    }
  } catch (err) {
    btn.textContent = 'Something went wrong — try again';
    btn.style.color = '#f08080';
    btn.disabled = false;
  }
}

/* ---- CLEAR errors on input ---- */
document.getElementById('rsvp-name').addEventListener('input', () => {
  document.getElementById('err-name').style.display = 'none';
});
document.getElementById('rsvp-phone').addEventListener('input', () => {
  document.getElementById('err-phone').style.display = 'none';
});
