#!/bin/zsh

set -euo pipefail

move_file() {
  local src="$1"
  local dest_dir="$2"
  local base dest stem ext counter

  [[ -e "$src" ]] || return 0

  base="${src:t}"
  dest="$dest_dir/$base"

  /bin/mkdir -p "$dest_dir"

  if [[ -e "$dest" ]]; then
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

  /bin/mv "$src" "$dest"
  printf '%s -> %s\n' "$src" "$dest"
}

move_file "/Users/ashley/Downloads/Documents/General/D197 - version contrl.docx" "/Users/ashley/WGU/D197 - Version Control"

move_file "/Users/ashley/Downloads/Documents/General/D370 Task 1 - Final.docx" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/General/D370 Task 1-2.pdf" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/General/D370 Task 1.pdf" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/General/Task 1-2.docx" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/General/Task 1.docx" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/General/Task 2 - Complete-2.docx" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/General/Task 2 - Complete.docx" "/Users/ashley/WGU/D370 - IT Leadership"
move_file "/Users/ashley/Downloads/Documents/Templates_Checklists/D370 Task 2 (V3) -template.docx" "/Users/ashley/WGU/D370 - IT Leadership"

move_file "/Users/ashley/Downloads/Documents/Learning/Transcript_C683_Writing_a_Lab_Report_SageCast.pdf" "/Users/ashley/WGU/C683 - Natural Science Lab"
move_file "/Users/ashley/Downloads/Documents/Learning/WGU C963_ American Politics & U.S. Constitution Study Guide.pdf" "/Users/ashley/WGU/C963 - American Politics & U.S. Constitution"

move_file "/Users/ashley/Downloads/Documents/Learning/WGU_Grade_Report-2.pdf" "/Users/ashley/WGU/Records"
move_file "/Users/ashley/Downloads/Documents/Learning/WGU_Grade_Report.pdf" "/Users/ashley/WGU/Records"
move_file "/Users/ashley/Downloads/Documents/Learning/WGU_Transcript.pdf" "/Users/ashley/WGU/Records"

move_file "/Users/ashley/Downloads/Documents/Templates_Checklists/OSM1_Task2Attach_ImplementationMeeting_Captions_English (United States).txt" "/Users/ashley/WGU/OSM1"
