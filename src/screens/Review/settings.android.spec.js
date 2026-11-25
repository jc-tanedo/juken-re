import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import ReviewMenu from './ReviewMenu';
import { SPEECH_MODE } from 'src/common/constants';
import { speechMode } from 'src/features/voice/speechProviders';

const mockSettings = {};
jest.mock('expo', () => {
  const expo = jest.requireActual('expo');
  const vosk = { installed: jest.fn(async () => false), install: jest.fn(async () => true) };
  return { ...expo, requireOptionalNativeModule: name =>
    name === 'JukenVosk' ? vosk : expo.requireOptionalNativeModule(name) };
});

jest.mock('easy-peasy', () => ({
  useStoreActions: () => jest.fn(),
  useStoreState: selector => selector({ session: { userSettings: mockSettings } }),
}));

const androidTest = Platform.OS === 'android' ? test : test.skip;

androidTest('opens, dismisses with Android Back, and reopens review settings', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  const setMenuOpen = jest.fn();
  const render = visible => act(async () => {
    root.render(<ReviewMenu menuOpen={visible} setMenuOpen={setMenuOpen} />);
  });
  await render(false);
  await render(true);
  expect(JSON.stringify(root.container.toJSON())).toContain('Quick Reveal');
  const [back] = root.container.queryAll(node => typeof node.props.onRequestClose === 'function');
  await act(async () => back.props.onRequestClose());
  expect(setMenuOpen).toHaveBeenCalledWith(false);
  await render(false);
  expect(JSON.stringify(root.container.toJSON())).not.toContain('Quick Reveal');
  await render(true);
  expect(JSON.stringify(root.container.toJSON())).toContain('Quick Reveal');
  await act(async () => root.unmount());
});

androidTest('selecting Vosk offers separate optional language packs and marks a completed install ready', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockSettings[SPEECH_MODE] = 'vosk';
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    const english = root.container.queryAll(node => node.props.accessibilityRole === 'button' &&
      JSON.stringify(node.toJSON()).includes('English speech model'))[0];
    expect(JSON.stringify(root.container.toJSON())).toContain('48 MB');
    await act(async () => english.props.onClick({ nativeEvent: {} }));
    expect(speechMode('vosk').provider.native.install).toHaveBeenCalledWith('en-US');
    expect(JSON.stringify(root.container.toJSON())).toContain('Ready on this device');
  } finally {
    delete mockSettings[SPEECH_MODE];
    await act(async () => root.unmount());
  }
});
