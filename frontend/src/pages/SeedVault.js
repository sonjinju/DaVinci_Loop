/**
 * 삭제된 아이디어의 legacy_keyword(씨앗) 목록을 `/ideas/seeds`에서 불러옵니다.
 * create_at/created_at 기준 오름차순 정렬, 날짜·시간 필터. 표시는 DB의 created_at 우선.
 * 본문 표시 전 구버전 UI 라벨은 stripLegacyMemoLabel로 제거합니다.
 */
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";
import { stripLegacyMemoLabel } from "../utils/ideaText";

/** API·DB에서 오는 타임스탬프 문자열/Date → 밀리초 (없거나 무효면 null) */
function parseCreatedMs(raw) {
  if (raw == null || raw === "") return null;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

/** 로컬 캘린더 날짜가 동일한지 (필터용) */
function isSameLocalDate(ms, ymd) {
  if (ms == null || !ymd) return false;
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return key === ymd;
}

/** "HH:mm" → 그날 0시부터의 분 */
function timeStringToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * 카드에 표시할 날짜시간. 파싱된 ms로 로캘 포맷, 실패 시 DB에서 온 created_at/create_at 원문 표시.
 * @param {number | null} ms - parseCreatedMs 결과
 * @param {unknown} dbRaw - API의 created_at 우선, 없으면 create_at 문자열 등
 */
function formatDisplayDate(ms, dbRaw) {
  const tryIntl = (tms) => {
    if (tms == null || !Number.isFinite(tms)) return null;
    try {
      return new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(tms));
    } catch {
      return null;
    }
  };

  const formatted = tryIntl(ms);
  if (formatted) return formatted;

  const fromRawMs = parseCreatedMs(dbRaw);
  const formattedRaw = tryIntl(fromRawMs);
  if (formattedRaw) return formattedRaw;

  if (dbRaw != null && String(dbRaw).trim() !== "") {
    return String(dbRaw).trim();
  }

  return "기록 시각 없음";
}

/**
 * @param {{ onBack: () => void, onLogout: () => void }} props — onBack은 메인(아이디어) 화면으로 전환
 */
