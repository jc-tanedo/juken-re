import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const variants = {
  filled: ['primary', 'onPrimary'],
  tonal: ['secondaryContainer', 'onSecondaryContainer'],
  text: ['surface', 'primary'],
};

const Button = ({ iconLeft, iconRight, text, onPress, style, textStyle, disabled, variant = 'tonal' }) => {
  const colors = theme[useColorScheme()];
  const [background, foreground] = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variant === 'text' ? 'transparent' : colors[background] },
        style,
        pressed && styles.pressed,
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
    borderRadius: theme.radius.touchable,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    ...theme.type.label,
    textAlign: 'center',
    flexShrink: 1,
  },
  icon: { flexShrink: 0 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});

export default Button;
