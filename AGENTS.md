# Spectrion Development Team

This document outlines the roles and responsibilities of agents involved in Spectrion project.

## Core Development Agents

### Backend/Extension Architecture Agent

- Responsible for manifest.json configuration
- Implements background scripts for API monitoring
- Manages extension permissions and browser compatibility

### Frontend/UI Agent

- Creates popup interface (HTML, CSS, TypeScript)
- Develops new tab analysis interface
- Implements visual feedback and user interactions

### Data Management Agent

- Implements session storage system
- Manages API data persistence across sessions
- Handles data retrieval and cleanup

### Testing Agent

- Writes unit tests for core functionality
- Implements integration tests
- Ensures extension compatibility across browsers

## Agent Collaboration

- All agents coordinate through version control
- Regular code reviews ensure quality and consistency
- Documentation updates accompany all feature changes

## Project Runtime

**IMPORTANT**: This project uses **Bun** as the runtime package manager instead of npm. All package operations should use `bun` commands:

- Install dependencies: `bun install`
- Run build: `bun run build`
- Run tests: `bun test`
- Add packages: `bun add <package-name>`
- Development mode: `bun run dev`
