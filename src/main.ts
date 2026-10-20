import { WarehouseWorld } from './world/warehouseWorld.ts';
import { CanvasRenderer } from './render/canvasRenderer.ts';
import { TelemetryLog } from './ui/telemetryLog.ts';

// 1. Initialize core models and UI components
const world = new WarehouseWorld();
const telemetry = new TelemetryLog('telemetry-log-container');
const renderer = new CanvasRenderer('warehouse-canvas', world);

// 2. Initial state and logging
telemetry.log('INFO', 'RoboMission Fleet initialized. 16x12 warehouse world ready.');
telemetry.log('INFO', 'Select an example mission above or type a custom instruction.');

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
      renderer.render();
    }
  }
});

// 4. Reset Button listener
const resetBtn = document.getElementById('btn-reset');
resetBtn?.addEventListener('click', () => {
  world.reset();
  telemetry.log('INFO', 'World reset to default state.');
  renderer.render();
});

// Initial canvas draw
renderer.render();
