'use strict';
const $ = (s) => document.querySelector(s);
const W = 1080, H = 1920;
const cv = $('#cv'), ctx = cv.getContext('2d');
const FONT = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
const S = { movie: null, img: null, rating: 4, title: '', loc: '', orig: '' };

/* ---------- TMDB ---------- */
let KEY = '';
const keyReady = fetch('config.json', { cache: 'no-store' }).then((r) => r.json()).then((j) => { KEY = String(j.tmdbKey || '').trim(); }).catch(() => {});
async function tmdb(path, params) {
  await keyReady;
  if (!KEY) throw new Error('NO_KEY');
  const u = new URL('https://api.themoviedb.org/3/' + path);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const o = {};
  if (KEY.length > 40) o.headers = { Authorization: 'Bearer ' + KEY }; else u.searchParams.set('api_key', KEY); // v4 token or v3 key
  const r = await fetch(u, o);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) throw new Error('BAD_KEY');
    throw new Error(j.status_message || 'TMDB returned an error (' + r.status + ').');
  }
  return j;
}
const say = (t, err) => { const m = $('#msg'); m.textContent = t || ''; m.className = 'msg' + (err ? ' err' : ''); };
function fail(e) {
  if (e.message === 'NO_KEY') say('TMDB key missing. Add it to public/config.json.', true);
  else if (e.message === 'BAD_KEY') say('The TMDB key in public/config.json is not valid.', true);
  else say(e.message === 'Failed to fetch' ? 'Could not reach TMDB.' : e.message, true);
}

let timer, seq = 0;
$('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 350); });
async function search() {
  const q = $('#q').value.trim(), list = $('#results');
  if (q.length < 2) { list.hidden = true; say(''); return; }
  const id = ++seq; say('Searching…');
  try {
    const d = await tmdb('search/movie', { query: q, language: 'en-US', include_adult: 'false' });
    if (id !== seq) return;
    list.innerHTML = '';
    d.results.slice(0, 10).forEach((m) => {
      const li = document.createElement('li'); li.tabIndex = 0;
      const pic = m.poster_path ? Object.assign(new Image(), { src: 'https://image.tmdb.org/t/p/w92' + m.poster_path, alt: '', loading: 'lazy' }) : Object.assign(document.createElement('div'), { className: 'noimg' });
      const info = document.createElement('div');
      const b = document.createElement('b'); b.textContent = m.title + (m.release_date ? ' (' + m.release_date.slice(0, 4) + ')' : '');
      const p = document.createElement('p'); p.textContent = m.overview || 'No synopsis.';
      info.append(b, p); li.append(pic, info);
      const pick = () => choose(m.id);
      li.addEventListener('click', pick);
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(); });
      list.append(li);
    });
    list.hidden = !d.results.length;
    say(d.results.length ? '' : 'No results for “' + q + '”.');
  } catch (e) { if (id === seq) fail(e); }
}

async function choose(id) {
  say('Loading movie…');
  try {
    const lang = 'en-US';
    const m = await tmdb('movie/' + id, { language: lang });
    S.movie = m; S.loc = m.title || m.original_title; S.orig = m.original_title || m.title;
    S.title = S.loc; $('#title').value = S.title;
    $('#results').hidden = true; $('#q').value = '';
    await loadPoster();
    $('#dlPng').disabled = $('#dlJpg').disabled = false;
    say(m.release_date ? m.title + ' · ' + m.release_date.slice(0, 4) : m.title);
  } catch (e) { fail(e); }
}

function loadPoster() {
  const m = S.movie;
  if (!m || !m.poster_path) { S.img = null; render(); return Promise.resolve(); }
  return new Promise((res) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => { S.img = im; render(); res(); };
    im.onerror = () => { S.img = null; say('Could not load the poster.', true); render(); res(); };
    im.src = 'https://image.tmdb.org/t/p/' + $('#psize').value + m.poster_path;
  });
}

