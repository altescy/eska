# Release Process

This document describes how to create a new release for Eska.

## Automated Release Process

When you create a new release on GitHub, the CI/CD pipeline will automatically:

1. Build the Electron application for all platforms (macOS, Windows, Linux)
2. Upload the built binaries as release assets
3. Update `Casks/eska.rb` with the new version and the SHA256 of the published
   macOS installer, then commit it to `main`

## Creating a Release

### 1. Prepare the Release

Before creating a release, ensure:

- All tests pass (`pnpm test`)
- Code is linted (`pnpm lint`)
- Application builds successfully (`pnpm build`)
- Update version in `package.json` (e.g., `"version": "0.1.0"`)

The version in `package.json` must match the tag you are about to create -- the
release workflow fails fast if they disagree. `Casks/eska.rb` is updated
automatically, so leave it alone.

### 2. Create a Git Tag

```bash
# Update version in package.json, then commit the change
git add package.json
git commit -m "Bump version to 0.1.0"

# Create a new version tag (e.g., v0.1.0)
git tag v0.1.0

# Push the changes and tag to GitHub
git push origin main
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

### 6. Homebrew Cask

Once the builds finish, the `update-cask` job downloads the published
`Eska-Mac-{version}-Installer.dmg`, computes its SHA256, writes both the version
and the checksum into `Casks/eska.rb`, and pushes the result to `main`.

Since this repository is also the Homebrew tap (`altescy/eska`), nothing else is
needed -- users get the new version on their next `brew upgrade --cask eska`.

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

### The release fails before building

`Verify package.json matches the release tag` failed: the tag and the version in
`package.json` disagree. electron-builder writes to `release/{package.json
version}/`, so continuing would publish a release with no assets. Fix
`package.json`, then re-create the tag and the release.

### The cask was not updated

The `update-cask` job pushes directly to `main` using `GITHUB_TOKEN`. If `main`
is protected by required reviews or status checks, the push is rejected and the
job fails after three attempts. Either allow GitHub Actions to bypass the
protection, or update `Casks/eska.rb` by hand:

```bash
shasum -a 256 Eska-Mac-{version}-Installer.dmg
```

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
