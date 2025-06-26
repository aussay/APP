let store: { [key: string]: string } = {};

const mockAsyncStorage = {
  getItem: jest.fn(async (key: string): Promise<string | null> => {
    return store[key] || null;
  }),
  setItem: jest.fn(async (key: string, value: string): Promise<void> => {
    store[key] = value;
  }),
  removeItem: jest.fn(async (key: string): Promise<void> => {
    delete store[key];
  }),
  clear: jest.fn(async (): Promise<void> => {
    store = {};
  }),
  getAllKeys: jest.fn(async (): Promise<string[]> => {
    return Object.keys(store);
  }),
  multiGet: jest.fn(async (keys: string[]): Promise<Array<[string, string | null]>> => {
    return keys.map(key => [key, store[key] || null]);
  }),
  multiSet: jest.fn(async (keyValuePairs: Array<[string, string]>): Promise<void> => {
    keyValuePairs.forEach(([key, value]) => {
      store[key] = value;
    });
  }),
  multiRemove: jest.fn(async (keys: string[]): Promise<void> => {
    keys.forEach(key => {
      delete store[key];
    });
  }),
  multiMerge: jest.fn(async (keyValuePairs: Array<[string, string]>): Promise<void> => {
    keyValuePairs.forEach(([key, value]) => {
      // Basic merge, for complex objects, JSON.parse and merge might be needed
      const existingValue = store[key];
      if (existingValue) {
        try {
          const existingObj = JSON.parse(existingValue);
          const newObj = JSON.parse(value);
          store[key] = JSON.stringify({ ...existingObj, ...newObj });
        } catch (e) {
          // If not valid JSON, overwrite
          store[key] = value;
        }
      } else {
        store[key] = value;
      }
    });
  }),
  useAsyncStorage: jest.fn((key: string) => ({
    getItem: jest.fn(() => mockAsyncStorage.getItem(key)),
    setItem: jest.fn((value: string) => mockAsyncStorage.setItem(key, value)),
    removeItem: jest.fn(() => mockAsyncStorage.removeItem(key)),
    mergeItem: jest.fn((value: string) => mockAsyncStorage.multiMerge([[key, value]])),
  })),
  // Helper to clear the store for tests
  __clearStore: () => {
    store = {};
  },
  // Helper to get the whole store for assertions
  __getStore: () => {
    return store;
  }
};

export default mockAsyncStorage;
