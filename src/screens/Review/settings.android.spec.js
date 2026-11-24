import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import ReviewMenu from './ReviewMenu';

jest.mock('easy-peasy', () => ({
  useStoreActions: () => jest.fn(),
  useStoreState: selector => selector({ session: { userSettings: {} } }),
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
