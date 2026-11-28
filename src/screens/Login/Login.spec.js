import React, { act } from 'react';
import { Keyboard, Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import Login from 'src/screens/Login/Login';

let mockScheme = 'light';
let mockLayout = { isWide: false, isTabletop: false, paneGap: 20 };
const mockLogin = jest.fn();
const mockToastShow = jest.fn();

jest.mock('src/hooks/useColorScheme', () => () => mockScheme);
jest.mock('src/hooks/useLayoutMode', () => () => mockLayout);
jest.mock('src/utils/device', () => jest.fn(query => (
  typeof query === 'object' ? (query.base || {}) : query === 'mobile'
)));
jest.mock('@expo/react-native-action-sheet', () => ({
  useActionSheet: () => ({ showActionSheetWithOptions: jest.fn() }),
}));
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
}));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));
jest.mock('easy-peasy', () => ({
  useStoreActions: selector => selector({ session: { login: mockLogin } }),
  useStoreState: selector => selector({ loadings: { login: false } }),
}));
jest.mock('src/components/Toast/Toast', () => {
  const ReactActual = require('react');
  return {
    __esModule: true,
    TYPES: { ERROR: 'error', SUCCESS: 'success', WARNING: 'warning' },
    default: ReactActual.forwardRef((_props, ref) => {
      ReactActual.useImperativeHandle(ref, () => ({ show: mockToastShow }), []);
      return null;
    }),
  };
});

const nativeTest = Platform.OS !== 'web' ? test : test.skip;

function findButton(root, label) {
  return root.container.queryAll(
    n => n.props.accessibilityRole === 'button' && (
      n.props.accessibilityLabel === label || JSON.stringify(n.toJSON()).includes(label)
    ),
  )[0];
}

describe('Login screen', () => {
  nativeTest('renders WaniKani token guide, opens token settings, and pastes trimmed API tokens', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    const startDemo = jest.fn();
    const root = createRoot();

    try {
      for (const [scheme, wide] of [['light', false], ['dark', true]]) {
        mockScheme = scheme;
        mockLayout = { isWide: wide, isTabletop: false, paneGap: 20 };
        await act(async () => {
          root.render(<Login startDemo={startDemo} />);
        });
      }

      const json = JSON.stringify(root.container.toJSON());
      expect(json).toContain('Open WaniKani API Tokens');
      expect(json).toContain('Paste');
      expect(json).toContain('reviews:create');
      expect(json).toContain('assignments:start');
      expect(json).toContain('study_materials:create');
      expect(json).toContain('study_materials:update');

      await act(async () => {
        findButton(root, 'Open WaniKani API Tokens').props.onClick({ nativeEvent: {} });
      });
      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
        'https://www.wanikani.com/settings/personal_access_tokens',
      );

      Clipboard.getStringAsync.mockResolvedValueOnce('  wk-token-123\n');
      await act(async () => {
        findButton(root, 'Paste API token').props.onClick({ nativeEvent: {} });
        await Promise.resolve();
        await Promise.resolve();
      });

      const tokenInput = root.container.queryAll(
        n => n.props.accessibilityLabel === 'WaniKani personal access token' && typeof n.props.value === 'string',
      )[0];
      expect(tokenInput.props.value).toBe('wk-token-123');

      await act(async () => {
        findButton(root, 'Sign in').props.onClick({ nativeEvent: {} });
      });
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith({
        token: 'wk-token-123',
        onFail: expect.any(Function),
      });

      Clipboard.getStringAsync.mockResolvedValueOnce('   ');
      await act(async () => {
        findButton(root, 'Paste API token').props.onClick({ nativeEvent: {} });
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockToastShow).toHaveBeenCalledWith('Clipboard is empty');

      Clipboard.getStringAsync.mockRejectedValueOnce(new Error('denied'));
      await act(async () => {
        findButton(root, 'Paste API token').props.onClick({ nativeEvent: {} });
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockToastShow).toHaveBeenCalledWith('Could not read clipboard');
      expect(mockLogin).toHaveBeenCalledTimes(1);

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      dismissSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      mockLogin.mockReset();
      mockToastShow.mockReset();
      Clipboard.getStringAsync.mockReset();
      WebBrowser.openBrowserAsync.mockReset();
      mockScheme = 'light';
      mockLayout = { isWide: false, isTabletop: false, paneGap: 20 };
    }
  });
});
