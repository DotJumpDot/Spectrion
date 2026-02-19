# Spectrion Development Team

**Version: 1.4.0** - 2026-02-19

This document outlines roles and responsibilities of agents involved in Spectrion project.

## Core Development Agents

### API Monitoring Agent

- Implements ApiMonitor class for intercepting Fetch and XHR requests
- Captures detailed API call data including headers, status codes, and timing
- Manages event listeners for real-time API notifications
- Located in `src/core/apiMonitor.ts`

### Session Management Agent

- Implements SessionManager class for tracking browsing sessions
- Manages active sessions across browser tabs
- Handles session lifecycle (start, end, restore)
- Adds API calls to active sessions
- Located in `src/core/sessionManager.ts`

### Storage Management Agent

- Implements StorageManager class for persistent data storage
- Handles Chrome storage API and localStorage fallback
- Manages session persistence across browser sessions
- Provides CRUD operations for session data
- Located in `src/core/storageManager.ts`

### Extension Architecture Agent

- Responsible for manifest.json configuration
- Implements background service worker for extension coordination
- Manages content scripts injection and web accessible resources
- Handles cross-tab communication via chrome.runtime messaging
- Configures permissions and host permissions for API monitoring

### Frontend/UI Agent

- Creates popup interface (popup.html, popup.css, popup.ts)
- Develops new tab analysis interface (analysis.html, analysis.css, analysis.ts)
- Implements visual feedback and user interactions
- Handles content script injection (content.ts, injected.js)

### Testing Agent

- Writes comprehensive unit tests for core functionality
- Implements integration tests with Jest and jsdom environment
- Tests API monitoring, session management, and storage operations
- Ensures extension compatibility across browsers
- Develops performance and scalability tests for high-frequency operations
- Creates real-world API scenario tests (REST, GraphQL, authentication, pagination)
- Validates edge cases and data integrity
- Located in `test/` directory

## Agent Collaboration

- All agents coordinate through version control
- Regular code reviews ensure quality and consistency
- Documentation updates accompany all feature changes
- Core modules export unified API through `src/spectrion.ts`

## Project Runtime

**IMPORTANT**: This project uses **Bun** as the runtime package manager instead of npm. All package operations should use `bun` commands:

- Install dependencies: `bun install`
- Run build: `bun run build`
- Run tests: `bun test`
- Add packages: `bun add <package-name>`
- Development mode: `bun run dev`

## Core Architecture

### Main Entry Point

- `src/spectrion.ts`: Main Spectrion class that coordinates all modules
- Singleton pattern for consistent instance management
- Automatic initialization on page load

### Core Modules

- `src/core/apiMonitor.ts`: Intercepts and captures API calls
- `src/core/sessionManager.ts`: Manages browsing sessions
- `src/core/storageManager.ts`: Handles persistent storage

### Extension Scripts

- `src/core/background/background.ts`: Background service worker
- `src/core/content/content.ts`: Content script for page injection
- `src/core/content/injected.js`: Injected script for API monitoring

### UI Components

- `src/core/popup/`: Extension popup interface
- `src/core/analysis/`: New tab analysis interface

## Build Configuration

- TypeScript for type safety
- Webpack for bundling
- Jest for testing
- Supports Chrome, Firefox, and Edge browsers
