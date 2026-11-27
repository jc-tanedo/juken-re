import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import { computeLayoutMode, DEFAULT_PANE_GAP } from 'src/hooks/useLayoutMode';

const TOP_CHROME_OFFSET = 64;
const BOTTOM_CHROME_OFFSET = 16;

/**
 * Arranges primary and secondary panes into side-by-side or tabletop halves,
 * aligning the gutter to any detected physical foldable hinge when wide enough.
 */
const AdaptivePaneLayout = ({
  layout,
  primary,
  secondary,
  primaryStyle,
  secondaryStyle,
  style,
  allowTabletop = true,
  reverseWide = false,
  primaryFlex = 1.05,
  secondaryFlex = 0.95,
}) => {
  const safeLayout = layout || computeLayoutMode();

  if (!secondary) {
    return <View style={[styles.single, style, primaryStyle]}>{primary}</View>;
  }

  if (allowTabletop && safeLayout.isTabletop) {
    const hasCustomTop = safeLayout.topPaneHeight != null && safeLayout.bottomPaneHeight != null;
    const topFlex = hasCustomTop
      ? Math.max(140, safeLayout.topPaneHeight - TOP_CHROME_OFFSET)
      : 1;
    const bottomFlex = hasCustomTop
      ? Math.max(140, safeLayout.bottomPaneHeight - BOTTOM_CHROME_OFFSET)
      : 1;
    const gap = safeLayout.tabletopGap ?? DEFAULT_PANE_GAP;

    return (
      <View style={[styles.column, style]}>
        <View style={[styles.pane, { flex: topFlex }, primaryStyle]}>{primary}</View>
        <View style={{ height: gap }} />
        <View style={[styles.pane, { flex: bottomFlex }, secondaryStyle]}>{secondary}</View>
      </View>
    );
  }

  if (safeLayout.isWide) {
    const hasCustomSides = safeLayout.leftPaneWidth != null && safeLayout.rightPaneWidth != null;
    const primaryPaneFlex = hasCustomSides
      ? (reverseWide ? safeLayout.rightPaneWidth : safeLayout.leftPaneWidth)
      : primaryFlex;
    const secondaryPaneFlex = hasCustomSides
      ? (reverseWide ? safeLayout.leftPaneWidth : safeLayout.rightPaneWidth)
      : secondaryFlex;
    const gap = safeLayout.paneGap ?? DEFAULT_PANE_GAP;

    return (
      <View style={[reverseWide ? styles.rowReverse : styles.row, style]}>
        <View style={[styles.pane, { flex: primaryPaneFlex }, primaryStyle]}>{primary}</View>
        <View style={{ width: gap }} />
        <View style={[styles.pane, { flex: secondaryPaneFlex }, secondaryStyle]}>{secondary}</View>
      </View>
    );
  }

  return (
    <View style={[styles.column, style]}>
      <View style={[styles.pane, primaryStyle]}>{primary}</View>
      {secondary && <View style={secondaryStyle}>{secondary}</View>}
    </View>
  );
};

AdaptivePaneLayout.propTypes = {
  layout: PropTypes.object,
  primary: PropTypes.node,
  secondary: PropTypes.node,
  primaryStyle: PropTypes.any,
  secondaryStyle: PropTypes.any,
  style: PropTypes.any,
  allowTabletop: PropTypes.bool,
  reverseWide: PropTypes.bool,
  primaryFlex: PropTypes.number,
  secondaryFlex: PropTypes.number,
};

const styles = StyleSheet.create({
  single: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  row: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    minWidth: 0,
    minHeight: 0,
  },
  rowReverse: {
    flex: 1,
    width: '100%',
    flexDirection: 'row-reverse',
    minWidth: 0,
    minHeight: 0,
  },
  column: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
  pane: {
    minWidth: 0,
    minHeight: 0,
  },
});

export default AdaptivePaneLayout;
