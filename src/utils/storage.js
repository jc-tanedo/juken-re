import device from 'src/utils/device';

function resolveBackend() {
  const native = device('mobile');
  const backend = native
    ? require('@react-native-async-storage/async-storage').default
    : require('localforage');
  return { native, backend };
}

/**
 * Produces a stable non-raw hash so API tokens are not written verbatim into storage keys.
 */
export function hashToken(token) {
  const input = String(token || 'anonymous');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash * 33) ^ input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

/**
 * Returns a lazy storage adapter that stores string values without JSON-encoding.
 */
export function getRawStorage() {
  return {
    async getItem(key) {
      const { backend } = resolveBackend();
      return backend.getItem(key);
    },
    async setItem(key, value) {
      const { backend } = resolveBackend();
      return backend.setItem(key, value);
    },
    async removeItem(key) {
      const { backend } = resolveBackend();
      return backend.removeItem(key);
    },
  };
}

/**
 * Returns a lazy JSON-serializing storage adapter compatible with both
 * AsyncStorage (strings on native) and localForage (structured values on web).
 */
export function createJsonStorage() {
  return {
    async getItem(key) {
      const { native, backend } = resolveBackend();
      const value = await backend.getItem(key);
      if (value == null) return null;
      return native && typeof value === 'string' ? JSON.parse(value) : value;
    },
    async setItem(key, value) {
      const { native, backend } = resolveBackend();
      return backend.setItem(key, native ? JSON.stringify(value) : value);
    },
    async removeItem(key) {
      const { backend } = resolveBackend();
      return backend.removeItem(key);
    },
  };
}

export default createJsonStorage();
