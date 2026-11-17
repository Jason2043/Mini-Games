import { PITCHERS, HITTERS, createBaseball, pitchBall, swingBat, advanceBaseball } from './baseball-engine.js';
const $ = id => document.getElementById(id), canvas = $('bb-board'), ctx = canvas.getContext('2d');
let game = createBaseball(), frame, lastTime, accumulator = 0, records = {}, shownResult;
try { const saved = JSON.parse(localStorage.getItem('pocket-arcade-baseball-bests') || '{}'); if (saved && typeof saved === 'object') records = saved; } catch { /* Storage is optional. */ }
const active = () => !$('baseball-panel').hidden;
const recordKey = () => `${game.pitcher}:${game.hitter}`;
const best = () => Number.isFinite(records[recordKey()]) ? records[recordKey()] : 0;
function save() {
  if (game.runs <= best()) return;
  records[recordKey()] = game.runs;
  try { localStorage.setItem('pocket-arcade-baseball-bests', JSON.stringify(records)); }
  catch { $('bb-save-note').textContent = 'Storage unavailable. Records kept for this visit.'; }
}
function stats() {
  $('bb-runs').textContent = String(game.runs).padStart(2, '0'); $('bb-best').textContent = String(Math.max(best(), game.runs)).padStart(2, '0');
  $('bb-outs').textContent = `${game.outs}/3`; $('bb-count').textContent = `${game.strikes} STRIKE${game.strikes === 1 ? '' : 'S'} · ${game.hits} HIT${game.hits === 1 ? '' : 'S'}`;
  $('bb-velocity').textContent = game.pitch ? `${game.pitch.mph} MPH · ${game.pitcher.toUpperCase()}` : PITCHERS[game.pitcher].name.toUpperCase();
  $('bb-stamina').value = game.stamina * 100; $('bb-stamina-label').textContent = `${Math.round(game.stamina * 100)}% · ${game.pitches} pitch${game.pitches === 1 ? '' : 'es'}`;
  const tired = game.stamina <= 0 ? ' Fatigued: pitches are slower and flatter.' : '';
  $('bb-player-note').textContent = `${PITCHERS[game.pitcher].name} tires after ${PITCHERS[game.pitcher].pitches} pitches.${tired} ${game.hitter === 'power' ? 'Power hitter: tight timing, home-run strength, slow feet.' : 'Contact hitter: wider timing, quick feet, fewer home runs.'}`;
  const locked = game.status === 'playing' || game.status === 'paused';
  document.querySelectorAll('[data-hitter], [data-pitcher]').forEach(button => button.disabled = locked);
  $('bb-lock-note').textContent = locked ? 'Matchup locked. Restart the inning to change players.' : 'Choose players before the inning. Restart to change.';
  const action = $('bb-action');
  action.disabled = game.status !== 'playing' || game.phase === 'result';
  action.textContent = ['windup', 'pitch'].includes(game.phase) ? 'Swing! ↗' : game.phase === 'result' ? 'Play in progress…' : 'Pitch ball ↗';
  $('bb-pause').disabled = !['playing', 'paused'].includes(game.status);
  $('bb-pause').textContent = game.status === 'paused' ? '▷' : 'Ⅱ';
  const label = game.status === 'paused' ? 'Resume baseball' : 'Pause baseball';
  $('bb-pause').setAttribute('aria-label', label); $('bb-pause').title = label;
  const cue = game.status === 'ready' ? 'Choose your matchup, then play ball.' : game.status === 'paused' ? 'Time out. Resume when you’re ready.' : game.phase === 'ready' ? 'Ready? Start the next pitch.' : game.phase === 'windup' ? 'Pitcher winding up… wait for the ball.' : game.phase === 'pitch' ? 'Swing as the ball reaches home plate!' : game.status === 'over' ? 'Three outs. That’s your inning.' : game.result?.title || '';
  if ($('bb-cue').textContent !== cue) $('bb-cue').textContent = cue;
  const progress = game.phase === 'pitch' ? Math.min(1.25, game.pitch.time / game.pitch.duration) : game.phase === 'result' ? 1.25 : 0;
  $('bb-timing-ball').style.left = `${progress / 1.25 * 100}%`;
  const width = HITTERS[game.hitter].window / (game.pitch?.duration || PITCHERS[game.pitcher].duration) / 1.25 * 100;
  $('bb-contact-zone').style.left = `${80 - width}%`; $('bb-contact-zone').style.width = `${width * 2}%`;
  if (game.result && shownResult !== game.result) { shownResult = game.result; save(); $('bb-result-title').textContent = game.result.title; $('bb-result-copy').textContent = game.result.message; }
  $('bb-result').hidden = game.phase !== 'result';
}
function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function line(points, color, width = 2) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke(); }
function polygon(points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); }
function player(x,y,color='#dce7ce',bat=false) {
  ctx.fillStyle='#203f3340';ctx.beginPath();ctx.ellipse(x+3,y+4,10,4,0,0,Math.PI*2);ctx.fill();
  line([[x-3,y],[x-4,y+5]],'#253d37',3);line([[x+3,y],[x+5,y+5]],'#253d37',3);
  ctx.fillStyle=color;ctx.fillRect(x-5,y-10,10,11);circle(x,y-14,5,'#e7b792');
  ctx.fillStyle=color;ctx.fillRect(x-6,y-19,12,5);
  if(bat) line([[x+6,y-5],[x+18,y-25]],'#e2bc78',4);
}
const bases = [[320,380],[440,285],[320,195],[200,285],[320,380]];
function basePoint(position) {
  const i=Math.min(3,Math.floor(position)), p=position-i;
  return [bases[i][0]+(bases[i+1][0]-bases[i][0])*p,bases[i][1]+(bases[i+1][1]-bases[i][1])*p];
}
function draw() {
  if (!canvas.width || !canvas.height) return;
  ctx.setTransform(canvas.width/640,0,0,canvas.height/430,0,0);
  ctx.fillStyle='#577b59';ctx.fillRect(0,0,640,430);
  for(let i=0;i<7;i++) {ctx.fillStyle=i%2?'#344f49':'#3b5950';ctx.fillRect(0,15+i*10,640,10);}
  for(let row=0;row<3;row++)for(let i=0;i<48;i++)circle(7+i*14+(row%2)*4,23+row*17,2,['#a2b489','#e9d4a5','#83a5a0'][i%3]);
  // The outfield fan and alternating mowing stripes frame a compact baseball diamond.
  ctx.save();ctx.beginPath();ctx.moveTo(320,380);ctx.arc(320,380,315,-Math.PI*.79,-Math.PI*.21);ctx.closePath();ctx.clip();
  ctx.fillStyle='#86a96b';ctx.fillRect(0,0,640,430);
  for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#8dad71':'#83a366';ctx.fillRect(0,i*43,640,43);}
  ctx.restore();
  ctx.strokeStyle='#d6d6a2';ctx.lineWidth=5;ctx.beginPath();ctx.arc(320,380,315,-Math.PI*.79,-Math.PI*.21);ctx.stroke();
  ctx.fillStyle='#e1dfb6';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('110 m',320,87);
  polygon([[320,380],[440,285],[320,195],[200,285]],'#c8ac7f');
  polygon([[320,352],[404,285],[320,221],[236,285]],'#83a466');
  line([[60,159],[320,380],[580,159]],'#f4efd3',2);
  line([[320,380],[440,285],[320,195],[200,285],[320,380]],'#e6d0a1',2);
  circle(320,270,17,'#cbb288');ctx.fillStyle='#eee8d1';ctx.fillRect(313,267,14,3);
  for(let i=1;i<4;i++){ctx.save();ctx.translate(...bases[i]);ctx.rotate(Math.PI/4);ctx.fillStyle='#f5f0d8';ctx.fillRect(-5,-5,10,10);ctx.restore();}
  polygon([[313,375],[327,375],[327,381],[320,387],[313,381]],'#fff6de');
  line([[293,370],[285,370],[285,388],[293,388]],'#e8ddba',1);line([[346,370],[355,370],[355,388],[346,388]],'#e8ddba',1);
  player(320,152);player(166,243);player(464,243);player(245,245);player(393,245);
  player(320,261,'#e3ba8d');player(320,400,'#a6bfbb');
  const result=game.result;
  const running=game.phase==='result'&&(result?.bases||result?.type==='groundout');
  if(running){
    const progress=Math.min(1,game.resultTime/(HITTERS[game.hitter].runTime*.48));
    const steps=result.bases||1;
    for(let i=0;i<4;i++) if(i===0||result.oldBases[i-1]){
      const end=Math.min(4,i+steps);const point=basePoint(i+(end-i)*progress);player(point[0],point[1]-3,'#e9a15f');
    }
  } else {for(let i=0;i<3;i++)if(game.bases[i])player(bases[i+1][0],bases[i+1][1]-5,'#e9a15f');player(301,379,'#e9a15f',true);}
  if(game.phase==='windup'){line([[326,250],[336,233]],'#e7b792',4);}
  if(game.phase==='pitch'){
    const p=Math.min(1.18,game.pitch.time/game.pitch.duration);const x=320+Math.sin(Math.min(1,p)*Math.PI)*game.pitch.break;const y=265+115*p;
    line([[x-2,y-10],[x,y]],'#fff4cc70',3);circle(x+2,y+2,3+3*p,'#263b3740');circle(x,y,3+3*p,'#fff7dd');line([[x-2,y-2],[x+2,y+2]],'#c36e58',1);
  }
  if(game.phase==='result'&&result?.distance){
    const p=Math.min(1,game.resultTime/1.2);const targetY=Math.max(35,360-result.distance*2.6);const targetX=320+(game.hitter==='power'?75:-65);
    const x=320+(targetX-320)*p,y=380+(targetY-380)*p-Math.sin(p*Math.PI)*65;
    if(p<1||game.resultTime<1.6){circle(x+2,y+3,4,'#20372d55');circle(x,y,4,'#fff6dc');}
  }
  ctx.setTransform(1,0,0,1,0,0);
}
function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);draw();}
function stop(){cancelAnimationFrame(frame);lastTime=undefined;accumulator=0;}
function show(kicker,title,copy,button){$('bb-kicker').textContent=kicker;$('bb-title').textContent=title;$('bb-copy').textContent=copy;$('bb-play').replaceChildren(document.createTextNode(button+' '));const arrow=document.createElement('span');arrow.textContent='↗';$('bb-play').append(arrow);$('bb-overlay').hidden=false;}
function loop(now){
  if(game.status!=='playing')return;
  if(lastTime!==undefined)accumulator+=Math.min((now-lastTime)/1000,.1);lastTime=now;
  while(accumulator>=1/120&&game.status==='playing'){advanceBaseball(game,1/120);accumulator-=1/120;}
  stats();draw();
  if(game.status==='over'){stop();save();show('THREE OUTS. ONE GOOD LITTLE INNING.',`${game.runs} run${game.runs===1?'':'s'} on the board.`,`${game.hits} hits in ${game.pitches} pitches. Try another matchup or take another swing.`, 'Play another inning');$('bb-play').focus({preventScroll:true});}
  else frame=requestAnimationFrame(loop);
}
function start(){if(!active())return;stop();save();game=createBaseball(game.pitcher,game.hitter);game.status='playing';shownResult=null;$('bb-overlay').hidden=true;stats();resize();canvas.focus({preventScroll:true});frame=requestAnimationFrame(loop);}
function pause(){if(game.status!=='playing')return;game.status='paused';stop();save();stats();show('TIME OUT','A moment in the dugout.','Your inning will be right here.','Keep playing');}
function resume(){if(!active()||game.status!=='paused'||$('bb-how-dialog').open)return;game.status='playing';$('bb-overlay').hidden=true;stats();canvas.focus({preventScroll:true});frame=requestAnimationFrame(loop);}
const play=()=>game.status==='paused'?resume():start();
function action(){if(game.status!=='playing')return;if(game.phase==='ready')pitchBall(game);else swingBat(game);stats();draw();}
$('bb-play').addEventListener('click',play);$('bb-action').addEventListener('click',()=>{action();canvas.focus({preventScroll:true});});
$('bb-pause').addEventListener('click',()=>game.status==='paused'?resume():pause());
$('bb-restart').addEventListener('click',()=>{stop();save();game=createBaseball(game.pitcher,game.hitter);shownResult=null;stats();draw();show('MAKE YOUR NEXT MATCHUP','Back to the lineup.', 'Choose your players, then start a fresh inning.','Play ball');});
for(const button of document.querySelectorAll('[data-hitter], [data-pitcher]'))button.addEventListener('click',()=>{
  if(['playing','paused'].includes(game.status))return;
  const kind=button.dataset.hitter?'hitter':'pitcher';const value=button.dataset[kind];
  game=createBaseball(kind==='pitcher'?value:game.pitcher,kind==='hitter'?value:game.hitter);
  document.querySelectorAll(`[data-${kind}]`).forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
  stats();draw();show('YOUR MATCHUP IS SET','Step up to the plate.',`${HITTERS[game.hitter].name} vs. ${PITCHERS[game.pitcher].name}. Score runs before three outs.`,'Play ball');
});
document.addEventListener('keydown',e=>{
  if(!active()||$('bb-how-dialog').open||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.code==='Space'&&!e.target.closest('button,a,input,select')){e.preventDefault();if(e.repeat)return;['ready','over','paused'].includes(game.status)?play():action();}
  if(e.code==='KeyP'){e.preventDefault();if(!e.repeat)game.status==='playing'?pause():resume();}
});
window.addEventListener('blur',pause);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
document.addEventListener('arcade-select',e=>{if(e.detail!=='baseball')pause();else resize();});
$('how-button').addEventListener('click',()=>{if(active()){pause();$('bb-how-dialog').showModal();}});
document.querySelectorAll('.bb-dialog-close').forEach(button=>button.addEventListener('click',()=>{$('bb-how-dialog').close();if(button.classList.contains('play-button'))play();}));
new ResizeObserver(resize).observe(canvas.parentElement);stats();
