# DaVinci Loop

> AI 확장형 아이디어 관리 프로젝트  
> 아이디어를 기록에서 끝내지 않고 **생성 → 잠금(숙고) → 재해석 → 보관/복구 → AI 확장** 흐름으로 관리하는 서비스

---

## ✨ Features

### 🔐 Auth
- `POST /auth/signup`: bcrypt 해시 기반 회원가입
- `POST /auth/login`: 비밀번호 검증 + JWT 발급
- `authMiddleware`: `Bearer` 토큰 검증 후 사용자별 접근 제어

### 💡 Idea Lifecycle
- `GET /ideas`: 아이디어 목록 조회
- `POST /ideas`: 아이디어 생성
- `PATCH /ideas/:id/reflect`: 회고 메모 누적
- `DELETE /ideas/:id`: 소프트 삭제(씨앗 키워드 저장)
- `PATCH /ideas/:id/restore`: 아이디어 복구
- `GET /ideas/seeds`: 씨앗 보관함 조회

### 🤖 AI Expansion
- `POST /ideas/:id/reflect-prompts`
  - Ollama 기반 회고 질문 3개 자동 생성
  - 실패 시 local fallback 질문 반환
- `GET /ideas/:id/similar`
  - 같은 사용자 아이디어 대상 유사도 계산 후 추천

### 🖥️ Frontend UX
- 로그인 상태 기반 화면 전환
- 저장 후 잠금 UI + 카운트다운
- `AI 확장하기` 모달 (회고 질문 + 유사 아이디어)
- 씨앗 보관함 날짜/시간 필터링

---

## 🛠 Tech Stack

- **Frontend**: React, JavaScript, Fetch API
- **Backend**: Node.js, Express
- **Database**: MySQL (`mysql2`)
- **Auth**: JWT (`jsonwebtoken`), bcrypt
- **AI(Local LLM)**: Ollama (`llama3.1:8b`)
- **Etc**: dotenv, CORS

---

## 📁 Project Structure

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
│  ├─ utils/
│  │  └─ jwt.js
│  └─ .env
└─ frontend/
   └─ src/
      ├─ App.js
      ├─ config.js
      └─ pages/
         ├─ Login.js
         ├─ sign.js
         ├─ main.js
         ├─ mainStyles.js
         └─ SeedVault.js
```
---
🚀 Getting Started

1) Backend
cd backend
npm install
node server.js

2) Frontend
cd frontend
npm install
npm start

3) Ollama (선택)
ollama pull llama3.1:8b
