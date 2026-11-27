import {
  APPRENTICE,
  BURNED,
  ENLIGHTENED,
  GURU,
  MASTER,
} from 'src/common/constants';

export const DEFAULT_SRS_SYSTEM = {
  id: 1,
  data: {
    starting_stage_position: 1,
    unlocking_stage_position: 0,
    passing_stage_position: 5,
    burning_stage_position: 9,
    stages: Array.from({ length: 10 }, (_, position) => ({ position })),
  },
};

function readSystemPositions(srsSystem) {
  const data = srsSystem?.data || srsSystem || DEFAULT_SRS_SYSTEM.data;
  const passing = data.passing_stage_position ?? DEFAULT_SRS_SYSTEM.data.passing_stage_position;
  const burning = data.burning_stage_position ?? DEFAULT_SRS_SYSTEM.data.burning_stage_position;
  return { passing, burning };
}

/**
 * Maps a numeric WaniKani SRS stage to its semantic bucket using the item's
 * Spaced Repetition System metadata (falling back to the default 9-stage system).
 */
export function srsCategoryForStage(stage, srsSystem = DEFAULT_SRS_SYSTEM) {
  if (stage == null || stage <= 0) return null;
  const { passing, burning } = readSystemPositions(srsSystem);

  if (stage >= burning) return BURNED;
  if (stage < passing) return APPRENTICE;

  const upperSpan = burning - passing;
  if (upperSpan >= 3 && stage === burning - 1) return ENLIGHTENED;
  if (upperSpan >= 4 && stage === burning - 2) return MASTER;
  return GURU;
}

/**
 * Computes whether moving from `current` to `next` crosses into a different
 * SRS bucket and whether it moved upward or downward.
 */
export function getSrsTransition(current, next, srsSystem = DEFAULT_SRS_SYSTEM) {
  if (current == null || next == null || next <= 0 || current === next) {
    return null;
  }
  const currentCategory = srsCategoryForStage(current, srsSystem);
  const nextCategory = srsCategoryForStage(next, srsSystem);
  if (!nextCategory || currentCategory === nextCategory) return null;
  return {
    category: nextCategory,
    direction: next > current ? 'up' : 'down',
  };
}

/**
 * Mirrors WaniKani's official stage-up / penalty formula for offline Demo mode.
 */
export function estimateNextStage(current = 0, incorrectCount = 0, srsSystem = DEFAULT_SRS_SYSTEM) {
  const { passing, burning } = readSystemPositions(srsSystem);
  const baseStage = current ?? 0;
  if (!incorrectCount || incorrectCount <= 0) {
    return Math.min(burning, baseStage + 1);
  }
  const incorrectAdjust = Math.ceil(incorrectCount / 2);
  const penaltyFactor = baseStage >= passing ? 2 : 1;
  return Math.max(1, Math.max(1, baseStage) - incorrectAdjust * penaltyFactor);
}

export default (current, next, srsSystem = DEFAULT_SRS_SYSTEM) => {
  const transition = getSrsTransition(current, next, srsSystem);
  return transition && transition.direction === 'up' ? transition.category : null;
};
