import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WarehouseWorld } from '../world/warehouseWorld.ts';
import { SimulationManager } from './simulationManager.ts';
import { MissionTask, RobotState } from '../types.ts';

// Mock CanvasRenderer & TelemetryLog for in-memory headless testing
class MockRenderer {
  public render = vi.fn();
}

class MockTelemetry {
  public log = vi.fn();
}

describe('SimulationManager Core Loop', () => {
  let world: WarehouseWorld;
  let sim: SimulationManager;
  let stateHistory: RobotState[];

  beforeEach(() => {
    world = new WarehouseWorld();
    stateHistory = [];
    const renderer = new MockRenderer() as any;
    const telemetry = new MockTelemetry() as any;

    sim = new SimulationManager(world, renderer, telemetry, (state) => {
      stateHistory.push(state);
    });
    // Set 0 delay for instant test execution
    sim.baseStepDelayMs = 0;
  });

  it('starts mission, calculates leg 1, and transitions to MOVING', () => {
    const task: MissionTask = {
      action: 'deliver',
      targetItem: 'red_box',
      destination: 'zone_a'
    };

    const started = sim.startMission(task);
    expect(started).toBe(true);
    expect(sim.robot.state).toBe('MOVING');
    expect(sim.remainingPath.length).toBeGreaterThan(0);
    expect(stateHistory).toContain('PLANNING');
    expect(stateHistory).toContain('MOVING');
  });

  it('traverses all steps, secures cargo, delivers to zone A, and finishes in ARRIVED state', async () => {
    const task: MissionTask = {
      action: 'deliver',
      targetItem: 'red_box',
      destination: 'zone_a'
    };

    sim.startMission(task);

    // Run ticks until mission completes
    let iterations = 0;
    while (sim.robot.state === 'MOVING' && iterations < 100) {
      // Simulate step tick directly
      (sim as any).executeStep();
      iterations++;
    }

    expect(sim.robot.state).toBe('ARRIVED');
    expect(sim.robot.position).toEqual(world.zones.zone_a);
    expect(sim.robot.cargo).toBeNull(); // cargo successfully delivered and unloaded
  });

  it('handles multi-leg mission with returnToDock', () => {
    const task: MissionTask = {
      action: 'deliver',
      targetItem: 'green_box',
      destination: 'zone_a',
      returnToDock: true
    };

    sim.startMission(task);

    let iterations = 0;
    while (sim.robot.state === 'MOVING' && iterations < 150) {
      (sim as any).executeStep();
      iterations++;
    }

    expect(sim.robot.state).toBe('ARRIVED');
    expect(sim.robot.position).toEqual(world.dock); // Returned home to dock!
  });

  it('halts safely in BLOCKED state when destination is unreachable', () => {
    // Trap Zone A
    world.toggleObstacle(13, 2);
    world.toggleObstacle(15, 2);
    world.toggleObstacle(14, 1);
    world.toggleObstacle(14, 3);

    const task: MissionTask = {
      action: 'deliver',
      targetItem: 'red_box',
      destination: 'zone_a'
    };

    sim.startMission(task);

    // Run until reaching red box, then leg 2 fails to find path to trapped zone A
    let iterations = 0;
    while (sim.robot.state === 'MOVING' && iterations < 50) {
      (sim as any).executeStep();
      iterations++;
    }

    expect(sim.robot.state).toBe('BLOCKED');
  });

  it('detours in real time when an obstacle is placed directly on the active path mid-transit', () => {
    const task: MissionTask = {
      action: 'deliver',
      targetItem: 'red_box',
      destination: 'zone_a'
    };

    sim.startMission(task);

    // Advance 2 steps
    (sim as any).executeStep();
    (sim as any).executeStep();

    // Check next upcoming cell on path
    const obstacleCell = sim.remainingPath[1];
    expect(obstacleCell).toBeDefined();

    // Place obstacle on active path!
    world.toggleObstacle(obstacleCell.x, obstacleCell.y);
    sim.onObstacleToggled(obstacleCell, true);

    expect(stateHistory).toContain('REPLANNING');
    expect(sim.robot.state).toBe('MOVING'); // resumed with detour
    expect(sim.remainingPath.some(pt => pt.x === obstacleCell.x && pt.y === obstacleCell.y)).toBe(false);

    // Run until finish
    let iterations = 0;
    while (sim.robot.state === 'MOVING' && iterations < 100) {
      (sim as any).executeStep();
      iterations++;
    }
    expect(sim.robot.state).toBe('ARRIVED');
  });

  it('resumes mission when user clears an obstacle that was blocking the path', () => {
    // Trap red box
    world.toggleObstacle(2, 8);
    world.toggleObstacle(1, 9);
    world.toggleObstacle(3, 9);
    world.toggleObstacle(2, 10);

    const task: MissionTask = {
      action: 'deliver',
      targetItem: 'red_box',
      destination: 'zone_a'
    };

    sim.startMission(task);
    expect(sim.robot.state).toBe('BLOCKED');

    // User removes obstacle at (2, 8)
    world.toggleObstacle(2, 8);
    sim.onObstacleToggled({ x: 2, y: 8 }, false);

    expect(sim.robot.state).toBe('MOVING'); // Successfully unblocked and resumed!
  });
});

