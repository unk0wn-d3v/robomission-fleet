import { WarehouseWorld } from './world/warehouseWorld.ts';
import { CanvasRenderer } from './render/canvasRenderer.ts';
import { TelemetryLog } from './ui/telemetryLog.ts';
import { SimulationManager } from './sim/simulationManager.ts';
import { MissionTask, RobotState } from './types.ts';

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

// 3. Preset Missions configuration
const PRESET_TASKS: Record<string, MissionTask> = {
  '1': {
    action: 'deliver',
    targetItem: 'red_box',
    destination: 'zone_a'
  },
  '2': {
    action: 'deliver',
    targetItem: 'blue_box',
    destination: 'zone_b'
  },
  '3': {
    action: 'deliver',
    targetItem: 'green_box',
    destination: 'zone_a',
    returnToDock: true
  }
};

// Preset button handlers
document.querySelectorAll<HTMLButtonElement>('.btn-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const presetId = btn.getAttribute('data-preset');
    if (!presetId) return;

    if (presetId === '4') {
      // Deliberate failure test: trap Zone A
      telemetry.log('WARN', 'Deliberate failure test selected: Enclosing Zone A in barrier obstacles.');
      world.reset();
      world.toggleObstacle(13, 2);
      world.toggleObstacle(15, 2);
      world.toggleObstacle(14, 1);
      world.toggleObstacle(14, 3);
      renderer.render(world.dock, null, []);

      simManager.startMission({
        action: 'deliver',
        targetItem: 'red_box',
        destination: 'zone_a'
      });
      return;
    }

    const task = PRESET_TASKS[presetId];
    if (task) {
      const inputEl = document.getElementById('mission-input') as HTMLInputElement;
      if (inputEl) {
        inputEl.value = btn.textContent?.replace(/^\d+\.\s*/, '') || '';
      }
      simManager.startMission(task);
    }
  });
});

// Run Mission button handler (runs whatever task or defaults to Preset 1)
const runBtn = document.getElementById('btn-run');
runBtn?.addEventListener('click', () => {
  simManager.startMission(PRESET_TASKS['1']);
});

// 4. Speed Toggle Button
const speedBtn = document.getElementById('btn-speed');
speedBtn?.addEventListener('click', () => {
  const newSpeed = simManager.speedMultiplier === 1 ? 2 : 1;
  simManager.setSpeed(newSpeed);
  if (speedBtn) {
    speedBtn.textContent = `Speed: ${newSpeed}x`;
  }
});

// 5. Reset Button
const resetBtn = document.getElementById('btn-reset');
resetBtn?.addEventListener('click', () => {
  simManager.reset();
  telemetry.log('INFO', 'Simulator reset to default state.');
  updateStatusUI('IDLE');
});

// 6. Canvas Click (toggle obstacles)
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
      renderer.render(simManager.robot.position, simManager.robot.cargo, simManager.remainingPath);
    }
  }
});
