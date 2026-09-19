cask "eska" do
  version "0.0.6"
  sha256 "94f9200e480055b35cf4786df574153829f3e2ac6d93d4659629c753a83afe0e"

  url "https://github.com/altescy/eska/releases/download/v#{version}/Eska-Mac-#{version}-Installer.dmg"
  name "Eska"
  desc "Modern Elasticsearch client built with Electron"
  homepage "https://github.com/altescy/eska"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on macos: :monterey

  app "Eska.app"

  # Remove quarantine attribute to allow running unsigned app
  postflight_steps do
    run "/usr/bin/xattr", args: ["-dr", "com.apple.quarantine", "{{appdir}}/Eska.app"]
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
