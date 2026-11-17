export const ROAD = { left: 120, right: 480, laneWidth: 120, playerY: 310, carWidth: 42, carHeight: 64 };
export const laneX = lane => ROAD.left + ROAD.laneWidth * (lane + .5);
export function createRace() {
  return { status: 'ready', lane: 1, x: laneX(1), traffic: [], distance: 0, elapsed: 0, speed: 150, passed: 0, nextSpawn: 1.8, scroll: 0 };
}
export function steer(race, direction) {
  if (race.status !== 'playing' || ![-1, 1].includes(direction)) return false;
  const lane = Math.max(0, Math.min(2, race.lane + direction));
  if (lane === race.lane) return false;
  race.lane = lane;
  return true;
}
export function spawnTraffic(race, random = Math.random) {
  // Each wave leaves at least one lane open. Waves are far enough apart to cross two lanes.
  const openLane = Math.min(2, Math.floor(random() * 3));
  const lanes = [0, 1, 2].filter(lane => lane !== openLane);
  const count = race.elapsed > 12 && random() > .35 ? 2 : 1;
  if (count === 1 && random() > .5) lanes.reverse();
  for (const lane of lanes.slice(0, count)) race.traffic.push({ lane, x: laneX(lane), y: -90, color: Math.floor(random() * 3), passed: false });
}
export function advanceRace(race, dt, random = Math.random) {
  if (race.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return 'idle';
  // Bound simulation steps so a delayed frame cannot jump over a collision.
  dt = Math.min(dt, .05);
  race.elapsed += dt;
  race.speed = Math.min(300, 150 + race.elapsed * 2.2);
  race.distance += race.speed / 3.6 * dt;
  const velocity = 170 + (race.speed - 150) * .9;
  race.scroll = (race.scroll + velocity * dt) % 80;
  const target = laneX(race.lane);
  race.x += Math.sign(target - race.x) * Math.min(Math.abs(target - race.x), 700 * dt);
  race.nextSpawn -= dt;
  if (race.nextSpawn <= 0) {
    spawnTraffic(race, random);
    race.nextSpawn = Math.max(1.25, 2.1 - race.elapsed * .009);
  }
  for (const car of race.traffic) {
    car.y += velocity * dt;
    // Small forgiving insets match the visible body rather than decorative wheel edges.
    if (Math.abs(car.x - race.x) < ROAD.carWidth - 7 && Math.abs(car.y - ROAD.playerY) < ROAD.carHeight - 9) {
      race.status = 'over';
      return 'collision';
    }
    if (!car.passed && car.y > ROAD.playerY + ROAD.carHeight) { car.passed = true; race.passed++; }
  }
  race.traffic = race.traffic.filter(car => car.y < 500);
  return 'drive';
}
