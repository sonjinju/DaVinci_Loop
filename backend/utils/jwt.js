/* JWT 토큰 생성 및 검증 유틸리티 */
import jwt from "jsonwebtoken";

/** 로컬 개발 기본값 — 운영에서는 반드시 환경변수로 덮어쓰세요. */
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

/** 페이로드(주입할 데이터)를 받아 JWT 토큰 생성 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

/** 토큰 검증 후 페이로드 반환 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// JWT_SECRET: 서버만 알고 있는 비밀 키(서명/검증용)
// token(JWT): 로그인 후 사용자에게 발급되는 문자열(민감정보 없음)