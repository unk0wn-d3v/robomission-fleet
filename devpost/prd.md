---
doc: prd
status: approved
---

# RoboMission Fleet — Product Requirements

A single-surface 2D warehouse simulator where learners type or choose plain-English missions, watch an autonomous robot navigate using deterministic A* pathfinding, drop obstacles live to trigger real-time rerouting, and follow every decision via an explainability log.

Source: [devpost/scope.md > The Core Loop](file:///d:/PROJECTS/BASIC_AI/devpost/scope.md) and [devpost/scope.md > The POC Boundary](file:///d:/PROJECTS/BASIC_AI/devpost/scope.md).

## The Core Journey
1. **Arrival & Initial State**: The user opens the web app locally. The 2D warehouse grid displays in a "Ready" state: one blue robot docked at start, color-coded item crates at pickup stations, green drop zones, and fixed warehouse barriers. The explainability log reads: *"System ready. Select an example mission or enter your own."*
2. **Mission Selection**: The user selects one of three preset mission buttons or types a custom plain-English instruction into the top input bar and clicks **Run Mission**.
3. **Parsing & Intent Extraction**: The parser evaluates the command into structured JSON (`{action, item, destination, avoid, returnToDock}`). If unparseable, the system rejects it gracefully, preserving input text and logging a helpful prompt while the robot remains idle.
4. **Initial Path Planning**: The robot computes an optimal shortest path using 4-directional A* avoiding static obstacles. A bright cyan route renders on the grid, and the log notes: *"Parsed mission: [task]. Shortest path calculated: [N] steps."*
5. **Execution**: The robot begins moving cell-by-cell along the highlighted route. If a multi-step mission is running (e.g. pick up crate -> deliver to zone -> return to dock), the robot transitions states sequentially with real-time log updates.
6. **The Climax (Live Obstacle Drop)**: While the robot is in transit, the user clicks any unoccupied grid cell directly along the robot's active path to drop a hazard (spill/barrier).
7. **Adaptive Replanning**: The robot immediately pauses upon detecting the newly placed obstacle, recalculates an alternative A* path avoiding the hazard, updates the cyan path vector, and resumes transit. The log narrates: *"Obstacle detected ahead. Recalculating route..."* followed by *"New path found ([M] steps). Resuming mission."*
8. **Goal Arrival or Safe Stop**:
   - *Success*: The robot reaches the drop zone, unloads the cargo, and marks the mission complete. Log: *"Mission complete: [item] delivered to [destination]."*
   - *Deliberate Failure / Trapped Goal*: If obstacles completely enclose the destination or robot, the robot safely halts. Log: *"Mission blocked: no valid path to destination. Clear an obstacle or reset the mission."*
9. **Reset & Exploration**: The user can reset the warehouse world at any time or toggle between 1x and 2x execution speeds.

## Screens and Layout
A unified single-screen responsive industrial console divided into three distinct zones:
- **Top Control Banner**: Mission input text field with submit button, 3 quick-click preset mission buttons, 1 deliberate failure test button, a **Reset** button, and a **1x / 2x Speed** toggle.
- **Center Canvas Stage**: 2D grid representation of the warehouse floor with high-contrast cell borders, docking bay, colored item containers, delivery zones, static walls, dynamic placed obstacles, and overlay route vectors.
- **Side Telemetry Panel**: A scrolling real-time explainability event log detailing parsing results, path calculations, obstacle detections, replan reasoning, and mission completions with timestamped entries.

## Look and Feel
- **Theme**: Modern industrial telemetry console with an approachable, high-contrast dark aesthetic.
- **Palette**:
  - Background: Dark navy (`#0b0f19`) with slate container panels (`#111827`, `#1e293b`).
  - Active Paths: Vibrant glowing cyan (`#38bdf8`) with directional markers.
  - Robot: Distinct bright blue indicator/puck (`#2563eb` / `#60a5fa`) with carrying status indicator.
  - Items / Crates: High-contrast colors (Red Box: `#ef4444`, Blue Box: `#3b82f6`, Green Box: `#10b981`).
  - Drop Zones: Distinct emerald green outlined bays (`#059669` / `#34d399`).
  - Hazards & Obstacles: Fixed warehouse racks in industrial slate (`#475569`); live-dropped obstacles in high-visibility warning orange/red (`#f97316` / `#dc2626`).
- **Typography**: Clean, readable sans-serif (e.g. Inter / system sans-serif) for labels and controls; monospace (JetBrains Mono / Consolas) for coordinate telemetry and explainability log entries.

## Features and Behavior

### 1. Mission Input & Parser
- **Capabilities**: Accepts plain-English text or one-click preset buttons.
- **Presets**:
  1. *"Pick up the red box and deliver it to Zone A"* (Standard pickup & delivery loop).
  2. *"Move the blue box to Zone B while avoiding the blocked aisle"* (Route planning around static hazard).
  3. *"Deliver the green box to Zone A, then return to the charging station"* (Multi-segment sequential route).
  4. *Failure Test: "Deliver yellow crate to Zone C (Completely Blocked)"* (Goal surrounded by barriers).
- **Validation & Fallback**:
  - Strict JSON schema for parsed tasks (`action`, `targetItem`, `destination`, `avoidConstraints`, `returnToStation`).
  - LLM parsing with robust keyword-based rule fallback for 100% offline reliability.
  - Rejection of out-of-domain instructions (e.g., *"fly to the moon"*): leaves robot safely idle, preserves user text in input, and displays: *"Couldn't understand this mission. Try specifying an item and a warehouse destination."*

### 2. Deterministic A* Pathfinding & Visualization
- **Capabilities**: 4-directional grid pathfinding considering static walls, drop zones, item pick points, and dynamic obstacles.
- **Acceptance Criteria**:
  - Computes the mathematical shortest Manhattan-distance path avoiding impassable cells.
  - Renders the computed route as a continuous cyan line across grid cells before motion begins.
  - Path dynamically trims as the robot traverses each cell.

### 3. Live Obstacle Placement & Real-Time Replanning
- **Capabilities**: Clicking any empty cell on the grid places an active hazard.
- **Acceptance Criteria**:
  - If placed outside the robot's active path: obstacle renders immediately without interrupting motion; log confirms placement.
  - If placed directly on the robot's active path: robot halts current step, recalculates alternative A* route immediately, updates cyan line to new detour, and logs: *"Obstacle detected ahead. Recalculating route..."* -> *"New path found ([M] steps). Resuming mission."*
  - Clicking an existing placed obstacle clears it, allowing trapped paths to reopen.

### 4. Real-Time Explainability Log
- **Capabilities**: Chronological, auto-scrolling log of system reasoning.
- **Acceptance Criteria**:
  - Logs parse results, path cost, transit progress, obstacle detection, reroute justifications, and completion.
  - Uses distinct color badges for event types (`INFO`, `PLAN`, `WARN`, `SUCCESS`, `ERROR`).
  - Preserves full run history until user clicks Reset.

### 5. Simulation & Demo Controls
- **Capabilities**: Reset and Speed Controls.
- **Acceptance Criteria**:
  - **Reset**: Stops active movement, clears dynamic obstacles, resets robot to dock, restores items to initial stations, and clears log to initial ready state.
  - **Speed Toggle**: Switches execution speed between 1x (standard readable demo speed) and 2x (fast verification).

## States and Boundaries
- **Ready State**: Application loaded, robot docked, grid static, waiting for mission input.
- **Parsing State**: Input submitted, parsing in progress (instant fallback if offline), button displays subtle loading indicator.
- **Planning State**: Task validated, A* computing trajectory, path line drawing on grid.
- **Moving State**: Robot progressing cell-by-cell; grid interactive for obstacle clicks.
- **Replanning State**: Robot paused mid-cell/turn, computing alternate route around freshly placed hazard.
- **Arrived / Completed State**: Robot reached destination, item delivered, status banner green, log notes success.
- **Blocked State**: Destination unreachable due to obstacles; robot stopped safely, status banner amber/red, log states: *"Mission blocked: no valid path to destination. Clear an obstacle or reset the mission."*
- **Invalid Input State**: Text rejected, error message in log, input preserved for editing.

## Product Decisions
- **Single Robot Core**: Focused exclusively on 1-robot loop to ensure live obstacle replanning and explainability are flawless within the 1–3 min demo video window.
- **Dual Parser Architecture**: LLM parser for natural language flexibility paired with a deterministic keyword regex parser so reviewers and local users have 100% reliable execution even without API keys.
- **Click-to-Drop Interaction**: Direct canvas/grid cell clicking enables dynamic obstacle insertion without leaving the simulator or opening secondary menus.
- **Interactive Obstacle Toggle**: Clicking an empty cell adds an obstacle; clicking a placed obstacle removes it to allow users to unblock trapped paths.

## What We're Building
- Single-page responsive web simulator with 3-zone industrial console layout.
- 2D grid world with dock, pickup stations, drop bays, and obstacles.
- Deterministic 4-way A* algorithm with unit test suite.
- Dual-mode mission parser (LLM + offline fallback).
- Dynamic obstacle click-placement with live replan loop.
- Colored explainability telemetry log.
- 3 preset missions, 1 impossible mission, reset button, and 1x/2x speed toggle.

## Deferred From the POC
- **Second Robot Fleet (Tier 3)**: Multi-robot simultaneous task dispatching deferred until single-robot loop is verified.
- **Collision Avoidance Rules (Tier 3)**: Inter-robot yielding rules deferred.
- **Search Frontier Visualizer (Tier 4)**: Open/closed set node expansion heatmap deferred.

## Possible Later Enhancements
- Visual heatmaps showing real-time path costs.
- Custom warehouse obstacle preset layouts.
- Sound effects / audio telemetry pings on obstacle detection.

## Non-Goals
- No backend server, user database, or authentication.
- No continuous physics, angular momentum, or wheel slippage.
- No multi-floor elevators or ROS bridge.

## Open Questions
- None blocking specification. All behavioral criteria, layouts, and edge cases are resolved.
