# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Eska is a modern Elasticsearch client built with Electron, React, and TypeScript. It provides an intuitive GUI for managing Elasticsearch clusters, building queries, and visualizing results with optional Vim keybindings in the Monaco editor.

## Development Commands

### Package Manager
This project uses **pnpm** as its package manager. All commands should be run with pnpm.

### Common Commands
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the application for production (runs TypeScript compilation, Vite build, and electron-builder)
- `pnpm lint` - Run Biome linter and TypeScript type checking
- `pnpm format` - Auto-fix code style issues with Biome
- `pnpm test` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

### Special Setup
- `pnpm setup-electron` - Manually trigger Electron installation (useful on macOS or when electron install fails)

## Architecture

### Application Structure

**Electron Process Architecture:**
- `electron/main.ts` - Main process entry point, handles window creation and IPC handlers
- `electron/preload.ts` - Preload script that exposes safe IPC and safeStorage APIs to renderer process
- `src/` - React renderer process

**Feature-Based Architecture:**

The application is organized using a feature-based structure where each major feature has its own directory in `src/features/`:

- `src/features/Clusters/` - Cluster management
  - `Clusters.tsx` - Elasticsearch cluster connection management UI

- `src/features/Collections/` - Saved query collections
  - `Collections.tsx` - Collections sidebar for saved queries

- `src/features/Playground/` - Query editor and execution
  - `Playground.tsx` - Main query interface orchestrator
  - `PlaygroundToolbar.tsx` - Cluster/index selection and save controls
  - `QueryEditor.tsx` - Query editor with Monaco integration
  - `QueryActions.tsx` - Run/Format/Copy action buttons
  - `ResponseViewer.tsx` - Search results display
  - `Fields.tsx` - Index field browser with filtering
  - `SaveCollectionDialog.tsx` - Dialog for saving queries

- `src/features/Settings/` - Application settings
  - `Settings.tsx` - User preferences and configuration

- `src/features/Tabs/` - Tab management
  - `Tabs.tsx` - Multi-tab interface for queries

**Shared Components:**
- `src/components/Editor.tsx` - Monaco editor wrapper with Vim mode support
- `src/components/ui/` - Reusable UI primitives (buttons, dialogs, etc.)

**Root Component:**
- `src/App.tsx` - Root component with sidebar navigation, keyboard shortcuts, and resizable panel layout

### State Management

This application uses **Jotai** for state management with atoms stored in `src/atoms/`:

- `clusters.ts` - Cluster configurations (encrypted via secure storage)
- `tabs.ts` - Open query tabs and active tab state
- `collections.ts` - Saved query collections
- `elasticsearch.ts` - Elasticsearch client instances and connection state
- `editor.ts` - Editor preferences (Vim mode, theme, clipboard format, etc.)

**Important:** Cluster credentials are encrypted using Electron's `safeStorage` API via IPC. The encryption/decryption flow is:
1. Main process exposes safeStorage IPC handlers (see `electron/main.ts:78-90`)
2. Preload script exposes safe API to renderer (see `electron/preload.ts:27-31`)
3. Renderer uses `src/lib/secureStorage.ts` helpers to encrypt/decrypt data
4. Encrypted data is stored in localStorage with `secure:` prefix

### Custom Hooks

Located in `src/hooks/`:
- `useClusters.ts` - Manages cluster connections and encrypted storage
- `useElasticsearch.ts` - Provides Elasticsearch client instances
- `useTabs.ts` - Tab creation, navigation, and state management
- `useCollections.ts` - Query collection CRUD operations
- `useClipboard.ts` - Clipboard operations
- `useMountEffect.ts` - Run effects only on mount
- `useResizeObserver.ts` - Observe element size changes

### Elasticsearch Integration

**Query Schema Generation:**
The application generates dynamic JSON schemas for Monaco editor autocomplete based on Elasticsearch index mappings:

- `src/lib/elasticsearch.ts:generateElasticsearchQuerySchema()` - Creates a comprehensive JSON schema for Elasticsearch queries
- Field extraction functions (`extractTextFields`, `extractTermFields`, `extractRangeFields`, etc.) - Filter fields by type for context-aware query suggestions
- Schema includes query types (match, term, bool, range, etc.), aggregations, and field-specific validation

**Type Safety:**
- `src/types/elasticsearch.d.ts` - Elasticsearch-specific types (mappings, fields)
- `src/types/cluster.d.ts` - Cluster connection configuration
- `src/types/tab.d.ts` - Query tab state
- `src/types/collection.d.ts` - Saved query collections
- `src/types/playground.d.ts` - Playground component state

### Monaco Editor Integration

The Monaco editor is configured in `src/components/Editor.tsx`:
- **JSONC Support:** JSON with Comments (trailing commas and comments allowed)
- **Optional Vim Mode:** via `monaco-vim` with status bar integration
- **Custom JSON Schemas:** Dynamic schema generation for Elasticsearch query validation based on index mappings
- **Theme Customization:** Transparent background with custom "eska" theme
- **Exposed API:** Uses `forwardRef` to expose `format()` method to parent components
- **Editor Settings:** Configurable font size, tab size, word wrap, minimap, key bindings, and clipboard format

