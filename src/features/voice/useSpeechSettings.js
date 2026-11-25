import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { speechMode, speechModes } from './speechProviders';

export default function useSpeechSettings(selected, select, visible) {
  const mode = speechMode(selected);
  const provider = mode.provider;
  const [installed, setInstalled] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!visible || !provider) return;
    let current = true;
    for (const { locale } of provider.models) {
      provider.native.installed(locale).then(ready => {
        if (current && ready) setInstalled(values => ({ ...values, [provider.id + locale]: true }));
      }).catch(() => {});
    }
    return () => { current = false; };
  }, [visible, provider]);

  if (Platform.OS !== 'android') return null;
  const items = [{
    id: 'speech-recognizer', title: 'Speech recognizer',
    subtitle: mode.shared ? 'One recording, checked by both when Android supports audio input.' :
      mode.retriesOnly ? 'Android listens first. Your offline model listens on a repeat.' :
      provider ? 'Use your downloaded model for every answer.' : 'Use the phone’s speech service.',
    picker: {
      value: mode.id, placeholder: {}, onValueChange: select,
      items: speechModes().map(({ id, label }) => ({ value: id, label })),
    },
  }];
  for (const model of provider?.models || []) {
    const { locale, label, size } = model;
    const key = provider.id + locale;
    items.push({
      id: key, title: label + ' speech model',
      subtitle: installed[key] ? 'Ready on this device' :
        loading[key] ? 'Downloading and verifying…' : 'Download · ' + size,
      onPress: installed[key] || loading[key] ? undefined : async () => {
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
