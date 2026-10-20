# Project Decisions Log

## Architecture & Project Rules
- **Workflow**: Following Devpost Build With AI: Basics curriculum (`1-start` -> `2-scope` -> `3-prd` -> `4-spec` -> `5-build` -> `6-ship`).
- **Git Ignore**: Created `.gitignore` ignoring `/devpost/learner-profile.md` (to keep personal learner context out of public commits) and `.env` / `.env.*` (allowing `.env.example`).
- **Pacing & Working Agreements**: Strict one-question-at-a-time interview, challenge vague answers, log decisions in `DECISIONS.md`, build in small vertical slices with 3-sentence previews and plain-language reviews, plan-first before any code.
- **Review Format**: Markdown as canonical truth + visual HTML companion with interactive diagrams/reveals for planning documents.
- **Scope Approved (`devpost/scope.md`)**: Single-robot POC with deterministic A*, LLM/fallback mission parser, live obstacle drop & replanning, explainability log, and 3 presets + 1 failure test. Second robot, collision rules, and search frontier moved to Later. Backend, DB, auth, continuous physics, and ROS explicitly cut.
- **PRD Approved (`devpost/prd.md`)**: Complete product requirements defined: 3-zone layout (controls, canvas grid, telemetry log), 3 presets + 1 failure case, pause/recalculate/resume replanning behavior, invalid text rejection, toggleable obstacles, and testable acceptance criteria across 8 states.
- **Spec Approved (`devpost/spec.md`)**: Frontend-only Vanilla TypeScript + Vite + HTML5 Canvas. Deterministic A* on a 16x12 grid (< 0.5ms), sub-frame replanning on obstacle placement, dual LLM/keyword fallback parser, Vitest unit testing, and modular file structure (`src/world`, `src/planner`, `src/parser`, `src/sim`, `src/render`, `src/ui`).
- **Build Checklist Approved (`devpost/checklist.md`)**: 5 vertical slices (1. Grid scaffold & render, 2. A* pathfinding & vector render, 3. Animated movement & telemetry, 4. Live obstacle placement & replanning, 5. Dual parser & controls). Mode: Learn mode.
- **Slice 1 Complete (`commit 578457b`, polished in `commit cdf29a4`)**: Scaffolded Vite/TypeScript/Vitest setup; rendered 16x12 warehouse world with dock, crates, zones, static shelves, and live telemetry log.
  - *Root Cause Analysis*: Canvas was squished and labels overlapped because the canvas logical dimensions were dynamically bound to an unconstrained container without minimum dimensions, causing cell sizes to drop to ~18px while fonts remained hardcoded at 11-16px.
  - *Fix*: Locked logical canvas buffer to 800x600 (scaled by DPR), centered within a flex stage, spaced station coordinates, rendered beveled cargo containers with clean 8px sub-badges, industrial steel racks, and high-tech AMR robot puck with glow.
