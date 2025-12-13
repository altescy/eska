cask "eska" do
  version "0.0.5"
  sha256 "6ecca6c3766df85c892d9e2b3d2f5bd84f2986140b128d38c8da1433a1780958"

  url "https://github.com/altescy/eska/releases/download/v#{version}/Eska-Mac-#{version}-Installer.dmg"
  name "Eska"
  desc "Modern Elasticsearch client built with Electron"
  homepage "https://github.com/altescy/eska"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Eska.app"

  # Remove quarantine attribute to allow running unsigned app
  postflight do
    system_command "/usr/bin/xattr",
                   args: ["-dr", "com.apple.quarantine", "#{appdir}/Eska.app"],
                   sudo: false
  end

  zap trash: [
    "~/Library/Application Support/Eska",
    "~/Library/Caches/jp.altescy.eska",
    "~/Library/Caches/jp.altescy.eska.ShipIt",
    "~/Library/Logs/Eska",
    "~/Library/Preferences/jp.altescy.eska.plist",
    "~/Library/Saved Application State/jp.altescy.eska.savedState",
  ]
end
