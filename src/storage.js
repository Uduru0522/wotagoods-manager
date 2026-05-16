export function createStorage(namespace) {
  return {
    get(key, fallbackValue = null) {
      return localStorage.getItem(`${namespace}.${key}`) ?? fallbackValue;
    },
    set(key, value) {
      localStorage.setItem(`${namespace}.${key}`, value);
    }
  };
}