function SeedVault({ onBack, onLogout }) {
  const [seeds, setSeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [restoringId, setRestoringId] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterTimeStart, setFilterTimeStart] = useState("");
  const [filterTimeEnd, setFilterTimeEnd] = useState("");
  const token = useMemo(() => localStorage.getItem("token"), []);

  /** PATCH /ideas/:id/restore 후 메인 목록으로 이동(메인 마운트 시 GET /ideas로 갱신) */
  const handleRestore = async (seed) => {
    if (!token || restoringId != null) return;
    setRestoringId(seed.id);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/ideas/${seed.id}/restore`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        setMessage(
          (typeof data === "object" && data?.message) || "회복에 실패했습니다."
        );
        setRestoringId(null);
        return;
      }
      setSeeds((prev) => prev.filter((s) => s.id !== seed.id));
      setRestoringId(null);
      onBack();
    } catch {
      setMessage("회복 요청 중 오류가 발생했습니다.");
      setRestoringId(null);
    }
  };

  useEffect(() => {
    /** 인증 헤더로 씨앗 전용 목록만 조회 */
    const fetchSeeds = async () => {
      if (!token) {
        setMessage("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/ideas/seeds`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (!res.ok) {
          setMessage(data?.message || "씨앗 보관함을 불러오지 못했습니다.");
          return;
        }

        const raw = Array.isArray(data) ? data : [];
        const normalized = raw.map((item) => {
          const sortRaw = item.create_at ?? item.created_at;
          const displayRaw =
            item.created_at != null && item.created_at !== ""
              ? item.created_at
              : item.create_at ?? null;
          const createdMs = parseCreatedMs(sortRaw);
          return {
            id: item.id,
            title: item.title || "(제목 없음)",
            keyword: String(item.legacy_keyword || "").trim() || "하나의 영감",
            content: stripLegacyMemoLabel(item.content),
            createdMs,
            displayRaw
          };
        });
        normalized.sort((a, b) => {
          if (a.createdMs == null && b.createdMs == null) return a.id - b.id;
          if (a.createdMs == null) return 1;
          if (b.createdMs == null) return -1;
          if (a.createdMs !== b.createdMs) return a.createdMs - b.createdMs;
          return a.id - b.id;
        });
        setSeeds(normalized);
      } catch (error) {
        setMessage("씨앗 보관함 조회 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeeds();
  }, [token]);

  const visibleSeeds = useMemo(() => {
    let list = seeds;

    if (filterDate) {
      list = list.filter((s) => isSameLocalDate(s.createdMs, filterDate));
    }

    const startM = timeStringToMinutes(filterTimeStart);
    const endM = timeStringToMinutes(filterTimeEnd);
    const useTime =
      filterDate && (startM != null || endM != null) && list.some((s) => s.createdMs != null);

    if (useTime) {
      const lo = startM != null ? startM : 0;
      const hi = endM != null ? endM : 24 * 60 - 1;
      list = list.filter((s) => {
        if (s.createdMs == null) return false;
        const d = new Date(s.createdMs);
        const mins = d.getHours() * 60 + d.getMinutes();
        if (lo <= hi) return mins >= lo && mins <= hi;
        return mins >= lo || mins <= hi;
      });
    }

    return list;
  }, [seeds, filterDate, filterTimeStart, filterTimeEnd]);

  const clearFilters = () => {
    setFilterDate("");
    setFilterTimeStart("");
    setFilterTimeEnd("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>씨앗 보관함</h2>
          <div style={styles.headerActions}>
            <button type="button" onClick={onBack} style={styles.backButton}>
              메인으로
            </button>
            <button type="button" onClick={onLogout} style={styles.logoutButton}>
              로그아웃
            </button>
          </div>
        </div>

        <p style={styles.description}>삭제된 아이디어가 남긴 영감 키워드를 모아봅니다.</p>

        {message ? <p style={styles.message}>{message}</p> : null}

        {isLoading ? (
          <p style={styles.emptyText}>불러오는 중...</p>
        ) : seeds.length === 0 ? (
          <p style={styles.emptyText}>아직 저장된 씨앗이 없습니다.</p>
        ) : (
          <>
            <div style={styles.filterBox}>
              <p style={styles.filterLegend}>날짜·시간으로 좁히기 (기록 시각 기준)</p>
              <div style={styles.filterRow}>
                <label style={styles.filterLabel}>
                  날짜
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={styles.filterInput}
                  />
                </label>
              </div>
              <div style={styles.filterRow}>
                <span style={styles.filterHint}>시간 (날짜를 고른 뒤, 선택)</span>
                <div style={styles.timeRow}>
                  <input
                    type="time"
                    value={filterTimeStart}
                    onChange={(e) => setFilterTimeStart(e.target.value)}
                    style={styles.filterInput}
                    disabled={!filterDate}
                    aria-label="시작 시각"
                  />
                  <span style={styles.timeSep}>~</span>
                  <input
                    type="time"
                    value={filterTimeEnd}
                    onChange={(e) => setFilterTimeEnd(e.target.value)}
                    style={styles.filterInput}
                    disabled={!filterDate}
                    aria-label="끝 시각"
                  />
                </div>
              </div>
              <button type="button" onClick={clearFilters} style={styles.clearFilterButton}>
                필터 초기화
              </button>
            </div>

            {visibleSeeds.length === 0 ? (
              <p style={styles.emptyText}>선택한 조건에 맞는 씨앗이 없습니다.</p>
            ) : (
              <div style={styles.list}>
                {visibleSeeds.map((seed) => (
                  <article key={seed.id} style={styles.seedCard}>
                    <p style={styles.metaLine}>{formatDisplayDate(seed.createdMs, seed.displayRaw)}</p>
                    <p style={styles.keyword}>#{seed.keyword}</p>
                    <h4 style={styles.title}>{seed.title}</h4>
                    <p style={styles.content}>{seed.content || "원본 아이디어 내용이 없습니다."}</p>
                    <div style={styles.seedCardFooter}>
                      <button
                        type="button"
                        onClick={() => handleRestore(seed)}
                        disabled={restoringId != null}
                        style={{
                          ...styles.restoreButton,
                          ...(restoringId === seed.id ? styles.restoreButtonBusy : {}),
                          ...(restoringId != null && restoringId !== seed.id
                            ? styles.restoreButtonDisabled
                            : {})
                        }}
                        aria-label="아이디어를 메인 목록으로 되돌리기"
                      >
                        {restoringId === seed.id ? "회복 중…" : "회복하기"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** 씨앗 보관함 페이지 전용 인라인 스타일 */
const styles = {
  // 바깥 영역만 밝은 배경 (카드는 양피지 톤)
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box",
    background: "#fff"
  },
  card: {
    width: "100%",
    maxWidth: "620px",
    border: "1px solid #b8a690",
    borderRadius: "6px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "linear-gradient(165deg, #faf5eb 0%, #f2eadc 100%)",
    boxShadow: "0 4px 16px rgba(44, 36, 22, 0.1)",
    fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    color: "#2c2416"
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px"
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0
  },
  heading: {
    margin: 0,
    fontSize: "22px",
    color: "#1e1812",
    letterSpacing: "0.02em",
    fontWeight: 700
  },
  backButton: {
    height: "34px",
    border: "1px solid #a89882",
    borderRadius: "3px",
    background: "#f5efe6",
    color: "#3d3429",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 600,
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
    fontSize: "13px",
    letterSpacing: "0.02em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)"
  },
  description: {
    margin: 0,
    color: "#5c5346",
    fontSize: "14px",
    lineHeight: 1.5
  },
  message: {
    margin: 0,
    color: "#6b3d38",
    fontSize: "14px"
  },
  filterBox: {
    border: "1px solid #c4b8a4",
    borderRadius: "4px",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  filterLegend: {
    margin: 0,
    fontSize: "13px",
    color: "#5c5346",
    fontWeight: 600
  },
  filterRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  filterLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    color: "#3d3429",
    fontWeight: 600
  },
  filterHint: {
    fontSize: "12px",
    color: "#6b6054"
  },
  timeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  timeSep: {
    color: "#5c5346",
    fontSize: "14px"
  },
  filterInput: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
    padding: "6px 8px",
    border: "1px solid #b8a690",
    borderRadius: "4px",
    background: "#fffdf8",
    color: "#2c2416",
    maxWidth: "100%"
  },
  clearFilterButton: {
    alignSelf: "flex-start",
    height: "32px",
    border: "1px solid #a89882",
    borderRadius: "3px",
    background: "#ebe3d7",
    color: "#3d3429",
    padding: "0 14px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "4px"
  },
  seedCard: {
    border: "1px solid #b8a690",
    borderRadius: "4px",
    padding: "14px",
    background: "linear-gradient(165deg, #faf5eb 0%, #f0e8da 45%, #e8dcc8 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(60,48,36,0.08)"
  },
  metaLine: {
    margin: "0 0 6px 0",
    fontSize: "12px",
    color: "#6b6054",
    letterSpacing: "0.02em"
  },
  keyword: {
    margin: 0,
    color: "#2e5224",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "0.03em"
  },
  title: {
    margin: "6px 0 6px 0",
    color: "#1e1812",
    fontSize: "15px"
  },
  content: {
    margin: 0,
    color: "#3d3429",
    whiteSpace: "pre-wrap",
    lineHeight: 1.55,
    fontSize: "14px"
  },
  seedCardFooter: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(184, 166, 144, 0.55)",
    display: "flex",
    justifyContent: "flex-end"
  },
  restoreButton: {
    height: "32px",
    border: "1px solid #4a6b3e",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #e8f0e4 0%, #c8d9c0 100%)",
    color: "#1e3318",
    padding: "0 14px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
    letterSpacing: "0.03em",
    fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)"
  },
  restoreButtonBusy: {
    opacity: 0.85,
    cursor: "wait"
  },
  restoreButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed"
  },
  emptyText: {
    margin: 0,
    color: "#7a6b5c",
    fontSize: "14px"
  }
};

export default SeedVault;
