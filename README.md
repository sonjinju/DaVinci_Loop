# DaVinci Loop  
AI 확장형 아이디어 관리 프로젝트

> 아이디어를 단순 기록에서 끝내지 않고,  
> **생성 → 잠금(숙고) → 재해석 → 보관/복구** 흐름으로 관리하는 서비스

---

## 1. 프로젝트 소개

**DaVinci Loop**는 사용자의 아이디어를 즉시 소비하지 않고,  
시간을 두고 다시 읽고 발전시키도록 설계한 아이디어 재해석 서비스입니다.

- JWT 인증 기반 사용자 분리
- 아이디어 라이프사이클 API 설계
- 씨앗 보관함(삭제 아이디어 재탐색/복구)
- 향후 LLM 기반 확장을 고려한 구조

---

## 2. 주요 기능

### 인증
- 회원가입: `POST /auth/signup` (bcrypt 해시 저장)
- 로그인: `POST /auth/login` (비밀번호 검증 + JWT 발급)
- 인증 미들웨어: `Authorization: Bearer <token>` 검증

### 아이디어 관리
- `GET /ideas`: 내 아이디어 목록 조회
- `POST /ideas`: 아이디어 생성
- `PATCH /ideas/:id/reflect`: 회고 메모 추가
- `DELETE /ideas/:id`: 소프트 삭제(씨앗 키워드 저장)
- `PATCH /ideas/:id/restore`: 삭제된 아이디어 복구
- `GET /ideas/seeds`: 씨앗 보관함 조회

### 프론트 UX
- 로그인 상태 기반 화면 전환
- 아이디어 저장 후 잠금 UI 및 카운트다운
- 씨앗 보관함 날짜/시간 필터링

---

## 3. 기술 스택

- **Frontend**: React, JavaScript, Fetch API
- **Backend**: Node.js, Express
- **Database**: MySQL (`mysql2`)
- **Auth/Security**: JWT (`jsonwebtoken`), bcrypt
- **Config**: dotenv, CORS

---

## 4. 프로젝트 구조

```text
project/
├─ backend/
│  ├─ server.js
│  ├─ db.js
│  ├─ middleware/
│  │  └─ auth.js
│  ├─ routes/
│  │  ├─ auth.js
│  │  └─ ideas.js
│  └─ utils/
│     └─ jwt.js
└─ frontend/
   └─ src/
      ├─ App.js
      ├─ config.js
      └─ pages/
         ├─ Login.js
         ├─ main.js
         └─ SeedVault.js
