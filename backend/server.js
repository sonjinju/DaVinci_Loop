/**
 * Express 서버 진입점 : 환경변수 로드 → 미들웨어 설정 → 라우트 설정 → 루트 라우트 → 서버 실행.
 * 환경변수는 다른 import보다 먼저 실행되도록 파일 최상단에 둡니다.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import ideasRoutes from "./routes/ideas.js";
import db from "./db.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// 미들웨어 설정 : 브라우저(React dev server 등)에서의 API 호출 허용
app.use(cors());
app.use(express.json()); 

// 라우트 설정 : 인증 및 아이디어 관련 라우트
app.use("/auth", authRoutes);
app.use("/ideas", ideasRoutes);

// 루트 라우트 : 서버 상태 확인
app.get("/", (_req, res) => {
  res.send("DaVinci Loop API Running");
});

// 서버 실행 : 지정된 포트에서 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
