import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, turn, DIRECTIONS, spawnFood, COLS, ROWS } from '../engine.js';
test('new rounds reset score and place food outside the snake', () => {
  const g = createGame(() => .5); assert.equal(g.score, 0); assert.equal(g.snake.length, 4);
  assert.ok(!g.snake.some(p => p.x === g.food.x && p.y === g.food.y));
});
test('a snack grows the snake and adds ten points', () => {
  const g = createGame(); g.food = { x: 10, y: 10 };
  assert.equal(step(g), 'eat'); assert.equal(g.score, 10); assert.equal(g.snake.length, 5);
});
test('turns reject reversals and retain two rapid legal turns', () => {
  const g = createGame(); assert.equal(turn(g, 'left'), false);
  assert.equal(turn(g, 'up'), true); assert.equal(turn(g, 'down'), false);
  assert.equal(turn(g, 'left'), true); assert.equal(turn(g, 'down'), false);
  step(g); assert.deepEqual(g.snake[0], { x: 9, y: 9 });
  step(g); assert.deepEqual(g.snake[0], { x: 8, y: 9 });
});
test('walls and the body end a round', () => {
  const g = createGame(); g.snake[0] = { x: 29, y: 10 }; assert.equal(step(g), 'collision'); assert.equal(g.status, 'over');
  const body = createGame(); body.snake = [{x:2,y:2},{x:2,y:1},{x:3,y:1},{x:3,y:2},{x:4,y:2}];
  assert.equal(step(body), 'collision');
});
test('the vacating tail is a legal move', () => {
  const g = createGame(); g.snake = [{x:2,y:2},{x:2,y:1},{x:3,y:1},{x:3,y:2}];
  g.food = {x:10,y:10}; assert.equal(step(g), 'move'); assert.deepEqual(g.snake[0], {x:3,y:2});
});
test('pause freezes the game', () => {
  const g = createGame(); g.status = 'paused'; const before = JSON.stringify(g);
  assert.equal(step(g), 'idle'); assert.equal(turn(g, 'up'), false); assert.equal(JSON.stringify(g), before);
});
test('filling the board wins without an endless food search', () => {
  const full = []; for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) full.push({x,y});
  assert.equal(spawnFood(full), null);
  const g = createGame(); g.snake = [{x:0,y:0}, ...full.filter(p => !(p.x===0&&p.y===0) && !(p.x===1&&p.y===0))];
  g.direction = DIRECTIONS.right; g.food = {x:1,y:0}; assert.equal(step(g), 'won'); assert.equal(g.status, 'won'); assert.equal(g.food, null);
});
