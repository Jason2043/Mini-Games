import test from 'node:test';
import assert from 'node:assert/strict';
import { createBaseball, pitchBall, swingBat, advanceBaseball, HITTERS } from '../baseball-engine.js';
function ready(pitcher='fastball',hitter='power'){const g=createBaseball(pitcher,hitter);g.status='playing';return g;}
function pitch(g,error=0){g.phase='ready';pitchBall(g);g.phase='pitch';g.pitch.time=g.pitch.duration+error;return g;}
function settle(g){for(let i=0;i<54;i++)advanceBaseball(g,.05);}
test('all four player matchups start with a clean inning',()=>{
  for(const p of ['fastball','curveball'])for(const h of ['power','contact']){const g=createBaseball(p,h);assert.equal(g.outs,0);assert.equal(g.runs,0);assert.deepEqual(g.bases,[false,false,false]);assert.equal(g.stamina,1);}
});
test('fastball starts faster but tires three times sooner than curveball',()=>{
  const fast=ready(),curve=ready('curveball');
  for(let i=0;i<6;i++){pitch(fast);pitch(curve);}
  assert.equal(fast.stamina,0);assert.ok(Math.abs(curve.stamina-2/3)<.001);
  const fresh=ready();pitch(fresh);pitch(fast);
  assert.ok(fast.pitch.mph<fresh.pitch.mph);assert.ok(fast.pitch.duration>fresh.pitch.duration);
  assert.ok(fresh.pitch.duration<curve.pitch.duration);assert.ok(curve.pitch.break>fresh.pitch.break);
});
test('curveball retains stamina for eighteen pitches and loses movement with fatigue',()=>{
  const g=ready('curveball');pitch(g);const initial=g.pitch.break;
  for(let i=1;i<18;i++)pitch(g);
  assert.equal(g.stamina,0);pitch(g);assert.ok(g.pitch.break<initial);assert.ok(g.pitch.break>0);
});
test('contact has a wider timing window while power can hit home runs',()=>{
  const power=ready(),contact=ready('fastball','contact');
  pitch(power,.14);pitch(contact,.14);
  assert.equal(swingBat(power).type,'foul');assert.equal(swingBat(contact).type,'hit');
  const perfectPower=ready(),perfectContact=ready('fastball','contact');pitch(perfectPower);pitch(perfectContact);
  assert.equal(swingBat(perfectPower).bases,4);assert.equal(swingBat(perfectContact).bases,3);
  assert.ok(HITTERS.contact.runTime<HITTERS.power.runTime);
});
test('runner speed decides weak grounders',()=>{
  const slow=ready(),fast=ready('curveball','contact');
  pitch(slow,HITTERS.power.window*.97);pitch(fast,HITTERS.contact.window*.97);
  assert.equal(swingBat(slow).type,'groundout');assert.equal(swingBat(fast).bases,1);
});
test('a home run scores the batter and all occupied bases',()=>{
  const g=ready();g.bases=[true,true,true];pitch(g);swingBat(g);
  assert.equal(g.runs,4);assert.equal(g.hits,1);assert.deepEqual(g.bases,[false,false,false]);assert.equal(g.strikes,0);
});
test('hits advance runners without duplication',()=>{
  const g=ready('fastball','contact');g.bases=[true,true,true];
  // Roughly 51 m is a single for the contact hitter.
  pitch(g,HITTERS.contact.window*.53);const result=swingBat(g);
  assert.equal(result.bases,1);assert.equal(g.runs,1);assert.deepEqual(g.bases,[true,true,true]);
});
test('fouls cannot strike out the batter',()=>{
  const g=ready();g.strikes=2;pitch(g,.14);swingBat(g);
  assert.equal(g.strikes,2);assert.equal(g.outs,0);assert.equal(g.phase,'result');
});
test('three misses make an out and three outs end the inning',()=>{
  const g=ready();
  for(let i=0;i<9;i++){pitch(g,-.5);swingBat(g);settle(g);}
  assert.equal(g.outs,3);assert.equal(g.strikes,0);assert.equal(g.status,'over');assert.equal(pitchBall(g),false);
});
test('taking a pitch is a strike; repeat swings and pitches are ignored',()=>{
  const g=ready();pitchBall(g);assert.equal(pitchBall(g),false);
  for(let i=0;i<40;i++)advanceBaseball(g,.05);
  assert.equal(g.strikes,1);assert.equal(g.phase,'result');assert.equal(swingBat(g),null);
});
test('pause freezes every phase and prevents input',()=>{
  const g=ready();pitchBall(g);g.status='paused';const before=JSON.stringify(g);
  assert.equal(advanceBaseball(g,.05),'idle');assert.equal(pitchBall(g),false);assert.equal(swingBat(g),null);assert.equal(JSON.stringify(g),before);
});
