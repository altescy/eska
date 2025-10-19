cask "eska" do
  version "0.0.3"
  sha256 "34aa95db5c77604f452d4d81694653e75ce24111be03e3d4ded8138162824070"

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
