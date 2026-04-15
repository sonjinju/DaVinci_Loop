import jwt from "jsonwebtoken";

/** 로컬 개발 기본값 — 운영에서는 반드시 환경변수로 덮어쓰세요. */
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
