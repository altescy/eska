# Homebrew Cask for Eska

This directory contains the Homebrew Cask formula for installing Eska via Homebrew.

## Installation

Users can install Eska directly from this repository:

```bash
# Tap this repository
brew tap altescy/eska https://github.com/altescy/eska

# Install Eska
brew install --cask eska
```

Or in a single command:

```bash
brew install --cask altescy/eska/eska
```

## Updating

To update Eska:

```bash
brew upgrade --cask eska
```

## Uninstalling

To uninstall Eska:

```bash
brew uninstall --cask eska
```

To completely remove all data:

```bash
brew uninstall --zap --cask eska
```

## Updating the Formula

When releasing a new version:

1. Update `version` in `package.json`
2. Create and push a git tag (e.g., `v0.0.2`)
3. Create a GitHub release with the tag
4. Update the `version` in `Casks/eska.rb` to match
5. Commit and push the updated Cask formula

The GitHub Actions workflow will automatically build and upload the DMG file to the release.

### Calculating SHA256 (Optional)

For better security, you can calculate and include the SHA256 checksum:

```bash
# Download the DMG from GitHub releases
wget https://github.com/altescy/eska/releases/download/v0.0.1/Eska-Mac-0.0.1-Installer.dmg

# Calculate SHA256
shasum -a 256 Eska-Mac-0.0.1-Installer.dmg

# Update eska.rb
# Replace `sha256 :no_check` with `sha256 "actual-hash-here"`
```

## Notes

- The repository is tapped as `altescy/eska`
- The Cask file must be in the `Casks/` directory at the repository root
- DMG files are automatically uploaded to GitHub Releases by the CI workflow
- Users will automatically get updates when they run `brew upgrade`
