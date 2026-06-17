#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Downloads_cleanup_roblox_$(date +%Y%m%d_%H%M%S)"

typeset -a targets=(
  "/Users/ashley/Downloads/Day Care with play area.rbxl"
  "/Users/ashley/Downloads/Modules.rbxl"
  "/Users/ashley/Downloads/Modules.rbxmx"
  "/Users/ashley/Downloads/Rain.rbxm"
  "/Users/ashley/Downloads/Shop Ui v1.rbxl"
  "/Users/ashley/Downloads/VolcanoTestPlace.rbxl"
  "/Users/ashley/Downloads/child.rbxm"
  "/Users/ashley/Downloads/react-lua-dev.rbxm"
  "/Users/ashley/Downloads/react-lua.rbxm"
  "/Users/ashley/Downloads/Rblx"
  "/Users/ashley/Downloads/react-lua-17.2.1/roblox-model"
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
