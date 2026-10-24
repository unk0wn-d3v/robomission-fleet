# RoboMission Fleet — Autonomous Warehouse Simulator

> An interactive 2D warehouse robot simulator running in the browser. Translates natural language missions into structured tasks, computes optimal paths with 4-directional Manhattan A*, and dynamically replans detours in real time when obstacles drop mid-transit.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

---

## Overview

In modern fulfillment centers, autonomous mobile robots (AMRs) must adapt instantly to blocked aisles, spills, and new operator instructions. **RoboMission Fleet** simulates this core workflow without heavy game engines, backend servers, or external physics frameworks.

### Key Capabilities
- **Dual-Mode Mission Parser:** Parses plain-English commands (e.g., *"Pick up the red box and deliver it to Zone A"*) using the Gemini LLM API when configured, with an instantaneous, deterministic regex/keyword fallback for 100% offline reliability.
- **Deterministic A* Pathfinding:** Computes mathematical shortest routes on a 16&times;12 grid using 4-way Manhattan distance heuristics ($h(n) = |x_1 - x_2| + |y_1 - y_2|$) in under 0.2ms.
- **Dynamic Live Replanning:** Clicking any grid cell drops an obstacle. If placed on the robot's active route, the robot immediately halts, recalculates an A* detour, updates the glowing cyan trajectory vector, and resumes transit.
- **Explainability Telemetry Log:** Real-time chronological event stream providing plain-English explanations for every route calculation, obstacle detection, reroute justification, and cargo status transition.
- **Safe Blocked Handling:** When a destination is completely trapped by barriers, the robot transitions safely to `BLOCKED` with diagnostic operator instructions, and automatically resumes when the corridor is cleared.

---

## Architecture & Project Structure

```
d:/PROJECTS/BASIC_AI/
├── src/
│   ├── parser/           # Dual parser: Gemini LLM API + offline regex fallback
│   │   ├── fallbackParser.ts
│   │   ├── missionParser.ts
│   │   └── parser.test.ts
│   ├── planner/          # 4-way Manhattan A* search engine
│   │   ├── astar.ts
│   │   └── astar.test.ts
│   ├── render/           # HTML5 Canvas renderer with DPI auto-scaling
│   │   └── canvasRenderer.ts
│   ├── sim/              # Autonomous robot model & simulation state machine
│   │   ├── robot.ts
│   │   ├── simulationManager.ts
│   │   └── simulationManager.test.ts
│   ├── ui/               # Control panel & explainability telemetry log
│   │   ├── controls.ts
│   │   └── telemetryLog.ts
│   ├── world/            # 16x12 warehouse grid, static racks & inventory
│   │   └── warehouseWorld.ts
│   ├── style.css         # Dark industrial telemetry console theme
│   ├── types.ts          # Strongly-typed data models & state contracts
│   └── main.ts           # System bootstrapping & dependency injection
├── devpost/              # Planning artifacts (Scope, PRD, Spec, App Map)
│   ├── scope.md / scope.html
│   ├── prd.md / prd.html
│   ├── spec.md / spec.html
│   ├── checklist.md
│   └── app-map.html
├── DECISIONS.md          # Architectural decision & root-cause bugfix log
├── index.html            # Main entry point & 3-zone industrial console
├── package.json
├── tsconfig.json
└── vite.config.ts
```

For an interactive visual tour of the codebase and data flow, see [devpost/app-map.html](devpost/app-map.html).

---

## Quickstart

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/unk0wn-d3v/robomission-fleet.git
   cd robomission-fleet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run automated unit tests:**
   ```bash
   npm test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## Environment Variables (Optional)

The application works 100% offline out-of-the-box using the deterministic rule-based keyword fallback. To enable experimental Gemini LLM parsing:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## Testing & Verification

RoboMission Fleet features 20 automated unit tests using Vitest covering:
- Deterministic 4-directional A* pathfinding and obstacle avoidance.
- Trapped goal detection and unreachable destination handling.
- Multi-leg autonomous state transitions (`IDLE` &rarr; `PLANNING` &rarr; `MOVING` &rarr; `ARRIVED` / `BLOCKED`).
- Live mid-transit path interception and detour calculation.
- Offline regex keyword extraction and out-of-domain command rejection.

---

## License

MIT License. Built for the Devpost *Build With AI: Basics* hackathon.