### UI Components

Built with Radix UI primitives and Tailwind CSS:
- `src/components/ui/` - Reusable UI components (buttons, dialogs, inputs, etc.)
- Uses Tailwind CSS v4 with Vite plugin
- Frosted glass effects with backdrop blur for dialogs
- Custom `app-region-drag` class for Electron window dragging

## Testing

- **Framework:** Vitest
- **Configuration:** `vitest.config.ts`
- Test files use `.test.ts` extension (e.g., `src/lib/elasticsearch.test.ts`)
- Run single test file: `pnpm test <file-path>`
- Example: `pnpm test src/lib/elasticsearch.test.ts`

## Path Aliases

The project uses TypeScript path aliases configured in both `tsconfig.json` and `vite.config.ts`:
- `@/*` maps to `./src/*`
- Example: `import { cn } from "@/lib/utils"`

## Code Quality

- **Linter:** Biome (replaces ESLint + Prettier)
- **Type Checking:** TypeScript with strict mode enabled
- Always run `pnpm lint` before committing
- Use `pnpm format` to auto-fix formatting issues

## Electron-Specific Considerations

1. **IPC Communication:** Always use the safe IPC wrapper exposed via preload script. Do not directly access Electron APIs from renderer.

2. **Security:**
   - Credentials must be encrypted using safeStorage before persisting
   - Web security is disabled for CORS (see `electron/main.ts:39`)
   - Never commit unencrypted credentials

3. **Window Styling:**
   - Uses `titleBarStyle: 'hiddenInset'` for native macOS appearance
   - Uses `vibrancy: 'fullscreen-ui'` and `backgroundMaterial: 'acrylic'` for translucent effects
   - Draggable regions use `.app-region-drag` class

4. **Build Process:**
   - Development: Vite dev server proxies to Electron
   - Production: electron-builder packages the app
   - Build output: `dist/` (renderer), `dist-electron/` (main process)

## Storage Keys

Application data is stored in localStorage with versioned keys (format: `eska:v0.0.1:<key>`):
- `eska:v0.0.1:clusters` - Encrypted cluster configurations
- `eska:v0.0.1:currentClusterId` - Active cluster ID
- `eska:v0.0.1:tabs` - Open query tabs
- `eska:v0.0.1:activeTabId` - Active tab ID
- `secure:*` prefix for encrypted data

When making storage schema changes, consider bumping the version in keys to avoid migration issues.

## Keyboard Shortcuts

- **Ctrl/Cmd + ,** - Open Settings dialog
- **Ctrl/Cmd + S** - Save current query to collection (when in Playground)
- **Ctrl/Cmd + Enter** - Execute query (when in Monaco editor)

## Key Features Implementation Notes

### Fields Component (`src/features/Playground/Fields.tsx`)

The Fields component provides a powerful field browser with:
- **Advanced Filtering:** Supports attribute filters (`@index`, `@source`, `@selected`), type filters (`:text`, `:keyword`), negation (`-@index`, `-:text`), and text search
- **Selection Toggle:** Click on the selected field count to toggle between showing all fields and selected fields only
- **Auto-deselect Protection:** Automatically disables "show selected only" filter when all selections are cleared to prevent empty state

### Editor Settings

Configurable in Settings dialog (Ctrl/Cmd + ,):
- **Font Size:** 10-24px
- **Tab Size:** 2, 4, or 8 spaces
- **Word Wrap:** On/Off
- **Minimap:** Show/Hide
- **Key Binding:** Default or Vim
- **Clipboard Format:** JSON (comments removed) or JSONC (comments preserved)

## Icon Generation

To regenerate app icons from a source image:
```bash
./scripts/generate-icons.sh <source-image>
```
Generates icons for all platforms (macOS, Windows, Linux, web) at various sizes.

## Debugging

### Port Forward Debugging

Port forwarding functionality uses kubectl/ssh commands and can fail if system PATH is not configured correctly. To enable detailed debug logging for port forwarding:

**macOS/Linux:**
```bash
DEBUG_PORT_FORWARD=1 pnpm dev
```

**Production App:**
Set the environment variable before launching:
```bash
DEBUG_PORT_FORWARD=1 ./path/to/Eska.app/Contents/MacOS/Eska
```

Debug logs will show:
- Command resolution paths (where kubectl/ssh were found)
- Enhanced PATH environment variable
- Process stdout/stderr output
- Connection status changes

**Common Issues:**
1. **`executable envchain not found`** - kubectl credential plugin not in PATH
   - Solution: Ensure `/opt/homebrew/bin` (or appropriate path) is in your system PATH
2. **`spawn kubectl ENOENT`** - kubectl command not found
   - Solution: Install kubectl or add its installation directory to PATH
3. **Exit code 127** - Command not found at runtime
   - Enable debug logging to see which command failed and check PATH
