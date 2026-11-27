import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const TopBar = ({
  style,
  textStyle,
  center,
  centerText,
  centerOnPress,
  left,
  leftText,
  leftOnPress,
  leftLabel,
  right,
  rightText,
  rightOnPress,
  rightLabel,
}) => {
  const colors = theme[useColorScheme()];
  const ripple = { color: colors.ripple, borderless: true };

  return (
    <View style={[styles.wrapper, style]}>
      {/* left */}
      <Pressable
        onPress={leftOnPress}
        accessibilityRole={leftOnPress ? 'button' : undefined}
        accessibilityLabel={leftLabel}
        disabled={!leftOnPress}
        android_ripple={leftOnPress ? ripple : undefined}
        style={({ pressed }) => [
          styles.cell,
          styles.side,
          styles.left,
          leftOnPress && pressed && styles.pressed,
        ]}
      >
        {!!left && left}
        {!!leftText && (
          <Text style={[styles.text, { color: colors.onSurface }, textStyle]}>{leftText}</Text>
        )}
      </Pressable>

      {/* center */}
      <Pressable
        onPress={centerOnPress}
        accessibilityRole={centerOnPress ? 'button' : undefined}
        disabled={!centerOnPress}
        style={[styles.cell, styles.center]}
      >
        {!!center && center}
        {!!centerText && (
          <Text
            accessibilityRole="header"
            style={[styles.text, { color: colors.onSurface }, textStyle]}
          >
            {centerText}
          </Text>
        )}
      </Pressable>

      {/* right */}
      <Pressable
        onPress={rightOnPress}
        accessibilityRole={rightOnPress ? 'button' : undefined}
        accessibilityLabel={rightLabel}
        disabled={!rightOnPress}
        android_ripple={rightOnPress ? ripple : undefined}
        style={({ pressed }) => [
          styles.cell,
          styles.side,
          styles.right,
          rightOnPress && pressed && styles.pressed,
        ]}
      >
        {!!right && right}
        {!!rightText && (
          <Text style={[styles.text, { color: colors.onSurface }, textStyle]}>{rightText}</Text>
        )}
      </Pressable>
    </View>
  );
};

TopBar.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  center: PropTypes.any,
  centerText: PropTypes.string,
  centerOnPress: PropTypes.func,
  left: PropTypes.any,
  leftLabel: PropTypes.string,
  leftText: PropTypes.string,
  leftOnPress: PropTypes.func,
  right: PropTypes.any,
  rightLabel: PropTypes.string,
  rightText: PropTypes.string,
  rightOnPress: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 56,
  },
  side: {
    position: 'absolute',
    zIndex: 1,
    minWidth: 48,
    minHeight: 48,
    borderRadius: theme.shape.full,
    paddingHorizontal: 4,
  },
  left: { left: 0 },
  right: { right: 0 },
  pressed: { opacity: 0.72 },
  text: {
    ...theme.type.titleLarge,
    textAlign: 'center',
  },
});

export default TopBar;
