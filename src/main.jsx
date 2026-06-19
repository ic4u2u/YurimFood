import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { ERPProvider } from './context/ERPContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// ============================================================
// main.jsx — 앱의 시작점 (진입점)
// ============================================================
// Provider 순서 (바깥 → 안쪽):
//   AuthProvider  → Firebase 로그인 상태 관리 (최상단에 있어야 함)
//   ERPProvider   → ERP 데이터(회사, 인부, 매출 등) 관리
//   App           → 실제 화면 컴포넌트
// ============================================================

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ERPProvider>
        <App />
      </ERPProvider>
    </AuthProvider>
  </StrictMode>,
)
