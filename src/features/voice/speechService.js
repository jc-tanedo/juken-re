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

export const speechService = {
  async permission() {
    if (!native) return false;
    const mic = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    return await PermissionsAndroid.check(mic) ||
      await PermissionsAndroid.request(mic) === PermissionsAndroid.RESULTS.GRANTED;
  },
  async listen(locale, current) {
    if (!native || !current()) return { status: 'cancelled' };
    const local = await native.listen(locale, true);
    if (local.status !== 'unavailable' || !current()) return local;
    if (!await allowSystemRecognition(current) || !current()) return { status: 'unavailable' };
    return native.listen(locale, false);
  },
  cancel() { native?.cancel().catch(() => {}); },
};
