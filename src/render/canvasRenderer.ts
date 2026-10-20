import { GridCoord } from '../types.ts';
import { WarehouseWorld } from '../world/warehouseWorld.ts';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: WarehouseWorld;

  public cellSize: number = 50;
  private dpr: number = 1;

  constructor(canvasId: string, world: WarehouseWorld) {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) {
      throw new Error(`Canvas #${canvasId} not found`);
    }
    this.canvas = el;
    const context = el.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context could not be acquired');
    }
    this.ctx = context;
    this.world = world;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width > 0 ? rect.width : 800;
    const displayHeight = rect.height > 0 ? rect.height : 600;

    this.cellSize = Math.floor(Math.min(displayWidth / this.world.width, displayHeight / this.world.height));

    this.canvas.width = (this.world.width * this.cellSize) * this.dpr;
    this.canvas.height = (this.world.height * this.cellSize) * this.dpr;

    this.ctx.scale(this.dpr, this.dpr);
    this.render();
  }

  public getGridCoordFromClick(clientX: number, clientY: number): GridCoord | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (col >= 0 && col < this.world.width && row >= 0 && row < this.world.height) {
      return { x: col, y: row };
    }
    return null;
  }

  public render(
    robotPos: { x: number; y: number } = this.world.dock,
    cargo: string | null = null,
    path: GridCoord[] = []
  ): void {
    const width = this.world.width * this.cellSize;
    const height = this.world.height * this.cellSize;

    // 1. Clear background
    this.ctx.fillStyle = '#0b0f19';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Draw subtle grid
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;

    for (let c = 0; c <= this.world.width; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.cellSize, 0);
      this.ctx.lineTo(c * this.cellSize, height);
      this.ctx.stroke();
    }
    for (let r = 0; r <= this.world.height; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.cellSize);
      this.ctx.lineTo(width, r * this.cellSize);
      this.ctx.stroke();
    }

    // 3. Draw Dock / Charging Station
    const dock = this.world.dock;
    this.drawDockCell(dock.x, dock.y);

    // 4. Draw Delivery Zones
    this.drawZone(this.world.zones.zone_a.x, this.world.zones.zone_a.y, 'Zone A', '#10b981');
    this.drawZone(this.world.zones.zone_b.x, this.world.zones.zone_b.y, 'Zone B', '#059669');

    // 5. Draw Static Shelves / Racks
    for (const key of this.world.staticWalls) {
      const [col, row] = key.split(',').map(Number);
      this.drawRack(col, row);
    }

    // 6. Draw Placed Dynamic Obstacles
    for (const key of this.world.dynamicObstacles) {
      const [col, row] = key.split(',').map(Number);
      this.drawHazard(col, row);
    }

    // 7. Draw Items / Crates (if not currently carried by robot)
    for (const [itemType, coord] of this.world.items.entries()) {
      if (cargo === itemType) continue; // carried by robot
      this.drawItemCrate(coord.x, coord.y, itemType);
    }

    // 8. Draw Planned Route Line (Cyan Vector)
    if (path.length > 0) {
      this.drawPath(path);
    }

    // 9. Draw Robot Puck
    this.drawRobot(robotPos.x, robotPos.y, cargo);
  }

  private drawDockCell(col: number, row: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;

    this.ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

    this.ctx.fillStyle = '#93c5fd';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DOCK', x + this.cellSize / 2, y + this.cellSize - 6);
  }

  private drawZone(col: number, row: number, label: string, color: string): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;

    this.ctx.fillStyle = `${color}22`; // ~13% opacity
    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

    this.ctx.fillStyle = '#6ee7b7';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + this.cellSize / 2, y + this.cellSize / 2 + 4);
  }

  private drawRack(col: number, row: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;

    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

    // Crosshatch detail
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 5, y + 5);
    this.ctx.lineTo(x + this.cellSize - 5, y + this.cellSize - 5);
    this.ctx.moveTo(x + this.cellSize - 5, y + 5);
    this.ctx.lineTo(x + 5, y + this.cellSize - 5);
    this.ctx.stroke();
  }

  private drawHazard(col: number, row: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;

    // Glowing hazard background
    this.ctx.fillStyle = '#7c2d12';
    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

    this.ctx.strokeStyle = '#f97316';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

    // Hazard symbol text
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠', x + this.cellSize / 2, y + this.cellSize / 2 + 5);
  }

  private drawItemCrate(col: number, row: number, itemType: string): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const pad = 8;
    const w = this.cellSize - pad * 2;

    let bg = '#ef4444';
    let text = 'RED';
    if (itemType === 'blue_box') {
      bg = '#3b82f6';
      text = 'BLUE';
    } else if (itemType === 'green_box') {
      bg = '#10b981';
      text = 'GRN';
    }

    this.ctx.fillStyle = bg;
    this.ctx.beginPath();
    this.ctx.roundRect(x + pad, y + pad, w, w, 4);
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x + this.cellSize / 2, y + this.cellSize / 2 + 3);
  }

  private drawPath(path: GridCoord[]): void {
    if (path.length < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const pt = path[i];
      const cx = pt.x * this.cellSize + this.cellSize / 2;
      const cy = pt.y * this.cellSize + this.cellSize / 2;
      if (i === 0) {
        this.ctx.moveTo(cx, cy);
      } else {
        this.ctx.lineTo(cx, cy);
      }
    }
    this.ctx.stroke();

    // Small waypoint dots
    this.ctx.fillStyle = '#e0f2fe';
    for (const pt of path) {
      const cx = pt.x * this.cellSize + this.cellSize / 2;
      const cy = pt.y * this.cellSize + this.cellSize / 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawRobot(col: number, row: number, cargo: string | null): void {
    const cx = col * this.cellSize + this.cellSize / 2;
    const cy = row * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.38;

    this.ctx.save();
    // Glowing halo
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 10;

    // Body
    this.ctx.fillStyle = '#2563eb';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#60a5fa';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // Directional icon / core dot
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Cargo indicator pip if carrying
    if (cargo) {
      let cargoColor = '#ef4444';
      if (cargo === 'blue_box') cargoColor = '#60a5fa';
      if (cargo === 'green_box') cargoColor = '#34d399';

      this.ctx.fillStyle = cargoColor;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - radius - 2, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}
