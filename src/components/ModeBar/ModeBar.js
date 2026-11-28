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
 * Single Material 3 Navigation Bar / Navigation Rail destination with an animated tonal pill.
 */
const ModeBarItem = ({ item, active, colors, isRail = false, onPress }) => {
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
      style={[styles.tab, isRail && styles.tabRail]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.indicatorSlot, isRail && styles.indicatorSlotRail]}>
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
  isRail: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

/**
 * Material 3 adaptive navigation container switching between bottom bar and leading rail.
 */
const ModeBar = ({ value, onChange, items = DEFAULT_ITEMS, variant = 'bar' }) => {
  const colors = theme[useColorScheme()];
  const insets = useSafeInsets();
  const isRail = variant === 'rail';

  return (
    <View
      style={[
        isRail ? styles.outerRail : styles.outer,
        {
          backgroundColor: colors.surfaceContainer,
          ...(isRail
            ? {
              width: 80 + insets.left,
              paddingLeft: insets.left,
              paddingTop: Math.max(20, insets.top + 12),
              paddingBottom: Math.max(16, insets.bottom + 12),
            }
            : {
              paddingBottom: Math.max(16, insets.bottom + 12),
            }),
        },
      ]}
    >
      <View style={isRail ? styles.innerRail : styles.inner}>
        {items.map(item => (
          <ModeBarItem
            key={item.id}
            item={item}
            active={value === item.id}
            colors={colors}
            isRail={isRail}
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
  variant: PropTypes.oneOf(['bar', 'rail']),
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    paddingTop: 12,
  },
  outerRail: {
    height: '100%',
    flexShrink: 0,
  },
  inner: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  innerRail: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabRail: {
    flex: 0,
    width: '100%',
    paddingVertical: 6,
  },
  indicatorSlot: {
    width: 64,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSlotRail: {
    width: 56,
  },
  indicatorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  stateLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
