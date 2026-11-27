import { createStore, persist } from 'easy-peasy';
import { loadings } from 'src/features/request/models';
import { session } from 'src/features/wk/models';
import { reviews } from 'src/features/reviews/models';
import { setTokenProvider } from 'src/features/wk/request';
import jsonStorage from 'src/utils/storage';

// Keep the existing key so users retain their sign-in and review settings.
const sessionKey = '[JukenStore]@session';
const sessionStorage = {
  async getItem(key) {
    if (key === '_') return null; // Easy Peasy probes for asynchronous storage.
    return jsonStorage.getItem(sessionKey);
  },
  setItem(key, value) {
    return jsonStorage.setItem(sessionKey, value);
  },
  removeItem() {
    return jsonStorage.removeItem(sessionKey);
  },
};

const store = createStore({
  session: persist(session, { storage: sessionStorage }),
  loadings,
  reviews,
}, {
  name: 'JukenStore',
});

setTokenProvider(() => store.getState().session.token);

export default store;
