# 말씀동역 배포 가이드

> 목표: 목사님이 링크 하나로 접속 가능한 상태

---

## Step 1: GitHub 레포 생성 (5분)

### 1-1. GitHub에서 레포 생성

1. https://github.com/new 접속
2. Repository name: `malssam`
3. Private 선택
4. [Create repository] 클릭

### 1-2. 로컬에서 푸시

```bash
cd "C:/Users/Jun Lee/Documents/malssam"
git remote add origin https://github.com/YOUR_USERNAME/malssam.git
git branch -M main
git push -u origin main
```

> YOUR_USERNAME을 본인 GitHub 아이디로 변경

---

## Step 2: 백엔드 배포 — Railway (10분)

### 2-1. Railway 가입

1. https://railway.app 접속
2. GitHub 계정으로 로그인

### 2-2. PostgreSQL 생성

1. [New Project] → [Provision PostgreSQL]
2. 생성된 DB의 `DATABASE_URL` 복사
   - Variables 탭 → DATABASE_URL 값

### 2-3. 백엔드 서비스 생성

1. 같은 프로젝트에서 [New] → [GitHub Repo] → `malssam` 선택
2. Settings에서:
   - Root Directory: `apps/api`
   - Build Command: `npx prisma generate && npx nest build`
   - Start Command: `npx prisma migrate deploy && node dist/main.js`

### 2-4. 환경변수 설정

Variables 탭에서 아래 추가:

```
DATABASE_URL = (위에서 복사한 PostgreSQL URL)
JWT_ACCESS_SECRET = prod-access-secret-CHANGE-THIS-12345
JWT_REFRESH_SECRET = prod-refresh-secret-CHANGE-THIS-67890
JWT_ACCESS_EXPIRY = 15m
JWT_REFRESH_EXPIRY = 7d
ANTHROPIC_API_KEY = sk-ant-api03-....(본인 키)
PORT = 4000
NODE_ENV = production
FRONTEND_URL = https://malssam-web.vercel.app
PRAYER_ENCRYPTION_KEY = 0123456789abcdef0123456789abcdef
```

### 2-5. 배포 확인

배포 완료 후 제공되는 URL 확인:
- 예: `https://malssam-api-production.up.railway.app`
- `https://YOUR_URL/api/v1/health` 접속 → `{"status":"ok"}` 확인

---

## Step 3: 프론트엔드 배포 — Vercel (5분)

### 3-1. Vercel 가입

1. https://vercel.com 접속
2. GitHub 계정으로 로그인

### 3-2. 프로젝트 생성

1. [New Project] → GitHub에서 `malssam` 선택
2. Framework Preset: Next.js
3. Root Directory: `apps/web`
4. Build and Output Settings:
   - Install Command: `cd ../.. && pnpm install`
   - Build Command: `cd ../.. && pnpm --filter @malssam/web build`

### 3-3. 환경변수 설정

```
NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-URL/api/v1
```

### 3-4. 배포 확인

배포 완료 후:
- `https://malssam-web.vercel.app` (또는 자동 생성된 URL)
- 랜딩 페이지가 정상 표시되는지 확인

---

## Step 4: CORS 업데이트

Railway 환경변수에 FRONTEND_URL을 Vercel 실제 URL로 업데이트:

```
FRONTEND_URL = https://malssam-web.vercel.app
```

---

## Step 5: 최종 테스트

### 테스트 체크리스트

```
[ ] 랜딩 페이지 접속 가능
[ ] 회원가입 가능
[ ] 로그인 가능
[ ] 교회 등록 가능
[ ] 설교 생성 가능 (15~20초 대기)
[ ] 설교 편집 가능
[ ] PPT 다운로드 가능
[ ] PDF 보기 가능
[ ] 설교 분석 가능
[ ] 모바일 브라우저에서 접속 가능
```

---

## Step 6: 목사님에게 보낼 안내 메시지

```
목사님 안녕하세요,

"말씀동역" 테스트 버전이 준비되었습니다.

아래 링크로 접속해주세요:
👉 https://[VERCEL_URL]

[사용 방법]
1. [3개월 무료로 시작하기] 클릭
2. 이름, 이메일, 비밀번호(8자 이상) 입력
3. 교회 정보 설정
4. 홈에서 [설교 만들기] 클릭
5. 예배 선택 → 성경 본문 입력 → 설교 생성
6. 결과 확인 → PPT/PDF 다운로드

[주요 기능]
- AI 설교 초안 생성 (15~20초)
- 설교 편집 및 AI 재생성
- PPT 자동 생성
- PDF 인쇄용 출력
- 설교 분석 & 개선

[참고]
- 테스트 버전이므로 실제 결제는 없습니다
- AI가 만든 초안이므로 반드시 검토 후 사용해주세요
- PC 또는 모바일 브라우저 모두 사용 가능합니다 (크롬 권장)

피드백은 언제든 편하게 말씀해주세요.
감사합니다!
```

---

## 비용 참고

| 서비스 | 요금 |
|---|---|
| Railway (백엔드 + DB) | $5/월 시작 (무료 크레딧 $5 제공) |
| Vercel (프론트) | 무료 (Hobby 플랜) |
| Claude API | 사용량 기반 (~$0.04/설교) |
| **월 총 예상** | **$5~15** |
