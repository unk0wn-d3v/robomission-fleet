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
});
