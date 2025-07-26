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
- **현재 아키텍처**: React + Vite + GitHub Actions (JAMstack)
- **목표 아키텍처**: Cloud-Native Serverless (AWS Lambda + DynamoDB + CloudFront)

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

- **시스템 설계**: `DESIGN.md` (현재 JAMstack 아키텍처)
- **모던 아키텍처**: `ARCHITECTURE_V2.md` (Cloud-Native 목표 설계)
- **마이그레이션 가이드**: `MIGRATION_ROADMAP.md` (단계별 전환 계획)
- **API 명세**: `API_SPEC.md`
- **인프라 코드**: `terraform/` (IaC 템플릿)
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

## 아키텍처 마이그레이션 전략

### 현재 단계 (Phase 0)
- JAMstack 기반 정적 사이트
- GitHub Actions로 스케줄된 데이터 수집
- JSON 파일 기반 데이터 저장

### 목표 아키텍처
- AWS Lambda 기반 서버리스 컴퓨팅
- DynamoDB로 실시간 데이터 저장
- CloudFront + S3로 글로벌 CDN
- EventBridge로 이벤트 드리븐 처리
- AppSync GraphQL로 실시간 업데이트

### 마이그레이션 원칙
1. **Blue-Green 배포**: 무중단 전환
2. **점진적 마이그레이션**: 기능별 단계적 이전
3. **데이터 이중화**: 마이그레이션 중 데이터 무결성 보장
4. **롤백 가능성**: 언제든 이전 버전으로 복구 가능

### Terraform 사용법
```bash
# 인프라 초기화
cd terraform
terraform init

# 개발 환경 배포
cd environments/dev
terraform plan
terraform apply

# 프로덕션 환경 배포
cd environments/prod
terraform plan
terraform apply
```