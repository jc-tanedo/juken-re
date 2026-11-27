import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const UndoSnackbar = ({ visible, label = 'Review recorded', onUndo }) => {
  const colors = theme[useColorScheme()];
  if (!visible) return null;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.inverseSurface },
        theme.elevation.level2,
      ]}
    >
      <Text numberOfLines={1} style={[theme.type.bodyMedium, styles.label, { color: colors.inverseOnSurface }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Undo last review"
        onPress={onUndo}
        android_ripple={{ color: colors.ripple, borderless: true }}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={[theme.type.labelLarge, { color: colors.inversePrimary }]}>
          Undo
        </Text>
      </Pressable>
    </View>
  );
};

UndoSnackbar.propTypes = {
  visible: PropTypes.bool,
  label: PropTypes.string,
  onUndo: PropTypes.func,
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: theme.shape.medium,
    marginTop: 8,
  },
  label: {
    flex: 1,
  },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
  pressed: {
    opacity: 0.72,
  },
});

export default UndoSnackbar;
