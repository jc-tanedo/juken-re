import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import ReviewMenu from './ReviewMenu';
import {
  ANSWER_INPUT_BUTTONS,
  ANSWER_INPUT_MODE,
  BACK_TO_BACK_MODE,
  CARD_SIDE_LEFT,
  LOWEST_LEVEL_FIRST,
  REVIEW_ORDER,
  SPEECH_MODE,
  UNFOLDED_CARD_SIDE,
} from 'src/common/constants';
import { speechMode } from 'src/features/voice/speechProviders';

const mockSettings = {};
const mockParakeetInstalled = new Set();
const mockSaveSetting = jest.fn(({ key, value }) => {
  mockSettings[key] = value;
});

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
  useStoreActions: () => mockSaveSetting,
  useStoreState: selector => selector({ session: { userSettings: mockSettings } }),
}));

const androidTest = Platform.OS === 'android' ? test : test.skip;

beforeEach(() => {
  for (const key of Object.keys(mockSettings)) delete mockSettings[key];
  mockParakeetInstalled.clear();
  mockSaveSetting.mockClear();
});

function findByRoleAndText(root, role, text) {
  return root.container.queryAll(
    node => node.props.accessibilityRole === role && JSON.stringify(node.toJSON()).includes(text),
  )[0];
}

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

androidTest('progressively discloses Meaning First only when Back To Back is enabled', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    expect(JSON.stringify(root.container.toJSON())).not.toContain('Meaning First');

    mockSettings[BACK_TO_BACK_MODE] = true;
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    expect(JSON.stringify(root.container.toJSON())).toContain('Meaning First');
  } finally {
    await act(async () => root.unmount());
  }
});

androidTest('opens M3 SelectionDialog for Review Order instead of a legacy dropdown', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    const orderRow = findByRoleAndText(root, 'button', 'Review Order');
    await act(async () => orderRow.props.onClick({ nativeEvent: {} }));
    expect(JSON.stringify(root.container.toJSON())).toContain('Prioritize items from lower WaniKani levels first.');

    const lowestOption = findByRoleAndText(root, 'radio', 'Lowest Level First');
    await act(async () => lowestOption.props.onClick({ nativeEvent: {} }));
    expect(mockSaveSetting).toHaveBeenCalledWith({ key: REVIEW_ORDER, value: LOWEST_LEVEL_FIRST });
  } finally {
    await act(async () => root.unmount());
  }
});

androidTest('navigates into Voice recognition sub-page and uses Back to return to Review settings', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  const setMenuOpen = jest.fn();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={setMenuOpen} />));
    const voiceRow = findByRoleAndText(root, 'button', 'Speech recognition');
    await act(async () => voiceRow.props.onClick({ nativeEvent: {} }));

    const voiceJson = JSON.stringify(root.container.toJSON());
    expect(voiceJson).toContain('Voice recognition');
    expect(voiceJson).toContain('Speech engine');
    expect(voiceJson).not.toContain('Listening mode');
    expect(voiceJson).not.toContain('Offline models');

    const [pageModal] = root.container.queryAll(node => typeof node.props.onRequestClose === 'function');
    await act(async () => pageModal.props.onRequestClose());
    expect(setMenuOpen).not.toHaveBeenCalled();
    expect(JSON.stringify(root.container.toJSON())).toContain('Quick Reveal');
  } finally {
    await act(async () => root.unmount());
  }
});

androidTest('initialSubpage="voice" opens directly on Voice recognition and Back returns to Review settings', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  const setMenuOpen = jest.fn();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen initialSubpage="voice" setMenuOpen={setMenuOpen} />));
    expect(JSON.stringify(root.container.toJSON())).toContain('Voice recognition');
    expect(JSON.stringify(root.container.toJSON())).toContain('Speech engine');

    const [pageModal] = root.container.queryAll(node => typeof node.props.onRequestClose === 'function');
    await act(async () => pageModal.props.onRequestClose());
    expect(setMenuOpen).not.toHaveBeenCalled();
    expect(JSON.stringify(root.container.toJSON())).toContain('Quick Reveal');
  } finally {
    await act(async () => root.unmount());
  }
});

