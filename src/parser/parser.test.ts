import { describe, it, expect } from 'vitest';
import { parseFallback } from './fallbackParser.ts';
import { parseMission } from './missionParser.ts';

describe('Mission Parser Suite', () => {
  describe('Fallback Rule-Based Parser (parseFallback)', () => {
    it('parses Preset 1: "Pick up the red box and deliver it to Zone A"', () => {
      const res = parseFallback('Pick up the red box and deliver it to Zone A');
      expect(res.success).toBe(true);
      expect(res.task).toBeDefined();
      expect(res.task?.targetItem).toBe('red_box');
      expect(res.task?.destination).toBe('zone_a');
      expect(res.task?.action).toBe('deliver');
      expect(res.task?.returnToDock).toBe(false);
      expect(res.source).toBe('fallback');
    });

    it('parses Preset 2: "Move the blue box to Zone B while avoiding the blocked aisle"', () => {
      const res = parseFallback('Move the blue box to Zone B while avoiding the blocked aisle');
      expect(res.success).toBe(true);
      expect(res.task?.targetItem).toBe('blue_box');
      expect(res.task?.destination).toBe('zone_b');
      expect(res.task?.action).toBe('move');
      expect(res.source).toBe('fallback');
    });

    it('parses Preset 3: "Deliver the green box to Zone A, then return to the charging station"', () => {
      const res = parseFallback('Deliver the green box to Zone A, then return to the charging station');
      expect(res.success).toBe(true);
      expect(res.task?.targetItem).toBe('green_box');
      expect(res.task?.destination).toBe('zone_a');
      expect(res.task?.returnToDock).toBe(true);
    });

    it('rejects out-of-domain command: "fly to the moon"', () => {
      const res = parseFallback('fly to the moon');
      expect(res.success).toBe(false);
      expect(res.task).toBeUndefined();
      expect(res.errorReason).toBe("Couldn't understand this mission. Try specifying an item and a warehouse destination.");
    });

    it('rejects irrelevant conversation or random noise', () => {
      const res = parseFallback('make me a hot cup of coffee');
      expect(res.success).toBe(false);
      expect(res.errorReason).toBe("Couldn't understand this mission. Try specifying an item and a warehouse destination.");
    });

    it('rejects empty or whitespace-only prompts', () => {
      const res = parseFallback('   ');
      expect(res.success).toBe(false);
    });

    it('handles varied phrasing and uppercase letters', () => {
      const res = parseFallback('PLEASE TAKE THE GREEN CRATE OVER TO BAY B AND COME BACK TO DOCK');
      expect(res.success).toBe(true);
      expect(res.task?.targetItem).toBe('green_box');
      expect(res.task?.destination).toBe('zone_b');
      expect(res.task?.returnToDock).toBe(true);
    });
  });

  describe('Dual Mission Parser (parseMission)', () => {
    it('seamlessly falls back to deterministic rules when no API key is provided', async () => {
      const res = await parseMission('Deliver red box to Zone A');
      expect(res.success).toBe(true);
      expect(res.source).toBe('fallback');
      expect(res.task?.targetItem).toBe('red_box');
      expect(res.task?.destination).toBe('zone_a');
    });

    it('gracefully handles out-of-domain prompts without throwing', async () => {
      const res = await parseMission('launch rocket');
      expect(res.success).toBe(false);
      expect(res.errorReason).toContain("Couldn't understand this mission");
    });
  });
});
