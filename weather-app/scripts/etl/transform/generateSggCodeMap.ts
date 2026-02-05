/**
 * 전국 시군구 코드 맵 자동 생성 스크립트
 *
 * 전국 264개 시군구 코드를 포함한 sggCodeMap.ts 파일을 생성합니다.
 *
 * 사용법:
 *   npx tsx scripts/etl/generateSggCodeMap.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 시도 코드 → 시도명 (SHP 기준)
const PROVINCE_MAP: Record<string, string> = {
  '11': '서울특별시',
  '26': '부산광역시',
  '27': '대구광역시',
  '28': '인천광역시',
  '29': '광주광역시',
  '30': '대전광역시',
  '31': '울산광역시',
  '36': '세종특별자치시',
  '41': '경기도',
  '43': '충청북도',
  '44': '충청남도',
  '46': '전라남도',
  '47': '경상북도',
  '48': '경상남도',
  '51': '강원특별자치도', // 주의: 기존 42 아님
  '52': '전북특별자치도', // 주의: 기존 45 아님
}

/**
 * 수동 시군구 코드 맵 (자동 매칭이 어려운 경우)
 * SHP 데이터와 korea_districts.json을 직접 비교하여 작성
 */
const MANUAL_SGG_MAP: Record<string, { province: string; city: string }> = {
  // 서울특별시
  '11010': { province: '서울특별시', city: '종로구' },
  '11020': { province: '서울특별시', city: '중구' },
  '11030': { province: '서울특별시', city: '용산구' },
  '11040': { province: '서울특별시', city: '성동구' },
  '11050': { province: '서울특별시', city: '광진구' },
  '11060': { province: '서울특별시', city: '동대문구' },
  '11070': { province: '서울특별시', city: '중랑구' },
  '11080': { province: '서울특별시', city: '성북구' },
  '11090': { province: '서울특별시', city: '강북구' },
  '11100': { province: '서울특별시', city: '도봉구' },
  '11110': { province: '서울특별시', city: '노원구' },
  '11120': { province: '서울특별시', city: '은평구' },
  '11130': { province: '서울특별시', city: '서대문구' },
  '11140': { province: '서울특별시', city: '마포구' },
  '11150': { province: '서울특별시', city: '양천구' },
  '11160': { province: '서울특별시', city: '강서구' },
  '11170': { province: '서울특별시', city: '구로구' },
  '11180': { province: '서울특별시', city: '금천구' },
  '11190': { province: '서울특별시', city: '영등포구' },
  '11200': { province: '서울특별시', city: '동작구' },
  '11210': { province: '서울특별시', city: '관악구' },
  '11220': { province: '서울특별시', city: '서초구' },
  '11230': { province: '서울특별시', city: '강남구' },
  '11240': { province: '서울특별시', city: '송파구' },
  '11250': { province: '서울특별시', city: '강동구' },

  // 부산광역시
  '26010': { province: '부산광역시', city: '중구' },
  '26020': { province: '부산광역시', city: '서구' },
  '26030': { province: '부산광역시', city: '동구' },
  '26040': { province: '부산광역시', city: '영도구' },
  '26050': { province: '부산광역시', city: '부산진구' },
  '26060': { province: '부산광역시', city: '동래구' },
  '26070': { province: '부산광역시', city: '남구' },
  '26080': { province: '부산광역시', city: '북구' },
  '26090': { province: '부산광역시', city: '해운대구' },
  '26100': { province: '부산광역시', city: '사하구' },
  '26110': { province: '부산광역시', city: '금정구' },
  '26120': { province: '부산광역시', city: '강서구' },
  '26130': { province: '부산광역시', city: '연제구' },
  '26140': { province: '부산광역시', city: '수영구' },
  '26150': { province: '부산광역시', city: '사상구' },
  '26710': { province: '부산광역시', city: '기장군' },

  // 대구광역시
  '27010': { province: '대구광역시', city: '중구' },
  '27020': { province: '대구광역시', city: '동구' },
  '27030': { province: '대구광역시', city: '서구' },
  '27040': { province: '대구광역시', city: '남구' },
  '27050': { province: '대구광역시', city: '북구' },
  '27060': { province: '대구광역시', city: '수성구' },
  '27070': { province: '대구광역시', city: '달서구' },
  '27710': { province: '대구광역시', city: '달성군' },
  '27720': { province: '대구광역시', city: '군위군' },

  // 인천광역시
  '28010': { province: '인천광역시', city: '중구' },
  '28020': { province: '인천광역시', city: '동구' },
  '28030': { province: '인천광역시', city: '미추홀구' },
  '28040': { province: '인천광역시', city: '연수구' },
  '28050': { province: '인천광역시', city: '남동구' },
  '28060': { province: '인천광역시', city: '부평구' },
  '28070': { province: '인천광역시', city: '계양구' },
  '28080': { province: '인천광역시', city: '서구' },
  '28710': { province: '인천광역시', city: '강화군' },
  '28720': { province: '인천광역시', city: '옹진군' },

  // 광주광역시
  '29010': { province: '광주광역시', city: '동구' },
  '29020': { province: '광주광역시', city: '서구' },
  '29030': { province: '광주광역시', city: '남구' },
  '29040': { province: '광주광역시', city: '북구' },
  '29050': { province: '광주광역시', city: '광산구' },

  // 대전광역시
  '30010': { province: '대전광역시', city: '동구' },
  '30020': { province: '대전광역시', city: '중구' },
  '30030': { province: '대전광역시', city: '서구' },
  '30040': { province: '대전광역시', city: '유성구' },
  '30050': { province: '대전광역시', city: '대덕구' },

  // 울산광역시
  '31010': { province: '울산광역시', city: '중구' },
  '31020': { province: '울산광역시', city: '남구' },
  '31030': { province: '울산광역시', city: '동구' },
  '31040': { province: '울산광역시', city: '북구' },
  '31710': { province: '울산광역시', city: '울주군' },

  // 세종특별자치시
  '36110': { province: '세종특별자치시', city: '세종특별자치시' },

  // 경기도
  '41110': { province: '경기도', city: '수원시' },
  '41111': { province: '경기도', city: '수원시장안구' },
  '41113': { province: '경기도', city: '수원시권선구' },
  '41115': { province: '경기도', city: '수원시팔달구' },
  '41117': { province: '경기도', city: '수원시영통구' },
  '41130': { province: '경기도', city: '성남시' },
  '41131': { province: '경기도', city: '성남시수정구' },
  '41133': { province: '경기도', city: '성남시중원구' },
  '41135': { province: '경기도', city: '성남시분당구' },
  '41150': { province: '경기도', city: '의정부시' },
  '41170': { province: '경기도', city: '안양시' },
  '41171': { province: '경기도', city: '안양시만안구' },
  '41173': { province: '경기도', city: '안양시동안구' },
  '41190': { province: '경기도', city: '부천시' },
  '41210': { province: '경기도', city: '광명시' },
  '41220': { province: '경기도', city: '평택시' },
  '41250': { province: '경기도', city: '동두천시' },
  '41270': { province: '경기도', city: '안산시' },
  '41271': { province: '경기도', city: '안산시상록구' },
  '41273': { province: '경기도', city: '안산시단원구' },
  '41280': { province: '경기도', city: '고양시' },
  '41281': { province: '경기도', city: '고양시덕양구' },
  '41285': { province: '경기도', city: '고양시일산동구' },
  '41287': { province: '경기도', city: '고양시일산서구' },
  '41290': { province: '경기도', city: '과천시' },
  '41310': { province: '경기도', city: '구리시' },
  '41360': { province: '경기도', city: '남양주시' },
  '41370': { province: '경기도', city: '오산시' },
  '41390': { province: '경기도', city: '시흥시' },
  '41410': { province: '경기도', city: '군포시' },
  '41430': { province: '경기도', city: '의왕시' },
  '41450': { province: '경기도', city: '하남시' },
  '41460': { province: '경기도', city: '용인시' },
  '41461': { province: '경기도', city: '용인시처인구' },
  '41463': { province: '경기도', city: '용인시기흥구' },
  '41465': { province: '경기도', city: '용인시수지구' },
  '41480': { province: '경기도', city: '파주시' },
  '41500': { province: '경기도', city: '이천시' },
  '41550': { province: '경기도', city: '안성시' },
  '41570': { province: '경기도', city: '김포시' },
  '41590': { province: '경기도', city: '화성시' },
  '41610': { province: '경기도', city: '광주시' },
  '41630': { province: '경기도', city: '양주시' },
  '41650': { province: '경기도', city: '포천시' },
  '41670': { province: '경기도', city: '여주시' },
  '41800': { province: '경기도', city: '연천군' },
  '41820': { province: '경기도', city: '가평군' },
  '41830': { province: '경기도', city: '양평군' },

  // 충청북도
  '43110': { province: '충청북도', city: '청주시' },
  '43111': { province: '충청북도', city: '청주시상당구' },
  '43112': { province: '충청북도', city: '청주시서원구' },
  '43113': { province: '충청북도', city: '청주시흥덕구' },
  '43114': { province: '충청북도', city: '청주시청원구' },
  '43130': { province: '충청북도', city: '충주시' },
  '43150': { province: '충청북도', city: '제천시' },
  '43720': { province: '충청북도', city: '보은군' },
  '43730': { province: '충청북도', city: '옥천군' },
  '43740': { province: '충청북도', city: '영동군' },
  '43745': { province: '충청북도', city: '증평군' },
  '43750': { province: '충청북도', city: '진천군' },
  '43760': { province: '충청북도', city: '괴산군' },
  '43770': { province: '충청북도', city: '음성군' },
  '43800': { province: '충청북도', city: '단양군' },

  // 충청남도
  '44130': { province: '충청남도', city: '천안시' },
  '44131': { province: '충청남도', city: '천안시동남구' },
  '44133': { province: '충청남도', city: '천안시서북구' },
  '44150': { province: '충청남도', city: '공주시' },
  '44180': { province: '충청남도', city: '보령시' },
  '44200': { province: '충청남도', city: '아산시' },
  '44210': { province: '충청남도', city: '서산시' },
  '44230': { province: '충청남도', city: '논산시' },
  '44250': { province: '충청남도', city: '계룡시' },
  '44270': { province: '충청남도', city: '당진시' },
  '44710': { province: '충청남도', city: '금산군' },
  '44760': { province: '충청남도', city: '부여군' },
  '44770': { province: '충청남도', city: '서천군' },
  '44790': { province: '충청남도', city: '청양군' },
  '44800': { province: '충청남도', city: '홍성군' },
  '44810': { province: '충청남도', city: '예산군' },
  '44825': { province: '충청남도', city: '태안군' },

  // 전북특별자치도 (코드 52)
  '52110': { province: '전북특별자치도', city: '전주시' },
  '52111': { province: '전북특별자치도', city: '전주시완산구' },
  '52113': { province: '전북특별자치도', city: '전주시덕진구' },
  '52130': { province: '전북특별자치도', city: '군산시' },
  '52140': { province: '전북특별자치도', city: '익산시' },
  '52180': { province: '전북특별자치도', city: '정읍시' },
  '52190': { province: '전북특별자치도', city: '남원시' },
  '52210': { province: '전북특별자치도', city: '김제시' },
  '52710': { province: '전북특별자치도', city: '완주군' },
  '52720': { province: '전북특별자치도', city: '진안군' },
  '52730': { province: '전북특별자치도', city: '무주군' },
  '52740': { province: '전북특별자치도', city: '장수군' },
  '52750': { province: '전북특별자치도', city: '임실군' },
  '52770': { province: '전북특별자치도', city: '순창군' },
  '52790': { province: '전북특별자치도', city: '고창군' },
  '52800': { province: '전북특별자치도', city: '부안군' },

  // 전라남도
  '46110': { province: '전라남도', city: '목포시' },
  '46130': { province: '전라남도', city: '여수시' },
  '46150': { province: '전라남도', city: '순천시' },
  '46170': { province: '전라남도', city: '나주시' },
  '46230': { province: '전라남도', city: '광양시' },
  '46710': { province: '전라남도', city: '담양군' },
  '46720': { province: '전라남도', city: '곡성군' },
  '46730': { province: '전라남도', city: '구례군' },
  '46770': { province: '전라남도', city: '고흥군' },
  '46780': { province: '전라남도', city: '보성군' },
  '46790': { province: '전라남도', city: '화순군' },
  '46800': { province: '전라남도', city: '장흥군' },
  '46810': { province: '전라남도', city: '강진군' },
  '46820': { province: '전라남도', city: '해남군' },
  '46830': { province: '전라남도', city: '영암군' },
  '46840': { province: '전라남도', city: '무안군' },
  '46860': { province: '전라남도', city: '함평군' },
  '46870': { province: '전라남도', city: '영광군' },
  '46880': { province: '전라남도', city: '장성군' },
  '46890': { province: '전라남도', city: '완도군' },
  '46900': { province: '전라남도', city: '진도군' },
  '46910': { province: '전라남도', city: '신안군' },

  // 경상북도
  '47110': { province: '경상북도', city: '포항시' },
  '47111': { province: '경상북도', city: '포항시남구' },
  '47113': { province: '경상북도', city: '포항시북구' },
  '47130': { province: '경상북도', city: '경주시' },
  '47150': { province: '경상북도', city: '김천시' },
  '47170': { province: '경상북도', city: '안동시' },
  '47190': { province: '경상북도', city: '구미시' },
  '47210': { province: '경상북도', city: '영주시' },
  '47230': { province: '경상북도', city: '영천시' },
  '47250': { province: '경상북도', city: '상주시' },
  '47280': { province: '경상북도', city: '문경시' },
  '47290': { province: '경상북도', city: '경산시' },
  '47720': { province: '경상북도', city: '의성군' },
  '47730': { province: '경상북도', city: '청송군' },
  '47750': { province: '경상북도', city: '영양군' },
  '47760': { province: '경상북도', city: '영덕군' },
  '47770': { province: '경상북도', city: '청도군' },
  '47780': { province: '경상북도', city: '고령군' },
  '47790': { province: '경상북도', city: '성주군' },
  '47800': { province: '경상북도', city: '칠곡군' },
  '47820': { province: '경상북도', city: '예천군' },
  '47830': { province: '경상북도', city: '봉화군' },
  '47840': { province: '경상북도', city: '울진군' },
  '47850': { province: '경상북도', city: '울릉군' },

  // 경상남도
  '48120': { province: '경상남도', city: '창원시' },
  '48121': { province: '경상남도', city: '창원시의창구' },
  '48123': { province: '경상남도', city: '창원시성산구' },
  '48125': { province: '경상남도', city: '창원시마산합포구' },
  '48127': { province: '경상남도', city: '창원시마산회원구' },
  '48129': { province: '경상남도', city: '창원시진해구' },
  '48170': { province: '경상남도', city: '진주시' },
  '48220': { province: '경상남도', city: '통영시' },
  '48240': { province: '경상남도', city: '사천시' },
  '48250': { province: '경상남도', city: '김해시' },
  '48270': { province: '경상남도', city: '밀양시' },
  '48310': { province: '경상남도', city: '거제시' },
  '48330': { province: '경상남도', city: '양산시' },
  '48720': { province: '경상남도', city: '의령군' },
  '48730': { province: '경상남도', city: '함안군' },
  '48740': { province: '경상남도', city: '창녕군' },
  '48820': { province: '경상남도', city: '고성군' },
  '48840': { province: '경상남도', city: '남해군' },
  '48850': { province: '경상남도', city: '하동군' },
  '48860': { province: '경상남도', city: '산청군' },
  '48870': { province: '경상남도', city: '함양군' },
  '48880': { province: '경상남도', city: '거창군' },
  '48890': { province: '경상남도', city: '합천군' },

  // 강원특별자치도 (코드 51)
  '51110': { province: '강원특별자치도', city: '춘천시' },
  '51130': { province: '강원특별자치도', city: '원주시' },
  '51150': { province: '강원특별자치도', city: '강릉시' },
  '51170': { province: '강원특별자치도', city: '동해시' },
  '51190': { province: '강원특별자치도', city: '태백시' },
  '51210': { province: '강원특별자치도', city: '속초시' },
  '51230': { province: '강원특별자치도', city: '삼척시' },
  '51720': { province: '강원특별자치도', city: '홍천군' },
  '51730': { province: '강원특별자치도', city: '횡성군' },
  '51750': { province: '강원특별자치도', city: '영월군' },
  '51760': { province: '강원특별자치도', city: '평창군' },
  '51770': { province: '강원특별자치도', city: '정선군' },
  '51780': { province: '강원특별자치도', city: '철원군' },
  '51790': { province: '강원특별자치도', city: '화천군' },
  '51800': { province: '강원특별자치도', city: '양구군' },
  '51810': { province: '강원특별자치도', city: '인제군' },
  '51820': { province: '강원특별자치도', city: '고성군' },
  '51830': { province: '강원특별자치도', city: '양양군' },
}

