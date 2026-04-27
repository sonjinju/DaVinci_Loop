/**
 * 인증 라우트: 회원가입(INSERT) / 로그인(SELECT + JWT).
 * API 엔드포인트.
 */
import express from "express";
import bcrypt from "bcrypt";
import db from "../db.js";
import { generateToken } from "../utils/jwt.js";

const router = express.Router();

/** POST /auth/signup — 평문 비밀번호는 저장하지 않고 bcrypt 해시만 저장 */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "회원가입 성공" });
    }
  );
});

/** POST /auth/login — 이메일 조회 후 bcrypt.compare, JWT 발급 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "유저 없음" });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호 틀림" });
    }

    const token = generateToken({ userId: user.id });

    res.json({
      message: "로그인 성공",
      userId: user.id,
      token
    });
  });
});

export default router;
