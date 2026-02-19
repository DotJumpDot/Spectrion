# Changelog

All notable changes to Spectrion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-19

### Added

- Initial release of Spectrion browser extension
- Real-time API monitoring with Fetch and XHR interception
- Session management for tracking API calls across browsing sessions
- Persistent storage using Chrome storage API with localStorage fallback
- Popup interface for quick access to captured data
- New tab analysis interface for detailed API call inspection
- Cross-browser support (Chrome, Firefox, Edge)
- TypeScript implementation for type safety
- Event-driven architecture for real-time notifications
- Comprehensive test coverage with Jest
- Webpack bundling configuration
- Content script injection for seamless integration

### Features

- **API Monitoring**: Automatically intercepts all fetch and XMLHttpRequest calls
- **Session Tracking**: Manages active sessions per browser tab
- **Data Persistence**: Stores session data across browser sessions
- **Event System**: Real-time notifications for captured API calls
- **Cross-Tab Communication**: Coordinates data between extension components
- **Responsive UI**: Popup and analysis interfaces with visual feedback

### Technical Details

- Manifest V3 compatibility
- Service worker background script
- Content scripts with document_start injection
- Web accessible resources for injected scripts
- TypeScript strict mode enabled
- Comprehensive unit and integration tests

[Unreleased]: https://github.com/DotJumpDot/Spectrion/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/DotJumpDot/Spectrion/releases/tag/v1.0.0
