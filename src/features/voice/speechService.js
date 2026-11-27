import { Alert, PermissionsAndroid } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { modelIsOptional, providerSupportsLocale, speechMode } from './speechProviders';
import AsyncStorage from '@react-native-async-storage/async-storage';

const native = requireOptionalNativeModule('JukenSpeech');
const consentKey = 'juken.voice.allowSystemRecognition';

async function askForConsent(current) {
  const saved = await AsyncStorage.getItem(consentKey);
  if (!current()) return false;
  if (saved != null) return saved === 'yes';
  const allowed = await new Promise(resolve => Alert.alert(
    'Use the phone’s speech service?',
    'On-device recognition is unavailable for this language. Your phone’s speech provider may send audio over the network.',
    [
      { text: 'Keep on device', onPress: () => resolve(false) },
      { text: 'Allow', onPress: () => resolve(true) },
    ],
    { cancelable: true, onDismiss: () => resolve(false) },
  ));
  await AsyncStorage.setItem(consentKey, allowed ? 'yes' : 'no');
  return allowed;
}

let pendingConsent;
function allowSystemRecognition(current) {
  if (!pendingConsent) {
    pendingConsent = askForConsent(current).finally(() => { pendingConsent = null; });
  }
  return pendingConsent;
}

let nextRequestId = 0;
async function recognize(engine, current, onActivity, listen) {
  const requestId = ++nextRequestId;
  const subscription = engine.addListener('speechActivity', event => {
    if (current() && event.requestId === requestId) onActivity(event);
  });
  try {
    return await listen(requestId);
  } finally {
    subscription.remove();
  }
}

let activeSupplement;
let releasing;

async function recognizeSupplement(mode, locale, current, onActivity, hints) {
  const engine = mode.provider.native;
  activeSupplement = engine;
  let captured;
  try {
    captured = await recognize(engine, current, onActivity, id => engine.listen(locale, id, !!mode.shared));
  } catch {
    captured = { status: 'unavailable' };
  } finally {
    if (current()) activeSupplement = null;
  }
  if (!current()) return { status: 'cancelled' };
  const { audio, ...result } = captured;
  if (mode.shared && audio?.length) {
    // Reuse this utterance. The second engine never needs a network call.
    const second = await native.listenRecorded(locale, ++nextRequestId, hints, audio)
      .catch(() => ({ status: 'unavailable' }));
    if (!current() || second.status === 'cancelled') return { status: 'cancelled' };
    if (second.status === 'result') {
      return result.status === 'result' ? { ...second, secondOpinion: result } : second;
    }
    result.sourceNote = mode.provider.label + ' only · Android returned no usable result';
  }
  if (result.status !== 'unavailable') return result;
  if (!mode.shared && !mode.retriesOnly && !modelIsOptional(mode.provider, locale)) {
    return { status: 'unavailable', message: mode.provider.label + ' unavailable. Check the model in Review settings.' };
  }
  return null;
}

export const speechService = {
  async permission() {
    if (!native) return false;
    const mic = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    return await PermissionsAndroid.check(mic) ||
      await PermissionsAndroid.request(mic) === PermissionsAndroid.RESULTS.GRANTED;
  },
  async listen(locale, current, onActivity = () => {}, hints = [], modeId, retry = false) {
    if (releasing) await releasing;
    if (!native || !current()) return { status: 'cancelled' };
    const mode = speechMode(modeId);
    const supportsLocale = providerSupportsLocale(mode.provider, locale);
    if (mode.provider && supportsLocale && (!mode.retriesOnly || retry)) {
      const result = await recognizeSupplement(mode, locale, current, onActivity, hints);
      if (result) return result;
      if (!current()) return { status: 'cancelled' };
    }
    const local = await recognize(native, current, onActivity, id => native.listen(locale, true, id, hints));
    if (local.status !== 'unavailable' || !current()) {
      return mode.shared && supportsLocale
        ? { ...local, sourceNote: 'Android only · Offline model unavailable' }
        : local;
    }
    onActivity({ stage: 'preparing' });
    if (!await allowSystemRecognition(current) || !current()) return { status: 'unavailable' };
    const system = await recognize(native, current, onActivity, id => native.listen(locale, false, id, []));
    return mode.shared && supportsLocale
      ? { ...system, sourceNote: 'Android only · Offline model unavailable' }
      : system;
  },
  cancel() {
    native?.cancel().catch(() => {});
    if (activeSupplement) {
      const pending = activeSupplement.cancel().catch(() => {});
      activeSupplement = null;
      releasing = pending;
      pending.finally(() => { if (releasing === pending) releasing = null; });
    }
  },
};
