import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import theme from 'src/common/theme';
import { addSherpaOnnxRepo } from '../../plugins/withSherpaOnnxRepo';
import Button from 'src/components/Button/Button';
import List from 'src/components/List/List';
import VoicePanel from 'src/features/voice/VoicePanel';
import TextWithMarkups from 'src/components/TextWithMarkups/TextWithMarkups';
import Toast, { TYPES } from 'src/components/Toast/Toast';
import Card from 'src/components/Card/Card';
import TextInput from 'src/components/Input/TextInput';
import Modal from 'src/components/Modal/Modal';
import M3Switch from 'src/components/Switch/Switch';
import SelectionDialog from 'src/components/SelectionDialog/SelectionDialog';
import ReviewTopBar from 'src/screens/Review/ReviewTopBar';
import { parseSpeechMode, modeIdFor, speechProviders } from 'src/features/voice/speechProviders';
import { APPRENTICE, KANA_VOCAB, KANJI, MEANING, RADICAL, READING, VOCAB } from 'src/common/constants';

let mockScheme = 'light';
jest.mock('src/hooks/useColorScheme', () => () => mockScheme);
jest.mock('@expo/react-native-action-sheet', () => ({
  useActionSheet: () => ({ showActionSheetWithOptions: jest.fn() }),
}));
jest.mock('src/hooks/useNetworkListener', () => () => true);
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy' },
}));

