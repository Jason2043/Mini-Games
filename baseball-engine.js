export const PITCHERS = {
  fastball: { name: 'Fastball ace', pitches: 6, duration: .76, break: 5, mph: 98 },
  curveball: { name: 'Curveball artist', pitches: 18, duration: 1.23, break: 58, mph: 76 }
};
export const HITTERS = {
  power: { name: 'Power hitter', window: .105, power: 1.45, runTime: 4.8 },
  contact: { name: 'Contact hitter', window: .18, power: .83, runTime: 3.5 }
};
export function createBaseball(pitcher = 'fastball', hitter = 'power') {
  if (!PITCHERS[pitcher] || !HITTERS[hitter]) throw new Error('Unknown player type');
  return { pitcher, hitter, status: 'ready', phase: 'ready', pitches: 0, stamina: 1, strikes: 0, outs: 0, runs: 0, hits: 0, bases: [false, false, false], pitch: null, result: null, resultTime: 0 };
}
export function pitchBall(game) {
  if (game.status !== 'playing' || game.phase !== 'ready') return false;
  const type = PITCHERS[game.pitcher], fatigue = 1 - game.stamina;
  game.pitch = { time: 0, windup: .65, duration: type.duration + fatigue * .48, break: type.break * (1 - fatigue * .65), mph: Math.round(type.mph - fatigue * 24) };
  game.pitches++;
  game.stamina = Math.max(0, 1 - game.pitches / type.pitches);
  game.phase = 'windup'; game.result = null;
  return true;
}
function finishAtBat(game, result) {
  const oldBases = [...game.bases];
  if (result.bases) {
    game.hits++;
    for (let i = 2; i >= 0; i--) if (game.bases[i]) {
      game.bases[i] = false;
      if (i + result.bases >= 3) game.runs++; else game.bases[i + result.bases] = true;
    }
    if (result.bases === 4) game.runs++; else game.bases[result.bases - 1] = true;
    game.strikes = 0;
  } else if (result.out) { game.outs++; game.strikes = 0; }
  game.result = { ...result, oldBases };
  game.phase = 'result'; game.resultTime = 0;
  return game.result;
}
function strike(game, message = 'Swing and a miss.') {
  game.strikes++;
  if (game.strikes >= 3) return finishAtBat(game, { type: 'strikeout', title: 'Strike three.', message: 'A fresh batter. A fresh chance.', out: true });
  return finishAtBat(game, { type: 'strike', title: `Strike ${game.strikes}.`, message });
}
export function swingBat(game) {
  if (game.status !== 'playing' || !['windup', 'pitch'].includes(game.phase)) return null;
  if (game.phase === 'windup') return strike(game, 'Too early. Wait for the ball to reach the plate.');
  const hitter = HITTERS[game.hitter], error = game.pitch.time - game.pitch.duration;
  const difference = Math.abs(error);
  if (difference > hitter.window * 1.7) return strike(game, error < 0 ? 'Too early. Let the ball come to you.' : 'Too late. Swing a little sooner.');
  if (difference > hitter.window) {
    game.strikes = Math.min(2, game.strikes + 1);
    return finishAtBat(game, { type: 'foul', title: 'Foul ball.', message: 'Close! Fouls never add a third strike.' });
  }
  const quality = 1 - difference / hitter.window;
  const distance = Math.round(23 + quality * 72 * hitter.power);
  // Speed decides close plays and whether a well-hit ball can be stretched into extra bases.
  const throwTime = 3.1 + distance * .035;
  if (hitter.runTime > throwTime) return finishAtBat(game, { type: 'groundout', title: 'Out at first.', message: `${distance} m grounder. The throw beat your runner.`, out: true, distance, quality, error });
  let bases = distance >= 110 ? 4 : distance >= 78 && hitter.runTime < 4 ? 3 : distance >= 65 ? 2 : 1;
  const titles = { 1: 'A little single.', 2: 'Into the gap! Double.', 3: 'Keep running! Triple.', 4: 'Out of the park!' };
  return finishAtBat(game, { type: bases === 4 ? 'homer' : 'hit', bases, title: titles[bases], message: `${distance} m · ${quality > .85 ? 'Perfect timing.' : error < 0 ? 'A little early.' : 'A little late.'} ${bases === 4 ? 'Touch them all.' : hitter.runTime < 4 ? 'Quick feet make the difference.' : 'Power puts it in play.'}`, distance, quality, error });
}
export function advanceBaseball(game, dt) {
  if (game.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return 'idle';
  dt = Math.min(dt, .05);
  if (game.phase === 'windup') {
    game.pitch.windup -= dt;
    if (game.pitch.windup <= 0) game.phase = 'pitch';
  } else if (game.phase === 'pitch') {
    game.pitch.time += dt;
    if (game.pitch.time > game.pitch.duration + .22) { strike(game, 'A called strike. Swing as the ball reaches home.'); return 'strike'; }
  } else if (game.phase === 'result') {
    game.resultTime += dt;
    if (game.resultTime >= 2.6) {
      if (game.outs >= 3) { game.status = 'over'; game.phase = 'over'; return 'over'; }
      game.phase = 'ready'; return 'ready';
    }
  }
  return game.phase;
}
