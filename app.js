import { COLS, ROWS, PACES, createGame, turn, step } from './engine.js';
const $ = id => document.getElementById(id);
const canvas = $('board');
const ctx = canvas.getContext('2d');
let game = createGame();
game.status = 'ready';
let pace = 'chill', timer, sound = false, audioContext, touchStart, roundBest = 0;
let records = {};
try { records = JSON.parse(localStorage.getItem('pocket-arcade-bests') || '{}'); if (!records || typeof records !== 'object') records = {}; } catch { records = {}; }
const best = () => Number.isFinite(records[pace]) ? records[pace] : 0;
const format = score => String(score).padStart(3, '0');
const descriptions = { chill: ['Nice & easy', 'A slower slither. Room to find your rhythm.'], classic: ['The original pace', 'The sweet spot. Keep your eyes on the next snack.'], speedy: ['Quick on your keys', 'Fast snacks. Faster decisions. You’ve got this.'] };
function updateScores() { $('score').textContent = format(game.score); $('best').textContent = format(best()); }
function saveBest() {
  if (game.score > best()) {
    records[pace] = game.score;
    try { localStorage.setItem('pocket-arcade-bests', JSON.stringify(records)); } catch { document.querySelector('.save-note p span').textContent = 'Storage unavailable. Best kept for this visit.'; }
  }
  updateScores();
}
function beep(frequency, duration = .07) {
  if (!sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
  } catch { /* Sound is optional when Web Audio is unavailable. */ }
}
function rounded(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function draw() {
  const w = canvas.width, h = canvas.height, cw = w / COLS, ch = h / ROWS;
  ctx.fillStyle = '#1e3029'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2a3b31'; ctx.lineWidth = .65;
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cw, 0); ctx.lineTo(x * cw, h); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * ch); ctx.lineTo(w, y * ch); ctx.stroke(); }
  if (game.food) {
    const x = (game.food.x + .5) * cw, y = (game.food.y + .5) * ch;
    ctx.shadowColor = '#ff9861'; ctx.shadowBlur = 13;
    rounded(x - cw * .32, y - ch * .32, cw * .64, ch * .64, 5, '#ff9861'); ctx.shadowBlur = 0;
    rounded(x + 1, y - ch * .42, 5, 3, 1, '#b3ce7f');
  }
  for (let i = game.snake.length - 1; i >= 0; i--) {
    const part = game.snake[i];
    rounded(part.x * cw + 1, part.y * ch + 1, cw - 2, ch - 2, i === 0 ? 5 : 4, i === 0 ? '#e2fc9c' : '#bedb78');
  }
  const head = game.snake[0], d = game.direction;
  ctx.fillStyle = '#263b2c';
  for (const side of [-1, 1]) {
    const x = (head.x + .5) * cw + d.x * 4 + (d.y ? side * 4 : 0);
    const y = (head.y + .5) * ch + d.y * 4 + (d.x ? side * 4 : 0);
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
}
function resizeBoard() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  draw();
}
function setPauseButton(paused) {
  $('pause').textContent = paused ? '▷' : 'Ⅱ';
  $('pause').setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
  $('pause').title = paused ? 'Resume game' : 'Pause game';
}
function overlay({ kicker, title, copy, button, emblem = '⌁', hint = 'or press Space to play' }) {
  $('overlay-kicker').textContent = kicker;
  $('overlay-title').textContent = title;
  $('overlay-copy').textContent = copy;
  $('play').replaceChildren(document.createTextNode(button + ' '));
  const arrow = document.createElement('span'); arrow.textContent = '↗'; $('play').append(arrow);
  $('overlay-emblem').textContent = emblem;
  $('start-hint').textContent = hint;
  $('overlay').hidden = false;
}
function tick() {
  const result = step(game);
  if (result === 'eat') { beep(620); saveBest(); }
  draw();
  if (result === 'collision' || result === 'won') {
    clearInterval(timer); saveBest(); $('pause').disabled = true;
    beep(result === 'won' ? 880 : 160, .2);
    const won = result === 'won';
    overlay({ kicker: won ? 'EVERY LAST SNACK. INCREDIBLE.' : game.score > roundBest ? 'A FRESH PERSONAL BEST' : 'THERE’S ALWAYS ONE MORE TRY', title: won ? 'You grew the whole way.' : 'A good little run.', copy: `You scored ${game.score} points. ${game.score ? 'Your next snack is calling.' : 'Find your rhythm and try again.'}`, button: 'Play again', emblem: won ? '✦' : '↻' });
    $('play').focus({ preventScroll: true });
  }
}
function start() {
  clearInterval(timer); roundBest = best(); game = createGame(); updateScores();
  $('overlay').hidden = true; $('pause').disabled = false; setPauseButton(false);
  timer = setInterval(tick, PACES[pace]);
  canvas.focus({ preventScroll: true }); draw();
}
function pause() {
  if (game.status !== 'playing') return;
  game.status = 'paused'; clearInterval(timer); setPauseButton(true);
  overlay({ kicker: 'TAKE YOUR TIME', title: 'A break within a break.', copy: 'Your snake will be right here.', button: 'Keep playing', emblem: 'Ⅱ', hint: 'or press Space to resume' });
}
function resume() {
  if (game.status !== 'paused' || $('how-dialog').open) return;
  game.status = 'playing'; $('overlay').hidden = true; setPauseButton(false);
  timer = setInterval(tick, PACES[pace]); canvas.focus({ preventScroll: true });
}
function playAction() { game.status === 'paused' ? resume() : start(); }
$('play').addEventListener('click', playAction);
$('pause').addEventListener('click', () => game.status === 'paused' ? resume() : pause());
$('restart').addEventListener('click', start);
$('sound').addEventListener('click', () => {
  sound = !sound;
  $('sound').setAttribute('aria-label', sound ? 'Turn sound off' : 'Turn sound on');
  $('sound').title = sound ? 'Turn sound off' : 'Turn sound on';
  $('sound').querySelector('span').hidden = sound; beep(520);
});
for (const button of document.querySelectorAll('[data-level]')) button.addEventListener('click', () => {
  if (pace === button.dataset.level) return;
  clearInterval(timer); pace = button.dataset.level; game = createGame(); game.status = 'ready';
  document.querySelectorAll('[data-level]').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
  $('pace-label').textContent = descriptions[pace][0]; $('difficulty-note').textContent = descriptions[pace][1];
  $('pause').disabled = true; setPauseButton(false); updateScores(); draw();
  overlay({ kicker: 'A CLASSIC FOR A REASON', title: 'Hello, little snake.', copy: `${button.textContent} pace. A fresh board. How far can you grow?`, button: "Let's play", hint: 'or press Space to start' });
});
const keys = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
document.addEventListener('keydown', e => {
  if ($('snake-panel').hidden || $('how-dialog').open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'Space') {
    // Keep normal Space activation for focused controls other than the board.
    if (e.target.closest('button, a, input, select')) return;
    e.preventDefault(); if (e.repeat) return;
    if (game.status === 'playing') pause(); else playAction();
  } else if (keys[e.key] && (e.target === canvas || game.status === 'playing')) {
    e.preventDefault(); turn(game, keys[e.key]);
  }
});
for (const button of document.querySelectorAll('[data-dir]')) button.addEventListener('click', e => {
  e.preventDefault(); turn(game, button.dataset.dir);
});
canvas.addEventListener('pointerdown', e => { touchStart = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', e => {
  if (!touchStart) return;
  const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y; touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
  turn(game, Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
});
canvas.addEventListener('pointercancel', () => touchStart = null);
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
$('how-button').addEventListener('click', () => { if (!$('snake-panel').hidden) { pause(); $('how-dialog').showModal(); } });
document.querySelectorAll('#how-dialog .dialog-close').forEach(button => button.addEventListener('click', () => { $('how-dialog').close(); if (button.classList.contains('play-button')) playAction(); }));
$('how-dialog').addEventListener('click', e => { if (e.target === $('how-dialog')) { const r = $('how-dialog').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('how-dialog').close(); } });
new ResizeObserver(resizeBoard).observe($('board-wrap'));
updateScores(); resizeBoard();

for (const button of document.querySelectorAll('[data-game]')) button.addEventListener('click', () => {
  if (button.classList.contains('selected')) return;
  const selected = button.dataset.game;
  pause();
  document.querySelectorAll('[data-game]').forEach(b => { const active = b === button; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', active); });
  $('snake-panel').hidden = selected !== 'snake';
  $('racing-panel').hidden = selected !== 'racing';
  $('baseball-panel').hidden = selected !== 'baseball';
  document.dispatchEvent(new CustomEvent('arcade-select', { detail: selected }));
});
