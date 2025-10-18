# Release Process

This document describes how to create a new release for Eska.

## Automated Release Process

When you create a new release on GitHub, the CI/CD pipeline will automatically:

1. Build the Electron application for all platforms (macOS, Windows, Linux)
2. Upload the built binaries as release assets

## Creating a Release

### 1. Prepare the Release

Before creating a release, ensure:

- All tests pass (`pnpm test`)
- Code is linted (`pnpm lint`)
- Application builds successfully (`pnpm build`)

### 2. Create a Git Tag

```bash
# Create a new version tag (e.g., v0.1.0)
git tag v0.1.0

# Push the tag to GitHub
git push origin v0.1.0
```

### 3. Create GitHub Release

1. Go to the [Releases page](https://github.com/altescy/eska/releases)
2. Click "Draft a new release"
3. Select the tag you just created (e.g., `v0.1.0`)
4. Fill in the release title and description
5. Click "Publish release"

### 4. Automated Build

Once the release is published:

- GitHub Actions will automatically trigger the release workflow
- Builds will run on macOS, Windows, and Linux
- The following artifacts will be uploaded to the release:
  - `Eska-Mac-{version}-Installer.dmg` (macOS)
  - `Eska-Windows-{version}-Setup.exe` (Windows)
  - `Eska-Linux-{version}.AppImage` (Linux)

### 5. Monitor the Build

Check the [Actions tab](https://github.com/altescy/eska/actions) to monitor the build progress.

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Release Artifacts

### macOS
- **Format**: DMG (Disk Image)
- **Architecture**: Universal (x64 and arm64)
- **Installation**: Drag and drop to Applications folder

### Windows
- **Format**: NSIS Installer (EXE)
- **Architecture**: x64
- **Installation**: Run the installer and follow the wizard

### Linux
- **Format**: AppImage
- **Architecture**: x64
- **Installation**: Make executable and run
  ```bash
  chmod +x Eska-Linux-{version}.AppImage
  ./Eska-Linux-{version}.AppImage
  ```

## Troubleshooting

### Build fails on macOS

If the macOS build fails due to code signing:
- The app will still build but without code signing
- Users may see a security warning when opening the app
- To resolve: Configure code signing in GitHub repository secrets

### Build fails on Windows

If the Windows build fails:
- Check that all dependencies are correctly installed
- Ensure the Windows runner has all required build tools

### Build fails on Linux

If the Linux build fails:
- Check AppImage packaging requirements
- Ensure all Linux dependencies are available

## Manual Build (for testing)

To build locally:

```bash
# Install dependencies
pnpm install

# Build for current platform
pnpm build

# Built artifacts will be in:
# release/{version}/
```

To build for specific platforms:

```bash
# macOS
pnpm exec electron-builder --mac

# Windows
pnpm exec electron-builder --win

# Linux
pnpm exec electron-builder --linux
```
