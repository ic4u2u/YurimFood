// ============================================================
// LoginPage.jsx — 유림푸드 ERP 로그인 화면
// ============================================================
// 직원은 이메일 + 비밀번호로 로그인합니다.
// 인부는 기존과 동일하게 전화번호로 간편 로그인합니다.
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// 로그인 페이지 메인 컴포넌트
const LoginPage = ({ onWorkerPhoneLogin }) => {
  const { login, authError, loading } = useAuth();

  // activeTab: 현재 선택된 탭 ('staff' = 직원, 'worker' = 인부)
  const [activeTab, setActiveTab] = useState('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 인부 전화번호 로그인 (기존 방식 그대로)
  const [workerPhone, setWorkerPhone] = useState('');

  // 직원 로그인 처리
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoggingIn(true);
    await login(email, password);
    setIsLoggingIn(false);
  };

  // 빠른 로그인 버튼 (데모용 계정 자동 입력)
  const quickFill = (role) => {
    const accounts = {
      admin:   { email: 'admin@yurimfood.com',   password: 'yurim2024!' },
      b2b:     { email: 'b2b@sungwoo.com',        password: 'yurim2024!' },
      pos:     { email: 'pos@yurimtown.com',       password: 'yurim2024!' },
      kitchen: { email: 'kitchen@yurimtown.com',  password: 'yurim2024!' },
    };
    if (accounts[role]) {
      setEmail(accounts[role].email);
      setPassword(accounts[role].password);
    }
  };

  return (
    <div style={styles.bg}>
      {/* 배경 그라데이션 원 (분위기 효과 + 서서히 움직임) */}
      <div style={{ ...styles.circle1, animation: 'floatPhone 10s ease-in-out infinite' }} />
      <div style={{ ...styles.circle2, animation: 'floatPhone 8s ease-in-out infinite alternate' }} />
      <div style={{ ...styles.circle3, animation: 'floatPhone 12s ease-in-out infinite alternate-reverse' }} />

      {/* 로그인 카드 */}
      <div 
        className="glass-premium neon-shadow-blue hover:scale-[1.01] transition-all duration-500" 
        style={styles.card}
      >
        {/* 로고 영역 */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon} className="filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">🍜</div>
          <h1 style={styles.logoTitle} className="bg-gradient-to-r from-white via-blue-100 to-zinc-400 bg-clip-text text-transparent">유림푸드 ERP</h1>
          <p style={styles.logoSubtitle}>통합 관리 시스템 v1.0</p>
        </div>

        {/* 탭 선택: 직원 / 인부 */}
        <div style={styles.tabBar} className="border border-white/5">
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'staff' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('staff')}
            className="hover:text-white transition-colors duration-300"
          >
            👔 직원 로그인
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'worker' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('worker')}
            className="hover:text-white transition-colors duration-300"
          >
            🪖 인부 간편 로그인
          </button>
        </div>

        {/* ── 직원 로그인 탭 ── */}
        {activeTab === 'staff' && (
          <form onSubmit={handleStaffLogin} style={styles.form}>
            {/* 이메일 입력 */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>이메일</label>
              <div style={styles.inputWrap} className="focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-300">
                <span style={styles.inputIcon}>✉️</span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="예: admin@yurimfood.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>비밀번호</label>
              <div style={styles.inputWrap} className="focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-300">
                <span style={styles.inputIcon}>🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={styles.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* 오류 메시지 */}
            {authError && (
              <div style={styles.errorBox}>
                ⚠️ {authError}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              id="staff-login-btn"
              type="submit"
              disabled={isLoggingIn || !email || !password}
              style={{
                ...styles.loginBtn,
                opacity: (isLoggingIn || !email || !password) ? 0.6 : 1,
              }}
              className="hover:brightness-110 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-[0.98] transition-all duration-300"
            >
              {isLoggingIn ? '🔄 로그인 중...' : '🚀 로그인'}
            </button>

            {/* 빠른 로그인 (데모용) */}
            <div style={styles.quickSection}>
              <p style={styles.quickLabel}>⚡ 빠른 로그인 (데모)</p>
              <div style={styles.quickGrid}>
                {[
                  { key: 'admin',   icon: '👑', label: '대표' },
                  { key: 'b2b',     icon: '🏢', label: 'B2B 담당' },
                  { key: 'pos',     icon: '🛒', label: 'POS' },
                  { key: 'kitchen', icon: '🍳', label: '주방' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    id={`quick-login-${item.key}`}
                    onClick={() => quickFill(item.key)}
                    style={styles.quickBtn}
                    className="hover:bg-white/10 hover:border-white/30 hover:text-white active:scale-95 transition-all duration-300"
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* ── 인부 간편 로그인 탭 ── */}
        {activeTab === 'worker' && (
          <div style={styles.form}>
            <div style={styles.workerInfo}>
              <div style={styles.workerInfoIcon}>🪖</div>
              <p style={styles.workerInfoText}>
                B2B 식권 앱에 등록된 전화번호로<br />
                바로 로그인합니다.
              </p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>휴대폰 번호</label>
              <div style={styles.inputWrap} className="focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-300">
                <span style={styles.inputIcon}>📱</span>
                <input
                  id="worker-phone-input"
                  type="tel"
                  placeholder="예: 010-1234-5678"
                  value={workerPhone}
                  onChange={e => setWorkerPhone(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <button
              id="worker-login-btn"
              type="button"
              disabled={!workerPhone}
              onClick={() => onWorkerPhoneLogin && onWorkerPhoneLogin(workerPhone)}
              style={{
                ...styles.loginBtn,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                opacity: !workerPhone ? 0.6 : 1,
              }}
              className="hover:brightness-110 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all duration-300"
            >
              📲 식권 앱 로그인
            </button>

            <p style={styles.workerHint}>
              💡 건설현장 담당자에게 전화번호를 등록해달라고 요청하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 스타일 정의 (글래스모피즘 + 다크 그라데이션)
// ============================================================
const styles = {
  bg: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at center, #111029 0%, #06050b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
  },
  // 배경 장식 원들 (분위기 연출용)
  circle1: {
    position: 'absolute', width: 450, height: 450,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
    top: -150, left: -150,
    filter: 'blur(30px)',
  },
  circle2: {
    position: 'absolute', width: 350, height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
    bottom: -80, right: -80,
    filter: 'blur(30px)',
  },
  circle3: {
    position: 'absolute', width: 250, height: 250,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
    top: '40%', right: '15%',
    filter: 'blur(20px)',
  },
  // 메인 카드 (글래스모피즘)
  card: {
    position: 'relative', zIndex: 10,
    background: 'rgba(255, 255, 255, 0.015)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    padding: '44px 38px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 30px 60px rgba(0,0,0,0.65)',
  },
  // 로고
  logoArea: { textAlign: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 56, marginBottom: 12 },
  logoTitle: {
    margin: 0, fontSize: 28, fontWeight: 900,
    letterSpacing: '-0.5px',
    textShadow: '0 0 25px rgba(59,130,246,0.3)',
  },
  logoSubtitle: {
    margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  // 탭바
  tabBar: {
    display: 'flex', gap: 6,
    background: 'rgba(0,0,0,0.45)',
    borderRadius: 14, padding: 4, marginBottom: 28,
  },
  tabBtn: {
    flex: 1, padding: '11px 8px', border: 'none',
    borderRadius: 11, cursor: 'pointer', fontSize: 12, fontWeight: 700,
    background: 'transparent', color: 'rgba(255,255,255,0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabActive: {
    background: 'rgba(99, 102, 241, 0.85)',
    color: '#fff',
    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  // 폼
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.5px' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, overflow: 'hidden',
  },
  inputIcon: { padding: '0 14px', fontSize: 15, opacity: 0.8 },
  input: {
    flex: 1, padding: '14px 8px', border: 'none',
    background: 'transparent', color: '#fff', fontSize: 14,
    outline: 'none',
    fontWeight: 500,
  },
  eyeBtn: {
    padding: '0 14px', background: 'transparent',
    border: 'none', cursor: 'pointer', fontSize: 15,
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  // 오류 박스
  errorBox: {
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '12px 14px', fontSize: 12,
    color: '#fca5a5',
    fontWeight: 500,
  },
  // 로그인 버튼
  loginBtn: {
    padding: '16px', border: 'none', borderRadius: 14,
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff', fontSize: 14, fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 10px 25px -5px rgba(59,130,246,0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.5px',
  },
  // 빠른 로그인
  quickSection: { marginTop: 6 },
  quickLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', marginBottom: 10,
    fontWeight: 600,
  },
  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  quickBtn: {
    padding: '11px', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer',
    fontWeight: 700,
    transition: 'all 0.3s',
  },
  // 인부 탭
  workerInfo: { textAlign: 'center', padding: '18px 0 10px' },
  workerInfoIcon: { fontSize: 52, marginBottom: 14, filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.3))' },
  workerInfoText: {
    color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6,
    margin: 0,
    fontWeight: 500,
  },
  workerHint: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', margin: 0,
    fontWeight: 500,
  },
};

export default LoginPage;
