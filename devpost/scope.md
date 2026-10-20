---
doc: scope
status: approved
---

# RoboMission Fleet

A 2D browser-based warehouse simulator where natural-language mission prompts translate into autonomous robot navigation, real-time obstacle replanning, and human-readable decision explanations.

## The Unique Kernel
Demystifying robot autonomy for beginners by connecting plain-English mission parsing to live A* pathfinding, real-time obstacle rerouting, and a plain-language explainability log that proves autonomy is a transparent series of logical decisions, not an opaque black box.

## Who It's For
Students and beginners curious about how autonomous robots make decisions and coordinate tasks. Today, they run into the high barrier of complex ROS configurations, abstract pathfinding algorithms, or static textbook diagrams. They need an interactive, visual sandbox where they can experiment directly and see cause and effect.

## The Core Loop
The user enters the simulator, selects or types a mission in plain English (e.g., *"Move the blue crate to Loading Bay 2 avoiding Hazard Zone A"*), watches the system parse the command and compute an optimal A* path, drops an obstacle directly into the robot's path mid-transit, and watches the robot adapt in real time with the log explaining every decision.

## Inspiration & Identity
- A crisp, readable 2D industrial warehouse layout: clear grid cells, item pickup stations, delivery drop zones, and dynamic hazard areas.
- Visual cues inspired by modern telemetry dashboards and interactive educational sandboxes: high-contrast paths, clean status indicators, and responsive event logging.
- Clear, immediate feedback on state transitions (idle, planning, moving, replanning, arrived, blocked).

## Why This Matters to the Learner
To master plan-first, spec-driven collaboration with an autonomous coding agent—defining acceptance criteria, decomposing tasks into verifiable vertical slices, and shipping a rock-solid, fully demonstrable proof of concept within a tight hackathon timeline.

## What "Working" Looks Like
In a browser, running locally via `npm run dev`:
1. Three preset example missions run end-to-end reliably: parsing the request, plotting an A* path, and reaching the destination.
2. Clicking a cell along the active trajectory drops an obstacle; the robot halts, recalculates an alternative route instantly, and continues.
3. The explainability log updates in real time, explaining initial assignment, path distance, obstacle detection, reroute justification, and arrival.
4. An impossible mission (destination walled off) fails gracefully with an explicit diagnostic message in the log.
5. All demonstrable within a crisp 1–3 minute screen recording.

## The POC Boundary
- **Single robot** navigating a 2D warehouse grid world.
- **Deterministic A* pathfinder** navigating around static obstacles and boundaries.
- **Mission parser** turning plain English into structured JSON (`{action, item, destination, avoid}`), using an LLM with a robust rule-based keyword fallback.
- **Interactive obstacle placement** (click-to-drop hazards) with immediate replanning.
- **Live explainability log** explaining parsing, route selection, reroutes, and outcomes.
- **Demo controls**: Reset world, speed adjustment (1x / 2x), and 3 preset missions + 1 deliberate failure test.

## Later
- Second robot with multi-agent task dispatching (Tier 3).
- Spatial-temporal collision avoidance and robot yield rules (Tier 3).
- Visual A* search frontier (open/closed set exploration animation) (Tier 4).
- Third robot and custom grid layout presets.

## Explicitly Cut
- Backend servers, database, or cloud infrastructure (pure client-side browser app).
- User accounts, authentication, or login walls.
- Continuous physics, wheel slip, or rotational momentum (discrete grid steps are sufficient and deterministic).
- ROS / ROS2 integration (out of scope for an accessible browser PoC).
- Complex custom map editor or multi-level floors.
