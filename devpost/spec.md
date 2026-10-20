---
doc: spec
status: approved
---

# RoboMission Fleet — Technical Spec

A pure client-side browser application built with Vite and Vanilla TypeScript, rendering an interactive 2D warehouse simulator via HTML5 Canvas, executing deterministic A* pathfinding with live obstacle replanning, and parsing natural language missions through a dual LLM/keyword architecture.

## How This Works, In Plain Language
The application is structured into four focused, decoupled modules that communicate through an in-memory event and state coordinator:
1. **The Mission Parser**: Takes the text from the input bar or preset buttons. It attempts to parse the text into a structured JSON task (`{ action, targetItem, destination, avoidConstraints, returnToStation }`). If an API key is present and network is available, it queries an LLM; otherwise (or if the request fails/times out), it instantly uses a deterministic keyword/regex fallback parser. Out-of-domain text is rejected without guessing.
2. **The A* Pathfinder**: A pure, deterministic algorithm operating on a 2D grid matrix. It calculates the mathematically shortest Manhattan-distance path between coordinates while routing around static warehouse shelves and placed hazards. Because the grid is lightweight (~16x12 cells), calculating or recalculating a route takes less than 1 millisecond.
3. **The Simulation & Robot State Machine**: Manages the robot's lifecycle (`IDLE`, `PARSING`, `PLANNING`, `MOVING`, `REPLANNING`, `ARRIVED`, `BLOCKED`). The movement loop updates the robot's position along waypoints. When a user clicks to place an obstacle along the active route, the state machine temporarily pauses movement, queries A* for a detour from the robot's current cell, updates the route, and resumes—or transitions to `BLOCKED` if no detour exists.
4. **The Canvas Renderer & Telemetry View**: A high-contrast Canvas 2D render loop drawing the warehouse floor, docking bay, colored item crates, drop zones, warning hazards, the robot puck, and a glowing cyan route line that trims as the robot moves. Alongside it, a DOM-based telemetry panel logs every decision in real time with distinct event badges.

Why this shape: Vanilla TypeScript and HTML5 Canvas keep dependencies minimal, eliminate framework rendering overhead, guarantee zero build friction, and ensure pathfinding and state changes are 100% deterministic and unit-testable.

