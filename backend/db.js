import mysql from "mysql2";

/**
 * MySQL 단일 연결(소규모 데모용).
 * 비밀번호 등은 반드시 .env에 두고, 저장소에 실제 값을 커밋하지 마세요.
 */
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "js97465B*", // 로컬은 빈 문자열일 수 있음
  database: process.env.DB_NAME || "davinci_loop"
});

db.connect((err) => {
  if (err) {
    console.error("DB 연결 실패", err);
  } else {
    console.log("DB 연결 성공");
  }
});

export default db;
