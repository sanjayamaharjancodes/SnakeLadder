import { BoardLayout, transitionAt } from './board';

export interface Player {
  id: number;
  name: string;
  isCpu: boolean;
  /** 0 = not on board yet; 1..100 = cell */
  pos: number;
}

export type Phase = 'idle' | 'rolling' | 'moving' | 'won';

export interface MoveStep {
  kind: 'hop' | 'snake' | 'ladder' | 'blocked' | 'capture';
  /** cells visited for hops (one entry per square stepped onto) */
  cells?: number[];
  /** snake/ladder transition target */
  to?: number;
  /** id of captured player (sent back to start) */
  victimId?: number;
}

/**
 * Pure rules resolution: given the mover's position, the dice and all players,
 * produce the ordered animation/effect steps and the final position.
 * Rules: exact landing on 100 wins; overshoot = no move; roll 6 = extra turn;
 * landing on an opponent sends them back to start.
 */
export function resolveMove(
  player: Player,
  dice: number,
  players: Player[],
  layout: BoardLayout,
): { steps: MoveStep[]; finalPos: number; extraTurn: boolean; won: boolean } {
  const steps: MoveStep[] = [];
  const start = player.pos;
  const target = start + dice;

  if (target > 100) {
    return { steps: [{ kind: 'blocked' }], finalPos: start, extraTurn: dice === 6, won: false };
  }

  const cells: number[] = [];
  for (let c = start + 1; c <= target; c++) cells.push(c);
  steps.push({ kind: 'hop', cells });

  let finalPos = target;
  const tr = transitionAt(target, layout);
  if (tr) {
    steps.push({ kind: tr.kind, to: tr.to });
    finalPos = tr.to;
  }

  const victim = players.find((p) => p.id !== player.id && p.pos === finalPos && finalPos !== 100);
  if (victim) steps.push({ kind: 'capture', victimId: victim.id });

  return { steps, finalPos, extraTurn: dice === 6, won: finalPos === 100 };
}

export function rollDice(): number {
  // dev/test hook: queue rolls via globalThis.__forceRolls = [6, 3, ...]
  const forced = (globalThis as { __forceRolls?: number[] }).__forceRolls;
  if (forced?.length) return forced.shift()!;
  return 1 + Math.floor(Math.random() * 6);
}
