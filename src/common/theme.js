import device from 'src/utils/device';

const light = {
  surface: '#F4FAF8',
  surfaceContainer: '#E4F1ED',
  surfaceContainerHigh: '#D5E8E3',
  surfaceBright: '#FFFFFF',
  onSurface: '#142620',
  onSurfaceVariant: '#405951',
  outline: '#729087',
  outlineVariant: '#BDD4CC',
  primary: '#006B5A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#A9F2D9',
  onPrimaryContainer: '#00382E',
  secondaryContainer: '#D8E8FF',
  onSecondaryContainer: '#163659',
  tertiaryContainer: '#FFE1A8',
  onTertiaryContainer: '#483003',
  success: '#267759',
  successContainer: '#C7F1D8',
  onSuccessContainer: '#123E2B',
  error: '#A43640',
  errorContainer: '#FFDADD',
  onErrorContainer: '#691522',
};

const dark = {
  surface: '#101D1A',
  surfaceContainer: '#1B2D27',
  surfaceContainerHigh: '#284039',
  surfaceBright: '#22362F',
  onSurface: '#EBF7F0',
  onSurfaceVariant: '#BCD3C9',
  outline: '#8BA99E',
  outlineVariant: '#405D53',
  primary: '#83DEBF',
  onPrimary: '#00382E',
  primaryContainer: '#075143',
  onPrimaryContainer: '#B3F5E1',
  secondaryContainer: '#243F60',
  onSecondaryContainer: '#D8E8FF',
  tertiaryContainer: '#5D4516',
  onTertiaryContainer: '#FFE1A8',
  success: '#82DDB1',
  successContainer: '#184734',
  onSuccessContainer: '#C7F1D8',
  error: '#FFB3BA',
  errorContainer: '#571F2B',
  onErrorContainer: '#FFDADD',
};

const type = {
  display: { fontSize: 48, lineHeight: 52, fontWeight: '800', letterSpacing: -2 },
  headline: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 21, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.1 },
};

const palette = {
  blue: 'rgb(30, 203, 225)', // 1ecbe1
  green: 'rgb(83, 242, 185)',
  red: 'rgb(255, 149, 143)',
  black: light.onSurface,
  white: 'rgb(255, 255, 255)',
  yellow: 'rgb(250, 191, 79)',
  gray: light.outlineVariant,
  lightGray: light.surfaceContainer,
  darkGray: light.onSurfaceVariant,
}

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
}

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
  card: light.surfaceBright,
};

const bg_dark = {
  body: palette_dark.black,
  card: palette_dark.gray,
};

const padding = {
  body: 24,
  card: 20,
  touchable: 12,
};

const radius = {
  card: 32,
  touchable: 28,
};

const height = device({
  base: { touchable: 52, },
  web: { statusBar: 22 },
  mobile: { statusBar: 8 }
});

export default {
  light,
  dark,
  type,
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
