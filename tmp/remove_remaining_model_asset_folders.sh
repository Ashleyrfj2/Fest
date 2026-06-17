#!/bin/zsh

set -euo pipefail

trash_root="$HOME/.Trash/Downloads_cleanup_model_asset_folders_$(date +%Y%m%d_%H%M%S)"

typeset -a targets=(
  "/Users/ashley/Downloads/react-lua-17.2.1"
  "/Users/ashley/Downloads/ArcadeAssets"
  "/Users/ashley/Downloads/Classical_city_models_FBX"
  "/Users/ashley/Downloads/Meshy_AI_Blue_Sheet_Bed_0103093549_texture_obj"
  "/Users/ashley/Downloads/Meshy_AI_Door_Handle_Design_0121053312_texture_obj"
  "/Users/ashley/Downloads/Meshy_AI_Doorhandle_0121052058_texture_obj"
  "/Users/ashley/Downloads/Meshy_AI_I_need_a_toddler_bed__0103084720_texture_obj"
  "/Users/ashley/Downloads/Meshy_AI_Vaporware_simple_arca_0127082524_texture_fbx"
  "/Users/ashley/Downloads/baby+bottle+3d+model"
  "/Users/ashley/Downloads/baby+crib+3d+model"
  "/Users/ashley/Downloads/banana+3d+model"
  "/Users/ashley/Downloads/blue+slime+3d+model"
  "/Users/ashley/Downloads/colorful+animal+toy+3d+model"
  "/Users/ashley/Downloads/colorful+block+castle+3d+model"
  "/Users/ashley/Downloads/colorful+block+castle+3d+model-2"
  "/Users/ashley/Downloads/colorful+blocky+bear+3d+model"
  "/Users/ashley/Downloads/daycare+foam+mat+3d+model"
  "/Users/ashley/Downloads/ecba63cc-eed4-406f-8166-a1cf5222befd.fbm"
  "/Users/ashley/Downloads/floor_lamp___modern_or_classic_shade_.fbm"
  "/Users/ashley/Downloads/fried+potato+coins+3d+model_Clone1"
  "/Users/ashley/Downloads/kids+bed+3d+model"
  "/Users/ashley/Downloads/lavender+bowl+3d+model"
  "/Users/ashley/Downloads/lavender+bowl+3d+model-2"
  "/Users/ashley/Downloads/lavender+bowl+3d+model-3"
  "/Users/ashley/Downloads/lavender+bowl+3d+model-4"
  "/Users/ashley/Downloads/meshy_reference_pack"
  "/Users/ashley/Downloads/metal+handrail+post+3d+model"
  "/Users/ashley/Downloads/pastel+bench+3d+model"
  "/Users/ashley/Downloads/pastel+modular+bench+3d+model"
  "/Users/ashley/Downloads/sauce+cup+3d+model"
  "/Users/ashley/Downloads/strawberry+3d+model_Clone1"
  "/Users/ashley/Downloads/wooden+dragon+toy+3d+model"
  "/Users/ashley/Downloads/wooden+dragon+toy+3d+model.fbm"
)

/bin/mkdir -p "$trash_root"

typeset -i total=0
typeset -i total_bytes=0

for target in "${targets[@]}"; do
  [[ -d "$target" ]] || continue

  size=$(/usr/bin/du -sk "$target" | /usr/bin/awk '{print $1 * 1024}')
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
