# REALTEETH_WEATHER

## 실행방법
### 프로젝트 실행방법
```bash
# 의존성 섪치
npm install

# 환경변수 설정
# 1. "동네예보 정보조회서비스" 신청
# 2. 인증키 복사
# 3. .env 파일 생성 및 입력
cp .env.example .env

# 4. 개발 서버 실행
npm run dev
```

### GeoJSON변환 및 GIS 파이프라인 실행방법
```bash
# 사전 요구사항(GDAL설치)
#맥OS
brew install gdal 

# 우분투
sudo apt install gdal-bin

# 전체 실행 (데이터 포맷변환 && GeoJSON변환 && 격자좌표 변환)
npx tsx scripts/etl/runFullPipeline.ts && npm run etl:generate

```

---

## 구현한 기능에 대한 설명
### 날씨관련
- 
### 검색관련
- 
### 즐겨찾기 관련
- 

---

## 기술적 의사결정 및 이유
### 마주한 문제
- 
### 과정 요약
- 

---

## 사용한 기술스택
### Language
- 
### Framework & Library
- 
### Algorithm
- 

---

### Review
- 