androidTest('selecting Vosk reveals Listening mode and language packs and marks a completed install ready', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockSettings[SPEECH_MODE] = 'vosk';
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    const voiceRow = findByRoleAndText(root, 'button', 'Speech recognition');
    await act(async () => voiceRow.props.onClick({ nativeEvent: {} }));

    expect(JSON.stringify(root.container.toJSON())).toContain('Listening mode');
    expect(JSON.stringify(root.container.toJSON())).toContain('48 MB');

    const english = findByRoleAndText(root, 'button', 'English speech model');
    await act(async () => english.props.onClick({ nativeEvent: {} }));
    expect(speechMode('vosk').provider.native.install).toHaveBeenCalledWith('en-US');
    expect(JSON.stringify(root.container.toJSON())).toContain('Ready on this device');
  } finally {
    await act(async () => root.unmount());
  }
});

androidTest('selecting Parakeet shows English + optional Japanese, Listening mode controls, and shares install state with Parakeet Japanese', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const versionSpy = jest.spyOn(Platform, 'Version', 'get').mockReturnValue(35);
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    await act(async () => findByRoleAndText(root, 'button', 'Speech recognition').props.onClick({ nativeEvent: {} }));

    await act(async () => findByRoleAndText(root, 'radio', 'Parakeet').props.onClick({ nativeEvent: {} }));
    expect(mockSaveSetting).toHaveBeenCalledWith({ key: SPEECH_MODE, value: 'parakeet' });
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));

    let snapshot = JSON.stringify(root.container.toJSON());
    expect(snapshot).toContain('Parakeet English speech model');
    expect(snapshot).toContain('460 MB');
    expect(snapshot).toContain('Parakeet Japanese (optional) speech model');
    expect(snapshot).toContain('467 MB');
    expect(snapshot).toContain('Combined');

    await act(async () => findByRoleAndText(root, 'radio', 'Combined').props.onClick({ nativeEvent: {} }));
    expect(mockSaveSetting).toHaveBeenCalledWith({ key: SPEECH_MODE, value: 'parakeet-android' });
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));

    const jaOptional = findByRoleAndText(root, 'button', 'Parakeet Japanese (optional) speech model');
    await act(async () => jaOptional.props.onClick({ nativeEvent: {} }));
    expect(speechMode('parakeet').provider.native.install).toHaveBeenCalledWith('ja-JP');

    await act(async () => findByRoleAndText(root, 'radio', 'Parakeet Japanese').props.onClick({ nativeEvent: {} }));
    expect(mockSaveSetting).toHaveBeenCalledWith({ key: SPEECH_MODE, value: 'parakeet-ja-android' });
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));

    snapshot = JSON.stringify(root.container.toJSON());
    expect(snapshot).toContain('Parakeet Japanese speech model');
    expect(snapshot).not.toContain('Parakeet English speech model');
    expect(snapshot).toContain('Ready on this device');
  } finally {
    versionSpy.mockRestore();
    await act(async () => root.unmount());
  }
});

androidTest('defaults Unfolded Card Side to Right Side and allows switching to Left Side', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    expect(JSON.stringify(root.container.toJSON())).toContain('Right Side');

    const cardSideRow = findByRoleAndText(root, 'button', 'Unfolded Card Side');
    await act(async () => cardSideRow.props.onClick({ nativeEvent: {} }));
    expect(JSON.stringify(root.container.toJSON())).toContain(
      'Show the review card on the left and study companion on the right.',
    );

    const leftOption = findByRoleAndText(root, 'radio', 'Left Side');
    await act(async () => leftOption.props.onClick({ nativeEvent: {} }));
    expect(mockSaveSetting).toHaveBeenCalledWith({
      key: UNFOLDED_CARD_SIDE,
      value: CARD_SIDE_LEFT,
    });
  } finally {
    await act(async () => root.unmount());
  }
});

androidTest('defaults Answer Controls to Swipe & Buttons and allows switching to Buttons Only', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot();
  try {
    await act(async () => root.render(<ReviewMenu menuOpen setMenuOpen={() => {}} />));
    expect(JSON.stringify(root.container.toJSON())).toContain('Swipe & Buttons');

    const controlsRow = findByRoleAndText(root, 'button', 'Answer Controls');
    await act(async () => controlsRow.props.onClick({ nativeEvent: {} }));
    expect(JSON.stringify(root.container.toJSON())).toContain(
      'Use Missed and Correct buttons on the card and disable swipe gestures.',
    );

    const buttonsOnlyOption = findByRoleAndText(root, 'radio', 'Buttons Only');
    await act(async () => buttonsOnlyOption.props.onClick({ nativeEvent: {} }));
    expect(mockSaveSetting).toHaveBeenCalledWith({
      key: ANSWER_INPUT_MODE,
      value: ANSWER_INPUT_BUTTONS,
    });
  } finally {
    await act(async () => root.unmount());
  }
});