## The Core Journey Through the System
Traced step by step from [devpost/prd.md > The Core Journey](file:///d:/PROJECTS/BASIC_AI/devpost/prd.md):
1. **Initial Load**: Vite serves the client bundle. `main.ts` initializes `WarehouseWorld` (16x12 grid), sets robot at Dock `(1, 1)`, places Red Crate `(3, 8)`, Blue Crate `(7, 2)`, Green Crate `(12, 9)`, Zone A `(14, 2)`, Zone B `(14, 9)`, and static racks. `TelemetryLog` prints initial system ready event.
2. **User Submits Mission**: User clicks Preset 1 (*"Pick up the red box and deliver it to Zone A"*) or types custom text and clicks **Run**.
3. **Parser Execution**: `missionParser.ts` converts text into structured task `{ action: "deliver", item: "red_box", destination: "zone_a" }`. Telemetry logs `[PARSE]` confirmation.
4. **Route Planning**: `stateMachine.ts` transitions to `PLANNING`. It resolves the item's coordinates and destination coordinates, calls `astar.findPath()`, and creates sequential legs: Leg 1 (Dock -> Item), Leg 2 (Item -> Zone A). Telemetry logs `[PLAN] Shortest path calculated: 14 steps`.
5. **Animation & Movement**: State machine transitions to `MOVING`. `canvasRenderer.ts` draws the glowing cyan vector connecting the waypoints. Each tick advances the robot along the path, trimming traversed nodes. When reaching the item, cargo state updates to `carrying: "red_box"`.
6. **Live Obstacle Placement (The "Aha!" Moment)**: User clicks cell `(5, 5)` directly along the active route.
   - `canvasRenderer` click listener identifies grid coordinates `(5, 5)`.
   - `world.toggleObstacle(5, 5)` adds an orange hazard.
   - `stateMachine.checkCollision()` detects that `(5, 5)` lies on remaining waypoints.
   - State temporarily transitions to `REPLANNING`. Telemetry logs `[WARN] Obstacle detected ahead. Recalculating route...`.
   - `astar.findPath(currentCell, goalCell, updatedObstacles)` returns a detour path.
   - Remaining waypoints are replaced with detour path. Telemetry logs `[REPLAN] New path found (16 steps). Resuming mission.`.
   - Robot transitions back to `MOVING` and follows the detour.
7. **Arrival or Safe Halt**:
   - *Arrival*: Robot reaches Zone A. Cargo unloads. State becomes `ARRIVED`. Telemetry logs `[SUCCESS] Mission complete: red_box delivered to zone_a`.
   - *Blocked Edge Case*: If an obstacle completely walls off the destination, A* returns `null`. Robot state becomes `BLOCKED`. Movement halts safely. Telemetry logs `[ERROR] Mission blocked: no valid path to destination. Clear an obstacle or reset the mission.`.
8. **Reset / Speed Toggle**: Reset clears dynamic obstacles, resets robot to Dock, re-places items, and resets state to `IDLE`. Speed toggle switches animation step interval between 1x (300ms/step) and 2x (150ms/step).

## Stack
- **Bundler & Dev Server**: [Vite 6+](https://vite.dev/) — Instant server start, fast HMR, zero-config TypeScript compilation.
- **Language**: [TypeScript 5+](https://www.typescriptlang.org/) — Strict static typing for grid coordinates, state machine events, and JSON schemas.
- **Rendering**: HTML5 Canvas 2D API (`CanvasRenderingContext2D`) — Direct, high-performance pixel control for grid, robot puck, path lines, and hazard icons.
- **UI & Controls**: Semantic HTML5 & Vanilla CSS — Slate-themed layout, high-contrast typography, zero framework overhead.
- **Testing Framework**: [Vitest](https://vitest.dev/) — Fast in-memory unit testing for A* pathfinding and parser rules without browser dependencies.

## Where It Runs and How Someone Tries It
- **Runtime**: Modern web browser (Chrome, Edge, Firefox, Safari).
- **Environment**: Node.js (v18+) for local dev server and testing.
- **Local Start Command**:
  ```bash
  npm install
  npm run dev
  ```
  App opens at `http://localhost:5173`.
- **Test Command**:
  ```bash
  npm test
  ```
- **Demo Recording Target**: 1–3 minute screen recording demonstrating:
  1. Preset 1 standard run.
  2. Live obstacle drop mid-run triggering instant rerouting and explainability logs.
  3. Deliberate failure test showing graceful blocked handling.
- **Deployment**: Optional static hosting (e.g. GitHub Pages or Vercel); not required for submission since video + public repo is primary.

## Look and Feel
Carried forward from [devpost/prd.md > Look and Feel](file:///d:/PROJECTS/BASIC_AI/devpost/prd.md):
- **Background**: Industrial deep navy `#0b0f19`; panel containers in `#111827` and `#1e293b`.
- **Grid Aesthetic**: 16 columns x 12 rows, dark grid lines (`#1f2937`), subtle cell coordinate dots.
- **Robot Puck**: Distinct vibrant blue circle (`#2563eb`, border `#60a5fa`) with directional pointer and glowing aura. Cargo appears as an attached colored pip.
- **Route Vectors**: Glowing cyan (`#38bdf8`) center line with directional chevrons; automatically trims traversed cells.
- **Items**: High-contrast squares with distinct badges (Red: `#ef4444`, Blue: `#3b82f6`, Green: `#10b981`).
- **Drop Zones**: Distinct outlined warehouse bays with green accents (`#059669` / `#34d399`).
- **Obstacles**: Static industrial shelving in dark slate (`#475569`); live user hazards in high-visibility warning orange/amber (`#f97316` / `#fbbf24`) with hazard stripe styling.
- **Typography**: Inter / system sans-serif for UI controls; monospace (JetBrains Mono / Consolas) for telemetry log and coordinate readouts.

## Components

### 1. Mission Parser (`src/parser/missionParser.ts` & `src/parser/fallbackParser.ts`)
- **Purpose**: Translates plain-English prompts into structured JSON task definitions.
- **Implementation**:
  - `fallbackParser.ts`: Deterministic token/regex matcher mapping keywords ("red box", "deliver", "Zone A", "avoid", "charging station") to a validated `MissionTask`.
  - `missionParser.ts`: Orchestrates LLM call (if API key present) with immediate fallback to `fallbackParser.ts` on network error, invalid JSON, or missing key.
- Implements: `prd.md > 1. Mission Input & Parser`.

### 2. A* Pathfinding Engine (`src/planner/astar.ts`)
- **Purpose**: Computes mathematical shortest path on a 2D grid matrix with Manhattan distance heuristic.
- **Implementation**:
  - Evaluates 4-directional cardinal neighbors `(dx, dy)`.
  - Treats grid boundaries, static racks, and dynamic user obstacles as impassable cells.
  - Returns array of `GridCoord` waypoints `[{x, y}, ...]`, or `null` if unreachable.
  - Fully decoupled from rendering; 100% unit-tested with Vitest.
- Implements: `prd.md > 2. Deterministic A* Pathfinding & Visualization`.

### 3. Simulation & Robot State Machine (`src/sim/stateMachine.ts` & `src/sim/robot.ts`)
- **Purpose**: Manages robot location, cargo status, mission phases, and live collision detection.
- **Implementation**:
  - Tracks states: `IDLE`, `PLANNING`, `MOVING`, `REPLANNING`, `ARRIVED`, `BLOCKED`.
  - Dispatches events to `TelemetryLog` when state changes occur.
  - Subscribes to obstacle placement: checks if new obstacle intersects remaining path; triggers pause, replan query, and resumption.
- Implements: `prd.md > 3. Live Obstacle Placement & Real-Time Replanning`.

### 4. Canvas Renderer (`src/render/canvasRenderer.ts`)
- **Purpose**: Renders the 2D warehouse grid, entities, and route vectors onto an HTML5 `<canvas>`.
- **Implementation**:
  - Auto-scales canvas for crisp DPI rendering.
  - Draws grid cells, dock, drop zones, static racks, placed hazards, robot puck, and active cyan route line.
  - Converts canvas click coordinates `(clientX, clientY)` into grid cell coordinates `(col, row)` for obstacle placement.
- Implements: `prd.md > Screens and Layout` and `prd.md > Look and Feel`.

### 5. Telemetry & Explainability Log (`src/ui/telemetryLog.ts`)
- **Purpose**: Chronological, formatted event stream explaining system decisions.
- **Implementation**:
  - Formats entries with timestamp, badge (`INFO`, `PARSE`, `PLAN`, `WARN`, `REPLAN`, `SUCCESS`, `ERROR`), and plain-English message.
  - Auto-scrolls to newest entry while preserving history.
- Implements: `prd.md > 4. Real-Time Explainability Log`.

### 6. Control Panel (`src/ui/controls.ts`)
- **Purpose**: Binds input form, preset buttons, reset button, and speed toggle to the simulation coordinator.
- Implements: `prd.md > 5. Simulation & Demo Controls`.

## Data Model

```typescript
export interface GridCoord {
  x: number; // Column index (0 to 15)
  y: number; // Row index (0 to 11)
}

export type RobotState = 'IDLE' | 'PLANNING' | 'MOVING' | 'REPLANNING' | 'ARRIVED' | 'BLOCKED';

export type CargoItemType = 'red_box' | 'blue_box' | 'green_box';

export type DestinationType = 'zone_a' | 'zone_b' | 'charging_station';

export interface MissionTask {
  action: 'deliver' | 'move';
  targetItem: CargoItemType;
  destination: DestinationType;
  avoidCoordinates?: GridCoord[];
  returnToDock?: boolean;
}

export interface ParseResult {
  success: boolean;
  task?: MissionTask;
  rawPrompt: string;
  source: 'llm' | 'fallback';
  errorReason?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'PARSE' | 'PLAN' | 'WARN' | 'REPLAN' | 'SUCCESS' | 'ERROR';
  message: string;
}

export interface WorldState {
  gridWidth: number;   // 16
  gridHeight: number;  // 12
  staticWalls: Set<string>;      // "x,y" keys
  dynamicObstacles: Set<string>; // "x,y" keys
  items: Map<CargoItemType, GridCoord>;
  zones: Map<DestinationType, GridCoord>;
  dock: GridCoord;
}
```

## File Structure

```
d:/PROJECTS/BASIC_AI/
├── .gitignore                    # Ignores /devpost/learner-profile.md, node_modules, .env
├── .env.example                  # Optional VITE_GEMINI_API_KEY template (no secrets)
├── DECISIONS.md                  # Project decisions log
├── package.json                  # Dependencies (Vite, TypeScript, Vitest)
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build config
├── index.html                    # Single-page console layout (3 zones)
├── devpost/                      # Hackathon planning workspace
│   ├── learner-profile.md        # Learner background & preferences
│   ├── scope.md                  # Approved scope doc
│   ├── scope.html                # Visual scope companion
│   ├── prd.md                    # Approved PRD doc
│   ├── prd.html                  # Visual PRD companion
│   ├── spec.md                   # Technical blueprint (this document)
│   └── spec.html                 # Visual spec companion
├── src/
│   ├── main.ts                   # App entry point, event coordinator & animation loop
│   ├── types.ts                  # Shared TypeScript interfaces & types
│   ├── style.css                 # Industrial dark telemetry CSS
│   ├── world/
│   │   └── warehouseWorld.ts     # Grid layout, stations, static walls & obstacle state
│   ├── planner/
│   │   ├── astar.ts              # Deterministic A* shortest path algorithm
│   │   └── astar.test.ts         # Vitest unit tests (shortest path, walls, blocked)
│   ├── parser/
│   │   ├── missionParser.ts      # LLM parser wrapper + fallback orchestrator
│   │   ├── fallbackParser.ts     # Deterministic keyword/regex parser
│   │   └── parser.test.ts        # Vitest unit tests for parser & fallback rules
│   ├── sim/
│   │   ├── robot.ts              # Robot state, position, cargo & step logic
│   │   └── simulationManager.ts  # Run loop, pause/replan coordination, speed control
│   ├── render/
│   │   └── canvasRenderer.ts     # HTML5 Canvas rendering for grid, items, path & robot
│   └── ui/
│       ├── controls.ts           # UI input handling, preset buttons & reset
│       └── telemetryLog.ts       # Explainability event logging component
```

## External Services and Dependencies
- **Runtime Dependencies**: Zero external client runtime libraries. Pure TypeScript and HTML5 Canvas API.
- **Optional LLM Integration**:
  - Endpoint: Google Gemini API via standard `fetch` call (`generativeLanguage.googleapis.com`) using `gemini-1.5-flash` with JSON mode response schema.
  - Environment Key: `VITE_GEMINI_API_KEY` loaded via Vite `.env`.
  - Fallback: If no key is set or the fetch fails, `fallbackParser.ts` executes immediately with zero latency and zero cost.
- **Dev Dependencies**: `vite`, `typescript`, `vitest`.

## Important Failure Modes
1. **Goal Completely Blocked by Obstacles**:
   - *Failure*: A* cannot find any path to the destination cell.
   - *Behavior*: A* returns `null`. Robot enters `BLOCKED` state, halts movement safely, and logs: *"Mission blocked: no valid path to destination. Clear an obstacle or reset the mission."* The app remains interactive so the user can click to remove obstacles or click Reset.
2. **Invalid or Nonsensical Mission Prompt**:
   - *Failure*: Prompt cannot be parsed into a warehouse task (e.g. *"fly to the moon"*).
   - *Behavior*: Parser rejects task. Robot stays docked in `IDLE` state. Input text is preserved in the input box. Telemetry logs: *"Couldn't understand this mission. Try specifying an item and a warehouse destination."*
3. **LLM API Key Missing or Network Down**:
   - *Failure*: No API key or browser is offline.
   - *Behavior*: System automatically switches to `fallbackParser.ts`. All presets and common variations run with 100% reliability; zero crashes.

## What Was Simplified and Why
- **Discrete Cell-by-Cell Step Animation instead of Continuous Kinematics**:
  - *Reason*: Eliminates physics jitter, collision clipping bugs, and complex turning radii. Discrete grid transit is 100% deterministic, easy to test, and visually crisp on canvas.
- **Synchronous A* Execution on Main Thread instead of Web Workers**:
  - *Reason*: On a 16x12 grid (192 nodes), A* executes in under 0.5 milliseconds. Offloading to a Web Worker would introduce asynchronous message passing overhead with zero performance benefit.
- **Pure DOM Log instead of Canvas Text Rendering**:
  - *Reason*: DOM scrolling, text selection, and CSS badge styling are vastly superior to manual canvas text measurement and clipping.

## Decisions and Open Issues

### Learner Technical Decisions
- **Stack**: Vanilla TypeScript with Vite and HTML5 Canvas (low dependencies, fast execution, deterministic state).
- **Architecture**: Single-surface app with decoupled planner, state machine, and canvas renderer.
- **Testing**: Dedicated Vitest suite for A* pathfinding and parser fallback rules.

### One Useful Unknown Clarified
- **Question**: How does live obstacle placement trigger A* replanning without breaking the animation loop or causing frame drops, and how does the parser fall back reliably?
- **Clarification**:
  1. *Animation & Replanning*: Robot movement is driven by a discrete tick timer coordinated with `requestAnimationFrame`. When an obstacle is placed on the active path, the simulation coordinator pauses the robot's current step, calculates an A* detour from the robot's current grid cell (which takes < 0.5ms), swaps the remaining waypoints, and resumes motion on the next tick. The animation loop never halts or stutters.
  2. *Dual Parser Fallback*: The parser function checks for `VITE_GEMINI_API_KEY`. If absent or if network fails, it immediately delegates to `fallbackKeywordParser`, which parses keywords using regex into the exact same TypeScript `MissionTask` schema. Vitest unit tests verify this contract deterministically.

### Open Issues
- None blocking implementation. All components, contracts, and file structures are established.
