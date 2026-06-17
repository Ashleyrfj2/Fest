#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Downloads_cleanup_review_list_$(date +%Y%m%d_%H%M%S)"

typeset -a targets=(
  "/Users/ashley/Downloads/Documents/.DS_Store"
  "/Users/ashley/Downloads/Documents/General/.DS_Store"
  "/Users/ashley/Downloads/Documents/Learning/.DS_Store"
  "/Users/ashley/Downloads/Documents/General/5387e51484a1be4e04c7ee098bbf611b.docx"
  "/Users/ashley/Downloads/Documents/General/821a0d3cdf5093695970a366b97e1334.docx"
  "/Users/ashley/Downloads/Documents/General/90ff48ec36ad6f5374bd86c0aea58ed5.docx"
  "/Users/ashley/Downloads/Documents/General/97aadfd4af7baa6fe70c093eb1783c5b.docx"
  "/Users/ashley/Downloads/Documents/General/a5c7b73e691ba567c5fb56f7dd6020cb.docx"
  "/Users/ashley/Downloads/Documents/General/ed5a7d398e8d470ee4499b9fdb8bc6dc.docx"
  "/Users/ashley/Downloads/Documents/General/Document 3.docx"
  "/Users/ashley/Downloads/Documents/General/docx current.docx"

  "/Users/ashley/Downloads/Documents/Medical/Adenomyosis_ Understanding Your Symptoms and Treatment Options.pdf"
  "/Users/ashley/Downloads/Documents/Medical/IdCard|UnitedHealthcare.pdf"
  "/Users/ashley/Downloads/Documents/Medical/Transvaginal Ultrasound Findings – Ashley R. Jackson (July 14, 2025).pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_AI_updated.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Sarah_Winston_ATS_Resume_Outlier_Aether.pdf"
  "/Users/ashley/Downloads/Documents/Work_Product/Board.pdf"

  "/Users/ashley/Downloads/Documents/General/ethan_rowan_agora_removed_patch.docx"
  "/Users/ashley/Downloads/Documents/General/student-career-prep-ethan-rowan-v0.0.1_seed-consistency_v12.docx"
  "/Users/ashley/Downloads/Documents/General/student_career_prep_ethan_rowan_v1.docx"

  "/Users/ashley/Downloads/Documents/OpenClaw"
)

/bin/mkdir -p "$trash_root"

typeset -i total=0
typeset -i total_bytes=0

for target in "${targets[@]}"; do
  [[ -e "$target" ]] || continue

  if [[ -d "$target" ]]; then
    size=$(/usr/bin/du -sk "$target" | /usr/bin/awk '{print $1 * 1024}')
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
