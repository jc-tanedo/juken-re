import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const zeroInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const DEFAULT_ITEMS = [
  { id: 'reviews', label: 'Reviews', icon: 'style' },
  { id: 'extraStudy', label: 'Extra Study', icon: 'fitness-center' },
];

const ModeBar = ({ value, onChange, items = DEFAULT_ITEMS }) => {
  const colors = theme[useColorScheme()];
  const insets = useContext(SafeAreaInsetsContext) || zeroInsets;

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderTopColor: colors.outlineVariant,
          paddingBottom: Math.max(8, insets.bottom),
        },
      ]}
    >
      <View style={styles.inner}>
        {items.map(item => {
          const active = value === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => onChange?.(item.id)}
              android_ripple={{ color: colors.ripple, borderless: true }}
              style={styles.tab}
            >
              <View
                style={[
                  styles.indicator,
                  active && { backgroundColor: colors.secondaryContainer },
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={active ? colors.onSecondaryContainer : colors.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  theme.type.labelSmall,
                  { color: active ? colors.onSurface : colors.onSurfaceVariant },
                  active && styles.labelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
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
    borderTopWidth: 1,
    paddingTop: 8,
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
    paddingVertical: 2,
  },
  indicator: {
    minWidth: 64,
    height: 32,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  labelActive: {
    fontWeight: '800',
  },
});

export default ModeBar;
