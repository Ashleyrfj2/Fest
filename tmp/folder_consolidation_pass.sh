#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Folder_consolidation_$(date +%Y%m%d_%H%M%S)"

move_item() {
  local src="$1"
  local dest_dir="$2"
  local dest_name="${3:-${src:t}}"
  local dest="$dest_dir/$dest_name"
  local counter

  [[ -e "$src" ]] || return 0

  /bin/mkdir -p "$dest_dir"

  if [[ -e "$dest" ]]; then
    counter=2
    while [[ -e "$dest_dir/${dest_name}-$counter" ]]; do
      (( counter++ ))
    done
    dest="$dest_dir/${dest_name}-$counter"
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

# Delete strong candidate folders and the ones explicitly requested.
typeset -a trash_targets=(
  "/Users/ashley/HERE"
  "/Users/ashley/Final packets"
  "/Users/ashley/landscape"
  "/Users/ashley/Postman"
  "/Users/ashley/Visualizer"
  "/Users/ashley/THC"
  "/Users/ashley/my-phaser-game"
  "/Users/ashley/virtual-world"
  "/Users/ashley/Models"
  "/Users/ashley/Textures"
  "/Users/ashley/Documents/Unit_2_project"
  "/Users/ashley/code/WGU/d197-version-control-1"
  "/Users/ashley/code/WGU/D197 - version contrl.docx"
)

for target in "${trash_targets[@]}"; do
  trash_item "$target"
done

# Move both resume site folders into a review area.
move_item "/Users/ashley/resume copy" "/Users/ashley/Documents/Resume Site Review"
move_item "/Users/ashley/Downloads/resume" "/Users/ashley/Documents/Resume Site Review"

# Keep WGU documents centralized in /Users/ashley/WGU.
move_item "/Users/ashley/code/WGU/D197 - version contrl.pdf 00-04-37-333.pdf" "/Users/ashley/WGU/D197 - Version Control"
move_item "/Users/ashley/code/WGU/D370 - IT Leadership/D370 Task 2.docx" "/Users/ashley/WGU/D370 - IT Leadership"
move_item "/Users/ashley/code/WGU/Scripting and programming/Pre assessment - Scripting foundamentals.pdf" "/Users/ashley/WGU/Scripting and programming"

# Consolidate the more complete D197 website project into code/WGU.
move_item "/Users/ashley/d197-version-control" "/Users/ashley/code/WGU"
