import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useStoreActions, useStoreState } from 'easy-peasy';

import Button from 'src/components/Button/Button';
import TextInput from 'src/components/Input/TextInput';
import Toast, { TYPES } from 'src/components/Toast/Toast';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import device from 'src/utils/device';

const projectUrl = 'https://github.com/jc-tanedo/juken-re';

const Login = ({ startDemo }) => {
  const [token, setToken] = useState('');
  const failed = useRef(null);
  const empty = useRef(null);
  const { showActionSheetWithOptions } = useActionSheet();
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const panelSurface = scheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;

  const login = useStoreActions(actions => actions.session.login);
  const loginLoading = useStoreState(state => state.loadings.login);
  const openProject = () => WebBrowser.openBrowserAsync(projectUrl);

  const submit = () => {
    if (loginLoading) return;
    if (device('mobile')) Keyboard.dismiss();
    if (!token) {
      empty.current.show('Please enter your API token');
    } else if (token === '1111') {
      startDemo();
    } else {
      login({ token, onFail: () => failed.current.show('Invalid token') });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Toast ref={failed} type={TYPES.ERROR} />
      <Toast ref={empty} type={TYPES.WARNING} />
      <KeyboardAvoidingView style={styles.screen} behavior={device('ios') ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.column}>
            <View style={[styles.hero, { backgroundColor: colors.primaryContainer }]}>
              <View style={[styles.emblem, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Image source={require('./logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
              </View>
              <Text accessibilityRole="header" style={[theme.type.displayLarge, { color: colors.onPrimaryContainer }]}>
                juken-re
              </Text>
              <Text style={[theme.type.bodyLarge, { color: colors.onPrimaryContainer }]}>
                Flashcard reviews for WaniKani
              </Text>
            </View>
            <View style={[styles.panel, { backgroundColor: panelSurface, borderColor: colors.outlineVariant }, theme.elevation.level1]}>
              <Text accessibilityRole="header" style={[theme.type.headlineSmall, { color: colors.onSurface }]}>
                Sign in
              </Text>
              <TextInput
                label="WaniKani personal access token"
                autoCapitalize="none"
                autoCorrect={false}
                value={token}
                onChangeText={setToken}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              <Button
                variant="filled"
                text={loginLoading ? 'Signing in…' : 'Sign in'}
                iconRight={loginLoading
                  ? <ActivityIndicator color={colors.onPrimary} />
                  : <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />}
                disabled={loginLoading}
                onPress={submit}
              />
              {!device('ios') && (
                <Button
                  variant="tonal"
                  text="Try the demo"
                  iconLeft={<MaterialIcons name="style" size={20} color={colors.onSecondaryContainer} />}
                  onPress={startDemo}
                />
              )}
            </View>
            {device('web') ? (
              <View style={styles.links}>
                <Button variant="text" text="Feedback & bug reports" style={styles.link} onPress={openProject} />
                <Button variant="text" text="Source code" style={styles.link} onPress={openProject} />
              </View>
            ) : (
              <Button
                variant="text"
                text="More"
                onPress={() => {
                  showActionSheetWithOptions({
                    options: ['Cancel', 'Feedback', 'Report Issues', 'Source Code'],
                    cancelButtonIndex: 0,
                  }, index => {
                    if (index > 0) openProject();
                  });
                }}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

Login.propTypes = { startDemo: PropTypes.func };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  column: { width: '100%', maxWidth: 480, gap: 10 },
  hero: {
    padding: 26,
    borderTopLeftRadius: theme.shape.extraLargeIncreased,
    borderTopRightRadius: theme.shape.extraLargeIncreased,
    borderBottomLeftRadius: theme.shape.large,
    borderBottomRightRadius: theme.shape.large,
    gap: 4,
  },
  emblem: {
    width: 56,
    height: 56,
    borderRadius: theme.shape.largeIncreased,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: { width: 38, height: 38, resizeMode: 'contain' },
  panel: {
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderTopLeftRadius: theme.shape.large,
    borderTopRightRadius: theme.shape.large,
    borderBottomLeftRadius: theme.shape.extraLarge,
    borderBottomRightRadius: theme.shape.extraLarge,
  },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  link: { width: 'auto' },
});

export default Login;
