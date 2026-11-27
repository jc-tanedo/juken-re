import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import ReviewMenu from './ReviewMenu';
import { SPEECH_MODE } from 'src/common/constants';
import { speechMode } from 'src/features/voice/speechProviders';

const mockSettings = {};
const mockParakeetInstalled = new Set();

jest.mock('expo', () => {
  const expo = jest.requireActual('expo');
  const vosk = { installed: jest.fn(async () => false), install: jest.fn(async () => true) };
  const parakeet = {
    installed: jest.fn(async locale => mockParakeetInstalled.has(locale)),
    install: jest.fn(async locale => {
      mockParakeetInstalled.add(locale);
      return true;
    }),
  };
  return {
    ...expo,
    requireOptionalNativeModule: name => {
      if (name === 'JukenVosk') return vosk;
      if (name === 'JukenParakeet') return parakeet;
      return expo.requireOptionalNativeModule(name);
    },
  };
});

jest.mock('easy-peasy', () => ({
  useStoreActions: () => jest.fn(),
  useStoreState: selector => selector({ session: { userSettings: mockSettings } }),
}));

const androidTest = Platform.OS === 'android' ? test : test.skip;

beforeEach(() => {
  mockParakeetInstalled.clear();
});

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

androidTest('selecting Parakeet shows English + optional Japanese and shares install state with Parakeet Japanese', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockSettings[SPEECH_MODE] = 'parakeet';
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    let snapshot = JSON.stringify(root.container.toJSON());
    expect(snapshot).toContain('Parakeet English speech model');
    expect(snapshot).toContain('460 MB');
    expect(snapshot).toContain('Parakeet Japanese (optional) speech model');
    expect(snapshot).toContain('467 MB');

    const jaOptional = root.container.queryAll(node => node.props.accessibilityRole === 'button' &&
      JSON.stringify(node.toJSON()).includes('Parakeet Japanese (optional) speech model'))[0];
    await act(async () => jaOptional.props.onClick({ nativeEvent: {} }));
    expect(speechMode('parakeet').provider.native.install).toHaveBeenCalledWith('ja-JP');

    mockSettings[SPEECH_MODE] = 'parakeet-ja';
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    snapshot = JSON.stringify(root.container.toJSON());
    expect(snapshot).toContain('Parakeet Japanese speech model');
    expect(snapshot).not.toContain('Parakeet English speech model');
    expect(snapshot).toContain('Ready on this device');
  } finally {
    delete mockSettings[SPEECH_MODE];
    await act(async () => root.unmount());
  }
});
