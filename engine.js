export const COLS = 30;
export const ROWS = 20;
export const PACES = { chill: 150, classic: 105, speedy: 70 };
export const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export function spawnFood(snake, random = Math.random) {
  const free = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (!snake.some(part => part.x === x && part.y === y)) free.push({ x, y });
  }
  return free.length ? free[Math.floor(random() * free.length)] : null;
}
export function createGame(random = Math.random) {
  const snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  return { snake, direction: DIRECTIONS.right, queue: [], food: spawnFood(snake, random), score: 0, status: 'playing' };
}
export function turn(game, name) {
  const next = DIRECTIONS[name];
  const last = game.queue.at(-1) || game.direction;
  if (game.status !== 'playing' || !next || game.queue.length >= 2 || (next.x === -last.x && next.y === -last.y) || (next.x === last.x && next.y === last.y)) return false;
  game.queue.push(next);
  return true;
}
export function step(game, random = Math.random) {
  if (game.status !== 'playing') return 'idle';
  game.direction = game.queue.shift() || game.direction;
  const head = { x: game.snake[0].x + game.direction.x, y: game.snake[0].y + game.direction.y };
  const eats = game.food && head.x === game.food.x && head.y === game.food.y;
  const body = eats ? game.snake : game.snake.slice(0, -1);
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || body.some(p => p.x === head.x && p.y === head.y)) {
    game.status = 'over';
    return 'collision';
  }
  game.snake.unshift(head);
  if (!eats) game.snake.pop();
  else { game.score += 10; game.food = spawnFood(game.snake, random); if (!game.food) game.status = 'won'; }
  return game.status === 'won' ? 'won' : eats ? 'eat' : 'move';
}
