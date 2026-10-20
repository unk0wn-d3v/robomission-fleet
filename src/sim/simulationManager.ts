import { findPath } from '../planner/astar.ts';
import { CanvasRenderer } from '../render/canvasRenderer.ts';
import { GridCoord, MissionTask, RobotState } from '../types.ts';
import { TelemetryLog } from '../ui/telemetryLog.ts';
import { WarehouseWorld } from '../world/warehouseWorld.ts';
import { Robot } from './robot.ts';

export class SimulationManager {
  public robot: Robot;
  public world: WarehouseWorld;
  public renderer: CanvasRenderer;
  public telemetry: TelemetryLog;

  public activeTask: MissionTask | null = null;
  public currentLegIndex: number = 0;
  public currentLegTarget: GridCoord | null = null;
  public remainingPath: GridCoord[] = [];

  public speedMultiplier: number = 1; // 1x or 2x
  public baseStepDelayMs: number = 250;

  private stepTimer: ReturnType<typeof setTimeout> | null = null;
  private onStateChangeCallback?: (state: RobotState) => void;

  constructor(
    world: WarehouseWorld,
    renderer: CanvasRenderer,
    telemetry: TelemetryLog,
    onStateChange?: (state: RobotState) => void
  ) {
    this.world = world;
    this.renderer = renderer;
    this.telemetry = telemetry;
    this.robot = new Robot(world.dock);
    this.onStateChangeCallback = onStateChange;
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
    this.telemetry.log('INFO', `Simulation speed adjusted to ${multiplier}x.`);
  }

