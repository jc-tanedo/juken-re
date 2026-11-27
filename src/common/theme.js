import device from 'src/utils/device';
import {
  APPRENTICE,
  BURNED,
  ENLIGHTENED,
  GURU,
  KANA_VOCAB,
  KANJI,
  MASTER,
  RADICAL,
  VOCAB,
} from 'src/common/constants';

const light = {
  surface: '#F4FAF8',
  surfaceDim: '#D8E5E0',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EDF6F3',
  surfaceContainer: '#E4F1ED',
  surfaceContainerHigh: '#D8EAE4',
  surfaceContainerHighest: '#CCE2DB',
  onSurface: '#142620',
  onSurfaceVariant: '#405951',
  outline: '#729087',
  outlineVariant: '#BDD4CC',
  primary: '#006B5A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#A9F2D9',
  onPrimaryContainer: '#00382E',
  secondary: '#3E6385',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D8E8FF',
  onSecondaryContainer: '#163659',
  tertiary: '#79581A',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFE1A8',
  onTertiaryContainer: '#483003',
  success: '#267759',
  onSuccess: '#FFFFFF',
  successContainer: '#C7F1D8',
  onSuccessContainer: '#123E2B',
  warning: '#7A590C',
  onWarning: '#FFFFFF',
  warningContainer: '#FFE09B',
  onWarningContainer: '#402C00',
  error: '#A43640',
  onError: '#FFFFFF',
  errorContainer: '#FFDADD',
  onErrorContainer: '#691522',
  inverseSurface: '#273933',
  inverseOnSurface: '#E6F3EE',
  inversePrimary: '#83DEBF',
  scrim: 'rgba(11, 21, 18, 0.56)',
  ripple: 'rgba(0, 107, 90, 0.14)',
  stateHover: 'rgba(20, 38, 32, 0.08)',
  statePressed: 'rgba(20, 38, 32, 0.12)',
};

const dark = {
  surface: '#101D1A',
  surfaceDim: '#0B1512',
  surfaceBright: '#355249',
  surfaceContainerLowest: '#0B1512',
  surfaceContainerLow: '#172722',
  surfaceContainer: '#1B2D27',
  surfaceContainerHigh: '#243A33',
  surfaceContainerHighest: '#2E4840',
  onSurface: '#EBF7F0',
  onSurfaceVariant: '#BCD3C9',
  outline: '#8BA99E',
  outlineVariant: '#405D53',
  primary: '#83DEBF',
  onPrimary: '#00382E',
  primaryContainer: '#075143',
  onPrimaryContainer: '#B3F5E1',
  secondary: '#A6C9EC',
  onSecondary: '#0F3050',
  secondaryContainer: '#243F60',
  onSecondaryContainer: '#D8E8FF',
  tertiary: '#EBC278',
  onTertiary: '#422C00',
  tertiaryContainer: '#5D4516',
  onTertiaryContainer: '#FFE1A8',
  success: '#82DDB1',
  onSuccess: '#063822',
  successContainer: '#184734',
  onSuccessContainer: '#C7F1D8',
  warning: '#F1C76F',
  onWarning: '#3F2C00',
  warningContainer: '#59410E',
  onWarningContainer: '#FFE09B',
  error: '#FFB3BA',
  onError: '#62121D',
  errorContainer: '#571F2B',
  onErrorContainer: '#FFDADD',
  inverseSurface: '#DFECE6',
  inverseOnSurface: '#1E302A',
  inversePrimary: '#006B5A',
  scrim: 'rgba(5, 11, 9, 0.68)',
  ripple: 'rgba(131, 222, 191, 0.16)',
  stateHover: 'rgba(235, 247, 240, 0.08)',
  statePressed: 'rgba(235, 247, 240, 0.12)',
};

const subjectColors = {
  light: {
    [RADICAL]: { container: '#D8EEFF', foreground: '#0E3C66' },
    [KANJI]: { container: '#FFD9E9', foreground: '#7D204D' },
    [VOCAB]: { container: '#EDDDFF', foreground: '#512880' },
    [KANA_VOCAB]: { container: '#EDDDFF', foreground: '#512880' },
  },
  dark: {
    [RADICAL]: { container: '#183B5E', foreground: '#CCE6FF' },
    [KANJI]: { container: '#59233F', foreground: '#FFD1E3' },
    [VOCAB]: { container: '#493263', foreground: '#EDDDFF' },
    [KANA_VOCAB]: { container: '#493263', foreground: '#EDDDFF' },
  },
};

