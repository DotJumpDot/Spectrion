# Spectrion

A powerful browser extension for analyzing API calls across browsing sessions with real-time monitoring and session management.

Version 1.4.1 - 🎉

View on GitHub

## Table of Contents

- [Spectrion](#spectrion)
  - [Table of Contents](#table-of-contents)
  - [About](#about)
  - [Features](#features)
  - [Installation](#installation)
    - [Chrome/Edge](#chromeedge)
    - [Firefox](#firefox)
  - [Quick Start](#quick-start)
  - [Usage Examples](#usage-examples)
    - [Basic Monitoring](#basic-monitoring)
    - [Accessing Captured Data](#accessing-captured-data)
    - [Real-time Notifications](#real-time-notifications)
    - [Session Management](#session-management)
  - [API Reference](#api-reference)
    - [Main Class](#main-class)
    - [ApiMonitor](#apimonitor)
    - [SessionManager](#sessionmanager)
    - [StorageManager](#storagemanager)
  - [Browser Compatibility](#browser-compatibility)
  - [Development](#development)
    - [Setup](#setup)
    - [Build](#build)
    - [Test](#test)
    - [Project Structure](#project-structure)
  - [Contributing](#contributing)
    - [Development Setup](#development-setup)
    - [Development Commands](#development-commands)
  - [License](#license)
  - [Changelog](#changelog)
  - [Support](#support)

## About

Spectrion is a feature-rich browser extension that provides comprehensive API monitoring and analysis capabilities. Built with TypeScript, it captures all HTTP/HTTPS requests made by your browser, organizes them into sessions, and provides detailed insights with a beautiful interface. Perfect for developers, QA engineers, and anyone who needs to debug or analyze web API behavior.

## Features

- 📡 **Real-time API Monitoring**: Automatically intercepts fetch and XMLHttpRequest calls
- 🏷️ **Session Management**: Tracks API calls per tab with intelligent session organization
- 💾 **Persistent Storage**: Stores session data across browser sessions using Chrome storage API
- 🎨 **Beautiful UI**: Modern popup and analysis interfaces with visual feedback
- 🔍 **Detailed Insights**: View headers, status codes, timing, and request/response data
- 🌐 **Cross-Browser**: Compatible with Chrome, Firefox, and Edge
- 📝 **TypeScript**: Full type definitions and type-safe operations
- 🔄 **Event-Driven**: Real-time notifications for captured API calls
- 🧪 **Well-Tested**: Comprehensive test coverage with Jest
- 📦 **Zero Runtime Dependencies**: Pure TypeScript implementation

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

## Quick Start

Once installed, Spectrion automatically starts monitoring all API calls:

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

## Usage Examples

### Basic Monitoring

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

### Accessing Captured Data

```typescript
import { spectrion } from "./src/spectrion";

// Get all sessions
const sessions = await spectrion.storageManager.getAllSessions();

// Get a specific session
const session = await spectrion.storageManager.getSessionById("session-id");

// Get active session for a tab
const activeSession = await spectrion.storageManager.getActiveSession(tabId);
```

### Real-time Notifications

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

### Session Management

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

## API Reference

### Main Class

```typescript
class Spectrion {
  static getInstance(): Spectrion;
  initialize(): Promise<void>;
  readonly sessionManager: SessionManager;
  readonly apiMonitor: ApiMonitor;
  readonly storageManager: StorageManager;
}
```

### ApiMonitor

**Methods**

| Method                 | Description                           |
| ---------------------- | ------------------------------------- |
| `onApiCall(listener)`  | Register callback for API call events |
| `offApiCall(listener)` | Remove API call listener              |
| `interceptFetch()`     | Intercept window.fetch calls          |
| `interceptXHR()`       | Intercept XMLHttpRequest calls        |

### SessionManager

**Methods**

| Method                           | Description                |
| -------------------------------- | -------------------------- |
| `getSession(tabId)`              | Get active session for tab |
| `startSession(tabId, domain)`    | Start a new session        |
| `endSession(tabId)`              | End active session         |
| `addApiCall(tabId, apiCall)`     | Add API call to session    |
| `restoreSession(tabId, session)` | Restore a session          |

### StorageManager

**Methods**

| Method                              | Description                 |
| ----------------------------------- | --------------------------- |
| `saveSession(session)`              | Save session to storage     |
| `updateSession(session)`            | Update existing session     |
| `getAllSessions()`                  | Get all stored sessions     |
| `getSessionById(id)`                | Get session by ID           |
| `saveActiveSession(tabId, session)` | Save active session for tab |
| `getActiveSession(tabId)`           | Get active session for tab  |
| `clearActiveSession(tabId)`         | Clear active session        |
| `clearAllSessions()`                | Clear all stored sessions   |

## Browser Compatibility

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 88+             |
| Safari  | 14+             |
| Edge    | 90+             |

## Development

### Setup

```bash
# Install dependencies
bun install
```

### Build

```bash
# Production build
bun run build

# Development build with watch mode
bun run dev
```

### Test

```bash
# Run tests
bun test

# Run tests in watch mode
bun run test:watch

# Run type checking
bun run lint
```

### Project Structure

```
Spectrion/
├── src/
│   ├── core/
│   │   ├── apiMonitor.ts        # API interception
│   │   ├── sessionManager.ts   # Session management
│   │   ├── storageManager.ts   # Data persistence
│   │   ├── background/         # Background scripts
│   │   ├── content/            # Content scripts
│   │   ├── popup/               # Popup UI
│   │   └── analysis/           # Analysis UI
│   └── spectrion.ts            # Main entry point
├── test/                       # Test files
├── icons/                      # Extension icons
├── manifest.json                # Extension manifest
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── webpack.config.js           # Build config
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Spectrion.git
cd Spectrion

# Install dependencies
bun install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
bun test

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

### Development Commands

```bash
# Install dependencies
bun install

# Run type checking
bun run lint

# Run tests
bun test

# Build extension
bun run build
```

## License

MIT License - Copyright (c) 2026 DotJumpDot

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/DotJumpDot/Spectrion/issues)
- 📖 Documentation: [AGENTS.md](AGENTS.md)

---

<div align="center">

<b>Made with ❤️ by DotJumpDot</b>

[⬆ Back to Top](#spectrion-)

</div>
