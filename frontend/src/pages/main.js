/**
 * 메인 화면: 아이디어 작성·목록, 1분 클라이언트 잠금(숙성), 길게 눌러 미리보기,
 * “다시보고 생각하기”(사유 메모) 모달, 삭제(씨앗 키워드) 흐름.
 * 목록은 앞 2개만 기본 표시, 3번째부터는 접어 두었다가「전체 보기」로 펼칩니다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../config";
import { LOCK_DURATION_MS, LOCK_STORAGE_KEY } from "../constants/locks";
import { reverseTextForPeek, stripLegacyMemoLabel } from "../utils/ideaText";
import styles from "./mainStyles";

/**
 * @param {{ onOpenSeedVault: () => void, onLogout: () => void }} props
 */
function Main({ onOpenSeedVault, onLogout }) {
  // --- 새 아이디어 입력 폼 ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- 목록: 서버에서 받은 아이디어 + 클라이언트 잠금 시각(lockedUntil) ---
  const [ideas, setIdeas] = useState([]);
  /** 3번째 아이디어부터 접어 둠 — 펼치면 전체 목록 */
  const [ideasListExpanded, setIdeasListExpanded] = useState(false);

  // 잠금 카운트다운·블러 UI 갱신용 (1초마다 증가)
  const [now, setNow] = useState(Date.now());
  // 길게 누르기(미리보기) 중인 카드 id — 잠금 중에만 의미 있음
  const [pressedIdeaId, setPressedIdeaId] = useState(null);
  const longPressTimerRef = useRef(null);

  // --- “다시보고 생각하기” 모달 ---
  const [isReflectModalOpen, setIsReflectModalOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);
  const [reflection, setReflection] = useState("");
  const [isReflectSaving, setIsReflectSaving] = useState(false);

  // --- 삭제: 확인 → 키워드 → 결과 (버튼은 “다시보고 생각하기” 옆에만 배치) ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState("confirm");
  const [deleteIdeaId, setDeleteIdeaId] = useState(null);
  const [deleteKeyword, setDeleteKeyword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteResultModalOpen, setIsDeleteResultModalOpen] = useState(false);
  const [deleteResultMessage, setDeleteResultMessage] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  /** GET /ideas: 목록을 받아 잠금 맵과 병합해 화면용 배열로 만듭니다. */
  const fetchIdeas = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/ideas`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json() : await res.text(); // 라우트 미배포 시 HTML 문자열일 수 있음

      if (!res.ok) {
        if (typeof data === "string" && data.includes("Cannot GET /ideas")) {
          setMessage("백엔드 서버를 재시작해 주세요. (/ideas 라우트 반영 필요)");
          return;
        }
        setMessage(
          (typeof data === "object" && data?.message) ||
            "아이디어 목록을 불러오지 못했습니다."
        );
        return;
      }

      // ideaId → 잠금 해제 시각(ms). 서버에 없고 순전히 브라우저에만 저장됩니다.
      let lockMap = {};
      try {
        lockMap = JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY) || "{}");
      } catch (error) {
        lockMap = {};
      }

      const normalizedIdeas = data.map((idea) => {
        const lockFromStorage = lockMap[idea.id];
        // 저장값 없으면 “방금 저장”으로 간주해 1분 잠금 시작
        let lockedUntil = lockFromStorage || Date.now() + LOCK_DURATION_MS;

        // 기존 24시간 잠금값이 남아 있으면 1분 정책으로 보정
        if (lockedUntil - Date.now() > LOCK_DURATION_MS) {
          lockedUntil = Date.now() + LOCK_DURATION_MS;
        }

        lockMap[idea.id] = lockedUntil;

        return {
          id: idea.id,
          title: idea.title || "(제목 없음)",
          content: stripLegacyMemoLabel(idea.content),
          lockedUntil
        };
      });

      localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockMap));
      setIdeas(normalizedIdeas);
    } catch (error) {
      setMessage("아이디어 목록 조회 중 오류가 발생했습니다.");
    }
  }, [token]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const IDEAS_HEAD_COUNT = 2;
  useEffect(() => {
    if (ideas.length <= IDEAS_HEAD_COUNT) setIdeasListExpanded(false);
  }, [ideas.length]);

  // 남은 잠금 시간 표시·잠금/해제 UI를 위해 매초 갱신
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /** POST /ideas: 제목·본문 저장 후 목록 새로고침 */
  const handleSaveIdea = async () => {
    if (!token) {
      setMessage("로그인이 필요합니다. 먼저 로그인해 주세요.");
      return;
    }

    if (!content.trim()) {
      setMessage("아이디어 내용을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/ideas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "아이디어 저장에 실패했습니다.");
        return;
      }

      setTitle("");
      setContent("");
      setMessage("아이디어 저장 성공");
      fetchIdeas();
    } catch (error) {
      setMessage("서버 연결에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  /** 잠금 중 본문 “살짝 보기”: ~400ms 유지 시 뒤집힌 텍스트 표시 */
  const startLongPress = (ideaId, isAlreadyUnlocked) => {
    if (isAlreadyUnlocked) return;

    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setPressedIdeaId(ideaId);
    }, 400);
  };

  const endLongPress = () => {
    clearTimeout(longPressTimerRef.current);
    setPressedIdeaId(null);
  };

  const openReflectModal = (ideaId) => {
    setSelectedIdeaId(ideaId);
    setReflection("");
    setIsReflectModalOpen(true);
  };

  const closeReflectModal = () => {
    setIsReflectModalOpen(false);
    setSelectedIdeaId(null);
    setReflection("");
  };

  /** PATCH /ideas/:id/reflect: 본문에 메모 누적 + 다시 1분 잠금 */
  const handleSaveReflection = async () => {
    if (!token || !selectedIdeaId) return;
    if (!reflection.trim()) {
      setMessage("메모를 입력해 주세요.");
      return;
    }

    setIsReflectSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/ideas/${selectedIdeaId}/reflect`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reflection })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "사유 저장에 실패했습니다.");
        return;
      }

      const nextLockedUntil = Date.now() + LOCK_DURATION_MS;
      const lockMap = JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY) || "{}");
      lockMap[selectedIdeaId] = nextLockedUntil;
      localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockMap));

      // 응답에 갱신된 본문이 있으면 사용, 없으면 로컬에서 이어붙인 문자열 사용
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === selectedIdeaId
            ? {
                ...idea,
                content: stripLegacyMemoLabel(
                  data?.idea?.content || `${idea.content}\n\n${reflection}`
                ),
                lockedUntil: nextLockedUntil
              }
            : idea
        )
      );

      setNow(Date.now());
      setMessage("사유 저장 성공");
      closeReflectModal();
    } catch (error) {
      setMessage("사유 저장 중 오류가 발생했습니다.");
    } finally {
      setIsReflectSaving(false);
    }
  };

  const handleDeleteIdea = (ideaId) => {
    setDeleteIdeaId(ideaId);
    setDeleteStep("confirm");
    setDeleteKeyword("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteStep("confirm");
    setDeleteIdeaId(null);
    setDeleteKeyword("");
  };

  const moveDeleteToKeywordStep = () => {
    setDeleteStep("keyword");
  };

  const closeDeleteResultModal = () => {
    setIsDeleteResultModalOpen(false);
    setDeleteResultMessage("");
  };

  /** DELETE /ideas/:id — 씨앗 키워드 저장 후 목록에서 제거 */
  const handleConfirmDelete = async () => {
    if (!token || !deleteIdeaId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ideas/${deleteIdeaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ keyword: deleteKeyword })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "아이디어 삭제에 실패했습니다.");
        return;
      }

      const lockMap = JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY) || "{}");
      delete lockMap[deleteIdeaId];
      localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockMap));

      setIdeas((prev) => prev.filter((idea) => idea.id !== deleteIdeaId));
      const seedKeyword = deleteKeyword.trim() || "하나의 영감";
      setDeleteResultMessage(
        `이 아이디어는 [${seedKeyword}]라는 씨앗을 남기고 사라졌습니다.`
      );
      setIsDeleteResultModalOpen(true);
      setMessage("");
      closeDeleteModal();
    } catch (error) {
      setMessage("아이디어 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 언마운트 시 길게 누르기 타이머 정리
  useEffect(() => {
    return () => clearTimeout(longPressTimerRef.current);
  }, []);

  const renderIdeaCard = (idea) => (
    <article
      key={idea.id}
      style={styles.ideaCard}
      onMouseDown={() => startLongPress(idea.id, isUnlocked(idea.lockedUntil, now))}
      onMouseUp={endLongPress}
      onMouseLeave={endLongPress}
      onTouchStart={() => startLongPress(idea.id, isUnlocked(idea.lockedUntil, now))}
      onTouchEnd={endLongPress}
    >
      <div
        style={{
          ...styles.lockTag,
          ...(isUnlocked(idea.lockedUntil, now) ? styles.unlockTag : {})
        }}
      >
        {isUnlocked(idea.lockedUntil, now) ? "Unlock" : "Locked"}
      </div>
      <h4 style={styles.ideaTitle}>{idea.title}</h4>
      <p
        style={
          isUnlocked(idea.lockedUntil, now)
            ? styles.ideaContentClear
            : pressedIdeaId === idea.id
              ? styles.ideaContentReversed
              : styles.ideaContentBlur
        }
      >
        {isUnlocked(idea.lockedUntil, now) || pressedIdeaId !== idea.id
          ? idea.content
          : reverseTextForPeek(idea.content)}
      </p>

      {isUnlocked(idea.lockedUntil, now) ? (
        <div style={styles.unlockStateBox}>
          <p style={styles.lockStateTitle}>열람 가능 상태입니다.</p>
          <p style={styles.lockStateTime}>이제 아이디어를 다시 해석해 보세요.</p>
        </div>
      ) : (
        <div style={styles.lockStateBox}>
          <p style={styles.lockStateTitle}>저장되는 동안 씨앗 보관함에 숙성된 키워드를 다시 들여다보세요...</p>
          <p style={styles.lockStateTime}>{formatRemainingTime(idea.lockedUntil, now)} 남음</p>
        </div>
      )}
      <div style={styles.actionRow}>
        <button
          type="button"
          disabled={!isUnlocked(idea.lockedUntil, now)}
          onClick={() => openReflectModal(idea.id)}
          style={
            isUnlocked(idea.lockedUntil, now) ? styles.rethinkButton : styles.lockedButton
          }
        >
          {isUnlocked(idea.lockedUntil, now) ? "다시보고 생각하기." : "아직 열 수 없습니다."}
        </button>
        <button
          type="button"
          disabled={!isUnlocked(idea.lockedUntil, now)}
          title={
            !isUnlocked(idea.lockedUntil, now)
              ? "숙성(잠금) 중에는 삭제할 수 없습니다. 잠금이 풀린 뒤에 삭제할 수 있어요."
              : undefined
          }
          onClick={() => handleDeleteIdea(idea.id)}
          style={{
            ...styles.deleteButton,
            ...(!isUnlocked(idea.lockedUntil, now) ? styles.deleteButtonDisabled : {})
          }}
        >
          진짜 삭제하기.
        </button>
      </div>
    </article>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* 상단: 제목 + 씨앗 보관함 / 로그아웃 */}
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>아이디어 작성</h2>
          <div style={styles.headerActions}>
            <button type="button" onClick={onOpenSeedVault} style={styles.seedVaultButton}>
              씨앗 보관함
            </button>
            <button type="button" onClick={onLogout} style={styles.logoutButton}>
              로그아웃
            </button>
          </div>
        </div>

        {/* 새 아이디어 작성 폼 */}
        <input
          style={styles.input}
          placeholder="아이디어 제목 (선택)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          style={styles.textarea}
          placeholder="아이디어 내용을 작성해 주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          onClick={handleSaveIdea}
          disabled={isSaving}
          style={{
            ...styles.button,
            ...(isSaving ? { opacity: 0.65, cursor: "wait" } : {})
          }}
        >
          {isSaving ? "저장 중..." : "아이디어 저장"}
        </button>

        {message ? <p style={styles.message}>{message}</p> : null}

        {/* 저장된 아이디어 목록 */}
        <div style={styles.subHeadingRow}>
          <h3 style={styles.subHeading}>내 아이디어</h3>
          <span style={styles.tipBadge} title="잠금 상태에서 내용 영역을 길게 누르면 뒤집힌 텍스트로 미리 볼 수 있어요.">
            1분 전에 미리보고 싶으면 아이디어 내용을 꾹 누르고 보세요
          </span>
        </div>
        <div style={styles.list}>
          {ideas.length === 0 ? (
            <p style={styles.emptyItem}>아직 저장된 아이디어가 없습니다.</p>
          ) : (
            <>
              {ideas.slice(0, IDEAS_HEAD_COUNT).map((idea) => renderIdeaCard(idea))}
              {ideas.length > IDEAS_HEAD_COUNT && !ideasListExpanded ? (
                <div style={styles.listTailCover}>
                  <p style={styles.listTailCoverText}>
                    세 번째 아이디어부터 {ideas.length - IDEAS_HEAD_COUNT}개가 가려져 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIdeasListExpanded(true)}
                    style={styles.listExpandButton}
                  >
                    전체 보기
                  </button>
                </div>
              ) : null}
              {ideasListExpanded
                ? ideas.slice(IDEAS_HEAD_COUNT).map((idea) => renderIdeaCard(idea))
                : null}
              {ideas.length > IDEAS_HEAD_COUNT && ideasListExpanded ? (
                <button
                  type="button"
                  onClick={() => setIdeasListExpanded(false)}
                  style={styles.listCollapseButton}
                >
                  다시 접기
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
      {/* 사유(다시보기) 메모 모달 */}
      {isReflectModalOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalBox}>
            <h4 style={styles.modalTitle}>
              다시 보는 행위는 복습이 아니라 새로운 발명입니다.
            </h4>
            <textarea
              style={styles.modalTextarea}
              placeholder="이 아이디어를 새로운 관점에서 생각해보세요."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button type="button" onClick={closeReflectModal} style={styles.modalCancelButton}>
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={isReflectSaving}
                style={styles.modalSaveButton}
              >
                {isReflectSaving ? "저장 중..." : "사유 저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isDeleteModalOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalBox}>
            {deleteStep === "confirm" ? (
              <>
                <h4 style={styles.modalTitle}>사고의 씨앗을 여기서 멈추시겠습니까?</h4>
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    style={styles.modalCancelButton}
                  >
                    아니오
                  </button>
                  <button
                    type="button"
                    onClick={moveDeleteToKeywordStep}
                    style={styles.modalSaveButton}
                  >
                    네
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 style={styles.modalTitle}>
                  이 아이디어는 비록 폐기되지만, 여기서 얻은 단 하나의 영감(키워드)은
                  무엇인가요?
                </h4>
                <input
                  style={styles.modalInput}
                  placeholder="키워드를 입력해 주세요"
                  value={deleteKeyword}
                  onChange={(e) => setDeleteKeyword(e.target.value)}
                />
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    style={styles.modalCancelButton}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    style={styles.deleteConfirmButton}
                  >
                    {isDeleting ? "삭제 중..." : "사고의 거름으로 쓰기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      {isDeleteResultModalOpen ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalBox}>
            <h4 style={styles.modalTitle}>{deleteResultMessage}</h4>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={closeDeleteResultModal}
                style={styles.modalSaveButton}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** 잠금 해제까지 남은 시간을 “N분 M초” 문자열로 */
function formatRemainingTime(lockedUntil, now) {
  const diff = Math.max(lockedUntil - now, 0);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}분 ${seconds}초`;
}

/** 잠금 만료 시각이 지났으면(남은 초가 0) 열람·사유 버튼 활성 */
function isUnlocked(lockedUntil, now) {
  const diffMs = Math.max(lockedUntil - now, 0);
  return Math.floor(diffMs / 1000) === 0;
}

export default Main;
