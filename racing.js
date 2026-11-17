import { ROAD, laneX, createRace, steer, advanceRace } from './racing-engine.js';
const $ = id => document.getElementById(id);
const canvas = $('race-board'), ctx = canvas.getContext('2d');
let race = createRace(), frame, lastTime, accumulator = 0, swipe, best = 0, startingBest = 0;
try { const saved = Number(localStorage.getItem('pocket-arcade-road-best')); if (Number.isFinite(saved) && saved >= 0) best = saved; } catch { /* Records remain available for this visit. */ }
const active = () => !$('racing-panel').hidden;
const meters = () => Math.floor(race.distance);
const format = n => String(n).padStart(3, '0');
function stats() {
  $('race-distance').textContent = format(meters());
  $('race-best').textContent = format(Math.max(best, meters()));
  $('race-speed').textContent = Math.floor(race.speed);
  $('race-passed').textContent = race.passed;
}
function save() {
  if (meters() <= best) return;
  best = meters();
  try { localStorage.setItem('pocket-arcade-road-best', String(best)); }
  catch { $('race-save-note').textContent = 'Storage unavailable. Best kept for this visit.'; }
}
function box(x, y, w, h, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function car(x, y, color, player = false) {
  ctx.save(); ctx.translate(x, y);
  box(-24, -28, 48, 64, 8, '#182d2950');
  for (const side of [-1, 1]) {
    box(side * 21 - 3, -23, 6, 14, 2, '#182925');
    box(side * 21 - 3, 12, 6, 14, 2, '#182925');
  }
  box(-21, -32, 42, 64, 8, color);
  box(-18, -27, 36, 53, 6, player ? '#f0b16d' : '#ffffff12');
  box(-14, -15, 28, 17, 4, '#253d40');
  box(-11, -13, 22, 3, 1, '#94b4ab65');
  box(-13, 15, 26, 10, 3, '#304744');
  box(-9, 3, 18, 10, 3, color);
  if (player) { box(-3, -29, 6, 12, 1, '#fff2be'); box(-3, 25, 6, 6, 1, '#fff2be'); }
  box(-17, -30, 9, 4, 2, '#fff1ba'); box(8, -30, 9, 4, 2, '#fff1ba');
  box(-17, 26, 7, 4, 1, '#b1503f'); box(10, 26, 7, 4, 1, '#b1503f');
  ctx.restore();
}
function tree(x, y, size = 17) {
  ctx.fillStyle = '#3c613145'; ctx.beginPath(); ctx.ellipse(x + 6, y + 6, size + 3, size * .7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#708e51'; ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8da666'; ctx.beginPath(); ctx.arc(x - 4, y - 5, size * .65, 0, Math.PI * 2); ctx.fill();
}
function draw() {
  if (!canvas.width || !canvas.height) return;
  ctx.setTransform(canvas.width / 600, 0, 0, canvas.height / 400, 0, 0);
  ctx.fillStyle = '#a5b77b'; ctx.fillRect(0, 0, 600, 400);
  ctx.fillStyle = '#b0be82'; ctx.fillRect(0, 0, 55, 400); ctx.fillRect(543, 0, 57, 400);
  const travel = race.scroll;
  // Roadside rows scroll with the road, giving the top-down track a sense of speed.
  for (let i = -1; i < 6; i++) {
    const y = i * 100 + travel * 1.25;
    ctx.fillStyle = '#bec994'; ctx.fillRect(8, y, 32, 3); ctx.fillRect(557, y + 20, 35, 3);
    tree(80, y + 18, 15); tree(525, y + 57, 20);
    box(103, y + 70, 5, 14, 1, '#edf0d7'); box(492, y + 70, 5, 14, 1, '#edf0d7');
  }
  ctx.fillStyle = '#819262'; ctx.fillRect(111, 0, 378, 400);
  ctx.fillStyle = '#3d4844'; ctx.fillRect(120, 0, 360, 400);
  ctx.fillStyle = '#45504a'; ctx.fillRect(125, 0, 350, 400);
  ctx.fillStyle = '#e7e9d3'; ctx.fillRect(120, 0, 5, 400); ctx.fillRect(475, 0, 5, 400);
  for (let i = -1; i < 7; i++) {
    const y = i * 80 + travel;
    ctx.fillStyle = '#dfe3cc'; ctx.fillRect(238, y, 4, 35); ctx.fillRect(358, y, 4, 35);
    ctx.fillStyle = '#d8a08a'; ctx.fillRect(116, y, 4, 40); ctx.fillRect(480, y, 4, 40);
  }
  const colors = ['#c3d2b1', '#b0c5d0', '#cf9d9a'];
  if (race.status === 'ready') {
    car(laneX(0), 65, colors[1]); car(laneX(2), 180, colors[0]);
  }
  for (const traffic of race.traffic) car(traffic.x, traffic.y, colors[traffic.color]);
  if (race.status === 'over') {
    ctx.strokeStyle = '#ffbd7e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(race.x, ROAD.playerY, 45, 0, Math.PI * 2); ctx.stroke();
  }
  car(race.x, ROAD.playerY, '#e5a261', true);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function resize() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); draw();
}
function stop() { cancelAnimationFrame(frame); frame = undefined; lastTime = undefined; accumulator = 0; }
function setPauseButton(paused) {
  $('race-pause').textContent = paused ? '▷' : 'Ⅱ';
  $('race-pause').setAttribute('aria-label', paused ? 'Resume race' : 'Pause race');
  $('race-pause').title = paused ? 'Resume race' : 'Pause race';
}
function show(kicker, title, copy, button) {
  $('race-kicker').textContent = kicker; $('race-title').textContent = title; $('race-copy').textContent = copy;
  $('race-play').replaceChildren(document.createTextNode(button + ' '));
  const arrow = document.createElement('span'); arrow.textContent = '↗'; $('race-play').append(arrow);
  $('race-overlay').hidden = false;
}
function loop(now) {
  if (race.status !== 'playing') return;
  if (lastTime !== undefined) accumulator += Math.min((now - lastTime) / 1000, .1);
  lastTime = now;
  while (accumulator >= 1 / 120 && race.status === 'playing') { advanceRace(race, 1 / 120); accumulator -= 1 / 120; }
  draw(); stats();
  if (race.status === 'over') {
    stop(); save(); $('race-pause').disabled = true;
    show(meters() > startingBest ? 'A FRESH DISTANCE RECORD' : 'THE ROAD WILL BE HERE', 'A bump in the road.', `${meters().toLocaleString()} meters. ${race.passed} cars overtaken. Ready for another drive?`, 'Drive again');
    $('race-play').focus({ preventScroll: true });
  } else frame = requestAnimationFrame(loop);
}
function start() {
  if (!active()) return;
  stop(); save(); startingBest = best; race = createRace(); race.status = 'playing';
  $('race-overlay').hidden = true; $('race-pause').disabled = false; setPauseButton(false);
  stats(); resize(); canvas.focus({ preventScroll: true }); frame = requestAnimationFrame(loop);
}
function pause() {
  if (race.status !== 'playing') return;
  race.status = 'paused'; stop(); save(); setPauseButton(true);
  show('PARKED FOR A MOMENT', 'Enjoy the scenery.', 'Your drive is right where you left it.', 'Keep driving');
}
function resume() {
  if (!active() || race.status !== 'paused' || $('race-how-dialog').open) return;
  race.status = 'playing'; $('race-overlay').hidden = true; setPauseButton(false);
  canvas.focus({ preventScroll: true }); frame = requestAnimationFrame(loop);
}
const play = () => race.status === 'paused' ? resume() : start();
$('race-play').addEventListener('click', play);
$('race-restart').addEventListener('click', start);
$('race-pause').addEventListener('click', () => race.status === 'playing' ? pause() : resume());
for (const button of document.querySelectorAll('[data-steer]')) button.addEventListener('click', () => steer(race, Number(button.dataset.steer)));
document.addEventListener('keydown', e => {
  if (!active() || $('race-how-dialog').open || e.metaKey || e.ctrlKey || e.altKey) return;
  const direction = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }[e.key];
  if (direction && (race.status === 'playing' || e.target === canvas)) {
    e.preventDefault(); if (!e.repeat) steer(race, direction);
  } else if (e.code === 'Space' && !e.target.closest('button, a, input, select')) {
    e.preventDefault(); if (!e.repeat) race.status === 'playing' ? pause() : play();
  }
});
canvas.addEventListener('pointerdown', e => { swipe = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', e => { if (swipe === undefined) return; const dx = e.clientX - swipe; swipe = undefined; if (Math.abs(dx) >= 16) steer(race, Math.sign(dx)); });
canvas.addEventListener('pointercancel', () => swipe = undefined);
window.addEventListener('blur', pause);
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('arcade-select', e => { if (e.detail !== 'racing') pause(); else resize(); });
$('how-button').addEventListener('click', () => { if (active()) { pause(); $('race-how-dialog').showModal(); } });
document.querySelectorAll('.race-dialog-close').forEach(button => button.addEventListener('click', () => { $('race-how-dialog').close(); if (button.classList.contains('play-button')) play(); }));
$('race-how-dialog').addEventListener('click', e => { if (e.target !== $('race-how-dialog')) return; const r = $('race-how-dialog').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('race-how-dialog').close(); });
new ResizeObserver(resize).observe(canvas.parentElement);
stats();
