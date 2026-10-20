import { CargoItemType, DestinationType, MissionTask, ParseResult } from '../types.ts';

/**
 * Deterministic rule-based regex keyword extractor for warehouse missions.
 * 100% offline, synchronous, zero-dependency.
 */
export function parseFallback(prompt: string): ParseResult {
  const text = prompt.toLowerCase().trim();

  if (!text) {
    return {
      success: false,
      rawPrompt: prompt,
      source: 'fallback',
      errorReason: "Couldn't understand this mission. Try specifying an item and a warehouse destination."
    };
  }

  // 1. Extract target cargo item
  let targetItem: CargoItemType | null = null;
  if (/\b(red\s*(box|crate|item)?|red_box)\b/.test(text)) {
    targetItem = 'red_box';
  } else if (/\b(blue\s*(box|crate|item)?|blue_box)\b/.test(text)) {
    targetItem = 'blue_box';
  } else if (/\b(green\s*(box|crate|item)?|green_box)\b/.test(text)) {
    targetItem = 'green_box';
  }

  // 2. Extract destination
  let destination: DestinationType | null = null;
  if (/\b(zone\s*a|bay\s*a|area\s*a)\b/.test(text)) {
    destination = 'zone_a';
  } else if (/\b(zone\s*b|bay\s*b|area\s*b)\b/.test(text)) {
    destination = 'zone_b';
  } else if (/\b(charging\s*station|dock|charger|charging\s*dock)\b/.test(text)) {
    destination = 'charging_station';
  }

  // Out-of-domain rejection: If neither item nor destination could be identified
  if (!targetItem || !destination) {
    return {
      success: false,
      rawPrompt: prompt,
      source: 'fallback',
      errorReason: "Couldn't understand this mission. Try specifying an item and a warehouse destination."
    };
  }

  // 3. Extract action (default: deliver)
  let action: 'deliver' | 'move' = 'deliver';
  if (/\b(move|transport|relocate|carry|take)\b/.test(text) && !/\b(deliver|drop)\b/.test(text)) {
    action = 'move';
  }

  // 4. Extract return to dock/charging station requirement
  const returnToDock = /\b(return|dock|station|recharge|come\s*back)\b/.test(text) && destination !== 'charging_station';

  const task: MissionTask = {
    action,
    targetItem,
    destination,
    returnToDock
  };

  return {
    success: true,
    task,
    rawPrompt: prompt,
    source: 'fallback'
  };
}
