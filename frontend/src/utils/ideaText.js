/** 구버전 UI에서 본문에 붙이던 표식 — 화면 표시만 제거 (DB 원문은 그대로일 수 있음) */
const LEGACY_MEMO_LABEL = "[다시보기 메모]";

/** 목록·상세 표시용으로 레거시 라벨을 제거한 문자열 반환 */
export function stripLegacyMemoLabel(text) {
  return String(text || "").replaceAll(LEGACY_MEMO_LABEL, "").trim();
}

/**
 * 잠금 중 “살짝 엿보기”용.
 * 암호화가 아니라 가독성만 낮추는 UX용 변환입니다.
 */
export function reverseTextForPeek(text) {
  return String(text).split("").reverse().join("");
}
