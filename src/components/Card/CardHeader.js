import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import isNil from 'lodash/isNil';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';

const headerHeight = 32;

const CardHeader = ({
  centerText,
  centerIcon,
  leftText,
  leftIcon,
  rightText,
  rightIcon,
}) => {
  const colors = theme[useColorScheme()];
  return (
  <View style={[ styles.wrapper ]}>
    
    {/* left label */}
    <View
      style={[
        styles.labelWrapper,
        styles.labelWrapperSide,
        styles.labelWrapperLeft,
      ]}
    >
      {!isNil(leftText) && (
        <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>
          {leftText}
        </Text>
      )}
      {!isNil(leftIcon) && (
        leftIcon
      )}
    </View>

    {/* center label */}
    <View
      style={[
        styles.labelWrapper,
        styles.labelWrapperCenter
      ]}
    >
      {!isNil(centerText) && (
        <Text style={[styles.labelText, styles.chip, { color: colors.onSecondaryContainer, backgroundColor: colors.secondaryContainer }]}>
          {centerText}
        </Text>
      )}
      {!isNil(centerIcon) && (
        centerIcon
      )}
    </View>
    
    {/* right label */}
    <View
      style={[
        styles.labelWrapper,
        styles.labelWrapperSide,
        styles.labelWrapperRight,
      ]}
    >
      {!isNil(rightText) && (
        <Text style={[styles.labelText, { color: colors.onSurfaceVariant }]}>
          {rightText}
        </Text>
      )}
      {!isNil(rightIcon) && (
        rightIcon
      )}
    </View>
  </View>
  );
};

CardHeader.propTypes = {
  centerText: PropTypes.string,
  centerIcon: PropTypes.any,
  leftText: PropTypes.string,
  leftIcon: PropTypes.any,
  rightText: PropTypes.string,
  rightIcon: PropTypes.any,
};

const styles = StyleSheet.create({
  wrapper: {
    height: headerHeight,
    flex: 1,
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
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
    ...theme.type.label,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
  }
})

export default CardHeader;
