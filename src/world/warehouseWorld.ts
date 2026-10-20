import { CargoItemType, DestinationType, GridCoord } from '../types.ts';

export class WarehouseWorld {
  public readonly width: number = 16;
  public readonly height: number = 12;

  public readonly dock: GridCoord = { x: 1, y: 1 };

  public readonly defaultItems: Record<CargoItemType, GridCoord> = {
    red_box: { x: 2, y: 9 },
    blue_box: { x: 7, y: 2 },
    green_box: { x: 11, y: 8 }
  };

  public readonly zones: Record<DestinationType, GridCoord> = {
    zone_a: { x: 14, y: 2 },
    zone_b: { x: 14, y: 9 },
    charging_station: { x: 1, y: 1 }
  };

  public items: Map<CargoItemType, GridCoord>;
  public staticWalls: Set<string>;
  public dynamicObstacles: Set<string>;

  constructor() {
    this.items = new Map();
    this.staticWalls = new Set();
    this.dynamicObstacles = new Set();
    this.initDefaultLayout();
  }

  public initDefaultLayout(): void {
    this.resetItems();
    this.dynamicObstacles.clear();
    this.staticWalls.clear();

    // Aisle Rack A: columns 4 & 5, rows 4-7
    for (let y = 4; y <= 7; y++) {
      this.staticWalls.add(`4,${y}`);
      this.staticWalls.add(`5,${y}`);
    }

    // Aisle Rack B: columns 9 & 10, rows 3-6
    for (let y = 3; y <= 6; y++) {
      this.staticWalls.add(`9,${y}`);
      this.staticWalls.add(`10,${y}`);
    }

    // Aisle divider rack: column 7, rows 5-6
    this.staticWalls.add('7,5');
    this.staticWalls.add('7,6');
  }

  public resetItems(): void {
    this.items.clear();
    for (const [key, coord] of Object.entries(this.defaultItems)) {
      this.items.set(key as CargoItemType, { ...coord });
    }
  }

  public isWalkable(x: number, y: number, ignoreDynamic: boolean = false): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    const key = `${x},${y}`;
    if (this.staticWalls.has(key)) {
      return false;
    }
    if (!ignoreDynamic && this.dynamicObstacles.has(key)) {
      return false;
    }
    return true;
  }

  public toggleObstacle(x: number, y: number): { added: boolean; coord: GridCoord } | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    const key = `${x},${y}`;

    // Cannot place an obstacle on static walls or dock
    if (this.staticWalls.has(key) || (x === this.dock.x && y === this.dock.y)) {
      return null;
    }

    if (this.dynamicObstacles.has(key)) {
      this.dynamicObstacles.delete(key);
      return { added: false, coord: { x, y } };
    } else {
      this.dynamicObstacles.add(key);
      return { added: true, coord: { x, y } };
    }
  }

  public reset(): void {
    this.initDefaultLayout();
  }
}
