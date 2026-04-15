/**
 * 프론트엔드 전역 설정.
 * CRA(Create React App)는 REACT_APP_ 접두사가 붙은 변수만 빌드에 주입합니다.
 * 배포 시 .env.production 등에 REACT_APP_API_BASE_URL을 맞춰 주세요.
 */
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";
