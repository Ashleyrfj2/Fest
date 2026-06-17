#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Downloads_cleanup_installers_$(date +%Y%m%d_%H%M%S)"

typeset -a targets=(
  "/Users/ashley/Downloads/Installers/Codex.dmg"
  "/Users/ashley/Downloads/Installers/Codex-2.dmg"
  "/Users/ashley/Downloads/Installers/Codex-3.dmg"
  "/Users/ashley/Downloads/Installers/Claude.dmg"
  "/Users/ashley/Downloads/Installers/zoomusInstallerFull.pkg"
  "/Users/ashley/Downloads/Installers/Zoom.pkg"
  "/Users/ashley/Downloads/Installers/node-v22.20.0.pkg"
)

/bin/mkdir -p "$trash_root"

typeset -i total=0
typeset -i total_bytes=0

for target in "${targets[@]}"; do
  [[ -e "$target" ]] || continue

  size=$(/usr/bin/stat -f '%z' "$target")
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
