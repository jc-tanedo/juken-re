import AsyncStorage from '@react-native-async-storage/async-storage';
import localForage from 'localforage';
import { createStore, persist } from 'easy-peasy';
import { loadings } from 'src/features/request/models';
import { session } from 'src/features/wk/models';
import { reviews } from 'src/features/reviews/models';
import { setTokenProvider } from 'src/features/wk/request';
import device from 'src/utils/device';

const native = device('mobile');
const storage = native ? AsyncStorage : localForage;

// Keep the existing key so users retain their sign-in and review settings.
const sessionKey = '[JukenStore]@session';
const sessionStorage = {
  async getItem(key) {
    if (key === '_') return null; // Easy Peasy probes for asynchronous storage.
    const value = await storage.getItem(sessionKey);
    return native ? JSON.parse(value) : value;
  },
  setItem(key, value) {
    return storage.setItem(sessionKey, native ? JSON.stringify(value) : value);
  },
  removeItem() {
    return storage.removeItem(sessionKey);
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
