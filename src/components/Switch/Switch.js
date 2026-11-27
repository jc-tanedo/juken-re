import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const Switch = ({
  value = false,
  onValueChange,
  disabled = false,
  decorative = false,
  accessibilityLabel,
}) => {
  const colors = theme[useColorScheme()];
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 22],
  });

  const thumbSize = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 24],
  });

  const track = (
    <View
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.primary : colors.surfaceContainerHighest,
          borderColor: value ? colors.primary : colors.outline,
        },
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            backgroundColor: value ? colors.onPrimary : colors.outline,
            transform: [{ translateX }],
          },
        ]}
      >
        <MaterialIcons
          name={value ? 'check' : 'close'}
          size={value ? 15 : 12}
          color={value ? colors.primary : colors.surfaceContainerHighest}
        />
      </Animated.View>
    </View>
  );

  if (decorative) {
    return (
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {track}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      hitSlop={8}
      style={styles.touchTarget}
    >
      {track}
    </Pressable>
  );
};

Switch.propTypes = {
  value: PropTypes.bool,
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool,
  decorative: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
};

const styles = StyleSheet.create({
  touchTarget: {
    minWidth: 52,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: theme.shape.full,
    borderWidth: 2,
    justifyContent: 'center',
  },
  thumb: {
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.38,
  },
});

export default Switch;
