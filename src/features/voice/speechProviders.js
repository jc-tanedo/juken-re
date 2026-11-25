import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

// Each supplementary module exposes installed/install(locale), cancel(), and
// listen(locale, requestId, shareAudio). Results and activity use the Android
// service's contract. Shared audio, when requested, is mono 16 kHz PCM16.
const vosk = {
  id: 'vosk', label: 'Vosk', native: requireOptionalNativeModule('JukenVosk'),
  models: [
    { locale: 'en-US', label: 'English', size: '40 MB' },
    { locale: 'ja-JP', label: 'Japanese', size: '48 MB' },
  ],
};

const androidOnly = { id: 'android', label: 'Android' };
const modes = [androidOnly];
for (const provider of [vosk]) {
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
