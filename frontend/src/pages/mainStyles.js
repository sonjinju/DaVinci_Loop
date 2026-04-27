/**
 * 메인 화면 전용 인라인 스타일.
 * (포트폴리오 설명) UI만 분리해 두면 컴포넌트 파일에서 “동작”에만 집중하기 쉽습니다.
 */
const styles = {
  // --- 전체 레이아웃 ---
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box"
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  heading: {
    margin: 0
  },
  // 헤더: 제목 옆 액션
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px"
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  // 씨앗 보관함 / 로그아웃 버튼
  seedVaultButton: {
    height: "34px",
    border: "1px solid #8a9678",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #e8ecdf 0%, #cdd5c0 100%)",
    color: "#2a3820",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif",
    fontSize: "13px",
    letterSpacing: "0.02em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)"
  },
  logoutButton: {
    height: "34px",
    border: "1px solid #a88880",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #efe6e2 0%, #dcc9c2 100%)",
    color: "#4c2f2a",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif",
    fontSize: "13px",
    letterSpacing: "0.02em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)"
  },
  // --- 목록 영역 제목·안내 ---
  subHeadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px"
  },
  subHeading: {
    margin: 0,
    fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    color: "#2c2416",
    letterSpacing: "0.02em"
  },
  tipBadge: {
    fontSize: "11px",
    color: "#5c5346",
    background: "#ebe4d8",
    border: "1px solid #c4b9a8",
    borderRadius: "999px",
    padding: "3px 8px",
    lineHeight: 1.4
  },
  // --- 새 아이디어 입력 ---
  input: {
    height: "38px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "0 10px"
  },
  textarea: {
    minHeight: "110px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "10px",
    resize: "vertical"
  },
  button: {
    height: "40px",
    border: "none",
    borderRadius: "6px",
    background: "linear-gradient(180deg, #c9b89a 0%, #b8a486 45%, #a08f6e 100%)",
    color: "#1a1510",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)"
  },
  message: {
    margin: 0,
    color: "#5c4a38"
  },
  // --- 아이디어 카드 리스트 ---
  list: {
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  ideaCard: {
    position: "relative",
    border: "1px solid #b8a690",
    borderRadius: "4px",
    padding: "14px",
    background: "linear-gradient(165deg, #faf5eb 0%, #f0e8da 45%, #e8dcc8 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(60,48,36,0.08)",
    fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    color: "#2c2416"
  },
  /** 3번째 이후 접힘 안내 */
  listTailCover: {
    border: "1px dashed #a89882",
    borderRadius: "6px",
    padding: "14px 16px",
    textAlign: "center",
    background: "linear-gradient(180deg, #f0ebe3 0%, #e4dcd0 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center"
  },
  listTailCoverText: {
    margin: 0,
    fontSize: "13px",
    color: "#5c4f42",
    lineHeight: 1.5,
    fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif"
  },
  listExpandButton: {
    height: "36px",
    border: "1px solid #8a7a68",
    borderRadius: "4px",
    background: "linear-gradient(180deg, #faf6f0 0%, #e0d6c8 100%)",
    color: "#2a241c",
    padding: "0 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    fontFamily: "Georgia, serif",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)"
  },
  listCollapseButton: {
    alignSelf: "center",
    marginTop: "4px",
    height: "34px",
    border: "1px solid #b5a896",
    borderRadius: "4px",
    background: "#ebe4da",
    color: "#4a4034",
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
    fontFamily: "Georgia, serif"
  },
  lockTag: {
    position: "absolute",
    top: "10px",
    right: "10px",
    fontSize: "11px",
    padding: "4px 8px",
    borderRadius: "3px",
    background: "#d8cfc0",
    color: "#4a4034",
    border: "1px solid #b5aa9a",
    letterSpacing: "0.04em",
    fontFamily: "Georgia, serif"
  },
  unlockTag: {
    background: "linear-gradient(180deg, #d8e0cc 0%, #b9c4a8 100%)",
    color: "#2e3824",
    border: "1px solid #8a9678"
  },
  ideaTitle: {
    margin: "0 0 6px 0",
    color: "#1e1812",
    letterSpacing: "0.02em"
  },
  ideaContentClear: {
    margin: 0,
    color: "#3d3429",
    lineHeight: 1.55
  },
  ideaContentBlur: {
    margin: 0,
    filter: "blur(3px)",
    userSelect: "none"
  },
  ideaContentReversed: {
    margin: 0,
    userSelect: "none"
  },
  lockStateBox: {
    marginTop: "12px",
    padding: "10px",
    borderRadius: "3px",
    border: "1px solid #a89882",
    textAlign: "center",
    background: "rgba(255,252,245,0.65)",
    color: "#3d3429"
  },
  lockStateTitle: {
    margin: 0,
    fontWeight: 700,
    color: "#2a221a"
  },
  lockStateTime: {
    margin: "4px 0 0 0",
    color: "#5c4f42"
  },
  lockedButton: {
    marginTop: "10px",
    flex: "1 1 0",
    minWidth: 0,
    height: "38px",
    border: "1px solid #b5a896",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #e0d8cc 0%, #cfc4b4 100%)",
    color: "#6b5f52",
    cursor: "not-allowed",
    fontFamily: "Georgia, serif"
  },
  unlockStateBox: {
    marginTop: "12px",
    padding: "10px",
    borderRadius: "3px",
    border: "1px solid #8f9d7e",
    background: "linear-gradient(180deg, #eef0e6 0%, #dde3d0 100%)",
    textAlign: "center",
    color: "#2e3824"
  },
  rethinkButton: {
    marginTop: "10px",
    flex: "1 1 0",
    minWidth: 0,
    height: "38px",
    border: "1px solid #3d4534",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #5a6348 0%, #434a36 55%, #3a4030 100%)",
    color: "#f5f0e6",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif",
    letterSpacing: "0.03em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)"
  },
  aiAssistButton: {
    marginTop: "10px",
    flex: "0 0 120px",
    height: "38px",
    border: "1px solid #355272",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #57789c 0%, #3f5f82 55%, #334f70 100%)",
    color: "#f0f5fb",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif",
    fontSize: "13px",
    letterSpacing: "0.02em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)"
  },
  aiAssistButtonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    background: "linear-gradient(180deg, #e0d8cc 0%, #cfc4b4 100%)",
    border: "1px solid #b5a896",
    color: "#6b5f52",
    boxShadow: "none"
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  /** “다시보고 생각하기” 오른쪽에만 붙는 삭제 버튼 */
  deleteButton: {
    marginTop: "10px",
    flex: "0 0 140px",
    height: "38px",
    border: "1px solid #8b5a45",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #c9a088 0%, #a67b5c 45%, #8f6549 100%)",
    color: "#2a1810",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif",
    fontSize: "13px",
    letterSpacing: "0.02em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)"
  },
  /** Locked(숙성 중)일 때 삭제 버튼 비활성 표시 */
  deleteButtonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    background: "linear-gradient(180deg, #e0d8cc 0%, #cfc4b4 100%)",
    border: "1px solid #b5a896",
    color: "#6b5f52",
    boxShadow: "none"
  },
  // --- 모달 공통 ---
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modalBox: {
    width: "100%",
    maxWidth: "500px",
    background: "linear-gradient(165deg, #faf5eb 0%, #f2eadc 100%)",
    borderRadius: "6px",
    padding: "18px",
    border: "1px solid #b8a690",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontFamily: "Georgia, 'Palatino Linotype', serif",
    color: "#2c2416",
    boxShadow: "0 8px 24px rgba(44,36,22,0.12)"
  },
  modalTitle: {
    margin: 0,
    fontSize: "17px",
    lineHeight: 1.45,
    color: "#1e1812"
  },
  modalTextarea: {
    minHeight: "120px",
    border: "1px solid #b8a690",
    borderRadius: "3px",
    padding: "10px",
    resize: "vertical",
    background: "#fffdf8",
    fontFamily: "Georgia, serif",
    color: "#2c2416"
  },
  modalInput: {
    height: "38px",
    border: "1px solid #b8a690",
    borderRadius: "3px",
    padding: "0 10px",
    background: "#fffdf8",
    fontFamily: "Georgia, serif",
    color: "#2c2416"
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px"
  },
  modalCancelButton: {
    height: "36px",
    border: "1px solid #a89882",
    borderRadius: "3px",
    background: "#f5efe6",
    color: "#3d3429",
    padding: "0 12px",
    cursor: "pointer",
    fontFamily: "Georgia, serif"
  },
  modalSaveButton: {
    height: "36px",
    border: "1px solid #3d4534",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #5a6348 0%, #3a4030 100%)",
    color: "#f5f0e6",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif"
  },
  deleteConfirmButton: {
    height: "36px",
    border: "1px solid #6b3a2a",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #a85c4c 0%, #7a3d32 100%)",
    color: "#f5ebe6",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Georgia, serif"
  },
  aiLoadingText: {
    margin: 0,
    color: "#4d5f75",
    fontSize: "14px"
  },
  aiSection: {
    border: "1px solid #c7b9a4",
    borderRadius: "4px",
    padding: "10px",
    background: "#fffdf8"
  },
  aiSectionTitle: {
    margin: "0 0 8px 0",
    fontWeight: 700,
    color: "#2b2418"
  },
  aiEmptyText: {
    margin: 0,
    color: "#6a5d4c",
    fontSize: "13px"
  },
  aiList: {
    margin: 0,
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  aiListItem: {
    color: "#2f271c",
    lineHeight: 1.5
  },
  aiSourceText: {
    margin: "8px 0 0 0",
    color: "#6a5d4c",
    fontSize: "12px"
  },
  aiScoreText: {
    marginLeft: "8px",
    color: "#5a6f88",
    fontSize: "12px"
  },
  emptyItem: {
    color: "#7a6b5c",
    margin: 0,
    fontFamily: "Georgia, serif"
  }
};

export default styles;
