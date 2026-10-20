import { WarehouseWorld } from './world/warehouseWorld.ts';
import { CanvasRenderer } from './render/canvasRenderer.ts';
import { TelemetryLog } from './ui/telemetryLog.ts';
import { findPath } from './planner/astar.ts';
import { GridCoord } from './types.ts';

// 1. Initialize core models and UI components
const world = new WarehouseWorld();
const telemetry = new TelemetryLog('telemetry-log-container');
const renderer = new CanvasRenderer('warehouse-canvas', world);

// Current active path preview
let activePath: GridCoord[] = [];

function updateRoutePreview(): void {
  const redBox = world.items.get('red_box');
  if (!redBox) return;

  const path = findPath(world.dock, redBox, world);
  if (path) {
    activePath = path;
    telemetry.log('PLAN', `A* route to Red Crate computed: ${path.length - 1} steps.`);
  } else {
    activePath = [];
    telemetry.log('WARN', 'Route to Red Crate is currently blocked by obstacles.');
  }
  renderer.render(world.dock, null, activePath);
}

// 2. Initial state and logging
telemetry.log('INFO', 'RoboMission Fleet initialized. 16x12 warehouse world ready.');
updateRoutePreview();

// 3. Canvas click interaction for placing/removing obstacles
const canvasEl = document.getElementById('warehouse-canvas') as HTMLCanvasElement;
canvasEl.addEventListener('click', (e: MouseEvent) => {
  const coord = renderer.getGridCoordFromClick(e.clientX, e.clientY);
  if (coord) {
    const result = world.toggleObstacle(coord.x, coord.y);
    if (result) {
      if (result.added) {
        telemetry.log('WARN', `Hazard obstacle placed at (${coord.x}, ${coord.y}).`);
      } else {
        telemetry.log('INFO', `Hazard obstacle removed from (${coord.x}, ${coord.y}).`);
      }
      updateRoutePreview();
    }
  }
});

// 4. Reset Button listener
const resetBtn = document.getElementById('btn-reset');
resetBtn?.addEventListener('click', () => {
  world.reset();
  telemetry.log('INFO', 'World reset to default state.');
  updateRoutePreview();
});
