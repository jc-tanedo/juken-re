import theme from 'src/common/theme';
import device from 'src/utils/device';

export const wrapper = device({
  base: {
    position: 'relative',
    width: '100%',
    height: theme.height.touchable,
    backgroundColor: theme.light.primaryContainer,
    borderRadius: theme.radius.touchable,
    overflow: 'hidden',
  },
  web: {
    userSelect: 'none'
  }
});

export const wrapper_dark = {
  backgroundColor: theme.dark.primaryContainer,
};

export const container = {
  width: '100%',
  height: '100%',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.padding.touchable,
};

export const text = {
  ...theme.type.label,
  color: theme.light.onPrimaryContainer,
  zIndex: 1,
};

export const text_dark = {
  color: theme.dark.onPrimaryContainer,
};