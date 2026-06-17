#!/bin/zsh

set -euo pipefail
setopt null_glob

downloads_dir="/Users/ashley/Downloads"
documents_dir="$downloads_dir/Documents"
trash_root="$HOME/.Trash/Downloads_cleanup_docs_$(date +%Y%m%d_%H%M%S)"
mode="${1:-dry-run}"

dry_run=true
if [[ "$mode" == "apply" ]]; then
  dry_run=false
fi

typeset -i moved_docs=0
typeset -i trashed_items=0
typeset -i trashed_bytes=0
typeset -A folder_counts

trash_item() {
  local path="$1"
  local size

  [[ -e "$path" ]] || return 0

  if [[ -d "$path" ]]; then
    size=$(/usr/bin/du -sk "$path" | /usr/bin/awk '{print $1 * 1024}')
  else
    size=$(/usr/bin/stat -f '%z' "$path")
  fi

  (( trashed_items += 1 ))
  (( trashed_bytes += size ))

  if $dry_run; then
    printf 'TRASH\t%s\n' "${path#$downloads_dir/}"
  else
    /bin/mkdir -p "$trash_root"
    /bin/mv "$path" "$trash_root/"
    printf 'TRASH\t%s\n' "${path#$downloads_dir/}"
  fi
}

doc_category() {
  local name="$1"
  local lower="${name:l}"

  if [[ "$lower" == openclaw* ]]; then
    echo "OpenClaw"
  elif [[ "$lower" == *resume* || "$lower" == *resumé* || "$lower" == *ats* ]]; then
    echo "Resumes"
  elif [[ "$lower" == *statement* || "$lower" == *invoice* || "$lower" == *creditnote* || "$lower" == *bill* || "$lower" == *tax* || "$lower" == *expense* || "$lower" == *account* || "$lower" == *nfcu* || "$lower" == *unitedhealthcare* || "$lower" == idcard* ]]; then
    echo "Finance_Insurance"
  elif [[ "$lower" == *adenomyosis* || "$lower" == *ultrasound* || "$lower" == *physical* || "$lower" == *after\ visit* || "$lower" == *visit\ summary* || "$lower" == jb_physical* ]]; then
    echo "Medical"
  elif [[ "$lower" == *bootcamp* || "$lower" == *wgu* || "$lower" == *syllabus* || "$lower" == *worksheet* || "$lower" == *learning* || "$lower" == *general\ assembly* || "$lower" == *codepath* || "$lower" == *full_stack* || "$lower" == *full\ stack* || "$lower" == *big-o* || "$lower" == *lab_* || "$lower" == *science* || "$lower" == *certification* || "$lower" == *credential* || "$lower" == *topic_* || "$lower" == *unit1_* || "$lower" == *cheat* || "$lower" == *guide* ]]; then
    echo "Learning"
  elif [[ "$lower" == *morning* || "$lower" == *daily\ hub* || "$lower" == *deep_reflection* || "$lower" == *personality* || "$lower" == *profile* || "$lower" == *letter_to_dad* || "$lower" == *relationship* || "$lower" == *focus_page* ]]; then
    echo "Personal"
  elif [[ "$lower" == *template* || "$lower" == *checklist* || "$lower" == *workflow* || "$lower" == *authorguide* || "$lower" == *author_guide* || "$lower" == *implementation* || "$lower" == *prompt* || "$lower" == *cards* ]]; then
    echo "Templates_Checklists"
  elif [[ "$lower" == *.md || "$lower" == agents.md || "$lower" == architecture.md || "$lower" == database_schema.md || "$lower" == *schema* || "$lower" == *spec* || "$lower" == *requirements* || "$lower" == *how-to* || "$lower" == compatibility_rules.md || "$lower" == cursor_prompt.md || "$lower" == game_requirements.md || "$lower" == discord_activity_spec.md ]]; then
    echo "Technical_Docs"
  elif [[ "$lower" == *garden_arcade_court* || "$lower" == *idletycoon* || "$lower" == *fleet* || "$lower" == *court_* || "$lower" == *workflow* || "$lower" == *board* || "$lower" == *company_* || "$lower" == *conversation_* || "$lower" == *verification* || "$lower" == *automation* ]]; then
    echo "Work_Product"
  else
    echo "General"
  fi
}

move_doc() {
  local path="$1"
  local name="${path:t}"
  local category dest_dir dest stem ext counter

  category="$(doc_category "$name")"
  dest_dir="$documents_dir/$category"
  dest="$dest_dir/$name"

  (( ++folder_counts["$category"] ))
  (( moved_docs += 1 ))

  if $dry_run; then
    printf 'MOVE\t%s\t%s/\n' "$name" "$category"
    return
  fi

  /bin/mkdir -p "$dest_dir"

  if [[ -e "$dest" ]]; then
    if [[ "$name" == *.* ]]; then
      stem="${name%.*}"
      ext=".${name##*.}"
    else
      stem="$name"
      ext=""
    fi
    counter=2
    while [[ -e "$dest_dir/${stem}-$counter${ext}" ]]; do
      (( counter++ ))
    done
    dest="$dest_dir/${stem}-$counter${ext}"
  fi

  /bin/mv "$path" "$dest"
}

# Remove the top-level 3D_Assets folder.
trash_item "$downloads_dir/3D_Assets"

# Remove only high-confidence document junk and exact duplicates with weaker names.
typeset -a trash_docs=(
  "$documents_dir/cm7dlgzqg09o007yr06rk4lwg-2647d00b-d300-910c-1b4d-761b59195ca2-Agent as a world Instructions (3).pdf"
  "$documents_dir/CompletedExample.pdf"
  "$documents_dir/pass_ios-keep-screen-on-walkthrough_result.txt"
  "$documents_dir/Adrian_Mercer_Quarterly_taxes.pdf"
  "$documents_dir/o.md"
  "$documents_dir/Ashley_Jackson_Completed_Profile_Template.txt"
  "$documents_dir/OpenClaw_Fractional_CFO_Time_Tracking_Invoicing_v0.0.1 (1).pdf"
)

for path in "${trash_docs[@]}"; do
  trash_item "$path"
done

for path in "$documents_dir"/*; do
  [[ -f "$path" ]] || continue
  move_doc "$path"
done

echo ""
echo "Summary:"
echo "Moved docs: $moved_docs"
echo "Trashed items: $trashed_items"
echo "Trashed bytes: $trashed_bytes"
for category in ${(ok)folder_counts}; do
  echo "$category: ${folder_counts[$category]}"
done
if ! $dry_run; then
  echo "Trash location: $trash_root"
fi
