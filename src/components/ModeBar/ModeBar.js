import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import useSafeInsets from 'src/hooks/useSafeInsets';

const DEFAULT_ITEMS = [
  { id: 'reviews', label: 'Reviews', icon: 'style' },
  { id: 'lessons', label: 'Lessons', icon: 'school' },
  { id: 'extraStudy', label: 'Extra Study', icon: 'fitness-center' },
];

/**
 * Single Material 3 Navigation Bar destination with an animated 64x32 tonal indicator pill.
 */
const ModeBarItem = ({ item, active, colors, onPress }) => {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const prevActive = useRef(active);

  useEffect(() => {
    // Only animate state transitions so initial mount settles immediately without extra timers.
    if (prevActive.current === active) return undefined;
    prevActive.current = active;
    const animation = Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: active ? 200 : 140,
      easing: active ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, progress]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      onPress={onPress}
      style={styles.tab}
    >
      {({ pressed }) => (
        <>
          <View style={styles.indicatorSlot}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicatorFill,
                {
                  backgroundColor: colors.primaryContainer,
                  opacity: progress,
                  transform: [
                    {
                      scaleX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            {pressed && (
              <View
                pointerEvents="none"
                style={[styles.stateLayer, { backgroundColor: colors.statePressed }]}
              />
            )}
            <MaterialIcons
              name={item.icon}
              size={24}
              color={active ? colors.onPrimaryContainer : colors.onSurfaceVariant}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[
              theme.type.labelMedium,
              active ? styles.labelActive : styles.labelInactive,
              { color: active ? colors.onSurface : colors.onSurfaceVariant },
            ]}
          >
            {item.label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

ModeBarItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
  active: PropTypes.bool.isRequired,
  colors: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
};

/**
 * Material 3 bottom navigation bar switching between Reviews, Lessons, and Extra Study.
 */
const ModeBar = ({ value, onChange, items = DEFAULT_ITEMS }) => {
  const colors = theme[useColorScheme()];
  const insets = useSafeInsets();

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.surfaceContainer,
          paddingBottom: Math.max(16, insets.bottom + 12),
        },
      ]}
    >
      <View style={styles.inner}>
        {items.map(item => (
          <ModeBarItem
            key={item.id}
            item={item}
            active={value === item.id}
            colors={colors}
            onPress={() => onChange?.(item.id)}
          />
        ))}
      </View>
    </View>
  );
};

ModeBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  items: PropTypes.array,
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    paddingTop: 12,
  },
  inner: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicatorSlot: {
    width: 64,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  labelActive: {
    fontWeight: '700',
  },
  labelInactive: {
    fontWeight: '500',
  },
});

export default ModeBar;
