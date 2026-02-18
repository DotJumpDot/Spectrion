import "@testing-library/jest-dom";

declare global {
  namespace NodeJS {
    interface Global {
      chrome: any;
    }
  }
}

(global as any).chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    lastError: null,
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
  },
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
    },
    onCompleted: {
      addListener: jest.fn(),
    },
  },
};
