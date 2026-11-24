import { Alert, PermissionsAndroid } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
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
async function recognize(locale, local, current, onActivity, hints) {
  const requestId = ++nextRequestId;
  const subscription = native.addListener('speechActivity', event => {
    if (current() && event.requestId === requestId) onActivity(event);
  });
  try {
    return await native.listen(locale, local, requestId, hints);
  } finally {
    subscription.remove();
  }
}

export const speechService = {
  async permission() {
    if (!native) return false;
    const mic = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    return await PermissionsAndroid.check(mic) ||
      await PermissionsAndroid.request(mic) === PermissionsAndroid.RESULTS.GRANTED;
  },
  async listen(locale, current, onActivity = () => {}, hints = []) {
    if (!native || !current()) return { status: 'cancelled' };
    const local = await recognize(locale, true, current, onActivity, hints);
    if (local.status !== 'unavailable' || !current()) return local;
    onActivity({ stage: 'preparing' });
    if (!await allowSystemRecognition(current) || !current()) return { status: 'unavailable' };
    return recognize(locale, false, current, onActivity, []);
  },
  cancel() { native?.cancel().catch(() => {}); },
};
