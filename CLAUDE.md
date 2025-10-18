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

**Key Components:**
- `src/App.tsx` - Root component with sidebar navigation and resizable panel layout
- `src/components/Clusters.tsx` - Elasticsearch cluster connection management
- `src/components/Collections.tsx` - Saved query collections sidebar
- `src/components/Tabs.tsx` - Tab management for multiple queries
- `src/components/Playground.tsx` - Main query interface
- `src/components/Editor.tsx` - Monaco editor with Vim mode support

### State Management

This application uses **Jotai** for state management with atoms stored in `src/atoms/`:

- `clusters.ts` - Cluster configurations (encrypted via secure storage)
- `tabs.ts` - Open query tabs and active tab state
- `collections.ts` - Saved query collections
- `elasticsearch.ts` - Elasticsearch client instances and connection state
- `editor.ts` - Editor preferences (Vim mode, theme, etc.)

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
- YAML language support via `monaco-yaml`
- Optional Vim mode via `monaco-vim`
- Custom JSON schemas for Elasticsearch query validation
- Theme customization and editor preferences

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

## Icon Generation

To regenerate app icons from a source image:
```bash
./scripts/generate-icons.sh <source-image>
```
Generates icons for all platforms (macOS, Windows, Linux, web) at various sizes.
