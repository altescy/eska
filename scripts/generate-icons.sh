#!/bin/bash

# Generate icons for Electron app from a source image
# Usage: ./scripts/generate-icons.sh <source-image>

set -e

# Check if source image is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <source-image>"
  echo "Example: $0 icon_large.png"
  exit 1
fi

SOURCE_IMAGE="$1"

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image '$SOURCE_IMAGE' not found"
  exit 1
fi

# Get image dimensions
WIDTH=$(sips -g pixelWidth "$SOURCE_IMAGE" | awk '/pixelWidth:/ {print $2}')
HEIGHT=$(sips -g pixelHeight "$SOURCE_IMAGE" | awk '/pixelHeight:/ {print $2}')

echo "Source image: $SOURCE_IMAGE (${WIDTH}x${HEIGHT})"

# Check if image is square
if [ "$WIDTH" != "$HEIGHT" ]; then
  echo "Warning: Source image is not square (${WIDTH}x${HEIGHT})"
  echo "Icons will be generated but may be distorted"
fi

# Recommend minimum size
if [ "$WIDTH" -lt 512 ] || [ "$HEIGHT" -lt 512 ]; then
  echo "Warning: Source image is smaller than recommended (512x512)"
  echo "Generated icons may have poor quality"
fi

# Create directories if they don't exist
mkdir -p build
mkdir -p public

echo ""
echo "Generating icons..."

# Generate macOS icon (1024x1024)
echo "  → build/icon.png (1024x1024) for macOS"
sips -z 1024 1024 "$SOURCE_IMAGE" --out build/icon.png > /dev/null

# Generate Linux icon (512x512)
echo "  → build/icon-512.png (512x512) for Linux"
sips -z 512 512 "$SOURCE_IMAGE" --out build/icon-512.png > /dev/null

# Generate Windows icon (256x256)
echo "  → build/icon-256.png (256x256) for Windows"
sips -z 256 256 "$SOURCE_IMAGE" --out build/icon-256.png > /dev/null

# Generate favicon (32x32)
echo "  → public/favicon.png (32x32) for web/window icon"
sips -z 32 32 "$SOURCE_IMAGE" --out public/favicon.png > /dev/null

echo ""
echo "✓ Icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh build/icon*.png public/favicon.png
