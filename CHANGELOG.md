# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-02-19

### Added

- Enhanced Analysis page UI with full-width Request Details panel
- Vertical scrolling support for long API response bodies
- Standardized SVG icons for better visual consistency
- Improved button styling with secondary outline style for action buttons
- Native Bun test runner support with custom configuration

### Fixed

- Fixed zero API calls issue in Analytics page by including active sessions
- Fixed tab-specific analytics loading logic
- Resolved Edge browser compatibility issues by removing insecure CSP directives
- Replaced CDN dependencies with local packages for better security
- Fixed various test failures and environment mismatches

## [1.3.0] - 2026-02-19

### Added

- Full Information Mode toggle in Settings modal to capture request/response headers and bodies
- Status indicator in header showing current mode (Reduced Mode / Full Info Mode)
- Real-time mode update with visual feedback (gray/green dot indicator)
- URL history clearing support in Clear button functionality

### Fixed

- Fixed Clear button to properly delete all API calls, sessions, and URL history
- Fixed toggle switch click handler to properly switch between modes
- Fixed API call details display to handle missing headers when in Reduced Mode
- Added null checks for requestHeaders and responseHeaders to prevent errors
- Reduced polling interval from 5s to 2s for faster mode switching

### Changed

- Enhanced user feedback with informative alert messages when enabling Full Information Mode
- Improved Settings modal layout with toggle switch for mode selection
- Updated local state clearing to include URL history and tab sessions

## [1.2.0] - 2026-02-19

### Added

- Comprehensive test suite with 88 test cases covering all core functionality
- Test coverage for API monitoring, session management, and integration scenarios
- Performance and scalability tests for high-frequency operations
- Real-world API scenario tests (REST, GraphQL, authentication, pagination)
- Edge case handling tests (large datasets, rapid operations, special characters)
- Data integrity and immutability tests

### Fixed

- Fixed request headers capture to properly convert Headers objects to plain JavaScript objects
- Fixed response headers capture for both fetch and XHR requests
- Fixed request body display to properly format JSON objects instead of showing `[object Object]`
- Fixed response body capture to include complete response data with proper formatting
- Added `onBeforeSendHeaders` listener to capture request headers from WebRequest API
- Improved request body decoding using TextDecoder for proper UTF-8 handling
- Enhanced display formatting in analysis page with proper JSON indentation

### Changed

- Improved header parsing logic in injected script to handle various header formats
- Enhanced error handling for malformed headers and response data
- Updated CSS for better code block display with `<pre>` tags
- Refined TypeScript types to handle optional properties more robustly

## [1.1.0] - 2026-02-17

### Added

- URL/Title toggle button with swap icon for better UX
- Improved dropdown UI in popup with custom styled dropdown
- Analysis dropdown now reflects current display mode (URL or site name)
- Better visual feedback with hover states and animations
- Tab selector shows both title and hostname for clarity

### Changed

- Replaced checkmark icon with more appropriate swap icon
- Enhanced dropdown styling with smooth animations and transitions
- Improved tab selector with icon placeholder and structured layout

### Fixed

- Analysis dropdown now correctly shows URLs when in URL mode and site names when in site name mode
- Fixed TypeScript type safety issues in popup dropdown
- Dropdown now re-renders when switching between URL and title display modes

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

[Unreleased]: https://github.com/DotJumpDot/Spectrion/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/DotJumpDot/Spectrion/releases/tag/v1.1.0
[1.0.0]: https://github.com/DotJumpDot/Spectrion/releases/tag/v1.0.0