  public setState(newState: RobotState): void {
    this.robot.state = newState;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(newState);
    }
  }

  public startMission(task: MissionTask): boolean {
    this.stop();
    this.activeTask = task;
    this.currentLegIndex = 0;

    const itemCoord = this.world.items.get(task.targetItem);
    if (!itemCoord) {
      this.telemetry.log('ERROR', `Item ${task.targetItem} not found on warehouse floor.`);
      this.setState('BLOCKED');
      return false;
    }

    this.setState('PLANNING');
    this.telemetry.log('PLAN', `Planning Leg 1: Navigate from Dock (${this.robot.position.x}, ${this.robot.position.y}) to ${task.targetItem.replace('_', ' ')} at (${itemCoord.x}, ${itemCoord.y}).`);

    this.currentLegTarget = itemCoord;

    const path = findPath(this.robot.position, itemCoord, this.world);
    if (!path) {
      this.telemetry.log('ERROR', `Cannot find path to ${task.targetItem}. Destination is blocked.`);
      this.setState('BLOCKED');
      this.renderer.render(this.robot.position, this.robot.cargo, []);
      return false;
    }

    this.remainingPath = [...path];
    this.telemetry.log('INFO', `Path plotted (${path.length - 1} steps). Starting transit.`);

    this.setState('MOVING');
    this.scheduleNextStep();
    return true;
  }

  private scheduleNextStep(): void {
    if (this.stepTimer !== null) {
      clearTimeout(this.stepTimer);
    }

    const delay = this.baseStepDelayMs / this.speedMultiplier;
    this.stepTimer = setTimeout(() => {
      this.executeStep();
    }, delay);
  }

  private executeStep(): void {
    if (this.robot.state !== 'MOVING') {
      return;
    }

    // Advance along path
    if (this.remainingPath.length > 1) {
      this.remainingPath.shift(); // remove current position
      const nextCoord = this.remainingPath[0];
      this.robot.moveTo(nextCoord);
      this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
      this.scheduleNextStep();
      return;
    }

    // Reached current leg destination
    this.handleLegArrival();
  }

  private handleLegArrival(): void {
    if (!this.activeTask) return;

    if (this.currentLegIndex === 0) {
      // Leg 1 complete: Reached Item
      const item = this.activeTask.targetItem;
      this.robot.pickupCargo(item);
      this.telemetry.log('SUCCESS', `Pickup station reached. Secured cargo: ${item.replace('_', ' ').toUpperCase()}.`);

      // Plan Leg 2: To Delivery Zone
      const destCoord = this.world.zones[this.activeTask.destination];
      this.currentLegIndex = 1;
      this.currentLegTarget = destCoord;

      this.telemetry.log('PLAN', `Planning Leg 2: Transport cargo to ${this.activeTask.destination.replace('_', ' ').toUpperCase()} at (${destCoord.x}, ${destCoord.y}).`);
      const path = findPath(this.robot.position, destCoord, this.world);

      if (!path) {
        this.telemetry.log('ERROR', `No valid path to delivery zone ${this.activeTask.destination.replace('_', ' ').toUpperCase()}. Halting safely.`);
        this.telemetry.log('ERROR', 'Mission blocked: no valid path to destination. Clear an obstacle or reset the mission.');
        this.setState('BLOCKED');
        this.renderer.render(this.robot.position, this.robot.cargo, []);
        return;
      }

      this.remainingPath = [...path];
      this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
      this.scheduleNextStep();
    } else if (this.currentLegIndex === 1) {
      // Leg 2 complete: Reached Destination Bay
      const deliveredItem = this.robot.dropCargo();
      const destName = this.activeTask.destination.replace('_', ' ').toUpperCase();
      this.telemetry.log('SUCCESS', `Delivery bay reached. Cargo ${deliveredItem?.replace('_', ' ').toUpperCase()} safely unloaded at ${destName}.`);

      if (this.activeTask.returnToDock) {
        // Plan Leg 3: Return to Dock
        this.currentLegIndex = 2;
        this.currentLegTarget = this.world.dock;
        this.telemetry.log('PLAN', `Planning Leg 3: Return to Dock / Charging Station at (${this.world.dock.x}, ${this.world.dock.y}).`);

        const path = findPath(this.robot.position, this.world.dock, this.world);
        if (path) {
          this.remainingPath = [...path];
          this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
          this.scheduleNextStep();
          return;
        }
      }

      // Mission finished!
      this.setState('ARRIVED');
      this.telemetry.log('SUCCESS', 'Mission complete: All operations concluded successfully.');
      this.remainingPath = [];
      this.renderer.render(this.robot.position, this.robot.cargo, []);
    } else if (this.currentLegIndex === 2) {
      // Leg 3 complete: Returned to Dock
      this.setState('ARRIVED');
      this.telemetry.log('SUCCESS', 'Dock reached: Robot successfully recharged and ready for next mission.');
      this.remainingPath = [];
      this.renderer.render(this.robot.position, this.robot.cargo, []);
    }
  }

  public onObstacleToggled(coord: GridCoord, added: boolean): void {
    if (!added) {
      // An obstacle was removed!
      if (this.robot.state === 'BLOCKED' && this.currentLegTarget) {
        this.telemetry.log('INFO', `Obstacle cleared at (${coord.x}, ${coord.y}). Checking if path reopened...`);
        const path = findPath(this.robot.position, this.currentLegTarget, this.world);
        if (path) {
          this.remainingPath = [...path];
          this.setState('MOVING');
          this.telemetry.log('SUCCESS', `Path reopened (${path.length - 1} steps). Resuming mission!`);
          this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
          this.scheduleNextStep();
          return;
        }
      }
      this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
      return;
    }

    // An obstacle was added! Check if it intersects the remaining path
    const onActivePath = this.remainingPath.some(pt => pt.x === coord.x && pt.y === coord.y);

    if (onActivePath && (this.robot.state === 'MOVING' || this.robot.state === 'PLANNING')) {
      // Pause step timer
      this.stop();
      this.setState('REPLANNING');
      this.telemetry.log('WARN', `Obstacle detected directly on active route at (${coord.x}, ${coord.y})! Halting to recalculate detour...`);

      // Draw obstacle immediately
      this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);

      if (!this.currentLegTarget) {
        return;
      }

      // Query A* from current robot cell with the new obstacle in place
      const detourPath = findPath(this.robot.position, this.currentLegTarget, this.world);

      if (detourPath && detourPath.length > 0) {
        this.remainingPath = [...detourPath];
        this.telemetry.log('REPLAN', `Detour found (${detourPath.length - 1} steps). New route engaged, resuming mission.`);
        this.setState('MOVING');
        this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
        this.scheduleNextStep();
      } else {
        this.remainingPath = [];
        this.setState('BLOCKED');
        this.telemetry.log('ERROR', 'Mission blocked: No valid detour around obstacles. Clear an obstacle or reset the mission.');
        this.renderer.render(this.robot.position, this.robot.cargo, []);
      }
    } else {
      // Placed outside active path, update canvas
      this.renderer.render(this.robot.position, this.robot.cargo, this.remainingPath);
    }
  }

  public stop(): void {
    if (this.stepTimer !== null) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  public reset(): void {
    this.stop();
    this.world.reset();
    this.robot.reset(this.world.dock);
    this.activeTask = null;
    this.remainingPath = [];
    this.currentLegIndex = 0;
    this.currentLegTarget = null;
    this.setState('IDLE');
    this.renderer.render(this.robot.position, null, []);
  }
}
