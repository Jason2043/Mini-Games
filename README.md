# Pocket Arcade

A responsive, browser-based arcade with three complete games: Snake, Road Rush, and Diamond Days baseball. Built with HTML, CSS, and JavaScript. No packages to install, account to create, or build step.

## Run locally

With Node.js 18 or newer installed:

```sh
npm start
```

Open http://localhost:3000. To choose another port, run `PORT=3001 npm start`.

## Play

- Choose Chill, Classic, or Speedy. Changing pace resets the round.
- Click **Let's play** or press **Space**.
- Move with **arrow keys** or **WASD**. On mobile, swipe the board or use the directional buttons.
- Eat orange snacks for 10 points each. Avoid walls and your own body.
- Press **Space** or the pause button to pause/resume. The game automatically pauses when you leave the tab or open instructions.
- Use the restart button for a fresh round, or **Play again** after a collision.
- Sound starts muted; use the music button to enable it.
- Personal bests are stored separately for each difficulty in this browser. Private browsing or browser storage restrictions may prevent saving.

## Road Rush

Select **Road Rush** in the game picker, then click **Hit the road** or press **Space**.

- Steer with **left/right arrows**, **A/D**, horizontal swipes, or the steering buttons. Each press changes one lane.
- The car accelerates automatically from 150 to 300 km/h. Dodge all traffic; a collision ends the drive.
- Drive as far as possible. The scoreboard tracks meters, speed, and cars overtaken.
- Press **Space** or pause to take a break. Restart or **Drive again** for another run.
- Switching games, opening instructions, leaving the window, or hiding the tab pauses the current run.
- Your best distance is stored in this browser separately from Snake records.

## Diamond Days baseball

Choose **Diamond Days** in the game picker. Select your hitter and opposing pitcher before the inning, then **Play ball**.

- **Power hitter:** home-run strength, a tighter timing window, and slower running. Weak grounders can become outs.
- **Contact hitter:** wider timing window, less power, and faster running. Quick feet beat close throws and stretch strong hits into triples.
- **Fastball ace:** starts at 98 mph and depletes stamina in 6 pitches. Fatigue slows the ball.
- **Curveball artist:** starts at 76 mph with a curved flight, depletes stamina in 18 pitches, and gradually loses movement.
- Press **Space** or the action button to start a pitch, then press again when the ball reaches home plate. The green timing zone also shows the contact window. Every pitch is a strike in this arcade mode.
- Three strikes make an out. Fouls cannot add a third strike. Three outs end the inning.
- Base running is automatic; hits advance runners and home runs score everyone on base. Runner speed affects close plays and extra bases.
- **P** or the pause button pauses/resumes. Switching games, leaving the tab, and opening help also pause play.
- Restart returns to player selection. Best runs are saved separately for all four matchups.

Block Drop and Memory Match are marked as coming soon.

## Check game rules

```sh
npm test
```

The tests cover food, scoring, growth, input buffering, wall and body collisions, moving into a vacating tail, pause, and winning a full board.

## Project layout

- `index.html`, `styles.css`: responsive hub and game UI
- `engine.js`: game rules, independent of the browser
- `app.js`: Snake rendering, controls, audio, local records, and game selection
- `racing-engine.js`, `racing.js`: Road Rush simulation, canvas rendering, controls, and records
- `baseball-engine.js`, `baseball.js`: player types, stamina, batting, base running, canvas rendering, and records
- `server.mjs`: dependency-free local server

The site needs no external services. Google Fonts are optional; system fonts are used offline. Serve the files over HTTP rather than opening `index.html` directly because the game uses JavaScript modules.
