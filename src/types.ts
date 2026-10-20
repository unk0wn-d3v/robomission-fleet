export interface GridCoord {
  x: number; // Column index (0 to 15)
  y: number; // Row index (0 to 11)
}

export type RobotState = 'IDLE' | 'PLANNING' | 'MOVING' | 'REPLANNING' | 'ARRIVED' | 'BLOCKED';

export type CargoItemType = 'red_box' | 'blue_box' | 'green_box';

export type DestinationType = 'zone_a' | 'zone_b' | 'charging_station';

export interface MissionTask {
  action: 'deliver' | 'move';
  targetItem: CargoItemType;
  destination: DestinationType;
  avoidCoordinates?: GridCoord[];
  returnToDock?: boolean;
}

export interface ParseResult {
  success: boolean;
  task?: MissionTask;
  rawPrompt: string;
  source: 'llm' | 'fallback';
  errorReason?: string;
}

export type LogLevel = 'INFO' | 'PARSE' | 'PLAN' | 'WARN' | 'REPLAN' | 'SUCCESS' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogLevel;
  message: string;
}
