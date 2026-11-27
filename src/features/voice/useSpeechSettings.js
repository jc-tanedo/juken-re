import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useColorScheme from 'src/hooks/useColorScheme';
import theme from 'src/common/theme';
import { speechMode, speechModes } from './speechProviders';

function modeSubtitle(mode) {
  const provider = mode.provider;
  if (!provider) return 'Use the phone’s speech service.';
  if (mode.shared) {
    return provider.locales?.includes('ja-JP') && provider.locales.length === 1
      ? 'One Japanese recording, checked by both when Android supports audio input. Meanings use Android.'
      : 'One recording, checked by both when Android supports audio input.';
  }
  if (mode.retriesOnly) {
    return provider.locales?.includes('ja-JP') && provider.locales.length === 1
      ? 'Android listens first. Parakeet Japanese listens on a Japanese repeat.'
      : 'Android listens first. Your offline model listens on a repeat.';
  }
  if (provider.locales?.includes('ja-JP') && provider.locales.length === 1) {
    return 'Use Parakeet Japanese for readings and Android for English meanings.';
  }
  if (provider.models.some(model => model.optional)) {
    return 'Use your downloaded Parakeet model offline (Android handles missing optional packs).';
  }
  return 'Use your downloaded model for every answer.';
}

export default function useSpeechSettings(selected, select, visible) {
  const mode = speechMode(selected);
  const provider = mode.provider;
  const colors = theme[useColorScheme()];
  const [installed, setInstalled] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!visible || !provider) return;
    let current = true;
    const storageKey = provider.storageKey || provider.id;
    for (const { locale } of provider.models) {
      const key = `${storageKey}:${locale}`;
      provider.native.installed(locale).then(ready => {
        if (current) setInstalled(values => ({ ...values, [key]: !!ready }));
      }).catch(() => {});
    }
    return () => { current = false; };
  }, [visible, provider]);

  if (Platform.OS !== 'android') return null;
  const storageKey = provider ? (provider.storageKey || provider.id) : '';
  const items = [{
    id: 'speech-recognizer',
    title: 'Speech recognizer',
    subtitle: modeSubtitle(mode),
    leftIcon: <MaterialIcons name="record-voice-over" size={22} color={colors.onSurfaceVariant} />,
    picker: {
      value: mode.id,
      placeholder: {},
      onValueChange: select,
      items: speechModes().map(({ id, label }) => ({ value: id, label })),
    },
  }];
  for (const model of provider?.models || []) {
    const { locale, label, size } = model;
    const key = `${storageKey}:${locale}`;
    const isInstalled = !!installed[key];
    const isLoading = !!loading[key];
    items.push({
      id: `${provider.id}:${locale}`,
      title: `${label} speech model`,
      subtitle: isInstalled
        ? 'Ready on this device'
        : isLoading ? 'Downloading and verifying…' : `Download · ${size}`,
      leftIcon: (
        <MaterialIcons
          name={isInstalled ? 'check-circle' : 'download'}
          size={22}
          color={isInstalled ? colors.success : colors.onSurfaceVariant}
        />
      ),
      loading: isLoading,
      onPress: isInstalled || isLoading ? undefined : async () => {
        setLoading(values => ({ ...values, [key]: true }));
        try {
          await provider.native.install(locale);
          setInstalled(values => ({ ...values, [key]: true }));
        } catch {
          Alert.alert('Model download failed', 'Check your connection and free storage, then tap the model to retry.');
        } finally {
          setLoading(values => ({ ...values, [key]: false }));
        }
      },
    });
  }
  return { title: 'Voice mode', items };
}
