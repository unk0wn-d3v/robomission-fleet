import { WarehouseWorld } from './world/warehouseWorld.ts';
import { CanvasRenderer } from './render/canvasRenderer.ts';
import { TelemetryLog } from './ui/telemetryLog.ts';
import { SimulationManager } from './sim/simulationManager.ts';
import { RobotState } from './types.ts';

// 1. Initialize core system modules
const world = new WarehouseWorld();
const telemetry = new TelemetryLog('telemetry-log-container');
const renderer = new CanvasRenderer('warehouse-canvas', world);

const statusBadge = document.getElementById('app-status') as HTMLElement;

function updateStatusUI(state: RobotState): void {
  if (!statusBadge) return;
  statusBadge.textContent = state;
  statusBadge.className = 'status-badge';

  if (state === 'IDLE') {
    statusBadge.textContent = 'READY';
    statusBadge.style.background = 'rgba(56, 189, 248, 0.12)';
    statusBadge.style.color = '#38bdf8';
    statusBadge.style.borderColor = 'rgba(56, 189, 248, 0.35)';
  } else if (state === 'MOVING') {
    statusBadge.textContent = 'NAVIGATING';
    statusBadge.style.background = 'rgba(56, 189, 248, 0.2)';
    statusBadge.style.color = '#38bdf8';
    statusBadge.style.borderColor = '#38bdf8';
  } else if (state === 'ARRIVED') {
    statusBadge.textContent = 'COMPLETE';
    statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    statusBadge.style.color = '#34d399';
    statusBadge.style.borderColor = '#10b981';
  } else if (state === 'BLOCKED') {
    statusBadge.textContent = 'BLOCKED';
    statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
    statusBadge.style.color = '#f87171';
    statusBadge.style.borderColor = '#ef4444';
  } else if (state === 'PLANNING' || state === 'REPLANNING') {
    statusBadge.textContent = state;
    statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
    statusBadge.style.color = '#fbbf24';
    statusBadge.style.borderColor = '#f59e0b';
  }
}

const simManager = new SimulationManager(world, renderer, telemetry, updateStatusUI);

// 2. Initial system state
telemetry.log('INFO', 'RoboMission Fleet initialized. 16x12 warehouse world ready.');
telemetry.log('INFO', 'Click "Run Mission" or choose an example above to begin.');
renderer.render(world.dock, null, []);

import { ControlPanel } from './ui/controls.ts';

// 3. Initialize Control Panel (Parser, Presets, Input, Speed, Reset)
new ControlPanel(simManager, world, telemetry, updateStatusUI);


// 6. Canvas Click (toggle obstacles)
const canvasEl = document.getElementById('warehouse-canvas') as HTMLCanvasElement;
canvasEl.addEventListener('click', (e: MouseEvent) => {
  const coord = renderer.getGridCoordFromClick(e.clientX, e.clientY);
  if (coord) {
    if (coord.x === simManager.robot.position.x && coord.y === simManager.robot.position.y) {
      telemetry.log('WARN', `Cannot place an obstacle on the robot's current position (${coord.x}, ${coord.y}).`);
      return;
    }

    const result = world.toggleObstacle(coord.x, coord.y);
    if (result) {
      if (result.added) {
        telemetry.log('WARN', `Hazard obstacle placed at (${coord.x}, ${coord.y}).`);
      } else {
        telemetry.log('INFO', `Hazard obstacle removed from (${coord.x}, ${coord.y}).`);
      }
      simManager.onObstacleToggled(coord, result.added);
    }
  }
});

