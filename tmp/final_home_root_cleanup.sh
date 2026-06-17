#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Home_root_cleanup_$(date +%Y%m%d_%H%M%S)"

move_file() {
  local src="$1"
  local dest_dir="$2"
  local dest_name="${3:-${src:t}}"
  local dest="$dest_dir/$dest_name"
  local stem ext counter

  [[ -e "$src" ]] || return 0

  /bin/mkdir -p "$dest_dir"

  if [[ -e "$dest" ]]; then
    if [[ "$dest_name" == *.* ]]; then
      stem="${dest_name%.*}"
      ext=".${dest_name##*.}"
    else
      stem="$dest_name"
      ext=""
    fi
    counter=2
    while [[ -e "$dest_dir/${stem}-$counter${ext}" ]]; do
      (( counter++ ))
    done
    dest="$dest_dir/${stem}-$counter${ext}"
  fi

  /bin/mv "$src" "$dest"
  printf 'MOVE\t%s -> %s\n' "$src" "$dest"
}

trash_item() {
  local target="$1"

  [[ -e "$target" ]] || return 0

  /bin/mkdir -p "$trash_root"
  /bin/mv "$target" "$trash_root/"
  printf 'TRASH\t%s\n' "$target"
}

# Move clear keepers into better homes.
move_file "/Users/ashley/quantum-visualizer-pro.html" "/Users/ashley/Visualizer"
move_file "/Users/ashley/VISUALIZER_README.md" "/Users/ashley/Visualizer"
move_file "/Users/ashley/index-Bbf4H7O0.js" "/Users/ashley/Visualizer"
move_file "/Users/ashley/howler-Br4KiHw0.js" "/Users/ashley/Visualizer"
move_file "/Users/ashley/Gemini_Generated_Image_6poerw6poerw6poe.png" "/Users/ashley/Pictures"
move_file "/Users/ashley/Untitled Copy.prproj" "/Users/ashley/Documents/Adobe/Premiere Pro"

# Trash the remaining questionable top-level files, keeping this reversible.
typeset -a trash_targets=(
  "/Users/ashley/.DS_Store"
  "/Users/ashley/quantum-visualizer.html"
  "/Users/ashley/Ashley_Jackson_AI_updated.pdf"
  "/Users/ashley/studiopresence-macos 2"
  "/Users/ashley/pesde"
  "/Users/ashley/server.js"
  "/Users/ashley/App.jsx"
  "/Users/ashley/App.css"
  "/Users/ashley/db.js 13-43-52-579.js"
  "/Users/ashley/program.py"
  "/Users/ashley/package.json 13-53-39-500.json"
  "/Users/ashley/package.json 14-02-45-722.json"
)

for target in "${trash_targets[@]}"; do
  trash_item "$target"
done
