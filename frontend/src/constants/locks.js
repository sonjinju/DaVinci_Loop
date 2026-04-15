/**
 * 아이디어가 “다시 열림”까지 걸리는 시간 (밀리초).
 * 서버와 무관하며 브라우저 localStorage의 타임스탬프만으로 동작합니다.
 */
export const LOCK_DURATION_MS = 60 * 1000;

/**
 * localStorage 키.
 * 값 형식: JSON 객체 `{ [ideaId: number]: lockedUntilEpochMs: number }`
 */
export const LOCK_STORAGE_KEY = "ideaLockMap";
