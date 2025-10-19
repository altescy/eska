# Eska

[![CI](https://github.com/altescy/eska/actions/workflows/ci.yml/badge.svg)](https://github.com/altescy/eska/actions/workflows/ci.yml)
[![Release](https://github.com/altescy/eska/actions/workflows/release.yml/badge.svg)](https://github.com/altescy/eska/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/altescy/eska)](https://github.com/altescy/eska/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern Elasticsearch client built with Electron, React, and TypeScript.

<img width="1342" height="931" alt="image" src="https://github.com/user-attachments/assets/3b72d369-93bb-448a-8f5f-2d0c5df91b89" />

> [!Warning]
> This application is currently in early development stage. Features and functionality may change significantly, and some features may be incomplete or experimental.

## Features

- 🔍 **Intuitive Query Builder** - Build complex Elasticsearch queries with ease
- 📊 **Data Visualization** - View and analyze search results
- 🌐 **Multi-Cluster Support** - Connect to multiple Elasticsearch clusters
- 🎨 **Modern UI** - Clean and responsive interface built with React
- ⌨️ **Vim Mode** - Monaco editor with optional Vim keybindings
- 🔐 **Secure** - Credentials stored securely on your local machine
- 🚀 **Cross-Platform** - Available for macOS, Windows, and Linux

## Installation

### macOS (Homebrew)

```bash
brew tap altescy/eska https://github.com/altescy/eska
brew install --cask eska
```

Or in a single command:

```bash
brew install --cask altescy/eska/eska
```

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases page](https://github.com/altescy/eska/releases/latest):

- **macOS**: `Eska-Mac-{version}-Installer.dmg`
- **Windows**: `Eska-Windows-{version}-Setup.exe`
- **Linux**: `Eska-Linux-{version}.AppImage`

### Build from Source

```bash
# Clone the repository
git clone https://github.com/altescy/eska.git
cd eska

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

## Development

### Prerequisites

- Node.js 22.x or later
- pnpm 9.x or later

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build the application for production
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run linter
- `pnpm format` - Format code with Biome

### Generating App Icons

To generate app icons from a source image:

```bash
./scripts/generate-icons.sh <source-image>

# Example
./scripts/generate-icons.sh icon_large.png
```

This will generate icons for all platforms:
- `build/icon.png` (1024x1024) - macOS
- `build/icon-512.png` (512x512) - Linux
- `build/icon-256.png` (256x256) - Windows
- `public/favicon.png` (32x32) - Web/Window icon

**Requirements:**
- Source image should be square and at least 512x512 pixels
- Larger images (1024x1024 or higher) recommended for best quality

### Project Structure

```
eska/
├── electron/            # Electron main process
├── src/                 # React application source
│   ├── features/        # Feature-based modules
│   │   ├── Clusters/    # Cluster management
│   │   ├── Collections/ # Saved query collections
│   │   ├── Playground/  # Query editor and execution
│   │   ├── Settings/    # Application settings
│   │   └── Tabs/        # Tab management
│   ├── components/      # Shared React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── Editor.tsx   # Monaco editor wrapper
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript type definitions
│   └── atoms/           # Jotai state atoms
├── .github/             # GitHub Actions workflows
└── dist-electron/       # Built Electron files
```

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Jotai](https://jotai.org/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linting**: [Biome](https://biomejs.dev/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**altescy**

- GitHub: [@altescy](https://github.com/altescy)

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
