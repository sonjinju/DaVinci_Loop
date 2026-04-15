import { verifyToken } from "../utils/jwt.js";

/**
 * Authorization: Bearer <JWT> 검사 후 req.userId 설정.
 * 서명 검증에 쓰는 비밀값은 generateToken과 동일한 utils/jwt.js를 사용합니다.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "토큰 없음" });
    }

    // 표준 형식: "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "토큰 형식 오류" });
    }

    const decoded = verifyToken(token); // 만료·위조 시 예외
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "토큰 오류" });
  }
};

export default authMiddleware;
