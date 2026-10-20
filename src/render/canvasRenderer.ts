import { GridCoord } from '../types.ts';
import { WarehouseWorld } from '../world/warehouseWorld.ts';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: WarehouseWorld;

  public readonly logicalWidth: number = 800;
  public readonly logicalHeight: number = 600;
  public readonly cellSize: number = 50; // 16 * 50 = 800, 12 * 50 = 600
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

    this.initCanvasSize();
    window.addEventListener('resize', () => this.initCanvasSize());
  }

  public initCanvasSize(): void {
    this.dpr = window.devicePixelRatio || 1;

    // Buffer dimensions always set to 800 * dpr by 600 * dpr
    this.canvas.width = this.logicalWidth * this.dpr;
    this.canvas.height = this.logicalHeight * this.dpr;

    // Scale canvas context so all draw calls use 800x600 logical space
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.scale(this.dpr, this.dpr);

    this.render();
  }

  public getGridCoordFromClick(clientX: number, clientY: number): GridCoord | null {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // Scale from CSS screen pixels to logical 800x600 canvas space
    const scaleX = this.logicalWidth / rect.width;
    const scaleY = this.logicalHeight / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const col = Math.floor(canvasX / this.cellSize);
    const row = Math.floor(canvasY / this.cellSize);

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
    // 1. Clear background
    this.ctx.fillStyle = '#090e1a';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 2. Draw warehouse floor grid
    this.drawFloorGrid();

    // 3. Draw Charging Dock
    this.drawDock(this.world.dock.x, this.world.dock.y);

    // 4. Draw Delivery Zones (Zone A, Zone B)
    this.drawDeliveryZone(this.world.zones.zone_a.x, this.world.zones.zone_a.y, 'ZONE A', '#10b981');
    this.drawDeliveryZone(this.world.zones.zone_b.x, this.world.zones.zone_b.y, 'ZONE B', '#059669');

    // 5. Draw Static Storage Racks
    for (const key of this.world.staticWalls) {
      const [col, row] = key.split(',').map(Number);
      this.drawStorageRack(col, row);
    }

    // 6. Draw Dynamic Placed Hazards
    for (const key of this.world.dynamicObstacles) {
      const [col, row] = key.split(',').map(Number);
      this.drawHazardBarrier(col, row);
    }

    // 7. Draw Cargo Crates
    for (const [itemType, coord] of this.world.items.entries()) {
      if (cargo === itemType) continue; // Currently carried by robot
      this.drawCargoCrate(coord.x, coord.y, itemType);
    }

    // 8. Draw Planned Route Vector (Cyan Glowing Path)
    if (path.length > 0) {
      this.drawPathVector(path);
    }

    // 9. Draw Autonomous Robot (AMR)
    this.drawRobot(robotPos.x, robotPos.y, cargo);
  }

  private drawFloorGrid(): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#141d33';
    this.ctx.lineWidth = 1;

    for (let c = 0; c <= this.world.width; c++) {
      const x = c * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.logicalHeight);
      this.ctx.stroke();
    }
    for (let r = 0; r <= this.world.height; r++) {
      const y = r * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.logicalWidth, y);
      this.ctx.stroke();
    }

    // Small coordinate intersection points
    this.ctx.fillStyle = '#1e293b';
    for (let c = 1; c < this.world.width; c++) {
      for (let r = 1; r < this.world.height; r++) {
        this.ctx.fillRect(c * this.cellSize - 1, r * this.cellSize - 1, 2, 2);
      }
    }
    this.ctx.restore();
  }

  private drawDock(col: number, row: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const s = this.cellSize;

    this.ctx.save();
    // Dock background
    this.ctx.fillStyle = 'rgba(30, 58, 138, 0.25)';
    this.ctx.fillRect(x + 3, y + 3, s - 6, s - 6);

    // Corner brackets
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2;
    const b = 8;
    // Top-left
    this.ctx.beginPath();
    this.ctx.moveTo(x + 3, y + 3 + b);
    this.ctx.lineTo(x + 3, y + 3);
    this.ctx.lineTo(x + 3 + b, y + 3);
    this.ctx.stroke();
    // Bottom-right
    this.ctx.beginPath();
    this.ctx.moveTo(x + s - 3, y + s - 3 - b);
    this.ctx.lineTo(x + s - 3, y + s - 3);
    this.ctx.lineTo(x + s - 3 - b, y + s - 3);
    this.ctx.stroke();

    // Subtle dock badge at top
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.font = 'bold 8px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('⚡ DOCK', x + 6, y + 12);
    this.ctx.restore();
  }

  private drawDeliveryZone(col: number, row: number, label: string, color: string): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const s = this.cellSize;

    this.ctx.save();
    // Soft transparent zone floor
    this.ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);

    // Diagonal hazard stripe pattern in corners
    this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);

    // Corner targeting lines
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2.5;
    const cl = 7;
    // TL
    this.ctx.beginPath();
    this.ctx.moveTo(x + 2, y + 2 + cl);
    this.ctx.lineTo(x + 2, y + 2);
    this.ctx.lineTo(x + 2 + cl, y + 2);
    this.ctx.stroke();
    // TR
    this.ctx.beginPath();
    this.ctx.moveTo(x + s - 2, y + 2 + cl);
    this.ctx.lineTo(x + s - 2, y + 2);
    this.ctx.lineTo(x + s - 2 - cl, y + 2);
    this.ctx.stroke();
    // BL
    this.ctx.beginPath();
    this.ctx.moveTo(x + 2, y + s - 2 - cl);
    this.ctx.lineTo(x + 2, y + s - 2);
    this.ctx.lineTo(x + 2 + cl, y + s - 2);
    this.ctx.stroke();
    // BR
    this.ctx.beginPath();
    this.ctx.moveTo(x + s - 2, y + s - 2 - cl);
    this.ctx.lineTo(x + s - 2, y + s - 2);
    this.ctx.lineTo(x + s - 2 - cl, y + s - 2);
    this.ctx.stroke();

    // Zone Badge
    const bw = 40;
    const bh = 14;
    const bx = x + (s - bw) / 2;
    const by = y + (s - bh) / 2;

    this.ctx.fillStyle = '#064e3b';
    this.ctx.strokeStyle = '#34d399';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, bw, bh, 3);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#a7f3d0';
    this.ctx.font = 'bold 8px -apple-system, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + s / 2, by + 10);
    this.ctx.restore();
  }

  private drawStorageRack(col: number, row: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const s = this.cellSize;

    this.ctx.save();
    // Heavy industrial steel shelf body
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);

    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);

    // Steel shelf beams
    this.ctx.fillStyle = '#1f293d';
    this.ctx.fillRect(x + 4, y + 4, s - 8, s - 8);

    // Industrial cross-struts
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 5, y + 5);
    this.ctx.lineTo(x + s - 5, y + s - 5);
    this.ctx.moveTo(x + s - 5, y + 5);
    this.ctx.lineTo(x + 5, y + s - 5);
    this.ctx.stroke();

    // Corner rivets
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillRect(x + 3, y + 3, 2, 2);
    this.ctx.fillRect(x + s - 5, y + 3, 2, 2);
    this.ctx.fillRect(x + 3, y + s - 5, 2, 2);
    this.ctx.fillRect(x + s - 5, y + s - 5, 2, 2);
    this.ctx.restore();
  }

  private drawHazardBarrier(col: number, row: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const s = this.cellSize;

    this.ctx.save();
    // High-visibility hazard background with amber glow
    this.ctx.shadowColor = 'rgba(249, 115, 22, 0.4)';
    this.ctx.shadowBlur = 10;

    this.ctx.fillStyle = '#431407';
    this.ctx.strokeStyle = '#f97316';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(x + 4, y + 4, s - 8, s - 8, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Diagonal hazard stripes inside
    this.ctx.save();
    this.ctx.clip();
    this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    this.ctx.lineWidth = 4;
    for (let offset = -s; offset < s * 2; offset += 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + offset, y);
      this.ctx.lineTo(x + offset + s, y + s);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Central warning beacon icon
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠', x + s / 2, y + s / 2 + 6);
    this.ctx.restore();
  }

  private drawCargoCrate(col: number, row: number, itemType: string): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    const s = this.cellSize;

    let primaryColor = '#dc2626';
    let borderColor = '#f87171';
    let label = 'RED';

    if (itemType === 'blue_box') {
      primaryColor = '#2563eb';
      borderColor = '#60a5fa';
      label = 'BLUE';
    } else if (itemType === 'green_box') {
      primaryColor = '#059669';
      borderColor = '#34d399';
      label = 'GREEN';
    }

    this.ctx.save();
    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x + 10, y + s - 8, s - 20, 4);

    // Crate outer body
    const cw = 30;
    const ch = 28;
    const cx = x + (s - cw) / 2;
    const cy = y + (s - ch) / 2 - 2;

    this.ctx.fillStyle = primaryColor;
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(cx, cy, cw, ch, 4);
    this.ctx.fill();
    this.ctx.stroke();

    // Crate diagonal brace lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + 2, cy + 2);
    this.ctx.lineTo(cx + cw - 2, cy + ch - 2);
    this.ctx.moveTo(cx + cw - 2, cy + 2);
    this.ctx.lineTo(cx + 2, cy + ch - 2);
    this.ctx.stroke();

    // Crisp text badge below crate
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 8px -apple-system, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + s / 2, cy + ch + 9);
    this.ctx.restore();
  }

  private drawPathVector(path: GridCoord[]): void {
    if (path.length < 2) return;

    this.ctx.save();
    // Outer neon glow
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 10;

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

    // Bright core line
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowBlur = 0;
    this.ctx.stroke();

    // Small waypoint nodes
    this.ctx.fillStyle = '#bae6fd';
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
    const radius = 17;

    this.ctx.save();
    // Drop shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 4;

    // Outer wheel treads (left and right tracks)
    this.ctx.fillStyle = '#0f172a';
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1;
    this.ctx.fillRect(cx - radius - 3, cy - 12, 4, 24);
    this.ctx.strokeRect(cx - radius - 3, cy - 12, 4, 24);
    this.ctx.fillRect(cx + radius - 1, cy - 12, 4, 24);
    this.ctx.strokeRect(cx + radius - 1, cy - 12, 4, 24);

    // Robot main circular chassis
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = '#1e40af';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // Inner sensor turret / LIDAR dome
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#60a5fa';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Sensor pulse center dot
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // If carrying cargo: miniature crate attached on top
    if (cargo) {
      let cargoColor = '#ef4444';
      if (cargo === 'blue_box') cargoColor = '#3b82f6';
      if (cargo === 'green_box') cargoColor = '#10b981';

      this.ctx.fillStyle = cargoColor;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(cx - 7, cy - radius - 7, 14, 14, 2);
      this.ctx.fill();
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}
