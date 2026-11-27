import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

const androidMeta = {
  id: 'android',
  label: 'Android',
  icon: 'smartphone',
  description: 'Uses your phone’s built-in speech service (on-device first when available).',
};

// Each supplementary module exposes installed/install(locale), cancel(), and
// listen(locale, requestId, shareAudio). Results and activity use the Android
// service's contract. Shared audio, when requested, is mono 16 kHz PCM16.
const vosk = {
  id: 'vosk',
  label: 'Vosk',
  storageKey: 'vosk',
  icon: 'offline-bolt',
  description: 'Lightweight offline models (40–48 MB) for English and Japanese.',
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
  icon: 'graphic-eq',
  description: 'High-accuracy NVIDIA NeMo offline speech model with optional Japanese.',
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
  icon: 'translate',
  description: 'Offline NVIDIA NeMo Japanese readings paired with Android for English meanings.',
  native: parakeetNative,
  locales: ['ja-JP'],
  models: [
    { locale: 'ja-JP', label: 'Parakeet Japanese', size: '467 MB' },
  ],
};

const supplementaryProviders = [vosk, parakeet, parakeetJa];
const androidOnly = { id: 'android', label: 'Android' };
const modes = [androidOnly];
for (const provider of supplementaryProviders) {
  if (!provider.native) continue;
  modes.push(
    { id: provider.id, label: provider.label, provider },
    { id: provider.id + '-retry', label: 'Android, then ' + provider.label + ' on retry', provider, retriesOnly: true },
    { id: provider.id + '-android', label: provider.label + ' + Android', provider, shared: true },
  );
}

export const supportsSharedAudio = () =>
  Platform.OS === 'android' && Number(Platform.Version) >= 33;

export const speechModes = () => modes.filter(mode => !mode.shared || supportsSharedAudio());
export const speechMode = id => speechModes().find(mode => mode.id === id) || androidOnly;

export const speechProviders = () => [
  androidMeta,
  ...supplementaryProviders.filter(provider => !!provider.native),
];

export const parseSpeechMode = id => {
  const mode = speechMode(id);
  if (!mode.provider) return { providerId: 'android', strategy: 'always' };
  if (mode.shared) return { providerId: mode.provider.id, strategy: 'shared' };
  if (mode.retriesOnly) return { providerId: mode.provider.id, strategy: 'retry' };
  return { providerId: mode.provider.id, strategy: 'always' };
};

export const modeIdFor = (providerId, strategy = 'always') => {
  if (!providerId || providerId === 'android') return 'android';
  if (strategy === 'shared' && supportsSharedAudio()) return `${providerId}-android`;
  if (strategy === 'retry') return `${providerId}-retry`;
  return speechModes().some(mode => mode.id === providerId) ? providerId : 'android';
};

export const providerSupportsLocale = (provider, locale) =>
  !provider?.locales || provider.locales.includes(locale);
export const modelIsOptional = (provider, locale) =>
  !!provider?.models?.find(m => m.locale === locale)?.optional;
