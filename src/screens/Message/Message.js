import React from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Page from 'src/components/Page/Page';
import Button from 'src/components/Button/Button';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';
import device from 'src/utils/device';

const Message = ({
  icon,
  iconStyle,
  style,
  title,
  description,
  component,
  loading,
  error,
  errorMessage,
  center,
  ctas = [],
}) => {
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const foreground = error ? colors.onErrorContainer : colors.onSurface;
  const errorSurface = scheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;

  return (
    <Page
      style={[
        styles.page,
        { backgroundColor: error ? colors.errorContainer : colors.surface },
        style,
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/** loading indicator */}
      {loading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      )}

      {/** error icon */}
      {error && (
        <MaterialIcons
          name="error-outline"
          size={52}
          color={foreground}
        />
      )}

      {/** custom icon */}
      {icon && typeof icon === 'string' && <Text style={[styles.iconStyle, { color: foreground }, iconStyle]}>{icon}</Text>}
      {icon && typeof icon !== 'string' && <View style={[styles.iconStyle, iconStyle]}>{icon}</View>}

      {/** page title */}
      {title && (
        <Text
          accessibilityRole="header"
          style={[
            styles.text,
            { color: foreground },
            styles.width,
            styles.title,
          ]}
        >
          {title}
        </Text>
      )}

      {/** page description */}
      {description && (
        <Text
          style={[
            styles.text,
            { color: foreground },
            styles.width,
            styles.description,
            center && styles.center,
          ]}
        >
          {description}
        </Text>
      )}

      {/** print error message */}
      {errorMessage && (
        <ScrollView
          style={[
            styles.width,
            styles.error,
            { backgroundColor: errorSurface, borderColor: colors.outlineVariant },
          ]}
        >
          <Text textBreakStrategy="simple" style={[styles.errorText, { color: colors.onSurface }]}>
            {errorMessage}
          </Text>
        </ScrollView>
      )}

      {/** render any component for description */}
      {!!component && (
        <View style={[styles.text, styles.width]}>
          {component}
        </View>
      )}

      {/** render cta's */}
      {ctas.length > 0 && ctas.filter(Boolean).map(cta => (
        <Button
          key={cta.id}
          variant={cta.variant || 'filled'}
          style={[styles.width, styles.cta, cta.style]}
          text={cta.text}
          textStyle={cta.textStyle}
          onPress={cta.onPress}
          iconLeft={cta.iconLeft}
          iconRight={cta.iconRight}
        />
      ))}
    </Page>
  );
};

Message.propTypes = {
  icon: PropTypes.any,
  iconStyle: PropTypes.object,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  loading: PropTypes.bool,
  error: PropTypes.bool,
  center: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  errorMessage: PropTypes.string,
  component: PropTypes.any,
  ctas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    text: PropTypes.string,
    variant: PropTypes.string,
    iconLeft: PropTypes.any,
    iconRight: PropTypes.any,
    style: PropTypes.any,
    textStyle: PropTypes.any,
    onPress: PropTypes.func,
  })),
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  center: {
    textAlign: 'center',
  },
  width: device({
    web: { width: '60%' },
    mobile: { width: '80%' },
  }),
  text: {
    textAlign: 'center',
  },
  iconStyle: {
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    ...theme.type.headlineMedium,
    marginTop: 18,
  },
  description: {
    ...theme.type.bodyLarge,
    marginTop: 10,
    textAlign: 'center',
  },
  error: {
    borderRadius: theme.shape.large,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
    height: 220,
    flexGrow: 0,
    overflow: 'hidden',
  },
  errorText: device({
    base: {
      textAlign: 'left',
      fontFamily: 'monospace',
      fontSize: 10,
    },
    web: {
      wordBreak: 'break-all',
    },
  }),
  cta: {
    marginTop: 14,
  },
});

export default Message;
