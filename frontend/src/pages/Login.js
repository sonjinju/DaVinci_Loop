/**
 * 로그인 화면: `/auth/login` 호출 후 JWT를 localStorage에 저장합니다.
 * @param {{ onSwitchToSignup: () => void, onLoginSuccess: () => void }} props
 */
import { useState } from "react";
import { API_BASE_URL } from "../config";
import { AUTH_SLOGAN } from "../constants/authSlogan";
import daVinciImage from "./DaVinci.jpg";

function Login({ onSwitchToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  /** 이메일·비밀번호 포커스 시 테두리 강조 */
  const [focusedField, setFocusedField] = useState(null);

  /** 성공 시 token 저장 후 부모가 main으로 전환 */
  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setMessage("로그인 성공! 다시 이어서 아이디어를 발전시켜 보세요.");
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setMessage(data.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      setMessage("요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.brandTitle}>DaVinci Loop</h2>
          <p style={styles.subTitle}>로그인</p>
        </div>
        <img src={daVinciImage} alt="DaVinci" style={styles.image} />
      </div>

      <p style={styles.slogan}>{AUTH_SLOGAN}</p>

      <input
        style={{
          ...styles.input,
          ...(focusedField === "email" ? styles.inputFocused : {})
        }}
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={() => setFocusedField("email")}
        onBlur={() => setFocusedField(null)}
      />

      <div style={styles.passwordRow}>
        <input
          style={{
            ...styles.input,
            margin: 0,
            flex: 1,
            ...(focusedField === "password" ? styles.inputFocused : {})
          }}
          type={showPassword ? "text" : "password"}
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField(null)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          style={{
            ...styles.smallButton,
            ...(showPassword ? styles.smallButtonActive : {})
          }}
          aria-pressed={showPassword}
          title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
        >
          👁
        </button>
      </div>

      <button
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          ...styles.mainButton,
          ...(isLoading ? styles.mainButtonDisabled : {})
        }}
      >
        {isLoading ? "로그인 중..." : "로그인"}
      </button>

      {message ? <p style={styles.message}>{message}</p> : null}

      <button type="button" onClick={onSwitchToSignup} style={styles.linkButton}>
        아직 계정이 없나요? 회원가입
      </button>
      </div>
    </div>
  );
}

/** 양피지·철갑 잉크 톤 (다빈치 원고 메모 느낌) */
const styles = {
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
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px"
  },
  brandTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1a1510",
    letterSpacing: "0.02em",
    fontWeight: 700,
    textShadow: "0 1px 0 rgba(255,248,235,0.35)"
  },
  subTitle: {
    margin: "6px 0 0 0",
    color: "#6b5d4a",
    fontSize: "14px",
    letterSpacing: "0.04em"
  },
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
  inputFocused: {
    borderColor: "#5c5346",
    outline: "none",
    boxShadow:
      "0 0 0 1px rgba(248, 244, 232, 0.9), 0 0 0 3px rgba(92, 83, 70, 0.22), 0 2px 10px rgba(44, 36, 24, 0.08), inset 0 1px 2px rgba(60, 48, 32, 0.05)"
  },
  passwordRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
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
  smallButtonActive: {
    background: "linear-gradient(180deg, #d4caba 0%, #b8aa96 100%)",
    border: "1px solid #6e5f4e",
    boxShadow: "inset 0 2px 4px rgba(40,32,24,0.12)"
  },
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
  mainButtonDisabled: {
    opacity: 0.72,
    cursor: "wait"
  },
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
  message: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#6b3d32",
    fontFamily: "'Malgun Gothic', Georgia, serif"
  }
};

export default Login;
