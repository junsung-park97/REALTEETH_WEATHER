# REALTEETH_WEATHER
실시간 날씨 정보를 제공하는 반응형 웹 애플리케이션입니다. 기상청 단기예보 API를 활용하여 전국 읍/면/동 단위의 상세한 날씨 정보를 제공합니다.
## 실행방법
### GeoJSON 변환 및 GIS 파이프라인 실행방법
```bash

# 사전 요구사항 (GDAL 설치)

# macOS

brew install gdal

  

# Ubuntu

sudo apt install gdal-bin

  

# weather-app 디렉토리에서 실행

cd weather-app

  

# 전체 파이프라인 실행 (SHP → GeoJSON 변환 && 격자좌표 변환)

npx tsx scripts/etl/runFullPipeline.ts && npm run etl:generate

```

### 프로젝트 실행방법
```bash

# weather-app 디렉토리로 이동

cd weather-app

  

# 의존성 설치

npm install

  

# 환경변수 설정

# 1. 공공데이터포털에서 "동네예보 정보조회서비스" 신청

# 2. 발급받은 인증키(ServiceKey) 복사

# 3. .env 파일 생성 및 API 키 입력

cp .env.example .env

# .env 파일에 VITE_WEATHER_API_KEY=발급받은키 입력

  

# 4. 개발 서버 실행

npm run dev

```

---
## 구현한 기능에 대한 설명

### 날씨 관련
- **데이터 변환 & GIS기반 ETL**
	- 공공데이터(`.shp`)를 GDAL활용하여 GeoJSON로 변환 -> 변환된 GeoJSON의 속성을 `matcher.ts`가 기대하는 형식으로 변환.
	- 행정구역명 파싱(`korea_districts.json`) 및 변환 -> 경계데이터 레벨별 매칭(지역명) -> 경계데이터로 지역 중심좌표 계산 -> 중심좌표, 격자좌표 변환 -> 스크립트 저장(`resgions.json`)
	- 레벨3(읍,면,리,가)에서 매칭되지 않는 지역은 레벨2(구,군)에서 매칭
- **현재 날씨 조회**
	- 기상청 API 응답데이터를 기반하여 사용자 위치 및 검색지역 실시간 날씨 정보 표시 (기온, 시간대별 기온, 강수확률, 풍속)
	- 최저&최고온도는 구현하지 못함.(시간 부족)
- **TanStack Query를 활용한 서버데이터 관리**
	- `src/app/providers.tsx`에서 전체 서버데이터 관리(**staleTime : 5분**)
	- 전에 방문한 데이터(좌표) 요청시 API호출 없이 캐시된 데이터 반환, staleTime이 지난 데이터의 경우 백그라운드 fetch실행 후 반환값 리랜더링
### 검색 관련
- **`korea_districts.json`을 기반한 검색기능 구현**
	- 데이터 정규화를 통해 공백 유무와 관계없이 일관된 검색 결과 제공
- **Debounce함수 및 useMemo훅 활용**
	- 검색어 입력시 불필요한 리랜더링을 최소화하고, 모든 idx를 탐색(O(n))하여 많은 비용이 소모되는 지역 검색 함수의 호출을 최적화
### 즐겨찾기 관련
- **Zustand & Local Storage 기반 즐겨찾기 관리**
	- 즐겨찾기 추가&삭제&이름 수정 시 구독 컴포넌트 자동 리랜더링 (Zustand)
	- persist 미들웨어로 localStorage에 즐겨찾기 목록 영구 저장
- **TanStack Query 기반 즐겨찾기 날씨데이터 관리**

---
## 기술적 의사결정 및 이유
### ETL 기술관련
#### 요구사항
- 제공된 `korea_districts.json`파일을 수정 및 활용하여 기능을 구현
#### 마주한 문제
- 기상청 API를 통해 데이터를 받기 위해서는 조회 할 위치정보(격자 좌표)를 파라미터로 요청해야 하지만 제공된 데이터는 지역명으로만 이루어져 기상청API에 요청을 보낼 수 없는 문제
#### 나의 해결 과정 요약
##### Step1. 카카오MAP API
- 카카오MAP API를 통하면 지역명요청시 지역의 중심좌표를 반환받을 수 있음.
- 카카오API -> 중심좌표, 격자좌표로 변환 -> 기상청 API -> 응답 설계
- 개발서버에서 실행시 날씨데이터 응답시간이 약 2300ms 소요.
- **네트워크 비용이 너무 높다 판단.**
##### Step2. GIS ETL
- 중심좌표만 구하면 된다는 생각, 도형으로부터 우리는 도심점을 알 수 있음. 이 점을 활용하기로 함.
- Git Hub를 통해서 전국단위 행정동 GeoJSON 데이터를 활용, ETL 스크립트 구현
- 네이버날씨와 동일지역 검색시 온도차 발생(약 1~3도), 스트립트 로그 기반 디버깅시 `korea_districts.json`지역과 정확매칭률이8%, 상위구역 매칭률 62%로 심각한 수준으로 매칭이 안되고있음
- **많은 문제가 있었지만 법정동으로 이루어진 `korea_districts.json`파일과 행정동으로 이루어진 GeoJSON데이터의 괴리와 해당 GeoJSON 데이터의 오염(데이터 누락)으로 인해 생긴 오차라 판단**
##### Step3. 전국단위 법정동 경계데이터SHP -> GeoJSON변환 & GIS ETL
- 국토부공공데이터(법정동 SHP 데이터)를 활용하기 위해 SHP -> GeoJSON변환을 도와주는 도메인에 변환 시도
	- .dbf의 인코딩 문제로 인해 실패
- 기존의 GIS ETL에서 GDAL활용한 SHP -> GeoJSON 변환 스크립트 추가
- **요청 - 응답시간 1.66s 단축, 네이버날씨 기준 오차 0.2 ~ 0.4도, 지역 정확 매칭률 약30%, 상위지역 매칭률 69% 개선**

---

## 사용한 기술스택

### Language
- **TypeScript**
### Framework & Library
- **React 19** 
- **Vite** 
- **React Router** 
- **TanStack Query** 
- **Zustand** 
- **Tailwind CSS** 
- **Shadnc.UI**
### Algorithm
- **Haversine Formula**: 중심점 계산
- **위경도 → 격자 좌표 변환**: 기상청 격자 변환 알고리즘 구현
### DevOps & Tools
- **GDAL/ogr2ogr** - 지리공간 데이터 변환
- **Git LFS** - 대용량 파일 관리
- **tsx** - TypeScript 스크립트 실행

---

## TODO

- 지역매칭 최적화를 통한 네이버날씨 기준 온도차 개선
- 최저온도 및 최고온도 