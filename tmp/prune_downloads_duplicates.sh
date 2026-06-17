#!/bin/zsh

set -euo pipefail

downloads_dir="${1:-$HOME/Downloads}"
mode="${2:-dry-run}"
trash_root="${HOME}/.Trash/Downloads_cleanup_$(date +%Y%m%d_%H%M%S)"

if [[ ! -d "$downloads_dir" ]]; then
  echo "Downloads directory not found: $downloads_dir" >&2
  exit 1
fi

dry_run=true
if [[ "$mode" == "apply" ]]; then
  dry_run=false
fi

tmp_candidates="$(mktemp)"
trap '/bin/rm -f "$tmp_candidates"' EXIT

copy_base() {
  local name="$1"
  local base="$name"

  if [[ "$name" =~ '^(.*) \(([0-9]+)\)(\.[^.]+)?$' ]]; then
    base="${match[1]}${match[3]}"
  elif [[ "$name" =~ '^(.*) ([0-9]+)(\.[^.]+)?$' ]]; then
    base="${match[1]}${match[3]}"
  elif [[ "$name" =~ '^(.*)-([0-9]+)(\.[^.]+)?$' ]]; then
    base="${match[1]}${match[3]}"
  fi

  printf '%s\n' "$base"
}

is_copy_name() {
  local name="$1"
  [[ "$name" =~ '^(.*) \(([0-9]+)\)(\.[^.]+)?$' ]] \
    || [[ "$name" =~ '^(.*) ([0-9]+)(\.[^.]+)?$' ]] \
    || [[ "$name" =~ '^(.*)-([0-9]+)(\.[^.]+)?$' ]]
}

queue_candidate() {
  local path="$1"
  local reason="$2"
  local size="$3"
  printf '%s\t%s\t%s\n' "$path" "$reason" "$size" >> "$tmp_candidates"
}

while IFS= read -r junk; do
  [[ -n "$junk" ]] || continue
  if [[ -d "$junk" ]]; then
    size=$(du -sk "$junk" | awk '{print $1 * 1024}')
  else
    size=$(/usr/bin/stat -f '%z' "$junk")
  fi
  queue_candidate "$junk" "junk" "$size"
done < <(
  find "$downloads_dir" -mindepth 1 -maxdepth 1 \
    \( -name '.DS_Store' -o -name '.localized' -o -name 'Icon?' -o -name '~$*' -o -name '*.download' -o -name '*.crdownload' -o -name '*.part' \) \
    -print
)

while IFS= read -r path; do
  [[ -n "$path" ]] || continue
  name="${path:t}"

  if ! is_copy_name "$name"; then
    continue
  fi

  base_name="$(copy_base "$name")"
  base_path="$downloads_dir/$base_name"

  [[ -e "$base_path" ]] || continue
  [[ "$base_path" != "$path" ]] || continue

  if /usr/bin/cmp -s "$path" "$base_path"; then
    size=$(/usr/bin/stat -f '%z' "$path")
    queue_candidate "$path" "duplicate_of:${base_name}" "$size"
  fi
done < <(find "$downloads_dir" -mindepth 1 -maxdepth 1 -type f -print)

typeset -A seen
typeset -i total_count=0
typeset -i total_bytes=0

if ! $dry_run; then
  /bin/mkdir -p "$trash_root"
fi

while IFS=$'\t' read -r path reason size; do
  [[ -n "$path" ]] || continue
  [[ -e "$path" ]] || continue
  [[ -z "${seen[$path]:-}" ]] || continue

  seen["$path"]=1
  (( total_count += 1 ))
  (( total_bytes += size ))

  if $dry_run; then
    printf '%s\t%s\n' "${path#$downloads_dir/}" "$reason"
  else
    /bin/mv "$path" "$trash_root/"
    printf '%s\t%s\n' "${path#$downloads_dir/}" "$reason"
  fi
done < "$tmp_candidates"

echo ""
echo "Summary:"
echo "Items: $total_count"
echo "Bytes: $total_bytes"
if ! $dry_run; then
  echo "Moved to: $trash_root"
fi
