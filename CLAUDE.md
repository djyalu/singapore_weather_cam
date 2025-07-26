# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 작업 원칙

### 필수 준수 사항
1. **모든 작업 전 CLAUDE.md 확인**: 작업 시작 전 반드시 이 파일의 내용을 확인하고 준수
2. **재기동 시 분석**: Claude 재기동 시 현재 프로그램 분석 후 작업 시작
3. **실행 모드**: `claude --dangerously-skip-permissions` 모드로 실행
4. **GitHub 배포**: 수시로 배포하고 checkpoint로 기록
5. **기능 보존**: 정상 작동하는 기능은 임의로 수정 금지
6. **작업 완료 시**: GitHub 배포 및 CLAUDE.md 업데이트
7. **문구 제한**: 과장된 마케팅 문구 사용 금지
8. **버전 관리**: 불필요한 "enhanced", "perfect" 버전 생성 금지
9. **정확도 주장**: 검증되지 않은 수치 주장 금지
10. **SuperClaude 활용**: 명령어, sub agent, 페르소나 적극 활용
11. **기본 원칙 준수**: CLAUDE.md 참조, 임의 진행 금지
12. **계획 수립**: 변경 전 개선방안 계획 및 공유
13. **최선의 방안 확정 후 작업**: 충분한 검토 후 변경 시작
14. **히스토리 관리**: 변경 이력 관리 및 복구 가능성 확보

## 프로젝트 개요
- **프로젝트명**: Singapore Weather Cam
- **목적**: 싱가포르 날씨 정보와 웹캠 영상을 실시간으로 제공하는 웹 애플리케이션
- **상태**: 설계 완료, 구현 시작
- **선택 아키텍처**: GitHub-Native JAMstack (최종 선택)
- **대안 검토**: AWS Cloud-Native는 비용 및 복잡성으로 인해 배제

## 개발 환경 설정

### 필수 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수 (GitHub Secrets)
- `CLAUDE_API_KEY`: Claude API 키 (웹캠 이미지 분석용)
- `OPENWEATHER_API_KEY`: OpenWeatherMap API 키 (백업 날씨 데이터)

## 아키텍처

### JAMstack + GitHub Actions
- **Frontend**: React (정적 빌드) → GitHub Pages
- **Backend**: GitHub Actions (스케줄된 데이터 수집)
- **Storage**: JSON 파일 (Git 저장소)
- **CDN**: GitHub 인프라

### 디렉토리 구조
```
/
├── .github/workflows/   # 자동화 워크플로우
├── scripts/            # 데이터 수집 스크립트
├── src/               # React 소스 코드
│   ├── components/    # UI 컴포넌트
│   └── utils/        # 유틸리티 함수
├── data/             # 수집된 데이터
│   ├── weather/      # 날씨 JSON
│   └── webcam/       # 웹캠 메타데이터
└── public/           # 정적 파일
    └── images/       # 웹캠 이미지
```

## 주요 명령어

### 개발
```bash
npm run dev          # 개발 서버 실행 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
```

### 데이터 수집 (GitHub Actions에서 자동 실행)
```bash
npm run collect-weather  # 날씨 데이터 수집
npm run capture-webcam   # 웹캠 이미지 캡처
```

### 코드 품질
```bash
npm run lint         # ESLint 실행
npm run format       # Prettier 포맷팅
```

## 주요 파일 참조

- **현재 아키텍처**: `ARCHITECTURE_GITHUB.md` (GitHub 중심 최종 설계)
- **구현 가이드**: `IMPLEMENTATION_GUIDE.md` (단계별 구현 방법)
- **기존 설계**: `DESIGN.md` (초기 JAMstack 아키텍처)
- **AWS 대안**: `ARCHITECTURE_V2.md` (참고용, 미사용)
- **API 명세**: `API_SPEC.md`
- **README**: `README.md`

## 개발 가이드라인

### 컴포넌트 개발
- Functional Components와 Hooks 사용
- PropTypes 또는 TypeScript 타입 정의
- Tailwind CSS 클래스 사용

### 데이터 처리
- 모든 날씨 데이터는 `/data` 디렉토리의 JSON 파일로 관리
- 이미지는 `/public/images` 디렉토리에 저장
- GitHub Actions가 30분/1시간 주기로 자동 업데이트

### Git 커밋 규칙
- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅
- refactor: 코드 리팩토링
- test: 테스트 추가
- chore: 빌드 업무 수정
- infra: 인프라 구성 변경
- perf: 성능 개선
- arch: 아키텍처 변경

## GitHub-Native 아키텍처

### 핵심 구성
- **호스팅**: GitHub Pages (무료)
- **CI/CD**: GitHub Actions (무료 2000분/월)
- **데이터 수집**: 5분 간격 자동화 워크플로우
- **저장소**: Git 기반 JSON 파일 (버전 관리)
- **외부 서비스**: NEA Singapore API (무료)

### 주요 워크플로우
1. **날씨 데이터 수집** (`.github/workflows/collect-weather.yml`)
   - 매 5분마다 실행
   - NEA Singapore API 호출
   - JSON 파일 업데이트 및 커밋

2. **자동 배포** (`.github/workflows/deploy.yml`)
   - 코드 변경 시 자동 실행
   - Vite 빌드 후 GitHub Pages 배포

### 비용 분석
- **호스팅**: $0 (GitHub Pages)
- **CI/CD**: $0 (무료 한도 내)
- **API**: $0 (NEA 무료)
- **총 운영비**: **$0/월**

### GitHub Actions 한도 관리
- 무료 한도: 2000분/월
- 예상 사용량: ~150분/월 (5분 간격 수집)
- 여유 한도: 약 1850분/월