import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import isNil from 'lodash/isNil';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';

const headerHeight = 36;

const CardHeader = ({
  centerText,
  centerIcon,
  chipIcon,
  leftText,
  leftIcon,
  rightText,
  rightIcon,
  chipBackground,
  chipColor,
}) => {
  const colors = theme[useColorScheme()];

  return (
    <View style={styles.wrapper}>
      {/* left label */}
      <View style={[styles.labelWrapper, styles.labelWrapperSide, styles.labelWrapperLeft]}>
        {!isNil(leftText) && (
          <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>{leftText}</Text>
        )}
        {!isNil(leftIcon) && leftIcon}
      </View>

      {/* center label */}
      <View style={[styles.labelWrapper, styles.labelWrapperCenter]}>
        {!isNil(centerText) && centerText !== '' && (
          <View
            style={[
              styles.chip,
              { backgroundColor: chipBackground ?? colors.secondaryContainer },
            ]}
          >
            {!!chipIcon && chipIcon}
            <Text style={[styles.labelText, { color: chipColor ?? colors.onSecondaryContainer }]}>
              {centerText}
            </Text>
          </View>
        )}
        {!isNil(centerIcon) && centerIcon}
      </View>

      {/* right label */}
      <View style={[styles.labelWrapper, styles.labelWrapperSide, styles.labelWrapperRight]}>
        {!isNil(rightText) && (
          <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>{rightText}</Text>
        )}
        {!isNil(rightIcon) && rightIcon}
      </View>
    </View>
  );
};

CardHeader.propTypes = {
  centerText: PropTypes.string,
  centerIcon: PropTypes.any,
  chipIcon: PropTypes.node,
  leftText: PropTypes.string,
  leftIcon: PropTypes.any,
  rightText: PropTypes.string,
  rightIcon: PropTypes.any,
  chipBackground: PropTypes.string,
  chipColor: PropTypes.string,
};

const styles = StyleSheet.create({
  wrapper: {
    height: headerHeight,
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    position: 'relative',
  },
  labelWrapper: {
    height: headerHeight,
    flex: 1,
    justifyContent: 'center',
  },
  labelWrapperCenter: {
    flexGrow: 1,
    alignItems: 'center',
  },
  labelWrapperSide: {
    flexShrink: 0,
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  labelWrapperLeft: {
    left: 0,
    alignItems: 'flex-start',
  },
  labelWrapperRight: {
    right: 0,
    alignItems: 'flex-end',
  },
  labelText: {
    ...theme.type.labelMedium,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
});

export default CardHeader;
