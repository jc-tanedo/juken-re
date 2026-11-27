import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const variants = {
  filled: ['primary', 'onPrimary'],
  tonal: ['secondaryContainer', 'onSecondaryContainer'],
  outlined: ['surface', 'primary'],
  elevated: ['surfaceContainerLow', 'primary'],
  text: ['surface', 'primary'],
};

const Button = ({ iconLeft, iconRight, text, onPress, style, textStyle, disabled, variant = 'tonal' }) => {
  const colors = theme[useColorScheme()];
  const [background, foreground] = variants[variant] || variants.tonal;
  const isTransparent = variant === 'text' || variant === 'outlined';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: variant === 'filled' ? 'rgba(255, 255, 255, 0.22)' : colors.ripple }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isTransparent ? 'transparent' : colors[background] },
        variant === 'outlined' && { borderWidth: 1, borderColor: colors.outline },
        variant === 'elevated' && theme.elevation.level1,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {!!iconLeft && <View style={styles.icon}>{iconLeft}</View>}
      <Text style={[styles.text, { color: colors[foreground] }, textStyle]}>{text}</Text>
      {!!iconRight && <View style={styles.icon}>{iconRight}</View>}
    </Pressable>
  );
};

Button.propTypes = {
  style: PropTypes.any,
  text: PropTypes.string,
  textStyle: PropTypes.any,
  onPress: PropTypes.func,
  iconLeft: PropTypes.node,
  iconRight: PropTypes.node,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(Object.keys(variants)),
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: theme.height.touchable,
    borderRadius: theme.shape.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  text: {
    ...theme.type.labelLarge,
    textAlign: 'center',
    flexShrink: 1,
  },
  icon: { flexShrink: 0 },
  pressed: {
    opacity: 0.88,
    borderRadius: theme.shape.large,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.38 },
});

export default Button;
