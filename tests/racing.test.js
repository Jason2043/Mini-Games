import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, steer, advanceRace, spawnTraffic, laneX, ROAD } from '../racing-engine.js';
const driving = () => ({ ...createRace(), status: 'playing' });
test('new races reset distance and start in the center lane', () => {
  const r = createRace(); assert.equal(r.distance, 0); assert.equal(r.lane, 1); assert.equal(r.x, laneX(1)); assert.equal(r.status, 'ready');
});
test('steering is bounded and moves smoothly toward the chosen lane', () => {
  const r = driving(); assert.ok(steer(r, -1)); assert.equal(steer(r, -1), false);
  advanceRace(r, .05); assert.ok(r.x < laneX(1) && r.x > laneX(0));
  for (let i=0;i<10;i++) advanceRace(r, .05);
  assert.equal(r.x, laneX(0)); steer(r, 1); steer(r, 1); assert.equal(steer(r, 1), false); assert.equal(steer(r, 2), false);
});
test('every traffic wave leaves an open lane', () => {
  for (let sample=0;sample<10;sample++) {
    const r = driving(); r.elapsed = 60;
    spawnTraffic(r, () => sample / 10);
    assert.ok(r.traffic.length >= 1 && r.traffic.length <= 2);
    assert.equal(new Set(r.traffic.map(c => c.lane)).size, r.traffic.length);
    assert.ok(r.traffic.every(c => c.lane >= 0 && c.lane <= 2));
  }
});
test('a car in the player path ends the race; adjacent lanes remain safe', () => {
  const r = driving(); r.traffic.push({x: laneX(1), y: ROAD.playerY - 50, lane:1, color:0});
  assert.equal(advanceRace(r, .01), 'collision'); assert.equal(r.status, 'over');
  const safe = driving(); safe.traffic.push({x:laneX(0),y:ROAD.playerY,lane:0,color:0});
  assert.equal(advanceRace(safe, .01), 'drive');
});
test('overtakes count once and offscreen cars are removed', () => {
  const r = driving(); r.traffic.push({x:laneX(0),y:380,lane:0,color:0,passed:false});
  advanceRace(r, .05); assert.equal(r.passed, 1);
  for(let i=0;i<20;i++) advanceRace(r,.05);
  assert.equal(r.passed, 1); assert.equal(r.traffic.length, 0);
});
test('distance tracks speed and both speed and frame delta are bounded', () => {
  const r = driving(); advanceRace(r, .05); assert.ok(r.distance > 2 && r.distance < 3);
  r.elapsed = 1000; r.nextSpawn = 100; advanceRace(r, 10);
  assert.equal(r.speed, 300); assert.ok(r.distance < 7);
});
test('paused and finished races do not advance or steer', () => {
  for(const status of ['ready','paused','over']) {
    const r = driving(); r.status = status; const before = JSON.stringify(r);
    assert.equal(advanceRace(r,.05), 'idle'); assert.equal(steer(r,1),false); assert.equal(JSON.stringify(r),before);
  }
});