const srsColors = {
  light: {
    [APPRENTICE]: { container: '#FFD9EC', foreground: '#6B1245' },
    [GURU]: { container: '#F1DBFF', foreground: '#4D1A66' },
    [MASTER]: { container: '#DCE4FF', foreground: '#19317A' },
    [ENLIGHTENED]: { container: '#D2EEFF', foreground: '#064469' },
    [BURNED]: { container: '#DCE5E1', foreground: '#22332D' },
  },
  dark: {
    [APPRENTICE]: { container: '#691947', foreground: '#FFD9EC' },
    [GURU]: { container: '#4D2263', foreground: '#F1DBFF' },
    [MASTER]: { container: '#243778', foreground: '#DCE4FF' },
    [ENLIGHTENED]: { container: '#134669', foreground: '#D2EEFF' },
    [BURNED]: { container: '#2E403A', foreground: '#DCE5E1' },
  },
};

const type = {
  displayLarge: { fontSize: 48, lineHeight: 52, fontWeight: '800', letterSpacing: -1.5 },
  displayMedium: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -0.8 },
  displaySmall: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.4 },
  headlineLarge: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  headlineMedium: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '700', letterSpacing: 0.15 },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.1 },
  bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  bodyMedium: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.5 },
  // Legacy aliases retained for existing consumers
  display: { fontSize: 48, lineHeight: 52, fontWeight: '800', letterSpacing: -1.5 },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 21, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.1 },
};

const shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
  full: 9999,
};

const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const elevation = {
  level0: {},
  level1: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  level2: {
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  level3: {
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
};

const palette = {
  blue: 'rgb(30, 203, 225)',
  green: 'rgb(83, 242, 185)',
  red: 'rgb(255, 149, 143)',
  black: light.onSurface,
  white: 'rgb(255, 255, 255)',
  yellow: 'rgb(250, 191, 79)',
  gray: light.outlineVariant,
  lightGray: light.surfaceContainer,
  darkGray: light.onSurfaceVariant,
};

const palette_dark = {
  blue: dark.primary,
  green: dark.success,
  red: dark.error,
  black: dark.surface,
  white: 'rgb(255, 255, 255)',
  yellow: dark.tertiaryContainer,
  gray: dark.surfaceContainer,
  lightGray: dark.onSurfaceVariant,
  mediumGray: dark.surfaceContainerHigh,
};

const color = {
  primary: palette.blue,
  correct: palette.green,
  incorrect: palette.red,
  radical: 'rgb(27, 163, 247)',
  kanji: 'rgb(239, 25, 160)',
  vocab: 'rgb(160, 35, 238)',
  githubBlack: '#333',
  githubWhite: '#fafafa',
  apprentice: '#dd0093',
  guru: '#882d9e',
  master: '#294ddb',
  enlightened: '#0093dd',
  burned: '#434343',
};

const color_dark = {
  primary: palette_dark.blue,
  correct: palette_dark.green,
  incorrect: palette_dark.red,
  radical: 'rgb(27, 163, 247)',
  kanji: 'rgb(239, 25, 160)',
  vocab: 'rgb(160, 35, 238)',
  githubBlack: '#333',
  githubWhite: '#fafafa',
  apprentice: '#dd0093',
  guru: '#882d9e',
  master: '#294ddb',
  enlightened: '#0093dd',
  burned: '#434343',
};

const bg = {
  body: light.surface,
  card: light.surfaceContainerLowest,
};

const bg_dark = {
  body: dark.surface,
  card: dark.surfaceContainerLow,
};

const padding = {
  body: 24,
  card: 20,
  touchable: 12,
};

const radius = {
  card: shape.extraLarge,
  touchable: shape.full,
};

const height = device({
  base: { touchable: 52 },
  web: { statusBar: 22 },
  mobile: { statusBar: 8 },
});

export default {
  light,
  dark,
  subjectColors,
  srsColors,
  type,
  shape,
  space,
  elevation,
  palette,
  palette_dark,
  color,
  color_dark,
  bg,
  bg_dark,
  padding,
  radius,
  height,
};
