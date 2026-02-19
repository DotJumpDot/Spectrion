import "@testing-library/jest-dom";

if (typeof document === "undefined") {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
  });
  global.document = dom.window.document;
  global.window = dom.window as any;
  global.navigator = dom.window.navigator;
  global.MouseEvent = dom.window.MouseEvent;
  global.Event = dom.window.Event;
  global.HTMLElement = dom.window.HTMLElement;
}

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