/* ---------- Canvas ---------- */
// Brand dots: media/lbxd_dots.png (replace it with your own). Falls back to drawn circles if missing.
let dotsOk = false;
const dots = new Image();
dots.onload = () => { dotsOk = dots.naturalWidth > 0; render(); };
dots.src = 'media/lbxd_dots.png';
const noise = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
})();
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : (ctx.moveTo(x + r, y), ctx.arcTo(x + w, y, x + w, y + h, r), ctx.arcTo(x + w, y + h, x, y + h, r), ctx.arcTo(x, y + h, x, y, r), ctx.arcTo(x, y, x + w, y, r), ctx.closePath()); };

function star(cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.48 : R;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function wrap(text, maxW) {
  const words = text.split(/\s+/).filter(Boolean), lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur); return lines;
}

function render() {
  const g = +$('#grad').value / 100;
  // fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, `rgb(${lerp(20, 58, g)},${lerp(24, 74, g)},${lerp(28, 92, g)})`);
  bg.addColorStop(0.5, `rgb(${lerp(14, 22, g)},${lerp(17, 27, g)},${lerp(20, 33, g)})`);
  bg.addColorStop(0.85, '#050607'); bg.addColorStop(1, '#000');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const gl = ctx.createRadialGradient(W / 2, 620, 40, W / 2, 620, 900);
  gl.addColorStop(0, `rgba(130,160,200,${0.05 + 0.14 * g})`); gl.addColorStop(1, 'rgba(130,160,200,0)');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.035; ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();

  // póster
  const ratio = S.img ? S.img.naturalWidth / S.img.naturalHeight : 2 / 3;
  let pw = W * +$('#pw').value / 100, ph = pw / ratio;
  if (ph > 1230) { ph = 1230; pw = ph * ratio; }
  const px = (W - pw) / 2, py = 120 + (1230 - ph) / 2;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 28;
  ctx.fillStyle = '#10151a'; rr(px, py, pw, ph, 22); ctx.fill(); ctx.restore();
  ctx.save(); rr(px, py, pw, ph, 22); ctx.clip();
  if (S.img) ctx.drawImage(S.img, px, py, pw, ph);
  else {
    const pg = ctx.createLinearGradient(0, py, 0, py + ph); pg.addColorStop(0, '#1d252d'); pg.addColorStop(1, '#0d1115');
    ctx.fillStyle = pg; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#5d6b78'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 38px ${FONT}`; ctx.fillText(S.movie ? 'No poster available' : 'Search for a movie', W / 2, py + ph / 2);
  }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 2; rr(px, py, pw, ph, 22); ctx.stroke(); ctx.restore();

  // título
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  const title = S.title.trim();
  if (title) {
    let size = 70, lines;
    for (; size >= 34; size -= 2) { ctx.font = `700 ${size}px ${FONT}`; lines = wrap(title, 900); if (lines.length <= 2) break; }
    if (lines.length > 2) { lines = [lines[0], lines.slice(1).join(' ')]; while (ctx.measureText(lines[1] + '…').width > 900 && lines[1].length) lines[1] = lines[1].slice(0, -1); lines[1] += '…'; }
    const lh = size * 1.18, y0 = 1470 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
  }

  // estrellas
  const r = S.rating;
  if (r > 0) {
    const R = 40, gap = 16, step = 2 * R + gap, full = Math.floor(r), half = r % 1 !== 0, cy = 1592;
    ctx.font = `800 ${R * 1.9}px ${FONT}`; const hw = half ? ctx.measureText('½').width : 0;
    const total = full * 2 * R + (full - 1) * gap + (half ? gap + hw : 0);
    let x = (W - total) / 2 + R;
    ctx.fillStyle = ctx.strokeStyle = '#00c853'; ctx.lineJoin = 'round'; ctx.lineWidth = 8;
    for (let i = 0; i < full; i++) { star(x, cy + 3, R - 4); ctx.fill(); ctx.stroke(); x += step; }
    if (half) { ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('½', x - R + (-gap + gap), cy + R * 0.62); }
  }

  // separador ON
  const sy = 1692;
  ctx.strokeStyle = '#4b5864'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  if ($('#showOn').checked) {
    ctx.moveTo(W / 2 - 200, sy); ctx.lineTo(W / 2 - 46, sy); ctx.moveTo(W / 2 + 46, sy); ctx.lineTo(W / 2 + 200, sy); ctx.stroke();
    ctx.fillStyle = '#8697a6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 26px ${FONT}`; ctx.fillText('ON', W / 2, sy + 1);
  } else { ctx.moveTo(W / 2 - 200, sy); ctx.lineTo(W / 2 + 200, sy); ctx.stroke(); }

  // branding
  if ($('#showBrand').checked) {
    const by = 1800, DH = 56, circ = $('#showCircles').checked;
    ctx.font = `800 62px ${FONT}`; const tw = ctx.measureText('Letterboxd').width;
    const dw = dotsOk ? DH * dots.naturalWidth / dots.naturalHeight : 98;
    const cw = circ ? dw + 22 : 0, total = cw + tw;
    let x = (W - total) / 2;
    if (circ) {
      if (dotsOk) ctx.drawImage(dots, x, by + 2 - DH / 2, dw, DH);
      else ['#ff8000', '#00e054', '#40bcf4'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 20 + i * 26, by, 20, 0, 7); ctx.fill(); });
      x += cw;
    }
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('Letterboxd', x, by + 2);
  }
}

