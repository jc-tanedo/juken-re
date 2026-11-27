import checkSrsStage, {
  DEFAULT_SRS_SYSTEM,
  estimateNextStage,
  getSrsTransition,
  srsCategoryForStage,
} from 'src/utils/checkSrsStage';
import {
  APPRENTICE,
  BURNED,
  ENLIGHTENED,
  GURU,
  MASTER,
} from 'src/common/constants';

describe('dynamic SRS stage helpers', () => {
  test('maps default WaniKani SRS stages and preserves upward checkSrsStage transitions', () => {
    expect(checkSrsStage(0, 1)).toBe(APPRENTICE);
    expect(checkSrsStage(4, 5)).toBe(GURU);
    expect(checkSrsStage(6, 7)).toBe(MASTER);
    expect(checkSrsStage(7, 8)).toBe(ENLIGHTENED);
    expect(checkSrsStage(8, 9)).toBe(BURNED);
    expect(checkSrsStage(1, 2)).toBeNull();
    expect(checkSrsStage(5, 3)).toBeNull();
  });

  test('detects downward stage drops and supports custom SRS stage positions', () => {
    expect(getSrsTransition(5, 3, DEFAULT_SRS_SYSTEM)).toEqual({
      category: APPRENTICE,
      direction: 'down',
    });

    const compactSystem = {
      id: 99,
      data: { passing_stage_position: 3, burning_stage_position: 5 },
    };
    expect(srsCategoryForStage(2, compactSystem)).toBe(APPRENTICE);
    expect(srsCategoryForStage(3, compactSystem)).toBe(GURU);
    expect(srsCategoryForStage(5, compactSystem)).toBe(BURNED);
    expect(getSrsTransition(2, 3, compactSystem)).toEqual({
      category: GURU,
      direction: 'up',
    });
  });

  test('estimates next stage on pass or penalty misses in Demo mode', () => {
    expect(estimateNextStage(0, 0)).toBe(1);
    expect(estimateNextStage(4, 0)).toBe(5);
    expect(estimateNextStage(8, 0)).toBe(9);
    expect(estimateNextStage(6, 1)).toBe(4);
    expect(estimateNextStage(2, 2)).toBe(1);
  });
});
