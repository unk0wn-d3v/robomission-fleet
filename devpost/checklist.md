---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Scaffold, 2D Grid Canvas & Initial World Render**
  Becomes usable: The local Vite dev server runs, displaying the 3-zone industrial console (controls banner, 16x12 warehouse canvas grid, and side telemetry log) with the docked blue robot, crates, zones, static racks, and initial system ready log.
  Why now: Bootstraps the project scaffold, dependencies, styling, canvas drawing pipeline, and event logging so every subsequent slice has a working visual stage to build on.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > States and Boundaries` (Ready State)
  Spec ref: `spec.md > Stack`, `spec.md > Components` (4. Canvas Renderer, 5. Telemetry Log), `spec.md > File Structure`
  Build: Initialize package.json with Vite, TypeScript, and Vitest; configure tsconfig and vite.config; create index.html with 3-zone layout; implement style.css with dark industrial theme; write types.ts; implement warehouseWorld.ts with 16x12 grid, items, dock, and static racks; implement canvasRenderer.ts to render the grid and entities; implement telemetryLog.ts; wire together in main.ts.
  Verify (mechanical): Run `npm run build` to confirm TypeScript compiles without errors; check that dev server loads with 0 console errors and canvas displays grid elements.
  Learner check: Open http://localhost:5173, confirm the dark navy console loads with the 3 zones, visible warehouse grid with blue robot at dock, colored crates, drop zones, static shelves, and the initial ready log entry.
  Commit: `Scaffold project and render interactive warehouse grid`

- [x] **2. Deterministic A* Shortest Pathfinding & Cyan Vector Rendering**
  Becomes usable: The robot computes the optimal Manhattan shortest path avoiding static obstacles, and the canvas draws the glowing cyan trajectory line connecting the waypoints.
  Why now: Pathfinding is the mathematical core of the robot; building and unit-testing it early with Vitest eliminates routing risks before animation is added.
  PRD ref: `prd.md > Features and Behavior` (2. Deterministic A* Pathfinding & Visualization)
  Spec ref: `spec.md > Components` (2. A* Pathfinding Engine), `spec.md > Data Model`
  Build: Implement `src/planner/astar.ts` with 4-directional Manhattan heuristic; write comprehensive unit tests in `src/planner/astar.test.ts` covering direct path, navigating around static racks, and returning null when trapped; update `canvasRenderer.ts` to draw glowing cyan path vector between waypoints.
  Verify (mechanical): Run `npm test` and confirm all A* pathfinding unit tests pass.
  Learner check: Run `npm test` to see tests pass; reload the app to observe the glowing cyan route line plotted cleanly on the grid.
  Commit: `Implement deterministic A* pathfinder and cyan route renderer`

- [x] **3. Animated Robot Movement & Telemetry Narration**
  Becomes usable: The robot advances cell-by-cell along the cyan route, trims traversed cells, secures cargo, navigates to the delivery bay, and streams milestone updates to the log.
  Why now: Validates the animation step loop, cargo attachment state, and waypoint consumption before adding dynamic interruptions.
  PRD ref: `prd.md > Features and Behavior` (2. Deterministic A* Pathfinding, 4. Real-Time Explainability Log)
  Spec ref: `spec.md > Components` (3. Simulation & Robot State Machine, 4. Canvas Renderer)
  Build: Implement `src/sim/robot.ts` and `src/sim/simulationManager.ts`; update robot state machine (IDLE -> PLANNING -> MOVING -> ARRIVED); implement discrete step timer interpolating robot movement across waypoints; update cargo attachment; trim path line as robot advances; log navigation milestones in `telemetryLog.ts`.
  Verify (mechanical): Trigger mission traversal programmatically; confirm robot steps from start to destination, cargo attaches at pickup, drops off at destination, and state becomes ARRIVED.
  Learner check: Trigger a test move, watch the blue robot follow the cyan path, pick up the box, unload at the drop zone, and verify the explainability log streams each event.
  Commit: `Add animated robot movement and telemetry narration`

- [x] **4. Live Obstacle Placement & Dynamic A* Replanning (The Kernel / Climax)**
  Becomes usable: The learner clicks any grid cell along the active route while the robot is moving; an orange hazard drops, the robot immediately pauses, calculates an A* detour, updates the cyan vector, and resumes—with instant narration in the log. Enclosing the goal safely halts the robot with a diagnostic blocked message.
  Why now: This is the unique kernel and the climax of the demo video; building it now ensures the core value proposition is rock-solid.
  PRD ref: `prd.md > Features and Behavior` (3. Live Obstacle Placement & Real-Time Replanning), `prd.md > States and Boundaries` (Replanning & Blocked State)
  Spec ref: `spec.md > Components` (3. Simulation & Robot State Machine), `spec.md > Decisions and Open Issues` (Live Obstacle Placement Replanning)
  Build: Add canvas click listener translating screen coordinates to grid coordinates `(x, y)`; implement `world.toggleObstacle(x, y)`; in `simulationManager.ts`, check if new obstacle intersects remaining path; if intersected: pause step, query `astar.findPath` from current cell, update remaining waypoints to detour path, and log `[WARN]` + `[REPLAN]` events; if no path found: transition to `BLOCKED`, halt movement, and log diagnostic safe stop message; allow clicking placed obstacle to remove it.
  Verify (mechanical): Run automated test verifying obstacle insertion triggers replanning and path replacement; verify enclosed goal triggers BLOCKED state.
  Learner check: Start a move, click a cell directly in the robot's upcoming path; observe the robot pause, replan a detour in real time, and resume while reading the detour explanation in the log. Click to trap the goal and verify it halts safely.
  Commit: `Implement live obstacle placement and dynamic A* replanning`

- [ ] **5. Dual Mission Parser (LLM + Offline Keyword Fallback) & Demo Controls**
  Becomes usable: Full end-to-end loop: custom mission input, 3 preset example buttons, 1 deliberate failure test, reset button, 1x/2x speed selector, and dual LLM/keyword parser with offline reliability.
  Why now: Completes the full user journey ("plain-English in, coordinated adaptive behavior out") and prepares the exact demo workflow for the recording.
  PRD ref: `prd.md > Features and Behavior` (1. Mission Input & Parser, 5. Simulation & Demo Controls)
  Spec ref: `spec.md > Components` (1. Mission Parser, 6. Control Panel)
  Build: Implement `src/parser/fallbackParser.ts` mapping keywords to structured `MissionTask`; implement `src/parser/missionParser.ts` calling Gemini API with JSON schema (if API key present) with instant fallback to regex parser; write `src/parser/parser.test.ts`; implement `src/ui/controls.ts` wiring input form, preset buttons (1, 2, 3, Failure), reset button, and speed toggle (1x / 2x).
  Verify (mechanical): Run `npm test` to confirm all parser unit tests pass (all presets, out-of-domain rejection, regex fallback); verify reset restores clean state.
  Learner check: Try all 3 preset buttons and the deliberate failure test; type a custom sentence and an invalid command; verify speed toggle and reset button.
  Commit: `Add dual-mode mission parser, demo presets, and simulation controls`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Slice 2 (Grid rendering + A* path finding verified)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 5 (Full simulator explored)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: 
Route and stops: 
Edit outcome: 
Reflection: 
Activity mode: 

## Revisions
