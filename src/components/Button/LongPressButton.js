import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import device from 'src/utils/device';
import theme from 'src/common/theme';
import run from 'src/utils/run';
import * as sharedStyles from 'src/components/Button/sharedStyles';
import useColorScheme from 'src/hooks/useColorScheme';

const longPressDefaultDuration = 200;
const textFlashDuration = 100;
const textFlashDisplayDuration = 1000;

const LongPressButton = ({
  text,
  flashText = 'Press and Hold',
  duration = longPressDefaultDuration,
  hapticFeedback = true,
  multiuse = false,
  onComplete,
}) => {
  const touchPercent = useRef(new Animated.Value(0)).current;
  const textFlash = useRef(new Animated.Value(0)).current;
  const flashTimer = useRef(null);
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme];

  const [done, setDone] = useState(false);
  const [pressing, setPressing] = useState(false);

  useEffect(() => {
    touchPercent.addListener(e => {
      if (e.value >= 100) {
        if (!multiuse) {
          setDone(true);
          touchPercent.setValue(0);
          textFlash.setValue(0);
        }
        if (device('mobile') && hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        run(onComplete);
      }
    });
    return () => {
      clearTimeout(flashTimer.current);
      touchPercent.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    Animated.timing(touchPercent, {
      duration,
      toValue: pressing ? 100 : 0,
      useNativeDriver: false,
    }).start();
  }, [pressing]);

  const barWidth = touchPercent.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const textOpacity = textFlash.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const textFlashOpacity = textFlash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.primaryContainer },
        pressing && styles.wrapperPressed,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint={flashText}
        android_ripple={{ color: colors.ripple }}
        onPressIn={() => { if (!done) setPressing(true); }}
        onPressOut={() => { if (!done) setPressing(false); }}
        onPress={() => {
          if (done) return;
          clearTimeout(flashTimer.current);
          Animated.timing(textFlash, {
            duration: textFlashDuration,
            toValue: 1,
            useNativeDriver: false,
          }).start();

          flashTimer.current = setTimeout(() => {
            Animated.timing(textFlash, {
              duration: textFlashDuration,
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }, textFlashDisplayDuration);
        }}
        style={styles.touchTarget}
      >
        <View style={styles.fillLayer}>
          <Animated.View style={[styles.bar, { backgroundColor: colors.primary, width: barWidth }]} />
          <View style={styles.container}>
            <Animated.View style={[styles.textWrapper, { opacity: textOpacity }]}>
              <MaterialIcons name="visibility" size={18} color={colors.onPrimaryContainer} />
              <Text style={[styles.text, { color: colors.onPrimaryContainer }]}>{text}</Text>
            </Animated.View>
            <Animated.View style={[styles.textWrapper, { opacity: textFlashOpacity }]}>
              <Text style={[styles.text, { color: colors.onPrimaryContainer }]}>{flashText}</Text>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

LongPressButton.propTypes = {
  text: PropTypes.string,
  flashText: PropTypes.string,
  duration: PropTypes.number,
  hapticFeedback: PropTypes.bool,
  multiuse: PropTypes.bool,
  onComplete: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: sharedStyles.wrapper,
  wrapperPressed: {
    borderRadius: theme.shape.large,
    transform: [{ scale: 0.985 }],
  },
  touchTarget: {
    height: '100%',
    width: '100%',
  },
  fillLayer: {
    height: '100%',
  },
  container: sharedStyles.container,
  text: sharedStyles.text,
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    opacity: 0.24,
    zIndex: 0,
  },
  textWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default LongPressButton;
