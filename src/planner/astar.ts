import { GridCoord } from '../types.ts';
import { WarehouseWorld } from '../world/warehouseWorld.ts';

interface AStarNode {
  coord: GridCoord;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

export function findPath(
  start: GridCoord,
  goal: GridCoord,
  world: WarehouseWorld,
  customObstacles?: Set<string>
): GridCoord[] | null {
  // Check bounds and walkable status
  if (!world.isWalkable(start.x, start.y, false) && !(start.x === world.dock.x && start.y === world.dock.y)) {
    return null;
  }
  if (!world.isWalkable(goal.x, goal.y, false)) {
    return null;
  }

  if (start.x === goal.x && start.y === goal.y) {
    return [{ ...start }];
  }

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    coord: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null
  };

  openSet.push(startNode);

  // 4 Cardinal directions: North, South, West, East
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  while (openSet.length > 0) {
    // Find node with lowest f score (tie-break with lowest h score)
    let bestIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (
        openSet[i].f < openSet[bestIndex].f ||
        (openSet[i].f === openSet[bestIndex].f && openSet[i].h < openSet[bestIndex].h)
      ) {
        bestIndex = i;
      }
    }

    const current = openSet.splice(bestIndex, 1)[0];
    const currentKey = `${current.coord.x},${current.coord.y}`;

    // Goal reached
    if (current.coord.x === goal.x && current.coord.y === goal.y) {
      return reconstructPath(current);
    }

    closedSet.add(currentKey);

    // Evaluate neighbors
    for (const dir of directions) {
      const nx = current.coord.x + dir.dx;
      const ny = current.coord.y + dir.dy;
      const neighborKey = `${nx},${ny}`;

      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Check walkability (world walls, dynamic obstacles, custom obstacle set)
      if (!world.isWalkable(nx, ny, false)) {
        continue;
      }
      if (customObstacles && customObstacles.has(neighborKey)) {
        continue;
      }

      const tentativeG = current.g + 1;
      const existingOpen = openSet.find(n => n.coord.x === nx && n.coord.y === ny);

      if (!existingOpen) {
        const h = manhattanDistance({ x: nx, y: ny }, goal);
        const neighborNode: AStarNode = {
          coord: { x: nx, y: ny },
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current
        };
        openSet.push(neighborNode);
      } else if (tentativeG < existingOpen.g) {
        existingOpen.g = tentativeG;
        existingOpen.f = tentativeG + existingOpen.h;
        existingOpen.parent = current;
      }
    }
  }

  // Open set exhausted, no path possible
  return null;
}

function manhattanDistance(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(endNode: AStarNode): GridCoord[] {
  const path: GridCoord[] = [];
  let curr: AStarNode | null = endNode;
  while (curr !== null) {
    path.unshift({ ...curr.coord });
    curr = curr.parent;
  }
  return path;
}
