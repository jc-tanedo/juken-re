import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const TextInputComponent = ({ style, label, right, onFocus, onBlur, ...props }) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.field,
        {
          backgroundColor: scheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest,
          borderColor: focused ? colors.primary : colors.outline,
          borderWidth: focused ? 2 : 1,
        },
        focused && styles.fieldFocused,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.main}>
          {!!label && (
            <Text
              style={[
                theme.type.labelSmall,
                { color: focused ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {label}
            </Text>
          )}
          <TextInput
            accessibilityLabel={label}
            placeholderTextColor={colors.onSurfaceVariant}
            selectionColor={colors.primary}
            underlineColorAndroid="transparent"
            {...props}
            onFocus={event => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={event => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[styles.input, { color: colors.onSurface }, style]}
          />
        </View>
        {!!right && <View style={styles.trailing}>{right}</View>}
      </View>
    </View>
  );
};

TextInputComponent.propTypes = {
  style: PropTypes.any,
  label: PropTypes.string,
  right: PropTypes.node,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

const styles = StyleSheet.create({
  field: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.shape.medium,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trailing: {
    flexShrink: 0,
  },
  fieldFocused: {
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  input: {
    ...theme.type.bodyLarge,
    minHeight: 26,
    paddingVertical: 0,
  },
});

export default TextInputComponent;
