#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Downloads_cleanup_installed_app_installers_$(date +%Y%m%d_%H%M%S)"

typeset -a targets=(
  "/Users/ashley/Downloads/Installers/Codex-4.dmg"
  "/Users/ashley/Downloads/Installers/Claude-2.dmg"
  "/Users/ashley/Downloads/Installers/LogiTuneInstaller.dmg"
  "/Users/ashley/Downloads/Installers/Slack-4.45.69-macOS.dmg"
  "/Users/ashley/Downloads/Installers/Discord.dmg"
  "/Users/ashley/Downloads/Installers/Grammarly.o0.c0000063qmaaab9lv2ot0182.dmg"
  "/Users/ashley/Downloads/Installers/Hubstaff-1.7.8-c835b2c2.dmg"
  "/Users/ashley/Downloads/Installers/Roblox.dmg"
  "/Users/ashley/Downloads/Installers/RobloxStudio.dmg"
  "/Users/ashley/Downloads/Installers/steam.dmg"
  "/Users/ashley/Downloads/Installers/Rectangle0.90.dmg"
  "/Users/ashley/Downloads/Installers/App_Bundles/Install Spotify.app"
)

/bin/mkdir -p "$trash_root"

typeset -i total=0
typeset -i total_bytes=0

for target in "${targets[@]}"; do
  [[ -e "$target" ]] || continue

  if [[ -d "$target" ]]; then
    size=$(du -sk "$target" | awk '{print $1 * 1024}')
  else
    size=$(/usr/bin/stat -f '%z' "$target")
  fi

  total=$(( total + 1 ))
  total_bytes=$(( total_bytes + size ))

  /bin/mv "$target" "$trash_root/"
  printf '%s\n' "$target"
done

echo ""
echo "Summary:"
echo "Items: $total"
echo "Bytes: $total_bytes"
echo "Moved to: $trash_root"
