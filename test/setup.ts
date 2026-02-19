import "@testing-library/jest-dom";

global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    } as any,
  },
  runtime: {
    get lastError() {
      return (this as any)._lastError;
    },
    set lastError(value: any) {
      (this as any)._lastError = value;
    },
    sendMessage: jest.fn(),
    onInstalled: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
    get: jest.fn(),
    onActivated: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    },
  } as any,
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
    } as any,
    onCompleted: {
      addListener: jest.fn(),
    } as any,
    onErrorOccurred: {
      addListener: jest.fn(),
    } as any,
  },
} as any;
