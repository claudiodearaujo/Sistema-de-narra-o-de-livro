import { afterEach, beforeAll } from 'vitest';

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

beforeAll(() => {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
    },
    configurable: true,
  });
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
