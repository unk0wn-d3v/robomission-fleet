import { describe, it, expect, beforeEach } from 'vitest';
import { WarehouseWorld } from '../world/warehouseWorld.ts';
import { findPath } from './astar.ts';

describe('A* Pathfinding Engine', () => {
  let world: WarehouseWorld;

  beforeEach(() => {
    world = new WarehouseWorld();
  });

  it('calculates the direct shortest path in an open area', () => {
    const start = { x: 1, y: 1 };
    const goal = { x: 1, y: 4 };

    const path = findPath(start, goal, world);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(4); // (1,1), (1,2), (1,3), (1,4)
    expect(path![0]).toEqual(start);
    expect(path![path!.length - 1]).toEqual(goal);
  });

  it('navigates cleanly around static warehouse shelving racks', () => {
    // Dock (1, 1) to Blue Box at (7, 2)
    // Shelf Rack A sits at columns 4-5, rows 4-7.
    // The path should move above the rack through row 1, 2, or 3.
    const start = { x: 1, y: 1 };
    const goal = { x: 7, y: 2 };

    const path = findPath(start, goal, world);
    expect(path).not.toBeNull();
    expect(path![0]).toEqual(start);
    expect(path![path!.length - 1]).toEqual(goal);

    // Verify no step touches static walls
    for (const step of path!) {
      expect(world.staticWalls.has(`${step.x},${step.y}`)).toBe(false);
    }
  });

  it('dynamically detours when dynamic obstacles are placed', () => {
    const start = { x: 1, y: 1 };
    const goal = { x: 1, y: 4 };

    // Initially 4 steps straight down
    const initialPath = findPath(start, goal, world);
    expect(initialPath!.length).toBe(4);

    // Place obstacle directly on the path at (1, 2)
    world.toggleObstacle(1, 2);

    const detourPath = findPath(start, goal, world);
    expect(detourPath).not.toBeNull();
    // Must step right to col 2, bypass (1, 2), and reconnect
    expect(detourPath!.some(step => step.x === 1 && step.y === 2)).toBe(false);
    expect(detourPath![detourPath!.length - 1]).toEqual(goal);
  });

  it('returns null when the destination is completely walled off (trapped goal)', () => {
    const start = { x: 1, y: 1 };
    const goal = { x: 14, y: 2 }; // Zone A

    // Trap Zone A (14, 2) by enclosing all 4 cardinal neighbors: (13, 2), (15, 2), (14, 1), (14, 3)
    world.toggleObstacle(13, 2);
    world.toggleObstacle(15, 2);
    world.toggleObstacle(14, 1);
    world.toggleObstacle(14, 3);

    const path = findPath(start, goal, world);
    expect(path).toBeNull();
  });

  it('handles start point being the goal immediately', () => {
    const start = { x: 5, y: 2 };
    const path = findPath(start, start, world);
    expect(path).toEqual([{ x: 5, y: 2 }]);
  });
});
