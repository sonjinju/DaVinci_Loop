/**
 * React 앱 진입점: #root에 App을 마운트합니다.
 * StrictMode는 개발 중 잠재적 문제(deprecated API 등)를 두 번 호출해 드러냅니다.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 성능 측정(선택): https://bit.ly/CRA-vitals
reportWebVitals();
