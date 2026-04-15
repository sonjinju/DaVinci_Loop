/**
 * 단일 페이지 앱의 화면 전환: login ↔ signup ↔ main(아이디어) ↔ seedVault(씨앗 보관함).
 * 토큰 존재 여부로 초기 화면을 정합니다.
 */
import { useState } from "react";
import { LOCK_STORAGE_KEY } from "./constants/locks";
import Sign from "./pages/sign";
import Login from "./pages/Login";
import Main from "./pages/main";
import SeedVault from "./pages/SeedVault";

/** 로그인 상태에서 main/seedVault 중 마지막 화면 — 새로고침 시 유지(탭 단위) */
const AUTH_VIEW_SESSION_KEY = "davinci_app_view";

function readInitialAuthView() {
  if (!localStorage.getItem("token")) return "login";
  const saved = sessionStorage.getItem(AUTH_VIEW_SESSION_KEY);
  if (saved === "seedVault") return "seedVault";
  return "main";
}

function App() {
  /** "login" | "signup" | "main" | "seedVault" — 조건부 렌더로 화면만 바꿉니다. */
  const [authView, setAuthViewState] = useState(readInitialAuthView);

  const setAuthView = (view) => {
    if (view === "main" || view === "seedVault") {
      sessionStorage.setItem(AUTH_VIEW_SESSION_KEY, view);
    }
    if (view === "login" || view === "signup") {
      sessionStorage.removeItem(AUTH_VIEW_SESSION_KEY);
    }
    setAuthViewState(view);
  };

  /** JWT·잠금 맵 제거 후 로그인 화면으로 */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(LOCK_STORAGE_KEY);
    setAuthView("login");
  };

  // 아래 분기 순서: main → seedVault → login → (기본) signup
  if (authView === "main") {
    return (
      <Main
        onOpenSeedVault={() => setAuthView("seedVault")}
        onLogout={handleLogout}
      />
    );
  }

  if (authView === "seedVault") {
    return <SeedVault onBack={() => setAuthView("main")} onLogout={handleLogout} />;
  }

  if (authView === "login") {
    return (
      <Login
        onSwitchToSignup={() => setAuthView("signup")}
        onLoginSuccess={() => setAuthView("main")}
      />
    );
  }

  return <Sign onSwitchToLogin={() => setAuthView("login")} />;
}

export default App;
