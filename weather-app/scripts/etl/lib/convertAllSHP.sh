#!/bin/bash
# 전국 법정동 SHP → GeoJSON 일괄 변환 스크립트
#
# GDAL ogr2ogr를 사용하여 16개 시도 SHP 파일을 WGS84 GeoJSON으로 변환합니다.
#
# 사용법:
#   chmod +x scripts/etl/convertAllSHP.sh
#   ./scripts/etl/convertAllSHP.sh
#
# 요구사항:
#   - GDAL (ogr2ogr) 설치 필요
#   - macOS: brew install gdal
#   - Ubuntu: sudo apt install gdal-bin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$SCRIPT_DIR/../data/LSMD_ADM_SECT_UMD_전국"
OUTPUT_DIR="$SCRIPT_DIR/../data/converted"

# 시도 코드 → 폴더명 매핑
declare -A PROVINCE_DIRS=(
  ["11"]="LSMD_ADM_SECT_UMD_서울"
  ["26"]="LSMD_ADM_SECT_UMD_부산"
  ["27"]="LSMD_ADM_SECT_UMD_대구"
  ["28"]="LSMD_ADM_SECT_UMD_인천"
  ["29"]="LSMD_ADM_SECT_UMD_광주"
  ["30"]="LSMD_ADM_SECT_UMD_대전"
  ["31"]="LSMD_ADM_SECT_UMD_울산"
  ["36"]="LSMD_ADM_SECT_UMD_세종"
  ["41"]="LSMD_ADM_SECT_UMD_경기"
  ["43"]="LSMD_ADM_SECT_UMD_충북"
  ["44"]="LSMD_ADM_SECT_UMD_충남"
  ["46"]="LSMD_ADM_SECT_UMD_전남"
  ["47"]="LSMD_ADM_SECT_UMD_경북"
  ["48"]="LSMD_ADM_SECT_UMD_경남"
  ["51"]="LSMD_ADM_SECT_UMD_강원특별자치도"
  ["52"]="LSMD_ADM_SECT_UMD_전북특별자치도"
)

# 시도 코드 → 시도명 매핑 (로그용)
declare -A PROVINCE_NAMES=(
  ["11"]="서울특별시"
  ["26"]="부산광역시"
  ["27"]="대구광역시"
  ["28"]="인천광역시"
  ["29"]="광주광역시"
  ["30"]="대전광역시"
  ["31"]="울산광역시"
  ["36"]="세종특별자치시"
  ["41"]="경기도"
  ["43"]="충청북도"
  ["44"]="충청남도"
  ["46"]="전라남도"
  ["47"]="경상북도"
  ["48"]="경상남도"
  ["51"]="강원특별자치도"
  ["52"]="전북특별자치도"
)

echo "🔄 전국 법정동 SHP → GeoJSON 변환 시작"
echo "   원본: $BASE_DIR"
echo "   출력: $OUTPUT_DIR"
echo ""

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

# GDAL 설치 확인
if ! command -v ogr2ogr &> /dev/null; then
  echo "❌ GDAL이 설치되어 있지 않습니다."
  echo "   macOS: brew install gdal"
  echo "   Ubuntu: sudo apt install gdal-bin"
  exit 1
fi

echo "✅ GDAL 버전: $(ogr2ogr --version | head -1)"
echo ""

# 변환 통계
SUCCESS_COUNT=0
FAIL_COUNT=0

# 시도별 변환
for code in "${!PROVINCE_DIRS[@]}"; do
  dir_name="${PROVINCE_DIRS[$code]}"
  province_name="${PROVINCE_NAMES[$code]}"

  # SHP 파일 찾기
  shp_file=$(find "$BASE_DIR/$dir_name" -name "*.shp" 2>/dev/null | head -1)

  if [ -z "$shp_file" ]; then
    echo "⚠️  [$code] $province_name: SHP 파일 없음 (건너뜀)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi

  output_file="$OUTPUT_DIR/${code}_wgs84.json"

  echo -n "📍 [$code] $province_name... "

  # ogr2ogr로 변환 (좌표계: EPSG:4326 = WGS84)
  if ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$output_file" "$shp_file" 2>/dev/null; then
    feature_count=$(grep -c '"type": "Feature"' "$output_file" 2>/dev/null || echo "?")
    echo "✅ ($feature_count개 Feature)"
    ((SUCCESS_COUNT++))
  else
    echo "❌ 변환 실패"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo ""
echo "📊 변환 완료"
echo "   성공: $SUCCESS_COUNT개 시도"
echo "   실패: $FAIL_COUNT개 시도"
echo ""
echo "📁 출력 파일:"
ls -lh "$OUTPUT_DIR"/*.json 2>/dev/null || echo "   (출력 파일 없음)"
