cask "eska" do
  version "0.0.7"
  sha256 "81391a07ded187fd1c71713c5bc7a9c0da36da0d87da72debf70743b6c7a7aa4"

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
