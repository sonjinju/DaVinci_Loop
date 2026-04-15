/** 환경변수 로드 — 반드시 다른 import보다 먼저 실행되도록 파일 최상단에 둡니다. */
import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import ideasRoutes from "./routes/ideas.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// 브라우저(React dev server 등)에서의 API 호출 허용
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/ideas", ideasRoutes);

app.get("/", (_req, res) => {
  res.send("DaVinci Loop API Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
