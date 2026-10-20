import { SimulationManager } from '../sim/simulationManager.ts';
import { WarehouseWorld } from '../world/warehouseWorld.ts';
import { TelemetryLog } from './telemetryLog.ts';
import { parseMission } from '../parser/missionParser.ts';
import { MissionTask, RobotState } from '../types.ts';

export class ControlPanel {
  private inputEl: HTMLInputElement;
  private runBtn: HTMLButtonElement;
  private speedBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private presetBtns: NodeListOf<HTMLButtonElement>;

  constructor(
    private simManager: SimulationManager,
    private world: WarehouseWorld,
    private telemetry: TelemetryLog,
    private updateStatusUI: (state: RobotState) => void
  ) {
    this.inputEl = document.getElementById('mission-input') as HTMLInputElement;
    this.runBtn = document.getElementById('btn-run') as HTMLButtonElement;
    this.speedBtn = document.getElementById('btn-speed') as HTMLButtonElement;
    this.resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
    this.presetBtns = document.querySelectorAll<HTMLButtonElement>('.btn-preset');

    this.bindEvents();
  }

  private bindEvents(): void {
    // 1. Run Mission on button click or Enter key
    this.runBtn?.addEventListener('click', () => this.handleRunMission());
    this.inputEl?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.handleRunMission();
      }
    });

    // 2. Preset mission buttons
    this.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.getAttribute('data-preset');
        if (!presetId) return;
        this.handlePreset(presetId);
      });
    });

    // 3. Speed toggle button (1x / 2x)
    this.speedBtn?.addEventListener('click', () => {
      const nextSpeed = this.simManager.speedMultiplier === 1 ? 2 : 1;
      this.simManager.setSpeed(nextSpeed);
      this.speedBtn.textContent = `Speed: ${nextSpeed}x`;
      this.telemetry.log('INFO', `Simulation speed adjusted to ${nextSpeed}x.`);
    });

    // 4. Reset simulator button
    this.resetBtn?.addEventListener('click', () => {
      this.simManager.reset();
      this.inputEl.value = '';
      this.telemetry.log('INFO', 'Simulator reset to default warehouse state.');
      this.updateStatusUI('IDLE');
    });
  }

  public async handleRunMission(): Promise<void> {
    const rawText = this.inputEl?.value.trim() || '';
    if (!rawText) {
      // Default prompt if input is empty
      this.inputEl.value = 'Pick up the red box and deliver it to Zone A';
      await this.executeMissionPrompt('Pick up the red box and deliver it to Zone A');
      return;
    }

    await this.executeMissionPrompt(rawText);
  }

  public async executeMissionPrompt(prompt: string): Promise<void> {
    this.telemetry.log('INFO', `Evaluating command: "${prompt}"...`);

    const result = await parseMission(prompt);

    if (!result.success || !result.task) {
      this.telemetry.log(
        'ERROR',
        result.errorReason || "Couldn't understand this mission. Try specifying an item and a warehouse destination."
      );
      // Preserve input text so the user can easily retry/edit
      return;
    }

    // Successfully parsed
    const task: MissionTask = result.task;
    const taskDesc = `${task.action} ${task.targetItem.replace('_', ' ')} -> ${task.destination.replace('_', ' ')}${
      task.returnToDock ? ' & return to station' : ''
    }`;
    this.telemetry.log('PARSE', `Mission parsed (${result.source.toUpperCase()}): ${taskDesc}.`);

    this.simManager.startMission(task);
  }

  public handlePreset(presetId: string): void {
    if (presetId === '1') {
      const prompt = 'Pick up the red box and deliver it to Zone A';
      this.inputEl.value = prompt;
      this.executeMissionPrompt(prompt);
    } else if (presetId === '2') {
      const prompt = 'Move the blue box to Zone B while avoiding the blocked aisle';
      this.inputEl.value = prompt;
      this.executeMissionPrompt(prompt);
    } else if (presetId === '3') {
      const prompt = 'Deliver the green box to Zone A, then return to the charging station';
      this.inputEl.value = prompt;
      this.executeMissionPrompt(prompt);
    } else if (presetId === '4') {
      // Deliberate failure test: Completely block Zone A
      const prompt = 'Deliver red box to Zone A (Completely Blocked)';
      this.inputEl.value = prompt;
      this.telemetry.log('WARN', 'Deliberate failure test selected: Enclosing Zone A in barrier obstacles.');
      
      this.simManager.reset();
      this.world.toggleObstacle(13, 2);
      this.world.toggleObstacle(15, 2);
      this.world.toggleObstacle(14, 1);
      this.world.toggleObstacle(14, 3);

      this.executeMissionPrompt('Deliver the red box to Zone A');
    }
  }
}
