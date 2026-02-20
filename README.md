<div align="center">

  <h1>Spectrion 📡</h1>

  <p>The most powerful browser extension for analyzing API calls across browsing sessions with <b>real-time monitoring</b> and <b>session management</b></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://badge.fury.io/js/spectrion.svg)](https://www.npmjs.com/package/spectrion)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg)](https://www.typescriptlang.org/)
[![Zero Runtime Dependencies](https://img.shields.io/badge/Zero%20Runtime%20Dependencies-2ecc71.svg)](https://github.com/DotJumpDot/Spectrion)

<b>Version 1.4.1 - Official Release</b> 🚀

[View on GitHub](https://github.com/DotJumpDot/Spectrion)

</div>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About](#about)
- [Features](#features)
- [Installation](#installation)
  - [Chrome/Edge](#chromeedge)
  - [Firefox](#firefox)
- [Quick Start](#quick-start)
  - [Usage Examples](#usage-examples)
  - [Interface include](#interface-include)
- [API Reference](#api-reference)
  - [Main Class](#main-class)
  - [ApiMonitor](#apimonitor)
  - [SessionManager](#sessionmanager)
  - [StorageManager](#storagemanager)
- [Use Cases](#use-cases)
  - [1. API Debugging](#1-api-debugging)
  - [2. Performance Analysis](#2-performance-analysis)
  - [3. Session Tracking](#3-session-tracking)
- [License](#license)
- [Support](#support)

---

## About

Spectrion is a feature-rich browser extension that provides comprehensive API monitoring and analysis capabilities. Built with TypeScript, it captures all HTTP/HTTPS requests made by your browser, organizes them into sessions, and provides detailed insights with a beautiful interface. Perfect for developers, QA engineers, and anyone who needs to debug or analyze web API behavior. Most API monitoring tools only show you raw request/response data. Spectrion goes further by **organizing calls into sessions** and providing **real-time notifications** with detailed timing and header analysis.

---

## Features

<div align="center">

  <table>
    <tr>
      <td align="center" width="25%">
        📡<br><b>Real-time API Monitoring</b>
      </td>
      <td align="center" width="25%">
        🏷️<br><b>Session Management</b>
      </td>
      <td align="center" width="25%">
        �<br><b>Persistent Storage</b>
      </td>
      <td align="center" width="25%">
        🎨<br><b>Beautiful UI</b>
      </td>
    </tr>
    <tr>
      <td align="center" width="25%">
        🔍<br><b>Detailed Insights</b>
      </td>
      <td align="center" width="25%">
        🌐<br><b>Cross-Browser</b>
      </td>
      <td align="center" width="25%">
        📝<br><b>TypeScript</b>
      </td>
      <td align="center" width="25%">
        🔄<br><b>Event-Driven</b>
      </td>
    </tr>
  </table>

</div>

- **Real-time API Monitoring**: Automatically intercepts fetch and XMLHttpRequest calls
- **Session Management**: Tracks API calls per tab with intelligent session organization
- **Persistent Storage**: Stores session data across browser sessions using Chrome storage API
- **Beautiful UI**: Modern popup and analysis interfaces with visual feedback
- **Detailed Insights**: View headers, status codes, timing, and request/response data
- **Cross-Browser**: Compatible with Chrome, Firefox, and Edge
- **TypeScript**: Full type definitions and type-safe operations
- **Event-Driven**: Real-time notifications for captured API calls
- **Well-Tested**: Comprehensive test coverage with Jest
- **Zero Runtime Dependencies**: Pure TypeScript implementation

---

## Installation

### Chrome/Edge

```bash
# Clone the repository
git clone https://github.com/DotJumpDot/Spectrion.git
cd Spectrion

# Install dependencies
bun install

# Build the extension
bun run build

# Load the extension
# 1. Open chrome://extensions/ or edge://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the dist folder
```

### Firefox

```bash
# Clone the repository
git clone https://github.com/DotJumpDot/Spectrion.git
cd Spectrion

# Install dependencies
bun install

# Build the extension
bun run build

# Load the extension
# 1. Open about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select manifest.json file
```

---

## Quick Start

### Usage Examples

```typescript
// Spectrion automatically initializes on page load
// No manual setup required!

// Access the Spectrion instance
import { spectrion } from "./src/spectrion";

// Get all captured sessions
const sessions = await spectrion.storageManager.getAllSessions();

// Listen for new API calls
spectrion.apiMonitor.onApiCall((call) => {
  console.log("New API call captured:", call);
});
```

```typescript
// Spectrion automatically monitors all fetch and XHR requests
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ key: "value" }),
});
```

### Interface include

```typescript
import { spectrion } from "./src/spectrion";

// Get all sessions
const sessions = await spectrion.storageManager.getAllSessions();

// Get a specific session
const session = await spectrion.storageManager.getSessionById("session-id");

// Get active session for a tab
const activeSession = await spectrion.storageManager.getActiveSession(tabId);
```

```typescript
import { spectrion } from "./src/spectrion";

// Listen for API calls
spectrion.apiMonitor.onApiCall((call) => {
  console.log("URL:", call.url);
  console.log("Method:", call.method);
  console.log("Status:", call.statusCode);
  console.log("Duration:", call.duration, "ms");
});

// Stop listening
spectrion.apiMonitor.offApiCall(listener);
```

---

## API Reference

### Main Class

| Method          | Description                          | Parameters | Returns         |
| --------------- | ------------------------------------ | ---------- | --------------- |
| `getInstance()` | Get the singleton Spectrion instance | None       | Spectrion       |
| `initialize()`  | Initialize Spectrion modules         | None       | Promise\<void\> |

### ApiMonitor

**Methods**

| Method                 | Description                           | Parameters                                                  | Returns |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------- | ------- |
| `onApiCall(listener)`  | Register callback for API call events | `listener` (function) - Function called with ApiCall object | void    |
| `offApiCall(listener)` | Remove API call listener              | `listener` (function) - Listener to remove                  | void    |
| `interceptFetch()`     | Intercept window.fetch calls          | None                                                        | void    |
| `interceptXHR()`       | Intercept XMLHttpRequest calls        | None                                                        | void    |

### SessionManager

**Methods**

| Method                           | Description                | Parameters                                                               | Returns              |
| -------------------------------- | -------------------------- | ------------------------------------------------------------------------ | -------------------- |
| `getSession(tabId)`              | Get active session for tab | `tabId` (number) - Browser tab ID                                        | Session \| undefined |
| `startSession(tabId, domain)`    | Start a new session        | `tabId` (number) - Browser tab ID<br>`domain` (string) - Domain name     | Session              |
| `endSession(tabId)`              | End active session         | `tabId` (number) - Browser tab ID                                        | void                 |
| `addApiCall(tabId, apiCall)`     | Add API call to session    | `tabId` (number) - Browser tab ID<br>`apiCall` (ApiCall) - API call data | void                 |
| `restoreSession(tabId, session)` | Restore a session          | `tabId` (number) - Browser tab ID<br>`session` (Session) - Session data  | void                 |

### StorageManager

**Methods**

| Method                              | Description                 | Parameters                                                              | Returns                         |
| ----------------------------------- | --------------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `saveSession(session)`              | Save session to storage     | `session` (Session) - Session data                                      | Promise\<void\>                 |
| `updateSession(session)`            | Update existing session     | `session` (Session) - Session data                                      | Promise\<void\>                 |
| `getAllSessions()`                  | Get all stored sessions     | None                                                                    | Promise\<Session[]\>            |
| `getSessionById(id)`                | Get session by ID           | `id` (string) - Session ID                                              | Promise\<Session \| undefined\> |
| `saveActiveSession(tabId, session)` | Save active session for tab | `tabId` (number) - Browser tab ID<br>`session` (Session) - Session data | Promise\<void\>                 |
| `getActiveSession(tabId)`           | Get active session for tab  | `tabId` (number) - Browser tab ID                                       | Promise\<Session \| undefined\> |
| `clearActiveSession(tabId)`         | Clear active session        | `tabId` (number) - Browser tab ID                                       | Promise\<void\>                 |
| `clearAllSessions()`                | Clear all stored sessions   | None                                                                    | Promise\<void\>                 |

---

## Use Cases

### 1. API Debugging

Debug API calls in real-time during development:

```typescript
import { spectrion } from "./src/spectrion";

spectrion.apiMonitor.onApiCall((call) => {
  if (call.url.includes("/api/")) {
    console.log(`API Call: ${call.method} ${call.url}`);
    console.log(`Status: ${call.statusCode}`);
    console.log(`Headers:`, call.headers);
    console.log(`Body:`, call.body);
  }
});
```

### 2. Performance Analysis

Track API response times for performance optimization:

```typescript
import { spectrion } from "./src/spectrion";

spectrion.apiMonitor.onApiCall((call) => {
  if (call.duration > 1000) {
    console.warn(`Slow API detected: ${call.url} took ${call.duration}ms`);
    console.warn(`Status: ${call.statusCode}, Method: ${call.method}`);
  }
});
```

### 3. Session Tracking

Organize and track API calls across different browsing sessions:

```typescript
import { spectrion } from "./src/spectrion";

// Start a new session for a tab
const session = spectrion.sessionManager.startSession(tabId, "example.com");

// Add API calls to session
spectrion.sessionManager.addApiCall(tabId, apiCall);

// End the session
spectrion.sessionManager.endSession(tabId);

// Save session to storage
await spectrion.storageManager.saveSession(session);
```

---

## License

MIT License - Copyright (c) 2026 [https://github.com/dotjumpdot](https://github.com/dotjumpdot)

---

## Support

- GitHub Issues: [https://github.com/DotJumpDot/Spectrion/issues](https://github.com/DotJumpDot/Spectrion/issues)
- Documentation: [AGENTS.md](AGENTS.md)

---

<div align="center">

<b>Made with ❤️ by DotJumpDot</b>

[⬆ Back to Top](#spectrion-)

</div>
