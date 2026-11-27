import React from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import M3Switch from 'src/components/Switch/Switch';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';

const toneMap = {
  primary: ['primaryContainer', 'onPrimaryContainer'],
  secondary: ['secondaryContainer', 'onSecondaryContainer'],
  tertiary: ['tertiaryContainer', 'onTertiaryContainer'],
  success: ['successContainer', 'onSuccessContainer'],
  warning: ['warningContainer', 'onWarningContainer'],
  error: ['errorContainer', 'onErrorContainer'],
  neutral: ['surfaceContainerHigh', 'onSurfaceVariant'],
};

const positionRadii = {
  single: {
    borderRadius: theme.shape.largeIncreased,
  },
  first: {
    borderTopLeftRadius: theme.shape.largeIncreased,
    borderTopRightRadius: theme.shape.largeIncreased,
    borderBottomLeftRadius: theme.shape.extraSmall,
    borderBottomRightRadius: theme.shape.extraSmall,
  },
  middle: {
    borderRadius: theme.shape.extraSmall,
  },
  last: {
    borderTopLeftRadius: theme.shape.extraSmall,
    borderTopRightRadius: theme.shape.extraSmall,
    borderBottomLeftRadius: theme.shape.largeIncreased,
    borderBottomRightRadius: theme.shape.largeIncreased,
  },
};

const ListItemComponent = ({
  title,
  subtitle,
  leftIcon,
  iconTone = 'neutral',
  rightIcon,
  onPress,
  switch: toggle,
  selected,
  badge,
  chevron = false,
  external = false,
  indented = false,
  loading = false,
  destructive = false,
  position = 'single',
}) => {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = theme[scheme];
  const rowBackground = dark ? colors.surfaceContainerLow : colors.surfaceContainerLowest;
  const rowAction = onPress ?? (toggle && (() => toggle.onValueChange(!toggle.value)));
  const shapeStyle = positionRadii[position] || positionRadii.single;
  const [iconBgKey] = toneMap[iconTone] || toneMap.neutral;
  const badgeToneKeys = badge ? (toneMap[badge.tone || 'secondary'] || toneMap.secondary) : null;

  const isSelected = selected === true;
  const baseBg = isSelected ? colors.secondaryContainer : rowBackground;
  const pressedBg = isSelected ? colors.secondaryContainer : colors.surfaceContainer;

  return (
    <Pressable
      onPress={rowAction}
      accessibilityRole={toggle ? 'switch' : selected != null ? 'radio' : rowAction ? 'button' : undefined}
      accessibilityState={
        toggle
          ? { checked: !!toggle.value }
          : selected != null
            ? { selected: isSelected }
            : undefined
      }
      aria-checked={toggle ? !!toggle.value : undefined}
      android_ripple={rowAction ? { color: colors.ripple } : undefined}
      style={({ pressed }) => [
        styles.row,
        shapeStyle,
        indented && styles.indented,
        { backgroundColor: pressed && rowAction ? pressedBg : baseBg },
      ]}
    >
      {!!leftIcon && (
        <View style={[styles.iconBadge, { backgroundColor: colors[iconBgKey] }]}>
          {leftIcon}
        </View>
      )}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: destructive
                ? colors.error
                : isSelected
                  ? colors.onSecondaryContainer
                  : colors.onSurface,
            },
          ]}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: isSelected ? colors.onSecondaryContainer : colors.onSurfaceVariant },
              isSelected && styles.selectedSubtitle,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {loading && <ActivityIndicator size="small" color={colors.primary} />}

      {!!badge && (
        <View style={[styles.badge, { backgroundColor: colors[badgeToneKeys[0]] }]}>
          <Text style={[styles.badgeText, { color: colors[badgeToneKeys[1]] }]}>{badge.label}</Text>
        </View>
      )}

      {!!rightIcon && <View style={styles.trailingIcon}>{rightIcon}</View>}

      {selected != null && !rightIcon && (
        <MaterialIcons
          name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
          size={22}
          color={isSelected ? colors.primary : colors.outline}
        />
      )}

      {toggle && <M3Switch value={!!toggle.value} decorative />}

      {chevron && (
        <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
      )}

      {external && (
        <MaterialIcons name="open-in-new" size={18} color={colors.onSurfaceVariant} />
      )}
    </Pressable>
  );
};

ListItemComponent.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  leftIcon: PropTypes.node,
  iconTone: PropTypes.oneOf(Object.keys(toneMap)),
  rightIcon: PropTypes.node,
  onPress: PropTypes.func,
  switch: PropTypes.object,
  selected: PropTypes.bool,
  badge: PropTypes.shape({
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(Object.keys(toneMap)),
  }),
  chevron: PropTypes.bool,
  external: PropTypes.bool,
  indented: PropTypes.bool,
  loading: PropTypes.bool,
  destructive: PropTypes.bool,
  position: PropTypes.oneOf(['single', 'first', 'middle', 'last']),
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 14,
    overflow: 'hidden',
  },
  indented: {
    paddingLeft: 28,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...theme.type.bodyLarge,
    fontWeight: '500',
  },
  subtitle: {
    ...theme.type.bodySmall,
  },
  selectedSubtitle: {
    opacity: 0.86,
  },
  badge: {
    borderRadius: theme.shape.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: {
    ...theme.type.labelSmall,
  },
  trailingIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ListItemComponent;
