import { action, computed, thunk } from 'easy-peasy';
import { GET, DEMO_TOKEN } from 'src/common/constants';
import { request } from 'src/features/wk/request';
import wkCache from 'src/features/wk/cache';
import { mergeDefaultSettings } from 'src/features/wk/preferences';

export const session = {
  user: null,
  token: null,
  settings: {},

  /** actions */

  saveUser: action((state, { user, token }) => {
    state.user = user;
    state.token = token;
  }),

  saveSetting: action((state, { key, value }) => {
    const token = state.token || DEMO_TOKEN;
    const currentSettings = state.settings[token];
    if (!currentSettings) state.settings[token] = {};
    state.settings[token][key] = value;
  }),

  seedDefaultsFromUser: action((state, wkPrefs) => {
    const token = state.token || DEMO_TOKEN;
    state.settings[token] = mergeDefaultSettings(state.settings[token], wkPrefs);
  }),

  logout: action(state => {
    state.user = null;
    state.token = null;
  }),

  /** computed */

  userSettings: computed(state => {
    const token = state.token || DEMO_TOKEN;
    return state.settings[token];
  }),

  /** thunks */

  login: thunk(async (action, { token, onFail }, { getStoreActions }) => {
    const { loadings } = getStoreActions();
    loadings.start('login');
    try {
      const user = await request({
        endpoint: 'user',
        method: GET,
        apiKey: token,
      });
      if (!user) throw new Error('Cannot log in');
      action.saveUser({ user, token });
      action.seedDefaultsFromUser(user?.data?.preferences);
      loadings.stop('login');
    } catch {
      onFail();
      loadings.stop('login');
    }
  }),

  refreshUser: thunk(async (action, _payload, { getState }) => {
    const { token } = getState();
    if (!token) return null;
    try {
      const user = await request({
        endpoint: 'user',
        method: GET,
        apiKey: token,
      });
      if (user) {
        action.saveUser({ user, token });
        action.seedDefaultsFromUser(user?.data?.preferences);
      }
      return user;
    } catch {
      return null;
    }
  }),

  signOut: thunk(async (action, _payload, { getState }) => {
    const { token } = getState();
    action.logout();
    if (token) {
      await wkCache.clearUserCache(token).catch(() => {});
    }
  }),
};