/* ---------- Controles ---------- */
const starsEl = $('#stars');
for (let i = 1; i <= 5; i++) {
  const s = document.createElement('div'); s.className = 'st'; s.innerHTML = '★<i>★</i>';
  [['l', i - 0.5], ['r', i]].forEach(([c, v]) => {
    const b = document.createElement('button'); b.className = c; b.setAttribute('aria-label', v + ' stars');
    b.addEventListener('click', () => setRating(v)); s.append(b);
  });
  starsEl.append(s);
}
function setRating(v) {
  S.rating = v;
  starsEl.querySelectorAll('.st').forEach((s, i) => { s.querySelector('i').style.width = Math.max(0, Math.min(1, v - i)) * 100 + '%'; });
  $('#ratingOut').textContent = v ? String(v).replace('.', ',') + ' / 5' : 'no rating';
  render();
}
$('#clear').onclick = () => setRating(0);
$('#title').addEventListener('input', (e) => { S.title = e.target.value; render(); });
$('#tLoc').onclick = () => { if (S.movie) { S.title = S.loc; $('#title').value = S.title; render(); } };
$('#tOrig').onclick = () => { if (S.movie) { S.title = S.orig; $('#title').value = S.title; render(); } };
['showBrand', 'showCircles', 'showOn'].forEach((id) => $('#' + id).addEventListener('change', render));
const sync = () => { $('#gradOut').textContent = $('#grad').value + '%'; $('#pwOut').textContent = $('#pw').value + '%'; $('#jqOut').textContent = $('#jq').value + '%'; };
['grad', 'pw', 'jq'].forEach((id) => $('#' + id).addEventListener('input', () => { sync(); render(); }));
$('#psize').addEventListener('change', loadPoster);

/* ---------- Exportación 1080×1920 ---------- */
async function download(type) {
  try {
    await document.fonts.ready; render();
    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('Could not generate the image.'))), mime, +$('#jq').value / 100));
    const slug = (S.title || 'movie').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'movie';
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `letterboxd-story-${slug}.${type}` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) { say(e.name === 'SecurityError' ? 'The browser blocked the export (CORS). Reload and try again.' : e.message, true); }
}
$('#dlPng').onclick = () => download('png');
$('#dlJpg').onclick = () => download('jpg');

sync(); setRating(4);
Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Inter`).catch(() => 0))).then(render);
