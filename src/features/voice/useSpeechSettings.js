import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  modeIdFor,
  parseSpeechMode,
  speechMode,
  speechProviders,
  supportsSharedAudio,
} from './speechProviders';

function buildStrategyDescription(provider, strategy) {
  if (!provider) return 'Your phone’s speech service handles every card.';
  const jaOnly = provider.locales?.includes('ja-JP') && provider.locales.length === 1;
  if (strategy === 'shared') {
    return jaOnly
      ? 'One Japanese recording is checked by both engines when Android supports audio replay. Meanings use Android.'
      : 'One recording is checked by both your offline model and Android when supported.';
  }
  if (strategy === 'retry') {
    return jaOnly
      ? 'Android listens first; Parakeet Japanese checks repeated Japanese readings.'
      : `Android listens first; ${provider.label} takes over on a repeat.`;
  }
  if (jaOnly) {
    return 'Parakeet Japanese handles Japanese readings offline; Android handles English meanings.';
  }
  if (provider.models.some(model => model.optional)) {
    return 'Parakeet English runs offline; Android handles Japanese unless the optional pack is installed.';
  }
  return `${provider.label} handles every supported card completely offline.`;
}

function buildSummary(mode, provider, strategy, models) {
  if (!provider) return 'Android · Default';
  const missingRequired = models.some(model => !model.optional && !model.installed);
  if (missingRequired) return `${provider.label} · Download needed`;
  if (strategy === 'retry') return `${provider.label} · On retry`;
  if (strategy === 'shared') return `${provider.label} · + Android`;
  return `${provider.label} · Ready`;
}

export default function useSpeechSettings(selected, select, visible) {
  const available = Platform.OS === 'android';
  const mode = speechMode(selected);
  const provider = mode.provider || null;
  const { providerId: activeProviderId, strategy: activeStrategy } = parseSpeechMode(mode.id);
  const providers = available ? speechProviders() : [];
  const [installed, setInstalled] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!available || !visible || !provider) return;
    let current = true;
    const storageKey = provider.storageKey || provider.id;
    for (const { locale } of provider.models) {
      const key = `${storageKey}:${locale}`;
      provider.native.installed(locale).then(ready => {
        if (current) setInstalled(values => ({ ...values, [key]: !!ready }));
      }).catch(() => {});
    }
    return () => { current = false; };
  }, [available, visible, provider]);

  const storageKey = provider ? (provider.storageKey || provider.id) : '';
  const models = (provider?.models || []).map(model => {
    const key = `${storageKey}:${model.locale}`;
    const isInstalled = !!installed[key];
    const isLoading = !!loading[key];
    return {
      ...model,
      id: `${provider.id}:${model.locale}`,
      title: `${model.label} speech model`,
      installed: isInstalled,
      loading: isLoading,
      install: isInstalled || isLoading ? undefined : async () => {
        setLoading(values => ({ ...values, [key]: true }));
        try {
          await provider.native.install(model.locale);
          setInstalled(values => ({ ...values, [key]: true }));
        } catch {
          Alert.alert(
            'Model download failed',
            'Check your connection and free storage, then tap the model to retry.',
          );
        } finally {
          setLoading(values => ({ ...values, [key]: false }));
        }
      },
    };
  });

  const strategies = [
    { id: 'always', label: 'Always' },
    { id: 'retry', label: 'On retry' },
    ...(supportsSharedAudio() ? [{ id: 'shared', label: 'Combined' }] : []),
  ];

  const selectProvider = nextProviderId => {
    if (nextProviderId === 'android') {
      select('android');
      return;
    }
    const nextStrategy = activeProviderId === 'android' ? 'always' : activeStrategy;
    select(modeIdFor(nextProviderId, nextStrategy));
  };

  const selectStrategy = nextStrategy => {
    if (activeProviderId === 'android') return;
    select(modeIdFor(activeProviderId, nextStrategy));
  };

  const needsDownload = !!provider && models.some(model => !model.optional && !model.installed);

  return {
    available,
    mode,
    providers,
    activeProvider: provider || providers[0] || null,
    activeProviderId,
    activeStrategy,
    strategies,
    selectProvider,
    selectStrategy,
    models,
    needsDownload,
    summary: buildSummary(mode, provider, activeStrategy, models),
    strategyDescription: buildStrategyDescription(provider, activeStrategy),
  };
}
