import { CargoItemType, GridCoord, RobotState } from '../types.ts';

export class Robot {
  public position: GridCoord;
  public state: RobotState = 'IDLE';
  public cargo: CargoItemType | null = null;

  constructor(initialPos: GridCoord = { x: 1, y: 1 }) {
    this.position = { ...initialPos };
  }

  public moveTo(coord: GridCoord): void {
    this.position = { ...coord };
  }

  public pickupCargo(item: CargoItemType): void {
    this.cargo = item;
  }

  public dropCargo(): CargoItemType | null {
    const dropped = this.cargo;
    this.cargo = null;
    return dropped;
  }

  public reset(dockPos: GridCoord): void {
    this.position = { ...dockPos };
    this.state = 'IDLE';
    this.cargo = null;
  }
}
