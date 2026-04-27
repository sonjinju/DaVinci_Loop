/**
 * 회원가입 화면: `/auth/signup` — 비밀번호 해시는 서버(bcrypt)에서 처리합니다.
 * @param {{ onSwitchToLogin: () => void }} props
 */
import { useState } from "react";
import { API_BASE_URL } from "../config";
import { AUTH_SLOGAN } from "../constants/authSlogan";
import daVinciImage from "./DaVinci.jpg";

function Sign({ onSwitchToLogin }) {
  // --- 입력값 상태 ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 비밀번호 표시/숨김 토글
  const [showPassword, setShowPassword] = useState(false);
  // 사용자에게 보여줄 안내 문구(성공/실패)
  const [message, setMessage] = useState("");
  // 회원가입 요청 중 버튼 중복 클릭 방지
  const [isLoading, setIsLoading] = useState(false);
  // 현재 포커스된 필드명("email" | "password")
  const [focusedField, setFocusedField] = useState(null);

  /** 응답 message를 그대로 안내 (실패 시에도 서버 메시지 우선) */
  const handleSignup = async () => {
    // 필수값 누락 시 네트워크 요청 없이 즉시 반환
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    // 요청 시작: 로딩 ON + 이전 메시지 초기화
    setIsLoading(true);
    setMessage("");

    try {
      // 회원가입 API 호출
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // 서버가 받는 JSON 바디
        body: JSON.stringify({ email, password })
      });

      // 서버 응답 메시지를 우선 표시
      const data = await res.json();
      setMessage(data.message || "회원가입이 완료되었습니다.");
    } catch (error) {
      // 네트워크 장애/예외 상황 공통 안내
      setMessage("요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      // 성공/실패와 무관하게 로딩 OFF
      setIsLoading(false);
    }
  };

  return (
    // 페이지 배경 및 중앙 정렬 래퍼
    <div style={styles.page}>
      {/* 실제 카드 영역 */}
      <div style={styles.container}>
        {/* 상단: 브랜드 텍스트 + 이미지 */}
        <div style={styles.topRow}>
          <div>
            <h2 style={styles.brandTitle}>DaVinci Loop</h2>
            <p style={styles.subTitle}>회원가입</p>
          </div>
          <img src={daVinciImage} alt="DaVinci" style={styles.image} />
        </div>

        {/* 인증 화면 공통 슬로건 */}
        <p style={styles.slogan}>{AUTH_SLOGAN}</p>

        {/* 이메일 입력 */}
        <input
          style={{
            ...styles.input,
            // 포커스 필드에만 강조 스타일 적용
            ...(focusedField === "email" ? styles.inputFocused : {})
          }}
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />

        {/* 비밀번호 입력 + 표시 토글 */}
        <div style={styles.passwordRow}>
          <input
            style={{
              ...styles.input,
              margin: 0,
              flex: 1,
              ...(focusedField === "password" ? styles.inputFocused : {})
            }}
            // showPassword 값에 따라 실제 input 타입 변경
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
          />
          <button
            type="button"
            // 이전 상태를 뒤집어 토글
            onClick={() => setShowPassword((prev) => !prev)}
            style={{
              ...styles.smallButton,
              ...(showPassword ? styles.smallButtonActive : {})
            }}
            // 접근성: 토글 상태 전달
            aria-pressed={showPassword}
            title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
          >
            👁
          </button>
        </div>

        {/* 회원가입 실행 버튼 */}
        <button
          onClick={handleSignup}
          disabled={isLoading}
          style={{
            ...styles.mainButton,
            ...(isLoading ? styles.mainButtonDisabled : {})
          }}
        >
          {isLoading ? "가입 중..." : "회원가입"}
        </button>

        {/* 안내 메시지는 값이 있을 때만 렌더링 */}
        {message ? <p style={styles.message}>{message}</p> : null}

        {/* 로그인 화면으로 전환 */}
        <button type="button" onClick={onSwitchToLogin} style={styles.linkButton}>
          이미 계정이 있나요? 로그인
        </button>
      </div>
    </div>
  );
}

