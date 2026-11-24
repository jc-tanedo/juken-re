import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';

const TextInputComponent = ({ style, label, onFocus, onBlur, ...props }) => {
  const colors = theme[useColorScheme()];
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      styles.field,
      { backgroundColor: colors.surfaceContainer, borderBottomColor: focused ? colors.primary : colors.outline },
    ]}>
      {!!label && <Text style={[theme.type.label, { color: focused ? colors.primary : colors.onSurfaceVariant }]}>{label}</Text>}
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
  );
};

TextInputComponent.propTypes = {
  style: PropTypes.any,
  label: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 2,
  },
  input: {
    ...theme.type.body,
    minHeight: 28,
    paddingVertical: 2,
  },
});

export default TextInputComponent;
