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
  topDivider,
  bottomDivider,
  onPress,
  switch: toggle,
  picker,
}) => {
  const dark = useColorScheme() === 'dark';
  const rowAction = onPress ?? (toggle && (() => toggle.onValueChange(!toggle.value)));

  return (
    <Pressable
      onPress={rowAction}
      accessibilityRole={rowAction ? 'button' : undefined}
      style={[
        styles.row,
        dark && styles.container_dark,
        topDivider && styles.topDivider,
        bottomDivider && styles.bottomDivider,
      ]}
    >
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text style={[styles.title, dark && styles.title_dark]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, dark && styles.subtitle_dark]}>{subtitle}</Text>}
      </View>
      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      {toggle && (isWeb()
        ? <Text>{toggle.value ? 'On' : 'Off'}</Text>
        : <Switch {...toggle} />)}
      {picker && <RNPickerSelect style={pickerStyles} {...picker} />}
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
    borderColor: theme.palette.gray,
  },
  content: {
    flex: 1,
  },
  topDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: device({
    web: { width: 32 },
    mobile: { width: 20 }
  }),
  title: {
    fontSize: 17,
  },
  title_dark: {
    fontSize: 17,
    color: theme.palette_dark.white,
  },
  container_dark: {
    backgroundColor: theme.palette_dark.gray,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    color: 'rgba(0, 0, 0, .3)',
  },
  subtitle_dark: {
    color: theme.palette_dark.lightGray,
  }
})

const pickerStyles = StyleSheet.create({
  inputWeb: {
    borderWidth: 0,
    textAlign: 'right',
    fontSize: 14,
  },
})

export default ListItemComponent;
