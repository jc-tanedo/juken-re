import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import device, { isWeb } from 'src/utils/device';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';

const ListItemComponent = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  switch: toggle,
  picker,
}) => {
  const dark = useColorScheme() === 'dark';
  const colors = dark ? theme.dark : theme.light;
  const rowAction = onPress ?? (toggle && (() => toggle.onValueChange(!toggle.value)));

  return (
    <Pressable
      onPress={rowAction}
      accessibilityRole={toggle ? 'switch' : rowAction ? 'button' : undefined}
      accessibilityState={toggle ? { checked: !!toggle.value } : undefined}
      aria-checked={toggle ? !!toggle.value : undefined}
      style={[
        styles.row,
        dark && styles.container_dark,
      ]}
    >
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text style={[styles.title, dark && styles.title_dark]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, dark && styles.subtitle_dark]}>{subtitle}</Text>}
      </View>
      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      {toggle && (isWeb()
        ? <Text style={[styles.toggleLabel, { color: colors.onPrimaryContainer, backgroundColor: colors.primaryContainer }]}>{toggle.value ? 'On' : 'Off'}</Text>
        : <Switch trackColor={{ false: colors.outlineVariant, true: colors.primary }} {...toggle} />)}
      {picker && <RNPickerSelect style={{ inputWeb: { ...styles.pickerInput, color: colors.onSurface, backgroundColor: colors.surfaceBright } }} {...picker} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
    padding: Platform.OS === 'ios' ? 14 : 16,
    backgroundColor: theme.palette.white,
    borderRadius: 8,
    marginBottom: 2,
  },
  content: {
    flex: 1,
  },
  icon: device({
    web: { width: 32 },
    mobile: { width: 20 }
  }),
  title: {
    ...theme.type.body,
    color: theme.light.onSurface,
  },
  title_dark: {
    color: theme.dark.onSurface,
  },
  container_dark: {
    backgroundColor: theme.dark.surfaceBright,
    borderColor: theme.dark.outlineVariant,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.light.onSurfaceVariant,
  },
  subtitle_dark: {
    color: theme.palette_dark.lightGray,
  },
  toggleLabel: { ...theme.type.label, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  pickerInput: {
    borderWidth: 0,
    textAlign: 'right',
    fontSize: 14,
  },
})

export default ListItemComponent;
