import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { speechService } from './speechService';

jest.mock('expo', () => {
  const native = { listen: jest.fn(), cancel: jest.fn(), addListener: jest.fn() };
  return { requireOptionalNativeModule: () => native };
});
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));

const native = requireOptionalNativeModule('JukenSpeech');
const androidTest = Platform.OS === 'android' ? test : test.skip;
beforeEach(() => native.addListener.mockReturnValue({ remove: jest.fn() }));
afterEach(() => { jest.restoreAllMocks(); jest.resetAllMocks(); });

androidTest('local results bypass the system recognizer and consent storage', async () => {
  native.listen.mockResolvedValue({ status: 'result', text: 'き' });
  expect((await speechService.listen('ja-JP', () => true)).text).toBe('き');
  expect(native.listen.mock.calls).toEqual([['ja-JP', true, expect.any(Number)]]);
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
  expect(native.listen.mock.calls).toEqual([['ja-JP', true, expect.any(Number)]]);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(expect.any(String), 'yes');
  AsyncStorage.getItem.mockResolvedValue('yes');
  current = true;
  await speechService.listen('ja-JP', () => current);
  expect(native.listen.mock.calls.slice(1)).toEqual([['ja-JP', true, expect.any(Number)], ['ja-JP', false, expect.any(Number)]]);
});

androidTest('a saved refusal never calls the network-capable recognizer', async () => {
  native.listen.mockResolvedValue({ status: 'unavailable' });
  AsyncStorage.getItem.mockResolvedValue('no');
  expect((await speechService.listen('en-US', () => true)).status).toBe('unavailable');
  expect(native.listen.mock.calls).toEqual([['en-US', true, expect.any(Number)]]);
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
