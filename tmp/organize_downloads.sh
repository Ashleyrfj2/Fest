#!/bin/zsh

set -euo pipefail
setopt null_glob

downloads_dir="${1:-$HOME/Downloads}"
mode="${2:-dry-run}"

if [[ ! -d "$downloads_dir" ]]; then
  echo "Downloads directory not found: $downloads_dir" >&2
  exit 1
fi

typeset -A category_counts
typeset -A destination_counts

dry_run=true
if [[ "$mode" == "apply" ]]; then
  dry_run=false
fi

category_for() {
  local item="$1"
  local name="${item:t}"
  local lower_name="${name:l}"
  local ext=""

  if [[ -d "$item" ]]; then
    if [[ "$name" == *.download ]]; then
      echo "Installers/Partial_Downloads"
      return
    fi
    if [[ "$name" == *.app ]]; then
      echo "Installers/App_Bundles"
      return
    fi
    echo ""
    return
  fi

  if [[ "$name" == .* ]]; then
    echo ""
    return
  fi

  if [[ "$name" == *.* ]]; then
    ext="${lower_name##*.}"
  fi

  case "$ext" in
    dmg|pkg|exe|msi)
      echo "Installers"
      ;;
    zip|rar|7z|tar|gz|tgz|bz2|xz|cpgz)
      echo "Archives"
      ;;
    pdf|doc|docx|rtf|txt|md|pages|xls|xlsx|ppt|pptx|csv)
      echo "Documents"
      ;;
    png|jpg|jpeg|gif|webp|heic|avif|svg|ai|psd)
      echo "Images"
      ;;
    mp4|mov|mp3|wav|m4a|aac|flac)
      echo "Media"
      ;;
    py|js|jsx|ts|tsx|css|scss|html|json|yaml|yml|sql|lua|rbxm)
      echo "Code_Data"
      ;;
    fbx|obj|blend|glb|gltf|usdz|usd|spp|unitypackage)
      echo "3D_Assets"
      ;;
    otf|ttf|woff|woff2)
      echo "Fonts"
      ;;
    *)
      if [[ "$lower_name" == conversations.json ]]; then
        echo "Data_Exports"
      elif [[ "$lower_name" == *.json ]]; then
        echo "Code_Data"
      else
        echo "Other"
      fi
      ;;
  esac
}

move_item() {
  local item="$1"
  local category="$2"
  local dest_dir="$downloads_dir/$category"
  local base="${item:t}"
  local dest="$dest_dir/$base"
  local stem ext counter

  (( ++destination_counts["$category"] ))

  if $dry_run; then
    echo "$base -> $category/"
    return
  fi

  /bin/mkdir -p "$dest_dir"

  if [[ -e "$dest" ]]; then
    if [[ -d "$item" ]]; then
      counter=2
      while [[ -e "$dest_dir/${base}-$counter" ]]; do
        (( counter++ ))
      done
      dest="$dest_dir/${base}-$counter"
    else
      if [[ "$base" == *.* ]]; then
        stem="${base%.*}"
        ext=".${base##*.}"
      else
        stem="$base"
        ext=""
      fi
      counter=2
      while [[ -e "$dest_dir/${stem}-$counter${ext}" ]]; do
        (( counter++ ))
      done
      dest="$dest_dir/${stem}-$counter${ext}"
    fi
  fi

  /bin/mv "$item" "$dest"
}

for item in "$downloads_dir"/* "$downloads_dir"/.*; do
  [[ -e "$item" ]] || continue

  case "${item:t}" in
    .|..|.DS_Store|.localized)
      continue
      ;;
    3D_Assets|Archives|Code_Data|Data_Exports|Documents|Fonts|Images|Installers|Media|Other)
      continue
      ;;
  esac

  category="$(category_for "$item")"
  [[ -n "$category" ]] || continue

  (( ++category_counts["$category"] ))
  move_item "$item" "$category"
done

echo ""
echo "Summary:"
for category in ${(ok)category_counts}; do
  echo "$category: ${category_counts[$category]}"
done
