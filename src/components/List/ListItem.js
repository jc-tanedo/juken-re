import React from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { isWeb } from 'src/utils/device';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';

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
  rightIcon,
  onPress,
  switch: toggle,
  picker,
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

  return (
    <Pressable
      onPress={rowAction}
      accessibilityRole={toggle ? 'switch' : rowAction ? 'button' : undefined}
      accessibilityState={toggle ? { checked: !!toggle.value } : undefined}
      aria-checked={toggle ? !!toggle.value : undefined}
      android_ripple={rowAction ? { color: colors.ripple } : undefined}
      style={({ pressed }) => [
        styles.row,
        shapeStyle,
        { backgroundColor: pressed && rowAction ? colors.surfaceContainer : rowBackground },
      ]}
    >
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text style={[styles.title, { color: destructive ? colors.error : colors.onSurface }]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {loading && <ActivityIndicator size="small" color={colors.primary} />}
      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      {toggle && (isWeb()
        ? (
          <Text
            style={[
              styles.toggleLabel,
              {
                color: toggle.value ? colors.onPrimary : colors.onSurfaceVariant,
                backgroundColor: toggle.value ? colors.primary : colors.surfaceContainerHighest,
              },
            ]}
          >
            {toggle.value ? 'On' : 'Off'}
          </Text>
        )
        : (
          <Switch
            trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
            thumbColor={toggle.value ? colors.onPrimary : colors.outline}
            {...toggle}
          />
        ))}
      {picker && (
        <RNPickerSelect
          darkTheme={dark}
          pickerProps={{ dropdownIconColor: colors.onSurfaceVariant, ...picker.pickerProps }}
          style={{
            viewContainer: styles.pickerContainer,
            inputAndroid: [styles.pickerText, { color: colors.primary }],
            inputIOS: [styles.pickerText, { color: colors.primary }],
            inputWeb: {
              ...styles.pickerInput,
              color: colors.onSurface,
              backgroundColor: colors.surfaceContainer,
            },
          }}
          {...picker}
        />
      )}
    </Pressable>
  );
};

ListItemComponent.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  onPress: PropTypes.func,
  switch: PropTypes.object,
  picker: PropTypes.object,
  loading: PropTypes.bool,
  destructive: PropTypes.bool,
  position: PropTypes.oneOf(['single', 'first', 'middle', 'last']),
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 14,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  icon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.type.bodyLarge,
  },
  subtitle: {
    ...theme.type.bodySmall,
  },
  toggleLabel: {
    ...theme.type.labelMedium,
    borderRadius: theme.shape.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  pickerContainer: {
    minWidth: 148,
    maxWidth: '52%',
    flexShrink: 1,
  },
  pickerText: {
    ...theme.type.labelLarge,
    textAlign: 'right',
  },
  pickerInput: {
    borderWidth: 0,
    borderRadius: theme.shape.small,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ListItemComponent;
