import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

// Each supplementary module exposes installed/install(locale), cancel(), and
// listen(locale, requestId, shareAudio). Results and activity use the Android
// service's contract. Shared audio, when requested, is mono 16 kHz PCM16.
const vosk = {
  id: 'vosk',
  label: 'Vosk',
  storageKey: 'vosk',
  native: requireOptionalNativeModule('JukenVosk'),
  models: [
    { locale: 'en-US', label: 'English', size: '40 MB' },
    { locale: 'ja-JP', label: 'Japanese', size: '48 MB' },
  ],
};

const parakeetNative = requireOptionalNativeModule('JukenParakeet');

const parakeet = {
  id: 'parakeet',
  label: 'Parakeet',
  storageKey: 'parakeet',
  native: parakeetNative,
  models: [
    { locale: 'en-US', label: 'Parakeet English', size: '460 MB' },
    { locale: 'ja-JP', label: 'Parakeet Japanese (optional)', size: '467 MB', optional: true },
  ],
};

const parakeetJa = {
  id: 'parakeet-ja',
  label: 'Parakeet Japanese',
  storageKey: 'parakeet',
  native: parakeetNative,
  locales: ['ja-JP'],
  models: [
    { locale: 'ja-JP', label: 'Parakeet Japanese', size: '467 MB' },
  ],
};

const androidOnly = { id: 'android', label: 'Android' };
const modes = [androidOnly];
for (const provider of [vosk, parakeet, parakeetJa]) {
  if (!provider.native) continue;
  modes.push(
    { id: provider.id, label: provider.label, provider },
    { id: provider.id + '-retry', label: 'Android, then ' + provider.label + ' on retry', provider, retriesOnly: true },
    { id: provider.id + '-android', label: provider.label + ' + Android', provider, shared: true },
  );
}

export const speechModes = () => modes.filter(mode =>
  !mode.shared || (Platform.OS === 'android' && Number(Platform.Version) >= 33)
);
export const speechMode = id => speechModes().find(mode => mode.id === id) || androidOnly;
export const providerSupportsLocale = (provider, locale) =>
  !provider?.locales || provider.locales.includes(locale);
export const modelIsOptional = (provider, locale) =>
  !!provider?.models?.find(m => m.locale === locale)?.optional;
