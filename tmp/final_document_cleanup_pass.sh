#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Downloads_cleanup_final_docs_$(date +%Y%m%d_%H%M%S)"

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

# Move selected medical files to Ashley's health records folder.
move_file "/Users/ashley/Downloads/Documents/Medical/JB_physical_2025.pdf" "/Users/ashley/Documents/health records"
move_file "/Users/ashley/Downloads/Documents/Medical/report-wellnessScreener-2026-01-22T05-59-48.500Z.pdf" "/Users/ashley/Documents/health records"

# Create a credentials folder and move earned certificates into it.
move_file "/Users/ashley/Downloads/Documents/Learning/GA_Software_Engineering_Bootcamp_Credential.pdf" "/Users/ashley/Credentials and Certificates"
move_file "/Users/ashley/Downloads/Documents/Learning/AWS Entry certification.pdf" "/Users/ashley/Credentials and Certificates"

# Move AuthorGuide into FleetAI/OpenClaw.
move_file "/Users/ashley/Downloads/Documents/Learning/AuthorGuide.pdf" "/Users/ashley/FleetAI/OpenClaw"

# Fleet-related resumes/documents.
move_file "/Users/ashley/Downloads/Documents/Work_Product/Ashley_Jackson_MTS_FleetAI.docx" "/Users/ashley/Downloads/Documents/Resumes" "Ashley_Jackson_FleetAI_Member_of_Technical_Staff_Resume.docx"
move_file "/Users/ashley/Downloads/Documents/Work_Product/Ashley_Jackson_Operations_Fleet.pdf" "/Users/ashley/Downloads/Documents/Resumes" "Ashley_Jackson_Fleet_Operations_Resume.pdf"
move_file "/Users/ashley/Downloads/Documents/Work_Product/Fleet_AI_Company_Verification.pdf" "/Users/ashley/Downloads/Documents/Resumes" "FleetAI_Company_Verification.pdf"

# Trash high-confidence junk.
typeset -a trash_targets=(
  "/Users/ashley/Downloads/Documents/.DS_Store"
  "/Users/ashley/Downloads/Documents/General/.DS_Store"
  "/Users/ashley/Downloads/Documents/Learning/.DS_Store"

  # Keep only the newest David resume.
  "/Users/ashley/Downloads/Documents/Resumes/David Drum Resume 23.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_Evaluation.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_Final.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_Full_Page.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_OnePage_v2.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_One_Page.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_Optimized.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_ATS_Optimized-2.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Drum_Resume_WFH.docx"
  "/Users/ashley/Downloads/Documents/Resumes/David_Resume.docx"

  # Delete all other resumes except Riley and the Fleet-related resumes above.
  "/Users/ashley/Downloads/Documents/Resumes/ATS_Optimized_Resume_Template.docx"
  "/Users/ashley/Downloads/Documents/Resumes/Achal _A_Ghugare-Resume Oracle Utilities.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley Jackson General v3.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley Jackson Resume for AI.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Full.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_AI.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_AI_Trainer_Resume.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_AI_updated-2.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_Resume_Final-2.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_Resume_Operations_Generalist.docx"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_Resume_Operations_Generalist.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Jackson_Resume_Updated_2026.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Resume.docx"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_Roblox.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Ashley_swe.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Mohammad_Wafiq_Hammaba_Resume.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Sarah_Winston_ATS_Resume_Outlier_Aether-2.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Wafiq_Outlier_Resume.pdf"
  "/Users/ashley/Downloads/Documents/Resumes/Wafiq_Resume (1).pdf"
  "/Users/ashley/Downloads/Documents/Resumes/resume-1.pdf"

  # Trash stale work files.
  "/Users/ashley/Downloads/Documents/Work_Product/AI_Automation_Platform_Evaluation_Report.pdf"
  "/Users/ashley/Downloads/Documents/Work_Product/Board-2.pdf"
  "/Users/ashley/Downloads/Documents/Work_Product/conversation_excerpt.txt"
  "/Users/ashley/Downloads/Documents/Work_Product/Conversation_6272_PM_Team_Sync_Agenda_and_Follow_Up_on_Feature_Launch.docx"
  "/Users/ashley/Downloads/Documents/Work_Product/Conversation_6283_PM_Team_Sync_Agenda_and_Follow_Up_Items.docx"
  "/Users/ashley/Downloads/Documents/Work_Product/Conversation_6316_PM_Team_Sync_Agenda_and_Follow_up_Items.docx"
  "/Users/ashley/Downloads/Documents/Work_Product/Conversation_6428_Follow_up_on_Insights_from_Customer_Discovery_Call.docx"
  "/Users/ashley/Downloads/Documents/Work_Product/Conversation_6438_PM_team_sync_agenda_and_follow_up_items.docx"
  "/Users/ashley/Downloads/Documents/Work_Product/enhanced_analytics_dashboard_chat.docx"
)

for target in "${trash_targets[@]}"; do
  trash_item "$target"
done