/**
 * sggCodeMap.ts 파일 생성
 */
const generateSggCodeMapFile = (outputPath: string) => {
  const entries = Object.entries(MANUAL_SGG_MAP)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, info]) => `  '${code}': { province: '${info.province}', city: '${info.city}' },`)
    .join('\n')

  const content = `/**
 * 시군구 코드 매핑 (EMD_CD 앞 5자리 → 시도/시군구 이름)
 *
 * 법정동 SHP 파일의 EMD_CD 코드를 시도/시군구 이름으로 변환합니다.
 * 전국 16개 시도 264개 시군구 포함.
 *
 * 코드 체계:
 * - 앞 2자리: 시도 코드
 * - 뒤 3자리: 시군구 코드
 *
 * 주의: 강원특별자치도(51), 전북특별자치도(52)는 새 코드 사용
 *
 * 자동 생성: scripts/etl/generateSggCodeMap.ts
 */

export interface SggInfo {
  province: string
  city: string
}

export const SGG_CODE_MAP: Record<string, SggInfo> = {
${entries}
}

/**
 * COL_ADM_SE 코드로 시군구 정보 조회
 */
export const getSggInfo = (colAdmSe: string): SggInfo | null => {
  return SGG_CODE_MAP[colAdmSe] || null
}

/**
 * EMD_CD (읍면동 코드) 기반으로 시군구 정보 조회
 *
 * 법정동 SHP에서 COL_ADM_SE가 행정시 단위(청주시 = 43110)로만 제공되는 경우,
 * EMD_CD의 앞 5자리를 사용하여 일반구 단위로 정확히 매핑합니다.
 *
 * 예: EMD_CD "43111310" → 앞 5자리 "43111" → 청주시상당구
 */
export const getSggInfoByEmdCode = (emdCode: string): SggInfo | null => {
  if (!emdCode || emdCode.length < 5) return null

  // EMD_CD 앞 5자리로 시군구 코드 추출
  const sggCode = emdCode.substring(0, 5)

  return SGG_CODE_MAP[sggCode] || null
}

/**
 * 시도 코드 추출 (앞 2자리)
 */
export const getProvinceCode = (colAdmSe: string): string => {
  return colAdmSe.substring(0, 2)
}

/**
 * 특정 시도의 모든 시군구 코드 목록 반환
 */
export const getSggCodesByProvince = (provinceCode: string): string[] => {
  return Object.keys(SGG_CODE_MAP).filter((code) => code.startsWith(provinceCode))
}
`

  fs.writeFileSync(outputPath, content, 'utf-8')
  console.log(`✅ sggCodeMap.ts 생성 완료: ${outputPath}`)
  console.log(`   총 ${Object.keys(MANUAL_SGG_MAP).length}개 시군구 코드`)
}

/**
 * 메인 실행
 */
const main = async () => {
  console.log('🔄 전국 시군구 코드 맵 생성 시작\n')

  const outputPath = path.join(__dirname, 'sggCodeMap.ts')
  generateSggCodeMapFile(outputPath)

  console.log('\n📊 시도별 시군구 수:')
  const countByProvince: Record<string, number> = {}
  for (const code of Object.keys(MANUAL_SGG_MAP)) {
    const provinceCode = code.substring(0, 2)
    const provinceName = PROVINCE_MAP[provinceCode] || provinceCode
    countByProvince[provinceName] = (countByProvince[provinceName] || 0) + 1
  }
  for (const [name, count] of Object.entries(countByProvince).sort()) {
    console.log(`  ${name}: ${count}개`)
  }
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err)
  process.exit(1)
})
