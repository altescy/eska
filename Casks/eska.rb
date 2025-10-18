cask "eska" do
  version "0.0.1"
  sha256 "9cd3221ef0490106c28170b6ba87388f1fd2d8bd1087fa2317fb70ce606971d2"

  url "https://github.com/altescy/eska/releases/download/v#{version}/Eska-Mac-#{version}-Installer.dmg"
  name "Eska"
  desc "Modern Elasticsearch client built with Electron"
  homepage "https://github.com/altescy/eska"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Eska.app"

  zap trash: [
    "~/Library/Application Support/Eska",
    "~/Library/Caches/jp.altescy.eska",
    "~/Library/Caches/jp.altescy.eska.ShipIt",
    "~/Library/Logs/Eska",
    "~/Library/Preferences/jp.altescy.eska.plist",
    "~/Library/Saved Application State/jp.altescy.eska.savedState",
  ]
end
