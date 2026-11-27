import React, { act } from 'react';
import { createRoot } from 'test-renderer';
import { computeLayoutMode, DEFAULT_PANE_GAP, RAIL_WIDTH } from 'src/hooks/useLayoutMode';
import useFoldState, { EMPTY_FOLD_STATE } from 'src/hooks/useFoldState';

let mockFoldNative = null;

jest.mock('expo', () => {
  const actual = jest.requireActual('expo');
  return {
    ...actual,
    requireOptionalNativeModule: name => (name === 'JukenFold' ? mockFoldNative : actual.requireOptionalNativeModule(name)),
  };
});

beforeEach(() => {
  mockFoldNative = null;
});

describe('computeLayoutMode', () => {
  test('classifies compact phone width without a navigation rail', () => {
    const mode = computeLayoutMode({ width: 390, height: 844 });
    expect(mode.sizeClass).toBe('compact');
    expect(mode.isCompact).toBe(true);
    expect(mode.isWide).toBe(false);
    expect(mode.showRail).toBe(false);
    expect(mode.railWidth).toBe(0);
    expect(mode.contentWidth).toBe(390);
    expect(mode.leftPaneWidth).toBeNull();
    expect(mode.rightPaneWidth).toBeNull();
    expect(mode.isTabletop).toBe(false);
  });

  test('computes medium rail and hinge-aligned dual panes for unfolded Z Fold portrait', () => {
    const foldState = {
      hasFold: true,
      state: 'flat',
      orientation: 'vertical',
      isSeparating: false,
      occlusionType: 'none',
      hingeBounds: { left: 335, top: 0, right: 339, bottom: 841, width: 4, height: 841 },
    };

    const mode = computeLayoutMode({ width: 674, height: 841, foldState });
    expect(mode.sizeClass).toBe('medium');
    expect(mode.isMedium).toBe(true);
    expect(mode.isWide).toBe(true);
    expect(mode.showRail).toBe(true);
    expect(mode.railWidth).toBe(RAIL_WIDTH);
    expect(mode.contentWidth).toBe(594);
    expect(mode.paneGap).toBe(DEFAULT_PANE_GAP);
    expect(mode.leftPaneWidth).toBe(247);
    expect(mode.rightPaneWidth).toBe(327);
    expect(mode.leftPaneWidth + mode.paneGap + mode.rightPaneWidth).toBe(mode.contentWidth);
  });

  test('computes expanded rail and wide hinge-aligned panes for Pixel Fold unfolded', () => {
    const foldState = {
      hasFold: true,
      state: 'flat',
      orientation: 'vertical',
      isSeparating: true,
      occlusionType: 'none',
      hingeBounds: { left: 418, top: 0, right: 422, bottom: 810, width: 4, height: 810 },
    };

    const mode = computeLayoutMode({ width: 840, height: 810, foldState });
    expect(mode.sizeClass).toBe('expanded');
    expect(mode.isExpanded).toBe(true);
    expect(mode.isLandscape).toBe(true);
    expect(mode.leftPaneWidth).toBe(330);
    expect(mode.rightPaneWidth).toBe(410);
    expect(mode.leftPaneWidth + mode.paneGap + mode.rightPaneWidth).toBe(mode.contentWidth);
  });

  test('falls back to balanced flex panes when hinge would make left pane too narrow', () => {
    const foldState = {
      hasFold: true,
      state: 'flat',
      orientation: 'vertical',
      isSeparating: true,
      occlusionType: 'none',
      hingeBounds: { left: 250, top: 0, right: 254, bottom: 800, width: 4, height: 800 },
    };

    const mode = computeLayoutMode({ width: 610, height: 800, foldState });
    expect(mode.isWide).toBe(true);
    expect(mode.leftPaneWidth).toBeNull();
    expect(mode.rightPaneWidth).toBeNull();
  });

  test('detects half-opened horizontal Tabletop posture with vertical split bounds', () => {
    const foldState = {
      hasFold: true,
      state: 'half_opened',
      orientation: 'horizontal',
      isSeparating: true,
      occlusionType: 'none',
      hingeBounds: { left: 0, top: 418, right: 674, bottom: 422, width: 674, height: 4 },
    };

    const mode = computeLayoutMode({ width: 674, height: 841, foldState });
    expect(mode.isTabletop).toBe(true);
    expect(mode.isBookMode).toBe(false);
    expect(mode.leftPaneWidth).toBeNull();
    expect(mode.tabletopGap).toBe(16);
    expect(mode.topPaneHeight).toBe(412);
    expect(mode.bottomPaneHeight).toBe(413);
  });
});

describe('useFoldState', () => {
  test('returns EMPTY_FOLD_STATE cleanly when native JukenFold module is absent', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    let latest;
    const Probe = () => {
      latest = useFoldState();
      return null;
    };
    const root = createRoot();
    try {
      await act(async () => {
        root.render(<Probe />);
      });
      expect(latest).toEqual(EMPTY_FOLD_STATE);
    } finally {
      await act(async () => {
        root.unmount();
      });
    }
  });

  test('reads initial state, subscribes to foldChange events, and removes subscription on unmount', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    let listener;
    const remove = jest.fn();
    const initial = {
      hasFold: true,
      state: 'flat',
      orientation: 'vertical',
      isSeparating: false,
      occlusionType: 'none',
      hingeBounds: { left: 300, top: 0, right: 304, bottom: 800, width: 4, height: 800 },
    };
    const updated = {
      ...initial,
      state: 'half_opened',
      orientation: 'horizontal',
      isSeparating: true,
    };

    mockFoldNative = {
      getFoldState: () => initial,
      addListener: (_event, cb) => {
        listener = cb;
        return { remove };
      },
    };

    let latest;
    const Probe = () => {
      latest = useFoldState();
      return null;
    };
    const root = createRoot();

    try {
      await act(async () => {
        root.render(<Probe />);
      });

      expect(latest).toEqual(initial);
      expect(typeof listener).toBe('function');

      await act(async () => {
        listener(updated);
      });
      expect(latest).toEqual(updated);
    } finally {
      await act(async () => {
        root.unmount();
      });
    }

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
