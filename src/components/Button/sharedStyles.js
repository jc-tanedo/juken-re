import theme from 'src/common/theme';
import device from 'src/utils/device';

export const wrapper = device({
  base: {
    position: 'relative',
    width: '100%',
    height: 56,
    backgroundColor: theme.light.primaryContainer,
    borderRadius: theme.shape.full,
    overflow: 'hidden',
  },
  web: {
    userSelect: 'none',
  },
});

export const wrapper_dark = {
  backgroundColor: theme.dark.primaryContainer,
};

export const container = {
  width: '100%',
  height: '100%',
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: theme.space.lg,
  paddingVertical: theme.padding.touchable,
};

export const text = {
  ...theme.type.labelLarge,
  color: theme.light.onPrimaryContainer,
  zIndex: 1,
};

export const text_dark = {
  color: theme.dark.onPrimaryContainer,
};
