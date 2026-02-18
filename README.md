# Spectrion

A powerful browser extension for analyzing API calls across browsing sessions.

## Features

- **Real-time API Monitoring**: Automatically captures and analyzes all API requests made by your browser
- **Session Management**: Stores API data across page reloads and site changes
- **Quick Access**: Click the extension icon to open a dedicated analysis tab
- **Cross-browser Compatible**: Works with Chrome, Firefox, and Edge

## Installation

### Chrome/Edge

1. Download or clone this repository
2. Install dependencies: `bun install`
3. Build the extension: `bun run build`
4. Open the browser and navigate to `chrome://extensions/` or `edge://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder

### Firefox

1. Download or clone this repository
2. Install dependencies: `bun install`
3. Build the extension: `bun run build`
4. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on" and select the `manifest.json` file

## Usage

1. Install the extension
2. Browse any website - Spectrion automatically captures API calls
3. Click the Spectrion extension icon to open the analysis tab
4. View, filter, and analyze captured API data

## Development

### Setup

```bash
bun install
```

### Build

```bash
bun run build
```

### Test

```bash
bun test
```

## License

MIT License - Copyright (c) 2026 DotJumpDot