/** 로그인과 동일 — 양피지·잉크 톤 (다빈치 원고 메모) */
const styles = {
  // 페이지 전체 배경과 카드 중앙 정렬
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box",
    background: "#fff"
  },
  container: {
    width: "100%",
    maxWidth: "360px",
    padding: "22px 20px",
    border: "1px solid #7a6b56",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "linear-gradient(165deg, #f8f0e0 0%, #ebe0cc 45%, #e2d4bc 100%)",
    boxShadow:
      "0 10px 28px rgba(44, 36, 24, 0.22), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 0 0 1px rgba(255,252,245,0.35)",
    color: "#2a2218",
    fontFamily: "Georgia, 'Palatino Linotype', 'Malgun Gothic', serif"
  },
  // 카드 상단 제목 영역
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px"
  },
  // 서비스명 타이틀
  brandTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1a1510",
    letterSpacing: "0.02em",
    fontWeight: 700,
    textShadow: "0 1px 0 rgba(255,248,235,0.35)"
  },
  // "회원가입" 서브 타이틀
  subTitle: {
    margin: "6px 0 0 0",
    color: "#6b5d4a",
    fontSize: "14px",
    letterSpacing: "0.04em"
  },
  // 카드 내 강조 문구
  slogan: {
    margin: "4px 0 8px 0",
    padding: "12px 14px 12px 14px",
    fontSize: "13px",
    lineHeight: 1.65,
    color: "#352a1f",
    background: "linear-gradient(90deg, #efe4d0 0%, #f7f1e4 55%, #faf6ec 100%)",
    borderLeft: "4px solid #3d3228",
    borderRadius: "0 8px 8px 0",
    fontFamily: "Georgia, 'Malgun Gothic', serif",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)"
  },
  // 우측 이미지
  image: {
    width: "120px",
    height: "120px",
    flexShrink: 0,
    objectFit: "cover",
    objectPosition: "center 20%",
    borderRadius: "8px",
    border: "1px solid #5c4f3e",
    boxShadow: "0 2px 8px rgba(40, 32, 20, 0.2)",
    filter: "sepia(0.18) saturate(0.92)"
  },
  // 공통 입력창
  input: {
    height: "38px",
    padding: "0 12px",
    border: "1px solid #9a8a74",
    borderRadius: "6px",
    marginBottom: "4px",
    background: "#faf6ee",
    color: "#241c14",
    fontFamily: "Georgia, 'Malgun Gothic', serif",
    fontSize: "14px",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(60, 48, 32, 0.06)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
  },
  // 입력창 포커스 강조
  inputFocused: {
    borderColor: "#5c5346",
    outline: "none",
    boxShadow:
      "0 0 0 1px rgba(248, 244, 232, 0.9), 0 0 0 3px rgba(92, 83, 70, 0.22), 0 2px 10px rgba(44, 36, 24, 0.08), inset 0 1px 2px rgba(60, 48, 32, 0.05)"
  },
  // 비밀번호 입력 + 토글 버튼 가로 배치
  passwordRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  // 눈(👁) 버튼 기본 스타일
  smallButton: {
    height: "38px",
    padding: "0 10px",
    border: "1px solid #8a7a68",
    borderRadius: "6px",
    background: "linear-gradient(180deg, #ebe4d6 0%, #ddd2c2 100%)",
    color: "#3a3228",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)"
  },
  // 눈(👁) 버튼 활성 상태 스타일
  smallButtonActive: {
    background: "linear-gradient(180deg, #d4caba 0%, #b8aa96 100%)",
    border: "1px solid #6e5f4e",
    boxShadow: "inset 0 2px 4px rgba(40,32,24,0.12)"
  },
  // 메인 액션(회원가입) 버튼
  mainButton: {
    height: "40px",
    border: "1px solid #1f1812",
    borderRadius: "6px",
    background: "linear-gradient(180deg, #4d4034 0%, #352a22 48%, #241c16 100%)",
    color: "#f4ecd8",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.06em",
    fontFamily: "Georgia, 'Malgun Gothic', serif",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(20, 14, 10, 0.25)",
    textShadow: "0 1px 0 rgba(0,0,0,0.35)"
  },
  // 로딩 중 버튼 상태
  mainButtonDisabled: {
    opacity: 0.72,
    cursor: "wait"
  },
  // 하단 텍스트 링크 버튼
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#5a4533",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    fontSize: "13px",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    fontFamily: "Georgia, 'Malgun Gothic', serif"
  },
  // 성공/실패 안내 메시지
  message: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#6b3d32",
    fontFamily: "'Malgun Gothic', Georgia, serif"
  }
};

export default Sign;