function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const channel = parseInt(clean.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe('withSherpaOnnxRepo Expo config plugin', () => {
  test('injects sherpa-onnx GitHub Releases ivy repository idempotently', () => {
    const input = `allprojects {\n  repositories {\n    google()\n    mavenCentral()\n  }\n}\n`;
    const once = addSherpaOnnxRepo(input);
    expect(once).toContain('https://github.com/k2-fsa/sherpa-onnx/releases/download');
    expect(once).toContain("artifact 'v[revision]/[artifact]-[revision].[ext]'");
    expect(once).toContain("includeGroup 'com.k2fsa.sherpa.onnx'");
    expect(addSherpaOnnxRepo(once)).toBe(once);
  });
});

describe('Material 3 Expressive theme tokens', () => {
  const requiredColors = [
    'surface', 'surfaceDim', 'surfaceBright',
    'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
    'surfaceContainerHigh', 'surfaceContainerHighest',
    'onSurface', 'onSurfaceVariant', 'outline', 'outlineVariant',
    'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
    'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
    'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
    'success', 'onSuccess', 'successContainer', 'onSuccessContainer',
    'warning', 'onWarning', 'warningContainer', 'onWarningContainer',
    'error', 'onError', 'errorContainer', 'onErrorContainer',
    'inverseSurface', 'inverseOnSurface', 'inversePrimary',
    'scrim', 'ripple', 'stateHover', 'statePressed',
  ];

  test('exposes full color, typography, shape, space, elevation, subject, and SRS tokens', () => {
    for (const scheme of ['light', 'dark']) {
      for (const key of requiredColors) {
        expect(theme[scheme][key]).toBeTruthy();
      }
      for (const subject of [RADICAL, KANJI, VOCAB, KANA_VOCAB]) {
        expect(theme.subjectColors[scheme][subject]).toMatchObject({
          container: expect.any(String),
          foreground: expect.any(String),
        });
      }
      expect(theme.srsColors[scheme][APPRENTICE]).toMatchObject({
        container: expect.any(String),
        foreground: expect.any(String),
      });
    }

    for (const scale of ['displayLarge', 'headlineMedium', 'titleLarge', 'titleSmall', 'bodyLarge', 'labelLarge', 'labelSmall']) {
      expect(theme.type[scale]).toBeDefined();
    }
    expect(theme.shape).toMatchObject({ extraSmall: 4, small: 8, medium: 12, large: 16, extraLarge: 28, full: 9999 });
    expect(theme.elevation.level1).toBeDefined();
  });

  test('dark mode surface container luminance strictly increases', () => {
    const order = [
      'surfaceContainerLowest',
      'surface',
      'surfaceContainerLow',
      'surfaceContainer',
      'surfaceContainerHigh',
      'surfaceContainerHighest',
      'surfaceBright',
    ];
    const luminances = order.map(token => relativeLuminance(theme.dark[token]));
    for (let i = 1; i < luminances.length; i++) {
      expect(luminances[i]).toBeGreaterThan(luminances[i - 1]);
    }
  });
});

describe('Speech provider mode mapping', () => {
  test('parses and constructs mode IDs cleanly', () => {
    expect(speechProviders()[0].id).toBe('android');
    expect(parseSpeechMode('android')).toEqual({ providerId: 'android', strategy: 'always' });
    expect(modeIdFor('android', 'retry')).toBe('android');
    expect(modeIdFor('unknown-engine', 'always')).toBe('android');
  });
});

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

describe('Material 3 Expressive components', () => {
  nativeTest('render in light and dark mode without React key or prop warnings', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onOpenVoiceSettings = jest.fn();
    const root = createRoot();

    try {
      for (const scheme of ['light', 'dark']) {
        mockScheme = scheme;
        await act(async () => {
          root.render(
            <>
              <ReviewTopBar
                demo
                wrapUpMode
                submissionQueue={[]}
                submissionErrors={[]}
                ignoreSubmissionErrors={() => {}}
                retrySubmission={() => {}}
                setMenuOpen={() => {}}
              />
              <Button text="Filled" variant="filled" onPress={() => {}} />
              <Button text="Tonal" variant="tonal" onPress={() => {}} />
              <Button text="Outlined" variant="outlined" onPress={() => {}} />
              <Button text="Elevated" variant="elevated" onPress={() => {}} />
              <Button text="Text" variant="text" onPress={() => {}} />
              <M3Switch value={scheme === 'dark'} onValueChange={() => {}} />
              <TextInput label="Token" value="abc" onChangeText={() => {}} />
              <List
                lists={[{
                  title: 'Section',
                  items: [
                    { id: 'one', title: 'First', iconTone: 'primary', chevron: true, onPress: () => {} },
                    { id: 'two', title: 'Middle', indented: true, switch: { value: true, onValueChange: () => {} } },
                    { id: 'three', title: 'Last', subtitle: 'Downloading', badge: { label: 'Ready', tone: 'success' }, loading: true },
                  ],
                }]}
              />
              <Card
                subjectType={KANJI}
                reviewType={MEANING}
                reviewQuestion="女"
                reviewAnswer="Woman"
                meaningMnemonic="A <kanji>woman</kanji> with <reading>her</reading> arms."
                deckProps={{
                  isFirstCard: true,
                  revealed: false,
                  mnemonicToggled: false,
                  getClearInterpolation: () => 0,
                  reveal: () => {},
                  toggleMnemonic: () => {},
                }}
              />
              <Card
                subjectType={KANJI}
                reviewType={MEANING}
                reviewQuestion="女"
                reviewAnswer="Woman"
                meaningMnemonic="A <kanji>woman</kanji> with <reading>her</reading> arms."
                deckProps={{
                  isFirstCard: true,
                  revealed: true,
                  mnemonicToggled: false,
                  getClearInterpolation: () => 0,
                  reveal: () => {},
                  toggleMnemonic: () => {},
                }}
              />
              <Card
                subjectType={KANJI}
                reviewType={MEANING}
                reviewQuestion="女"
                reviewAnswer="Woman"
                meaningMnemonic="A <kanji>woman</kanji> with <reading>her</reading> arms."
                deckProps={{
                  isFirstCard: true,
                  revealed: true,
                  mnemonicToggled: true,
                  getClearInterpolation: () => 0,
                  reveal: () => {},
                  toggleMnemonic: () => {},
                }}
              />
              <Card
                subjectType={KANA_VOCAB}
                reviewType={MEANING}
                reviewQuestion="おやつ"
                reviewAnswer="Snack"
                meaningMnemonic="An afternoon snack."
                deckProps={{
                  isFirstCard: false,
                  revealed: false,
                  mnemonicToggled: false,
                  getClearInterpolation: () => 0,
                  reveal: () => {},
                  toggleMnemonic: () => {},
                }}
              />
              <Card
                subjectType={KANJI}
                reviewType={READING}
                reviewQuestion="人"
                reviewAnswer="にん, じん"
                readingTypeLabel="On'yomi"
                readingMnemonic="Imagine a <kanji>person</kanji> at Nintendo."
                deckProps={{
                  isFirstCard: false,
                  revealed: false,
                  mnemonicToggled: false,
                  getClearInterpolation: () => 0,
                  reveal: () => {},
                  toggleMnemonic: () => {},
                }}
              />
              <TextWithMarkups text="Use <radical>ground</radical> and <vocabulary>word</vocabulary>." />
              <VoicePanel
                state={{ phase: 'off', message: '', detail: '' }}
                session={{ start: () => {}, stop: () => {}, pass: () => {}, retry: () => {} }}
                colors={theme[scheme]}
                engineLabel="Parakeet"
                onOpenVoiceSettings={onOpenVoiceSettings}
              />
              {['listening', 'speaking', 'processing', 'correction', 'correct', 'answer', 'manual'].map(phase => (
                <VoicePanel
                  key={phase}
                  state={{ phase, message: `Phase ${phase}`, detail: phase === 'speaking' ? '“tree”' : '' }}
                  session={{ start: () => {}, stop: () => {}, pass: () => {}, retry: () => {} }}
                  colors={theme[scheme]}
                  engineLabel="Parakeet"
                />
              ))}
              <Toast type={TYPES.ERROR} />
              <Modal visible title="Settings" close={() => {}}>
                <Button text="Done" onPress={() => {}} />
              </Modal>
              <SelectionDialog
                visible
                title="Review Order"
                options={[
                  { value: 'a', label: 'Random Order', description: 'Shuffle cards' },
                  { value: 'b', label: 'Lowest Level First', description: 'Lower levels first' },
                ]}
                value="a"
                onSelect={() => {}}
                onClose={() => {}}
              />
            </>,
          );
        });
      }

      const settingsBtn = root.container.queryAll(
        node => node.props.accessibilityLabel === 'Voice recognition settings',
      )[0];
      await act(async () => settingsBtn.props.onClick({ nativeEvent: {} }));
      expect(onOpenVoiceSettings).toHaveBeenCalledTimes(1);

      const json = JSON.stringify(root.container.toJSON());
      expect(json).toContain('Filled');
      expect(json).toContain('Start voice mode');
      expect(json).toContain('Parakeet');
      expect(json).toContain('Phase listening');
      expect(json).toContain('Wrap-up');
      expect(json).toContain('Show mnemonic');
      expect(json).toContain('Kana Vocabulary');
      expect(json).toContain("On'yomi");
      expect(json).toContain('woman');
      expect(json).toContain('Lowest Level First');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      mockScheme = 'light';
    }
  });
});
