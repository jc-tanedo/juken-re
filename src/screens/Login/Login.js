import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useStoreActions, useStoreState } from 'easy-peasy';

import Button from 'src/components/Button/Button';
import TextInput from 'src/components/Input/TextInput';
import Toast, { TYPES } from 'src/components/Toast/Toast';
import theme from 'src/common/theme';
import useColorScheme from 'src/hooks/useColorScheme';
import useLayoutMode from 'src/hooks/useLayoutMode';
import device from 'src/utils/device';

const projectUrl = 'https://github.com/jc-tanedo/juken-re';
const wkTokensUrl = 'https://www.wanikani.com/settings/personal_access_tokens';
const REQUIRED_TOKEN_SCOPES = [
  'reviews:create',
  'assignments:start',
  'study_materials:create',
  'study_materials:update',
];

const Login = ({ startDemo }) => {
  const [token, setToken] = useState('');
  const failed = useRef(null);
  const empty = useRef(null);
  const { showActionSheetWithOptions } = useActionSheet();
  const scheme = useColorScheme();
  const colors = theme[scheme];
  const layout = useLayoutMode();
  const wideLogin = layout.isWide && !layout.isTabletop;
  const panelSurface = scheme === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainerLowest;

  const login = useStoreActions(actions => actions.session.login);
  const loginLoading = useStoreState(state => state.loadings.login);
  const openProject = () => WebBrowser.openBrowserAsync(projectUrl);
  const openWkTokens = () => WebBrowser.openBrowserAsync(wkTokensUrl);

  const pasteToken = async () => {
    if (loginLoading) return;
    try {
      const raw = await Clipboard.getStringAsync();
      const pasted = (raw || '').trim();
      if (!pasted) {
        empty.current?.show('Clipboard is empty');
        return;
      }
      setToken(pasted);
      if (device('mobile')) Keyboard.dismiss();
    } catch {
      failed.current?.show('Could not read clipboard');
    }
  };

  const submit = () => {
    if (loginLoading) return;
    if (device('mobile')) Keyboard.dismiss();
    const trimmed = token.trim();
    if (trimmed !== token) setToken(trimmed);
    if (!trimmed) {
      empty.current?.show('Please enter your API token');
    } else if (trimmed === '1111') {
      startDemo();
    } else {
      login({ token: trimmed, onFail: () => failed.current?.show('Invalid token') });
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
          <View style={[styles.column, wideLogin && styles.columnWide]}>
            <View style={wideLogin ? [styles.cardsWideRow, { gap: layout.paneGap }] : styles.cardsStack}>
              <View
                style={[
                  styles.hero,
                  wideLogin && styles.heroWide,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
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
              <View
                style={[
                  styles.panel,
                  wideLogin && styles.panelWide,
                  { backgroundColor: panelSurface, borderColor: colors.outlineVariant },
                  theme.elevation.level1,
                ]}
              >
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
                  right={(
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Paste API token"
                      accessibilityState={{ disabled: !!loginLoading }}
                      disabled={loginLoading}
                      hitSlop={6}
                      onPress={pasteToken}
                      style={({ pressed }) => [
                        styles.pasteBtn,
                        { backgroundColor: colors.secondaryContainer },
                        pressed && !loginLoading && styles.pressed,
                        loginLoading && styles.disabled,
                      ]}
                    >
                      <MaterialIcons name="content-paste" size={16} color={colors.onSecondaryContainer} />
                      <Text style={[theme.type.labelMedium, { color: colors.onSecondaryContainer }]}>
                        Paste
                      </Text>
                    </Pressable>
                  )}
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
                <View
                  style={[
                    styles.tokenHelp,
                    { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
                  ]}
                >
                  <Text style={[theme.type.labelLarge, { color: colors.onSurface }]}>
                    Need an API token?
                  </Text>
                  <Text style={[theme.type.bodySmall, { color: colors.onSurfaceVariant }]}>
                    Generate a v2 token on WaniKani and enable these write permissions:
                  </Text>
                  <View style={styles.scopeList}>
                    {REQUIRED_TOKEN_SCOPES.map(scope => (
                      <View
                        key={scope}
                        style={[
                          styles.scopeChip,
                          { backgroundColor: panelSurface, borderColor: colors.outlineVariant },
                        ]}
                      >
                        <Text
                          style={[
                            theme.type.labelSmall,
                            styles.scopeText,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
                          {scope}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    variant="outlined"
                    text="Open WaniKani API Tokens"
                    iconRight={<MaterialIcons name="open-in-new" size={18} color={colors.primary} />}
                    style={styles.tokenLinkBtn}
                    onPress={openWkTokens}
                  />
                </View>
                {!device('ios') && (
                  <Button
                    variant="tonal"
                    text="Try the demo"
                    iconLeft={<MaterialIcons name="style" size={20} color={colors.onSecondaryContainer} />}
                    onPress={startDemo}
                  />
                )}
              </View>
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
  columnWide: { maxWidth: 880 },
  cardsStack: { gap: 10 },
  cardsWideRow: { flexDirection: 'row', alignItems: 'stretch' },
  hero: {
    padding: 26,
    borderTopLeftRadius: theme.shape.extraLargeIncreased,
    borderTopRightRadius: theme.shape.extraLargeIncreased,
    borderBottomLeftRadius: theme.shape.large,
    borderBottomRightRadius: theme.shape.large,
    gap: 4,
  },
  heroWide: {
    flex: 0.95,
    justifyContent: 'center',
    borderRadius: theme.shape.extraLargeIncreased,
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
  panelWide: {
    flex: 1.05,
    justifyContent: 'center',
    borderRadius: theme.shape.extraLarge,
  },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  link: { width: 'auto' },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.shape.full,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.38 },
  tokenHelp: {
    padding: 14,
    gap: 8,
    borderRadius: theme.shape.large,
    borderWidth: 1,
  },
  scopeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.shape.small,
    borderWidth: 1,
  },
  scopeText: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  tokenLinkBtn: {
    marginTop: 2,
    minHeight: 40,
    paddingVertical: 8,
  },
});

export default Login;
