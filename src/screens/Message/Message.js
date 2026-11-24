import React from 'react';
import PropTypes from 'prop-types';
import { StatusBar, StyleSheet, ActivityIndicator, Text, ScrollView, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
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
  return (
  <Page
    style={[
      styles.page,
      { backgroundColor: error ? colors.errorContainer : colors.surface },
      style,
    ]}
  >
    <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

    {/** loading indicator */}
    {loading && (
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />
    )}

    {/** error icon */}
    {error && (
      <AntDesign
        name="frown"
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
      <ScrollView style={[styles.width, styles.error, { backgroundColor: colors.surfaceBright }]}>
        <Text textBreakStrategy="simple" style={[styles.errorText, { color: colors.onSurface }]}>
          {errorMessage}
        </Text>
      </ScrollView>
    )}

    {/** render any component for description */}
    {!!component && (
      <View style={[ styles.text, styles.width]}>
        {component}
      </View>
    )}

    {/** render cta's */}
    {ctas.length > 0 && ctas.filter(Boolean).map(cta => (
      <Button
        key={cta.id}
        style={[ styles.width, cta.style ]}
        text={cta.text}
        textStyle={cta.textStyle}
        onPress={cta.onPress}
        color={cta.color}
        iconRight={cta.iconRight}
      />
    ))}
    
  </Page>
  );
};

Message.propTypes = {
  icon: PropTypes.any,
  iconStyle: PropTypes.object,
  style: PropTypes.object,
  loading: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  errorMessage: PropTypes.string,
  component: PropTypes.any,
  ctas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    iconRight: PropTypes.any,
    style: PropTypes.object,
    textStyle: PropTypes.object,
    color: PropTypes.string,
    onPress: PropTypes.func,
  }))
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
    mobile: { width: '80%' }
  }),
  text: {
    textAlign: 'center',
  },
  iconStyle: {
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    ...theme.type.headline,
    marginTop: 18,
  },
  description: {
    ...theme.type.body,
    marginTop: 10,
    textAlign: 'center',
  },
  error: {
    borderRadius: 18,
    padding: 12,
    marginTop: 16,
    height: 220,
    flexGrow: 0,
    overflow: 'hidden',
  },
  errorText: device({
    base: {
      textAlign: 'left',
      fontFamily: 'monospace',
      fontSize: 9,
    },
    web: {
      wordBreak: 'break-all',
    }
  })
})

export default Message;
