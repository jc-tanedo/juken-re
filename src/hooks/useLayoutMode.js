import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import useFoldState, { EMPTY_FOLD_STATE } from 'src/hooks/useFoldState';

export const RAIL_WIDTH = 80;
export const MIN_PANE_WIDTH = 240;
export const DEFAULT_PANE_GAP = 20;

/**
 * Computes Material 3 window size classes, adaptive navigation mode, and
 * hinge-aware dual-pane / tabletop split metrics for any screen geometry.
 */
export function computeLayoutMode({
  width = 0,
  height = 0,
  foldState = EMPTY_FOLD_STATE,
  railWidth = RAIL_WIDTH,
} = {}) {
  const safeFold = foldState || EMPTY_FOLD_STATE;
  const sizeClass = width >= 840 ? 'expanded' : width >= 600 ? 'medium' : 'compact';
  const isCompact = sizeClass === 'compact';
  const isMedium = sizeClass === 'medium';
  const isExpanded = sizeClass === 'expanded';
  const isWide = width >= 600;
  const isLandscape = width > height;

  const isTabletop = Boolean(
    safeFold.hasFold && safeFold.state === 'half_opened' && safeFold.orientation === 'horizontal',
  );
  const isBookMode = Boolean(
    safeFold.hasFold && safeFold.state === 'half_opened' && safeFold.orientation === 'vertical',
  );
  const hasVerticalFold = Boolean(
    safeFold.hasFold && safeFold.orientation === 'vertical' && safeFold.hingeBounds,
  );
  const hasHorizontalFold = Boolean(
    safeFold.hasFold && safeFold.orientation === 'horizontal' && safeFold.hingeBounds,
  );

  const showRail = isWide;
  const effectiveRailWidth = showRail ? railWidth : 0;
  const contentWidth = Math.max(0, width - effectiveRailWidth);

  let leftPaneWidth = null;
  let rightPaneWidth = null;
  let paneGap = DEFAULT_PANE_GAP;

  if (isWide && !isTabletop && hasVerticalFold) {
    const hingeLeft = Math.max(0, safeFold.hingeBounds.left - effectiveRailWidth);
    const hingeRight = Math.min(contentWidth, safeFold.hingeBounds.right - effectiveRailWidth);
    const rawHingeW = Math.max(0, hingeRight - hingeLeft);
    const candidateGap = Math.max(DEFAULT_PANE_GAP, Math.round(rawHingeW));
    const extra = Math.max(0, candidateGap - rawHingeW) / 2;
    const candidateLeft = Math.round(hingeLeft - extra);
    const candidateRight = Math.round(contentWidth - candidateLeft - candidateGap);

    if (candidateLeft >= MIN_PANE_WIDTH && candidateRight >= MIN_PANE_WIDTH) {
      leftPaneWidth = candidateLeft;
      rightPaneWidth = candidateRight;
      paneGap = candidateGap;
    }
  }

  let topPaneHeight = null;
  let bottomPaneHeight = null;
  let tabletopGap = DEFAULT_PANE_GAP;

  if (isTabletop && hasHorizontalFold) {
    const rawHingeH = Math.max(
      0,
      safeFold.hingeBounds.height ?? (safeFold.hingeBounds.bottom - safeFold.hingeBounds.top),
    );
    tabletopGap = Math.max(16, Math.round(rawHingeH));
    const extraH = Math.max(0, tabletopGap - rawHingeH) / 2;
    topPaneHeight = Math.max(180, Math.round(safeFold.hingeBounds.top - extraH));
    bottomPaneHeight = Math.max(160, Math.round(height - topPaneHeight - tabletopGap));
  }

  return {
    width,
    height,
    contentWidth,
    sizeClass,
    isCompact,
    isMedium,
    isExpanded,
    isWide,
    isLandscape,
    showRail,
    railWidth: effectiveRailWidth,
    fold: safeFold,
    isTabletop,
    isBookMode,
    hasVerticalFold,
    hasHorizontalFold,
    leftPaneWidth,
    rightPaneWidth,
    paneGap,
    topPaneHeight,
    bottomPaneHeight,
    tabletopGap,
  };
}

/**
 * Live hook combining React Native window dimensions with native foldable posture.
 */
export default function useLayoutMode() {
  const { width, height } = useWindowDimensions();
  const foldState = useFoldState();

  return useMemo(
    () => computeLayoutMode({ width, height, foldState }),
    [width, height, foldState],
  );
}
