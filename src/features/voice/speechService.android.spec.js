import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { speechService } from './speechService';

jest.mock('expo', () => {
  const module = () => ({ listen: jest.fn(), listenRecorded: jest.fn(), cancel: jest.fn(), addListener: jest.fn() });
  const modules = { JukenSpeech: module(), JukenVosk: module() };
  return { requireOptionalNativeModule: name => modules[name] };
});
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));

const native = requireOptionalNativeModule('JukenSpeech');
const androidTest = Platform.OS === 'android' ? test : test.skip;
const vosk = requireOptionalNativeModule('JukenVosk');
beforeEach(() => {
  for (const engine of [native, vosk]) {
    engine.addListener.mockReturnValue({ remove: jest.fn() });
    engine.cancel.mockResolvedValue(null);
  }
});
afterEach(() => { jest.restoreAllMocks(); jest.resetAllMocks(); });

androidTest('local results bypass the system recognizer and consent storage', async () => {
  native.listen.mockResolvedValue({ status: 'result', text: 'き' });
  expect((await speechService.listen('ja-JP', () => true)).text).toBe('き');
  expect(native.listen.mock.calls).toEqual([['ja-JP', true, expect.any(Number), []]]);
  expect(AsyncStorage.getItem).not.toHaveBeenCalled();
});

androidTest('system recognition only starts after consent and honors cancellation', async () => {
  native.listen.mockResolvedValue({ status: 'unavailable' });
  AsyncStorage.getItem.mockResolvedValue(null);
  let current = true;
  jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    current = false;
    buttons[1].onPress();
  });
  await speechService.listen('ja-JP', () => current);
  expect(native.listen.mock.calls).toEqual([['ja-JP', true, expect.any(Number), []]]);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(expect.any(String), 'yes');
  AsyncStorage.getItem.mockResolvedValue('yes');
  current = true;
  await speechService.listen('ja-JP', () => current, undefined, ['がっこう', 'ぎんこう']);
  expect(native.listen.mock.calls.slice(1)).toEqual([['ja-JP', true, expect.any(Number), ['がっこう', 'ぎんこう']], ['ja-JP', false, expect.any(Number), []]]);
});

androidTest('a saved refusal never calls the network-capable recognizer', async () => {
  native.listen.mockResolvedValue({ status: 'unavailable' });
  AsyncStorage.getItem.mockResolvedValue('no');
  expect((await speechService.listen('en-US', () => true)).status).toBe('unavailable');
  expect(native.listen.mock.calls).toEqual([['en-US', true, expect.any(Number), []]]);
});

androidTest('activity is scoped to a live native request and its listener is released', async () => {
  let finish;
  let active = true;
  const update = jest.fn();
  const remove = jest.fn();
  native.addListener.mockReturnValue({ remove });
  native.listen.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = speechService.listen('en-US', () => active, update);
  const [name, emit] = native.addListener.mock.calls[0];
  expect(name).toBe('speechActivity');
  const requestId = native.listen.mock.calls[0][2];
  emit({ requestId: requestId - 1, stage: 'ready' });
  emit({ requestId, stage: 'speaking' });
  active = false;
  emit({ requestId, stage: 'partial', text: 'old answer' });
  finish({ status: 'cancelled' });
  await pending;
  expect(update.mock.calls).toEqual([[{ requestId, stage: 'speaking' }]]);
  expect(remove).toHaveBeenCalledTimes(1);
});

androidTest('Vosk can handle the first answer alone, or only on the repeat', async () => {
  const listen = (mode, repeat = false) => speechService.listen('ja-JP', () => true, undefined, [], mode, repeat);
  native.listen.mockResolvedValue({ status: 'silence' });
  vosk.listen.mockResolvedValue({ status: 'result', text: 'がっこう' });
  expect((await listen('vosk')).text).toBe('がっこう');
  expect(native.listen).not.toHaveBeenCalled();
  expect(await listen('vosk-retry')).toEqual({ status: 'silence' });
  expect((await listen('vosk-retry', true)).text).toBe('がっこう');
  expect(native.listen).toHaveBeenCalledTimes(1);
  vosk.listen.mockResolvedValue({ status: 'unavailable' });
  expect((await listen('vosk')).status).toBe('unavailable');
  expect(native.listen).toHaveBeenCalledTimes(1);
});

androidTest('combined mode passes the same PCM to Android and discards it before grading', async () => {
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue(35);
  const audio = new Uint8Array([1, 2]);
  vosk.listen.mockResolvedValue({ status: 'result', text: 'tree', audio });
  native.listenRecorded.mockResolvedValue({ status: 'result', text: 'three', confidence: 0.9 });
  const listen = () => speechService.listen('en-US', () => true, undefined, [], 'vosk-android');
  expect(await listen()).toEqual({ status: 'result', text: 'three', confidence: 0.9,
    secondOpinion: { status: 'result', text: 'tree' } });
  expect(native.listenRecorded).toHaveBeenCalledWith('en-US', expect.any(Number), [], audio);
  native.listenRecorded.mockResolvedValue({ status: 'unavailable' });
  expect(await listen()).toMatchObject({ status: 'result', text: 'tree', sourceNote: expect.stringContaining('Vosk') });
  expect(native.listen).not.toHaveBeenCalled();
  expect(AsyncStorage.getItem).not.toHaveBeenCalled();
});

androidTest('stopping combined capture prevents a late result from starting Android replay', async () => {
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue(35);
  let finish;
  let active = true;
  vosk.listen.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = speechService.listen('en-US', () => active, undefined, [], 'vosk-android');
  active = false;
  speechService.cancel();
  finish({ status: 'result', text: 'tree', audio: new Uint8Array([1, 2]) });
  expect(await pending).toEqual({ status: 'cancelled' });
  expect(vosk.cancel).toHaveBeenCalledTimes(1);
  expect(native.listenRecorded).not.toHaveBeenCalled();
});

androidTest('a missing combined model falls back to the normal Android consent flow', async () => {
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue(35);
  vosk.listen.mockResolvedValue({ status: 'unavailable' });
  native.listen.mockResolvedValue({ status: 'unavailable' });
  AsyncStorage.getItem.mockResolvedValue('no');
  expect(await speechService.listen('ja-JP', () => true, undefined, [], 'vosk-android'))
    .toEqual({ status: 'unavailable' });
  expect(native.listen).toHaveBeenCalledTimes(1);
  expect(native.listen.mock.calls[0][1]).toBe(true);
  expect(native.listenRecorded).not.toHaveBeenCalled();
});
