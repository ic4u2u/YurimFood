import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Sun, 
  Moon, 
  QrCode, 
  Truck, 
  Activity, 
  Coffee, 
  ChevronRight, 
  RefreshCw, 
  Flame, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  MapPin, 
  Clock,
  AlertTriangle,
  Volume2,
  FileText,
  Thermometer,
  Download
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { ERPContext, standardCatalog } from './context/ERPContext';
import { useAuth, ROLE_LABELS } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import SuperAdminPage from './pages/SuperAdminPage';
import B2BPortalPage from './pages/B2BPortalPage';
import StorePOSPage from './pages/StorePOSPage';
import WorkerMobilePage from './pages/WorkerMobilePage';
import KitchenKDSPage from './pages/KitchenKDSPage';
import UserGuidePage from './pages/UserGuidePage';

// ============================================================
// SyncTimeAgo — "N초 전" 실시간 표시 컴포넌트
// ============================================================
// 마지막으로 서버에서 데이터를 가져온 시각을 "3초 전", "1분 전" 형태로
// 1초마다 자동 갱신하여 보여줍니다.
// (카카오톡의 "읽지 않은 메시지: 5초 전" 같은 느낌!)
function SyncTimeAgo({ lastSyncTime }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    // 1초마다 "몇 초 전인지" 다시 계산
    const updateTimeAgo = () => {
      if (!lastSyncTime) return;
      const diffSec = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      if (diffSec < 5) setTimeAgo('방금');
      else if (diffSec < 60) setTimeAgo(`${diffSec}초 전`);
      else if (diffSec < 3600) setTimeAgo(`${Math.floor(diffSec / 60)}분 전`);
      else setTimeAgo(`${Math.floor(diffSec / 3600)}시간 전`);
    };

    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(timer); // 정리 (메모리 누수 방지)
  }, [lastSyncTime]);

  return (
    <span style={{ opacity: 0.7, fontSize: 9 }}>· {timeAgo}</span>
  );
}

export default function App() {
  const {
    companies,
    workers,
    orders,
    sales,
    iot,
    coldChainTemp,
    buildings,
    kitchenOrders,
    totalSavings,
    // ── 실시간 동기화 상태 (새로 추가) ──
    connectionStatus,
    lastSyncTime,
    // ── 비즈니스 액션 함수들 ──
    addSCMOrder,
    addBulkSCMOrders,
    consolidateAndNegotiateOrders,
    updateSCMOrderStatus,
    chargeCompanyBalance,
    addWorkerToken,
    deleteWorkerToken,
    scanQRAndPay,
    logGeneralSale,
    toggleAcPeakControl,
    updateAcStatus,
    updateTempSetting,
    sendDunningNotice,
    completeKitchenOrder,
    resetToInitial
  } = useContext(ERPContext);

  // ── Firebase Auth 상태 ──────────────────────────────────────
  const { currentUser, userRole, userName, logout, loading: authLoading } = useAuth();

  // Firebase role → App role 매핑
  // userRole이 바뀌면 자동으로 해당 화면으로 전환
  const roleMap = {
    super_admin:   'Super_Admin',
    b2b_client:    'Client_B2B',
    store_pos:     'Store_Manager',
    kitchen_kds:   'Kitchen_KDS',
    worker_mobile: 'Worker_Mobile',
  };

  const [role, setRole] = useState('Login'); // Login, Super_Admin, Client_B2B, Store_Manager, Worker_Mobile, Kitchen_KDS
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Firebase 로그인 성공 시 자동으로 역할 화면 전환
  useEffect(() => {
    if (currentUser && userRole) {
      const mappedRole = roleMap[userRole] || 'Super_Admin';
      setRole(mappedRole);
      setIsLoggedIn(true);
    } else if (!currentUser) {
      setRole('Login');
      setIsLoggedIn(false);
    }
  }, [currentUser, userRole]);
  const [selectedLoginRole, setSelectedLoginRole] = useState('Super_Admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCompanyId, setLoginCompanyId] = useState('c4');
  const [loginStoreName, setLoginStoreName] = useState('양평신내서울해장국');
  const [loginWorkerPhone, setLoginWorkerPhone] = useState('');
  const [loginKdsStoreName, setLoginKdsStoreName] = useState('양평신내서울해장국');
  const [theme, setTheme] = useState('dark'); // dark, light

  // ----------------------------------------------------
  // SHARED STATES FOR MODULES
  // ----------------------------------------------------
  const [loginPhone, setLoginPhone] = useState('');
  const [loggedInWorker, setLoggedInWorker] = useState(null);
  const [selectedKdsStore, setSelectedKdsStore] = useState('양평신내서울해장국');
  const [selectedCompanyId, setSelectedCompanyId] = useState('c4'); // Default to Hyundai Construction (c4) for demo
  const [selectedStore, setSelectedStore] = useState('양평신내서울해장국');
  const [selectedMenu, setSelectedMenu] = useState('양평해장국 특');
  const [qrInput, setQrInput] = useState('');
  const [posState, setPosState] = useState('idle'); // idle, success, error
  const [virtualAccountModalOpen, setVirtualAccountModalOpen] = useState(false);
  const [chargeInput, setChargeInput] = useState('');
  const [qrModalWorker, setQrModalWorker] = useState(null);

  // Sync theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Handle B2B company switch
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0] || { id: 'c1', name: '-', balance: 0, businessNumber: '-' };

  // Reset function wrap
  const handleReset = () => {
    resetToInitial();
    setSelectedCompanyId('c4');
    setPosState('idle');
    setQrInput('');
    setLoggedInWorker(null);
    setLoginPhone('');
  };







  // ============================================================
  // 인증 게이트 (Auth Gate)
  // ============================================================
  // authLoading: Firebase가 이전 로그인 기록을 확인하는 중 (보통 1~2초)
  // 이 시간 동안 빈 화면이 깜빡이지 않도록 로딩 스피너를 보여줍니다.
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 52 }}>🍜</div>
        <div style={{
          width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid #6366f1', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>유림푸드 ERP 로딩 중...</p>
      </div>
    );
  }

  // currentUser가 없으면(= 로그아웃 상태) 로그인 페이지를 보여줌
  // 인부는 전화번호 로그인으로 Worker_Mobile 화면으로 직접 진입
  if (!currentUser) {
    return (
      <LoginPage
        onWorkerPhoneLogin={(phone) => {
          // 인부는 Firebase Auth 없이 전화번호로 기존 방식 사용
          const found = workers.find(w => w.phone === phone);
          if (found) {
            setLoggedInWorker(found);
            setRole('Worker_Mobile');
            setIsLoggedIn(true);
          } else {
            alert('등록되지 않은 전화번호입니다. 담당자에게 문의하세요.');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md py-3 px-4 md:py-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-2 md:gap-3 mr-auto md:mr-0">
          <div className="p-1.5 md:p-2 bg-blue-600 rounded-lg text-white">
            <Building2 className="w-5 h-5 md:w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-extrabold tracking-tight">유림푸드 F&B 타운 통합 ERP</h1>
            <p className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-mono hidden sm:block">Yulim Food Digital Smart Solution v1.0</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Active Role Info Suffix Badge */}
          {isLoggedIn && (
            <span className="text-[9px] md:text-[10px] font-black tracking-wide text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-1 md:gap-1.5 font-mono shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {role === 'Super_Admin' && '👑 최고 관리자'}
              {role === 'Client_B2B' && `🤝 협력사 [${activeCompany.name.split(' ')[0]}]`}
              {role === 'Store_Manager' && `🖥️ 매장결제 [${selectedStore.substring(0, 5)}]`}
              {role === 'Worker_Mobile' && `📱 근로자식권 [${loggedInWorker ? loggedInWorker.name : '미인증'}]`}
              {role === 'Kitchen_KDS' && `👨‍🍳 주방주문 [${selectedKdsStore.substring(0, 5)}]`}
              {role === 'User_Guide' && '📖 시스템 설명서'}
            </span>
          )}

          {/* Active Role Selector Tab */}
          <div className="bg-zinc-100 dark:bg-zinc-900 p-0.5 md:p-1 rounded-lg flex flex-wrap gap-0.5 md:gap-1 border border-zinc-200/50 dark:border-zinc-800/50 max-w-full overflow-x-auto">
            {/* Super Admin */}
            <div className="relative group">
              <button 
                onClick={() => { setRole('Super_Admin'); setIsLoggedIn(true); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Super_Admin' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                최고 관리자
              </button>
              
              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top text-left">
                <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" /> 최고 관리자 사용방법
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium">
                  F&B 타운 전체의 자금 흐름과 프롭테크 임대 정보를 총괄하는 최고 관리 권한입니다.
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                  <div className="flex items-start gap-1">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>식당별 매출 기여도 및 점심 시간대 식수 그래프 모니터링</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>6개동 임대료 수납 관리 및 연체 매장 독촉장 즉시 발송</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>식봄 SCM 연동을 통한 식자재 공동구매 승인/네고</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>B2B 세금계산서 가상 발행 및 정산 엑셀 다운로드</span>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B Portal */}
            <div className="relative group">
              <button 
                onClick={() => { setRole('Client_B2B'); setIsLoggedIn(true); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Client_B2B' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                협력사 식권관리
              </button>
              
              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top text-left">
                <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" /> 협력사 식권관리 사용방법
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium">
                  협력 건설사가 근로자들의 장부 식권을 배포하고 정산하는 관리 페이지입니다.
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                  <div className="flex items-start gap-1">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>선불 예치금 가상계좌 발급 및 입금 충전 시뮬레이션</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>소속 근로자 등록 및 일일 25,000 P 포인트 식권 즉시 발급</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>소속 근로자들의 실시간 식사 이력(메뉴, 가격, 일시) 모니터링</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Manager */}
            <div className="relative group">
              <button 
                onClick={() => { setRole('Store_Manager'); setIsLoggedIn(true); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Store_Manager' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                매장 결제관리
              </button>
              
              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top text-left">
                <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <ShoppingBag className="w-4 h-4" /> 매장 결제관리 사용방법
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                  F&B 타운 입점 식당 카운터에서 식사 결제를 승인하고 식자재를 발주하는 화면입니다.
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>결제 처리할 판매 메뉴 선택 및 근로자 OTP QR 스캔 결제</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>동일 QR 코드의 30초 내 중복 결제를 차단하는 보안 검증</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>식자재 도매 카탈로그(식봄)를 통한 실시간 발주 신청</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Worker Mobile */}
            <div className="relative group">
              <button 
                onClick={() => { setRole('Worker_Mobile'); setIsLoggedIn(true); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Worker_Mobile' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                근로자 식권관리
              </button>
              
              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top text-left">
                <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <QrCode className="w-4 h-4" /> 근로자 식권관리 사용방법
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                  현장 근로자가 스마트폰으로 식사를 인증하는 모바일 웹 앱 화면입니다.
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                  <div className="flex items-start gap-1">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>사전 등록된 전화번호 입력을 통한 보안 로그인</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>30초마다 자동 갱신 및 난수가 붙는 일회용 OTP QR 생성</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>오늘 식사 잔여 포인트 및 개인 식사 기록 실시간 확인</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kitchen KDS */}
            <div className="relative group">
              <button 
                onClick={() => { setRole('Kitchen_KDS'); setIsLoggedIn(true); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Kitchen_KDS' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                주방 주문관리
              </button>
              
              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top text-left">
                <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <Flame className="w-4 h-4" /> 주방 주문관리 사용방법
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                  각 식당 주방에 설치되어 실시간 주문 조리 현황을 관리하는 모니터입니다.
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                  <div className="flex items-start gap-1">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>POS/모바일 결제 시 주문서 실시간 연동 접수</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>주문 경과 시간 실시간 표시 (3분 초과 시 지연 경고 점멸)</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>조리 완료 처리 시 해당 근로자 호출 알림</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System User Guide */}
            <div className="relative group">
              <button 
                onClick={() => { setRole('User_Guide'); setIsLoggedIn(true); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'User_Guide' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                시스템 설명서 📖
              </button>
              
              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top text-left font-sans">
                <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" /> 통합 사용설명서 안내
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium">
                  각 메뉴별(최고관리자, 협력사, POS, 근로자, 주방) 상세 사용 방법 및 최근 시스템 업그레이드 내역을 확인합니다.
                </p>
              </div>
            </div>
          </div>

          {/* ── 실시간 동기화 상태 배지 (새로 추가) ── */}
          {/* 서버와 연결이 잘 되고 있는지 한눈에 보여주는 작은 표시 */}
          {isLoggedIn && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold font-mono tracking-wide shadow-sm transition-all duration-500"
              style={{
                // 상태에 따라 색상이 바뀜: 초록(연결) / 빨강(끊김) / 노랑(동기화중)
                background: connectionStatus === 'connected' ? 'rgba(16,185,129,0.08)'
                          : connectionStatus === 'disconnected' ? 'rgba(239,68,68,0.08)'
                          : 'rgba(234,179,8,0.08)',
                borderColor: connectionStatus === 'connected' ? 'rgba(16,185,129,0.25)'
                           : connectionStatus === 'disconnected' ? 'rgba(239,68,68,0.25)'
                           : 'rgba(234,179,8,0.25)',
                color: connectionStatus === 'connected' ? '#10b981'
                     : connectionStatus === 'disconnected' ? '#ef4444'
                     : '#eab308',
              }}
            >
              {/* 상태 점: 연결됨이면 깜빡, 끊기면 고정, 동기화중이면 회전 */}
              <span style={{
                width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                background: connectionStatus === 'connected' ? '#10b981'
                          : connectionStatus === 'disconnected' ? '#ef4444'
                          : '#eab308',
                animation: connectionStatus === 'connected' ? 'pulse 2s infinite'
                         : connectionStatus === 'syncing' ? 'pulse 0.8s infinite'
                         : 'none',
              }} />

              {/* 상태 텍스트 */}
              <span>
                {connectionStatus === 'connected' && '서버 연결됨'}
                {connectionStatus === 'disconnected' && '오프라인 모드'}
                {connectionStatus === 'syncing' && '동기화 중...'}
              </span>

              {/* 마지막 동기화 시각 (연결된 상태에서만 표시) */}
              {connectionStatus === 'connected' && lastSyncTime && (
                <SyncTimeAgo lastSyncTime={lastSyncTime} />
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-zinc-400" />}
          </button>

          {/* System Reset */}
          <button 
            onClick={handleReset}
            title="데이터 초기화"
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Logout Button */}
          {isLoggedIn && (
            <button 
              onClick={() => {
                // Firebase Auth 로그아웃 + 로컬 상태 초기화
                logout();
                setIsLoggedIn(false);
                setRole('Login');
                setLoggedInWorker(null);
              }}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all font-bold text-xs flex items-center gap-1"
              title="로그아웃"
            >
              <X className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          )}
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTAINER */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* ROLE INFO HEADER */}
        {role !== 'Login' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {role === 'Super_Admin' ? '건물주 / 총괄 관리자 모드' : 
                   role === 'Client_B2B' ? '협력 건설사 장부 관리 포털' : 
                   role === 'Store_Manager' ? '매장 POS 및 식자재 발주 연동' :
                   role === 'Worker_Mobile' ? '현장 근로자용 모바일 식권 앱' : 
                   role === 'User_Guide' ? '통합 시스템 사용 가이드 및 요구사항' : '식당 주방 주문 KDS 모니터'}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {role === 'Super_Admin' ? 'F&B 타운 전사적 자원 관리 대시보드' : 
                 role === 'Client_B2B' ? 'B2B 달장부 잔액 및 식수 정산 관리' : 
                 role === 'Store_Manager' ? `${selectedStore} 태블릿 POS 카운터` :
                 role === 'Worker_Mobile' ? '내 스마트폰 모바일 식권' : 
                 role === 'User_Guide' ? '유림푸드 ERP 사용설명서 & 업그레이드 리포트' : `${selectedKdsStore} 주방 KDS 화면`}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-sm">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono">현장: 용인 하이닉스 반도체 건설 기지 배후</span>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 0: LOGIN PORTAL */}
        {/* ---------------------------------------------------- */}
        {role === 'Login' && (
          <div className="max-w-4xl w-full mx-auto my-auto p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col gap-8 animate-fadeIn">
            <div className="text-center flex flex-col gap-2">
              <div className="mx-auto p-3 bg-blue-600 rounded-2xl text-white w-max shadow-lg shadow-blue-500/20">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight mt-2 bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                유림푸드 F&B 타운 통합 ERP
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                부서 및 권한별 시스템 로그인을 위해 아래의 역할을 선택해 주세요.
              </p>
            </div>
            
            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Super Admin */}
              <div className="relative group/card">
                <div 
                  onClick={() => {
                    setSelectedLoginRole('Super_Admin');
                    setLoginPassword('');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-between h-40 text-center ${
                    selectedLoginRole === 'Super_Admin'
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/15'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02]'
                  }`}
                >
                  <div className="p-3 bg-blue-600 rounded-xl text-white">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">Super Admin</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">최고 관리자</p>
                  </div>
                  <span className="text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                    F&B 타운 총괄
                  </span>
                </div>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover/card:opacity-100 group-hover/card:scale-100 transition-all duration-200 origin-bottom text-left">
                  <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-4 h-4" /> 최고 관리자 (Super Admin) 사용방법
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                    F&B 타운 전체의 자금 흐름과 프롭테크 임대 정보를 총괄하는 최고 관리 권한입니다.
                  </p>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                    <div className="flex items-start gap-1">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>식당별 매출 기여도 및 점심 시간대 식수 그래프 모니터링</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>6개동 임대료 수납 관리 및 연체 매장 독촉장 즉시 발송</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>식봄 SCM 연동을 통한 식자재 공동구매 승인/네고</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>B2B 세금계산서 가상 발행 및 정산 엑셀 다운로드</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* B2B Portal */}
              <div className="relative group/card">
                <div 
                  onClick={() => {
                    setSelectedLoginRole('Client_B2B');
                    setLoginPassword('');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-between h-40 text-center ${
                    selectedLoginRole === 'Client_B2B'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02]'
                  }`}
                >
                  <div className="p-3 bg-indigo-600 rounded-xl text-white">
                    <Users className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">협력사 식권관리</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium font-sans">협력업체 대시보드</p>
                  </div>
                  <span className="text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                    식수 정산 관리
                  </span>
                </div>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover/card:opacity-100 group-hover/card:scale-100 transition-all duration-200 origin-bottom text-left">
                  <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-4 h-4" /> 협력사 식권관리 사용방법
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                    협력 건설사가 근로자들의 장부 식권을 배포하고 정산하는 관리 페이지입니다.
                  </p>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                    <div className="flex items-start gap-1">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>선불 예치금 가상계좌 발급 및 입금 충전 시뮬레이션</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>소속 근로자 등록 및 일일 포인트 식권 즉시 발급</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>소속 근로자들의 실시간 식사 이력(메뉴, 가격, 일시) 모니터링</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store POS */}
              <div className="relative group/card">
                <div 
                  onClick={() => {
                    setSelectedLoginRole('Store_Manager');
                    setLoginPassword('');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-between h-40 text-center ${
                    selectedLoginRole === 'Store_Manager'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02]'
                  }`}
                >
                  <div className="p-3 bg-emerald-600 rounded-xl text-white">
                    <ShoppingBag className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">매장 결제관리</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium font-sans">식당 포스기</p>
                  </div>
                  <span className="text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                    식사 결제/발주
                  </span>
                </div>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover/card:opacity-100 group-hover/card:scale-100 transition-all duration-200 origin-bottom text-left">
                  <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <ShoppingBag className="w-4 h-4" /> 매장 결제관리 사용방법
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                    F&B 타운 입점 식당 카운터에서 식사 결제를 승인하고 식자재를 발주하는 화면입니다.
                  </p>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                    <div className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>결제 처리할 판매 메뉴 선택 및 근로자 OTP QR 스캔 결제</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>동일 QR 코드의 30초 내 중복 결제를 차단하는 보안 검증</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>식자재 도매 카탈로그(식봄)를 통한 실시간 발주 신청</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Worker Mobile */}
              <div className="relative group/card">
                <div 
                  onClick={() => {
                    setSelectedLoginRole('Worker_Mobile');
                    setLoginWorkerPhone('');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-between h-40 text-center ${
                    selectedLoginRole === 'Worker_Mobile'
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/15'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02]'
                  }`}
                >
                  <div className="p-3 bg-purple-600 rounded-xl text-white">
                    <QrCode className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">근로자 식권관리</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium font-sans">모바일 식권</p>
                  </div>
                  <span className="text-[9px] font-extrabold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    OTP QR 모바일 식권
                  </span>
                </div>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover/card:opacity-100 group-hover/card:scale-100 transition-all duration-200 origin-bottom text-left">
                  <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <QrCode className="w-4 h-4" /> 근로자 식권관리 사용방법
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                    현장 근로자가 스마트폰으로 식사를 인증하는 모바일 웹 앱 화면입니다.
                  </p>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                    <div className="flex items-start gap-1">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>사전 등록된 전화번호 입력을 통한 보안 로그인</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>30초마다 자동 갱신 및 난수가 붙는 일회용 OTP QR 생성</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>오늘 식사 잔여 포인트 및 개인 식사 기록 실시간 확인</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kitchen KDS */}
              <div className="relative group/card">
                <div 
                  onClick={() => {
                    setSelectedLoginRole('Kitchen_KDS');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-between h-40 text-center ${
                    selectedLoginRole === 'Kitchen_KDS'
                      ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/15'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02]'
                  }`}
                >
                  <div className="p-3 bg-rose-600 rounded-xl text-white">
                    <Flame className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">주방 주문관리</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium font-sans">주방 오더 모니터</p>
                  </div>
                  <span className="text-[9px] font-extrabold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded">
                    실시간 주문 접수
                  </span>
                </div>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 p-4 rounded-xl border bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md text-zinc-900 dark:text-zinc-100 z-50 opacity-0 scale-95 pointer-events-none group-hover/card:opacity-100 group-hover/card:scale-100 transition-all duration-200 origin-bottom text-left">
                  <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Flame className="w-4 h-4" /> 주방 주문관리 사용방법
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 font-medium font-sans">
                    각 식당 주방에 설치되어 실시간 주문 조리 현황을 관리하는 모니터입니다.
                  </p>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold font-sans">
                    <div className="flex items-start gap-1">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>POS/모바일 결제 시 주문서 실시간 연동 접수</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>주문 경과 시간 실시간 표시 (3분 초과 시 지연 경고 점멸)</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>조리 완료 처리 시 해당 근로자 호출 알림</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Form Panel */}
            <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-inner transition-all duration-300">
              {/* Super Admin Form */}
              {selectedLoginRole === 'Super_Admin' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">최고 관리자 비밀번호</label>
                    <input 
                      type="password"
                      placeholder="비밀번호 입력 (데모: 1234 또는 admin)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-zinc-100"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (loginPassword === '1234' || loginPassword === 'admin' || loginPassword === '') {
                        setRole('Super_Admin');
                        setIsLoggedIn(true);
                      } else {
                        alert('비밀번호가 올바르지 않습니다. (데모 비밀번호: 1234 또는 admin)');
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    최고 관리자 로그인
                  </button>
                </div>
              )}

              {/* B2B Portal Form */}
              {selectedLoginRole === 'Client_B2B' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">협력사 선택</label>
                      <select 
                        value={loginCompanyId}
                        onChange={(e) => setLoginCompanyId(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-zinc-100 font-bold"
                      >
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">비밀번호</label>
                      <input 
                        type="password"
                        placeholder="비밀번호 입력 (데모: 1234)"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCompanyId(loginCompanyId);
                      setRole('Client_B2B');
                      setIsLoggedIn(true);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
                  >
                    B2B 달장부 포털 로그인
                  </button>
                </div>
              )}

              {/* Store POS Form */}
              {selectedLoginRole === 'Store_Manager' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">매장 선택</label>
                      <select 
                        value={loginStoreName}
                        onChange={(e) => setLoginStoreName(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-zinc-100 font-bold"
                      >
                        <option value="양평신내서울해장국">양평신내서울해장국 (한식)</option>
                        <option value="유림푸드 중화식당">유림푸드 중화식당 (중식)</option>
                        <option value="삼계탕&염소탕">삼계탕&염소탕 (보양식)</option>
                        <option value="장어&고기">장어&고기 (고기류)</option>
                        <option value="분식집">분식집 (분식)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">POS 패스코드</label>
                      <input 
                        type="password"
                        placeholder="패스코드 입력 (데모: 1234)"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedStore(loginStoreName);
                      setRole('Store_Manager');
                      setIsLoggedIn(true);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    매장 태블릿 POS 로그인
                  </button>
                </div>
              )}

              {/* Worker Mobile Form */}
              {selectedLoginRole === 'Worker_Mobile' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">전화번호 직접 입력</label>
                      <input 
                        type="text"
                        placeholder="010-XXXX-XXXX"
                        value={loginWorkerPhone}
                        onChange={(e) => setLoginWorkerPhone(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono dark:text-zinc-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">데모용 빠른 계정 선택 (선택 시 자동 입력)</label>
                      <select 
                        value={loginWorkerPhone}
                        onChange={(e) => setLoginWorkerPhone(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none font-bold dark:text-zinc-100"
                      >
                        <option value="">-- 근로자 선택 --</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.phone}>{w.name} ({w.companyName.split(' ')[0]}) - {w.phone}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const found = workers.find(w => w.phone.trim() === loginWorkerPhone.trim());
                      if (found) {
                        setLoggedInWorker(found);
                        setLoginPhone(loginWorkerPhone.trim());
                        setRole('Worker_Mobile');
                        setIsLoggedIn(true);
                      } else {
                        alert('등록되지 않은 전화번호입니다. B2B 포털에서 먼저 근로자를 등록하시거나, 데모용 빠른 선택 목록에서 선택해 주세요.');
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    근로자 모바일 식권 앱 로그인
                  </button>
                </div>
              )}

              {/* Kitchen KDS Form */}
              {selectedLoginRole === 'Kitchen_KDS' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">주방 선택</label>
                    <select 
                      value={loginKdsStoreName}
                      onChange={(e) => setLoginKdsStoreName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-zinc-100 font-bold"
                    >
                      <option value="양평신내서울해장국">양평신내서울해장국 (한식 주방)</option>
                      <option value="유림푸드 중화식당">유림푸드 중화식당 (중식 주방)</option>
                      <option value="삼계탕&염소탕">삼계탕&염소탕 (보양식 주방)</option>
                      <option value="장어&고기">장어&고기 (고기류 주방)</option>
                      <option value="분식집">분식집 (분식 주방)</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedKdsStore(loginKdsStoreName);
                      setRole('Kitchen_KDS');
                      setIsLoggedIn(true);
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
                  >
                    주방 KDS 모니터 가동
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: SUPER_ADMIN */}
        {/* ---------------------------------------------------- */}
        {role === 'Super_Admin' && (
          <SuperAdminPage theme={theme} />
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: CLIENT_B2B (식권대장 B2B 식수 정산 모듈) */}
        {/* ---------------------------------------------------- */}
        {role === 'Client_B2B' && (
          <B2BPortalPage selectedCompanyId={selectedCompanyId} setSelectedCompanyId={setSelectedCompanyId} />
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW: USER_GUIDE (유림푸드 ERP 시스템 사용설명서) */}
        {/* ---------------------------------------------------- */}
        {role === 'User_Guide' && (
          <UserGuidePage theme={theme} />
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 3: STORE_MANAGER (식당 카운터 태블릿 QR 스캐너) */}
        {/* ---------------------------------------------------- */}
        {role === 'Store_Manager' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Store Configuration Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold">카운터 태블릿 매장 설정:</span>
                <select 
                  value={selectedStore}
                  onChange={(e) => {
                    setSelectedStore(e.target.value);
                    setPosState('idle');
                  }}
                  className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                >
                  <option value="양평신내서울해장국">양평신내서울해장국 (한식)</option>
                  <option value="유림푸드 중화식당">유림푸드 중화식당 (중식)</option>
                  <option value="삼계탕&염소탕">삼계탕&염소탕 (보양식)</option>
                  <option value="장어&고기">장어&고기 (고기류)</option>
                  <option value="분식집">분식집 (분식)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-500">스캔 시 주문할 메뉴:</span>
                <select 
                  value={selectedMenu}
                  onChange={(e) => setSelectedMenu(e.target.value)}
                  className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                >
                  <option value="양평해장국 특">양평해장국 특 (11,000원)</option>
                  <option value="무항생제 영계 삼계탕">무항생제 영계 삼계탕 (16,000원)</option>
                  <option value="국내산 돈육 삼겹살">국내산 돈육 삼겹살 (18,000원)</option>
                  <option value="자장면 곱빼기">자장면 곱빼기 (9,000원)</option>
                </select>
              </div>
            </div>

            {/* Split Screen Layout (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* Left Column: QR Code Camera Scanner Simulator */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    가상 QR 식권 스캐너 카메라 뷰
                  </h3>
                  
                  {/* Camera Simulator box */}
                  <div className="relative aspect-video w-full max-w-md mx-auto bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner group">
                    {/* Glowing corners (scan guide brackets) */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-md"></div>
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-md"></div>
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-md"></div>
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-md"></div>

                    {/* Laser scanning animated line */}
                    <div className="absolute left-6 right-6 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-[bounce_3s_infinite]"></div>

                    {/* Central Icon */}
                    <QrCode className="w-24 h-24 text-zinc-800 group-hover:text-emerald-500/40 transition-colors duration-500" />
                    <span className="text-[10px] text-zinc-500 font-mono absolute bottom-4">SCANNING CAMERA FEED ACTIVE</span>
                  </div>

                  {/* Test Scanner options */}
                  <div className="mt-6 flex flex-col gap-3 max-w-md mx-auto">
                    <label className="text-xs font-bold text-zinc-500">가상 스캔 테스트 근로자 토큰 선택:</label>
                    <select 
                      value={qrInput} 
                      onChange={(e) => setQrInput(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none"
                    >
                      <option value="">-- 결제할 근로자를 선택해 주세요 --</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.qrCode}>
                          {w.name} ({w.companyName}) - 잔여 {w.remainingPoints ? w.remainingPoints.toLocaleString() : 0} P [토큰: {w.qrCode}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 max-w-md mx-auto w-full">
                  <button 
                    onClick={() => {
                      if (!qrInput) {
                        alert('결제할 근로자 식권 토큰을 선택해 주세요.');
                        return;
                      }
                      handleQRCheckout(qrInput);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl py-3.5 text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <QrCode className="w-4.5 h-4.5" />
                    가상 QR 스캔 실행
                  </button>
                </div>
              </div>

              {/* Right Column: Authorization Alert Window (Pop-up alert) */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    실시간 결제 승인 알림창
                  </h3>

                  {/* IDLE STATE */}
                  {posState === 'idle' && (
                    <div className="h-64 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-400 text-center p-6">
                      <Coffee className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-3" />
                      <span className="text-xs font-bold">카운터 식사 결제 대기 중...</span>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-normal">
                        왼쪽 카메라 영역에서 근로자를 고르고 가상 QR 스캔을 실행하면 결제 상태가 표시됩니다.
                      </p>
                    </div>
                  )}

                  {/* SUCCESS STATE (With 3s fade transition) */}
                  {posState === 'success' && (
                    <div 
                      style={{ opacity: posOpacity }}
                      className="h-64 bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500 rounded-2xl p-6 flex flex-col justify-between items-center text-center text-emerald-800 dark:text-emerald-300 transition-opacity duration-500 shadow-lg"
                    >
                      <div className="p-3 bg-emerald-500 rounded-full text-white mt-4">
                        <Check className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-lg font-black tracking-wide">결제 승인 완료</span>
                        <p className="text-sm font-extrabold px-2 leading-relaxed">
                          {posResult.companyName} [{posResult.workerName}] 님 - [{posResult.menuName}] 결제 완료
                        </p>
                      </div>
                      <div className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        잔여 예치금: {posResult.remainingBalance.toLocaleString()}원
                      </div>
                    </div>
                  )}

                  {/* ERROR STATE */}
                  {posState === 'error' && (
                    <div className="h-64 bg-rose-500/10 dark:bg-rose-500/20 border-2 border-rose-500 rounded-2xl p-6 flex flex-col justify-between items-center text-center text-rose-800 dark:text-rose-300 shadow-lg animate-[shake_0.5s_ease-in-out]">
                      <div className="p-3 bg-rose-500 rounded-full text-white mt-4 flex items-center gap-1.5">
                        <Volume2 className="w-8 h-8 animate-bounce" />
                        <AlertTriangle className="w-5 h-5 absolute text-amber-300 ml-6 mt-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-black tracking-wide text-rose-600 dark:text-rose-400">결제 실패 (한도/잔액 부족)</span>
                        <p className="text-xs font-bold px-4 leading-normal mt-1 text-zinc-600 dark:text-zinc-400">
                          {posResult.errorMsg}
                        </p>
                      </div>
                      <button 
                        onClick={() => setPosState('idle')}
                        className="mb-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        확인 및 재시도
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
                    <span>이 매장 실시간 매출 통계:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      오늘 누적 {sales.filter(s => s.storeName === selectedStore).reduce((acc, c) => acc + c.amount, 0).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* '식봄' 벤치마킹 - 식자재 통합 자동 발주 시스템 (SCM) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col gap-4 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    식자재 도매 발주 센터 (식봄 SCM 연동)
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">매장별 필요한 식자재 수량을 조율하여 본사 공동구매 대기열에 합산시킵니다.</p>
                </div>
                
                {/* 상단 매장명 선택 뱃지 노출 */}
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-black px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-900 shadow-sm animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    📍 발주 매장: {selectedStore}
                  </span>
                </div>
              </div>

              {/* 자바스크립트 상태 관리 및 실시간 계산 로직 의사 코드 설명 주석 */}
              {/* 
                * [자바스크립트 상태 관리 로직 의사 코드 - 실시간 복리 계산 및 발주 제어]
                * 
                * // 1. 장바구니 수량 실시간 변경 핸들러
                * function handleCartUpdate(itemId, quantity) {
                *   const updatedQuantity = Math.max(0, quantity);
                *   if (updatedQuantity === 0) {
                *     cartState.remove(itemId);
                *   } else {
                *     cartState.update({ id: itemId, qty: updatedQuantity });
                *   }
                *   // 2. 오늘의 총 발주 예정 금액 실시간 복리/단리 누적 집계 계산
                *   const totalCost = cartState.items.reduce((total, item) => {
                *     return total + (item.price * item.qty);
                *   }, 0);
                *   ui.stickyBottomBar.updateTotalCost(totalCost);
                * }
                * 
                * // 3. 통합 대기열 발주 요청 전송
                * function submitSCMOrders() {
                *   api.scm.sendBulk(cartState.items)
                *     .then(response => {
                *       cartState.clear();
                *       toast.success("공동구매 마스터 대기열 전송 성공!");
                *     });
                * }
                */}

              {/* Grid: Catalog and Cart Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Left 2 Columns: scrollable catalog list */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="text-xs text-zinc-500 font-bold">식자재 품목 리스트 (수량을 입력하거나 조절해 주세요)</div>
                  
                  {/* 스크롤 가능한 카드형 아이템 리스트 뷰 */}
                  <div className="max-h-[380px] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standardCatalog.map(item => {
                      const cartItem = cart.find(c => c.id === item.id);
                      const qtyInCart = cartItem ? cartItem.quantity : 0;

                      return (
                        <div key={item.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* 식자재 이미지 공간 */}
                            <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-300 dark:border-zinc-700/80 flex-shrink-0 relative overflow-hidden group shadow-inner">
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-zinc-400/20 dark:to-black/40"></div>
                              <span className="text-2xl filter drop-shadow z-10">{item.icon}</span>
                              <span className="absolute bottom-0 text-[7px] text-zinc-500 dark:text-zinc-400 font-mono tracking-tighter bg-zinc-300/40 dark:bg-black/40 w-full text-center">IMAGE</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-[9px] font-semibold text-zinc-400 font-mono mb-0.5">{item.category}</span>
                              <span className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100">{item.name}</span>
                              <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                                단가: {item.price.toLocaleString()}원 / {item.unit}
                              </span>
                            </div>
                          </div>

                          {/* 수량 조절 컴포넌트 [ - ] [ 입력창 ] [ + ] 제공 */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 shadow-sm">
                            <button 
                              onClick={() => handleQtyChange(item.id, Math.max(0, qtyInCart - 1))}
                              className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="0"
                              className="w-10 text-center text-xs font-bold font-mono bg-transparent focus:outline-none border-b border-transparent focus:border-zinc-400 dark:text-zinc-100"
                              value={qtyInCart || ''} 
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value;
                                handleQtyChange(item.id, val === '' ? 0 : parseInt(val, 10));
                              }}
                            />
                            <button 
                              onClick={() => handleQtyChange(item.id, qtyInCart + 1)}
                              className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: SCM Shopping Cart Items Display */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                      실시간 발주 희망 내역 ({cart.length}개)
                    </h4>
                    
                    {cart.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-center">
                        <ShoppingBag className="w-7 h-7 text-zinc-300 dark:text-zinc-800 mb-2" />
                        <span className="text-[10px] font-semibold">선택한 품목이 없습니다.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                        {cart.map(cItem => (
                          <div key={cItem.id} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{cItem.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{cItem.name}</span>
                                <span className="text-[9px] text-zinc-400 font-mono">
                                  {cItem.price.toLocaleString()}원 × {cItem.quantity}{cItem.unit}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold font-mono">
                              {(cItem.price * cItem.quantity).toLocaleString()}원
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-4 text-xs">
                    <div className="flex justify-between text-zinc-500">
                      <span>매장 전용 발주 배송처:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{selectedStore} 주방</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Bottom Bar (하단 바) */}
              <div className="sticky bottom-0 z-30 -mx-6 -mb-6 mt-6 bg-zinc-950 border-t border-zinc-800 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-between rounded-b-2xl">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">오늘의 총 발주 예정 금액 (실시간)</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {cart.reduce((sum, c) => sum + c.price * c.quantity, 0).toLocaleString()}원
                  </span>
                </div>
                
                {/* 최우측에 '발주 요청 전송' 버튼 배치 */}
                <button
                  onClick={() => {
                    if (cart.length === 0) {
                      alert('장바구니에 담긴 품목이 없습니다.');
                      return;
                    }
                    addBulkSCMOrders(selectedStore, cart);
                    setCart([]);
                    alert(`공동구매 통합 발주 요청서가 전송되었습니다! 총 ${cart.length}개 품목이 공동 대기열에 등록되었습니다.`);
                  }}
                  disabled={cart.length === 0}
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${
                    cart.length === 0 
                      ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  발주 요청 전송
                </button>
              </div>

            </div>

            {/* Store Specific SCM Order History Tracker */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
              <h3 className="text-xs font-bold mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <Truck className="w-4 h-4 text-blue-600" />
                {selectedStore} 식자재 통합 공동구매 신청 현황 (실시간 추적)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                      <th className="py-2.5 px-3">신청일시</th>
                      <th className="py-2.5 px-3">식자재 품목</th>
                      <th className="py-2.5 px-3 text-right">요청 수량</th>
                      <th className="py-2.5 px-3 text-right">기본 단가 (매입가)</th>
                      <th className="py-2.5 px-3 text-right">네고 합의 단가</th>
                      <th className="py-2.5 px-3 text-center">절감율</th>
                      <th className="py-2.5 px-3 text-center">진행 단계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(order => order.storeName === selectedStore)
                      .map(order => {
                        const isNegotiated = order.discountPercent > 0;
                        return (
                          <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-3 text-xs font-mono">
                              {new Date(order.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-semibold text-xs">{order.itemName}</td>
                            <td className="py-3 px-3 text-right text-xs font-mono font-bold">
                              {order.quantity} {order.unit}
                            </td>
                            <td className="py-3 px-3 text-right text-xs font-mono text-zinc-400 line-through">
                              {(order.originalPrice || order.price).toLocaleString()}원
                            </td>
                            <td className="py-3 px-3 text-right text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                              {(order.negotiatedPrice || order.price).toLocaleString()}원
                            </td>
                            <td className="py-3 px-3 text-center text-xs font-extrabold text-emerald-500 font-mono">
                              {isNegotiated ? `${order.discountPercent}%` : '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                                order.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}>
                                {order.status === 'pending' ? '🥬 공동구매 합산 대기' : order.status === 'approved' ? '🚚 협상가 발송 완료' : '반려됨'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {orders.filter(order => order.storeName === selectedStore).length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-zinc-400 text-sm">
                          이 매장의 최근 식자재 발주 신청 내역이 없습니다. 위의 도매 카탈로그에서 장바구니에 담아 신청해 보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 4: WORKER_MOBILE (현장 근로자용 모바일 식권 앱) */}
        {/* ---------------------------------------------------- */}
        {role === 'Worker_Mobile' && (
          <div className="flex flex-col items-center justify-center p-4 animate-fadeIn">
            {/* Smartphone Container Mockup */}
            <div className="relative w-full max-w-sm bg-zinc-950 p-6 rounded-[3rem] border-[8px] border-zinc-800 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[680px]">
              
              {/* Smartphone Notch / Camera */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-zinc-800 rounded-full flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-900"></span>
              </div>

              {/* Mobile app header */}
              <div className="flex justify-between items-center mt-3 text-white text-xs font-bold font-mono border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>YURIM MOBILE</span>
                </div>
                <span>09:30 AM</span>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col justify-center my-6">
                {!loggedInWorker ? (
                  /* Login Screen */
                  <div className="flex flex-col gap-5 text-center px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-blue-600/10 rounded-full text-blue-500 border border-blue-500/20">
                        <QrCode className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-black text-zinc-100 mt-2">근로자 모바일 식권 로그인</h3>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        B2B 식권대장에 사전 등록된 근로자 본인의 전화번호를 입력하여 인증을 진행해 주세요.
                      </p>
                    </div>

                    <div className="flex flex-col text-left gap-1.5 mt-2">
                      <label className="text-[10px] font-bold text-zinc-400">전화번호 입력</label>
                      <input 
                        type="text" 
                        placeholder="예: 010-1234-5678"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-zinc-600 font-mono"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const cleanPhone = loginPhone.trim();
                        const found = workers.find(w => w.phone === cleanPhone);
                        if (found) {
                          setLoggedInWorker(found);
                          alert(`인증 성공!\n\n${found.name} 님 (${found.companyName}) 환영합니다.`);
                        } else {
                          alert(`등록된 근로자 정보를 찾을 수 없습니다.\n입력하신 번호: ${cleanPhone}\n\n팁: '협력사 식권관리' 화면에서 근로자를 등록할 때 지정한 전화번호를 정확히 입력해 주세요. (예: 010-9999-8888)`);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl py-3.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md mt-2"
                    >
                      식권 앱 로그인
                    </button>
                  </div>
                ) : (
                  /* Logged-In Mobile Screen */
                  <div className="flex flex-col gap-4 text-center px-2">
                    <div className="flex justify-between items-center p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-500 text-[9px] font-bold">근로자 본인 계정</span>
                        <span className="text-sm font-extrabold text-zinc-100">{loggedInWorker.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{loggedInWorker.phone}</span>
                      </div>
                      <div className="text-right flex flex-col gap-0.5">
                        <span className="text-zinc-500 text-[9px] font-bold">소속사</span>
                        <span className="text-xs font-black text-blue-400">{loggedInWorker.companyName}</span>
                      </div>
                    </div>

                    {/* Meal Limit Counter Card */}
                    <div className="p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">오늘 식사 잔여 포인트:</span>
                      <span className="text-sm font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1 rounded-lg">
                        {loggedInWorker.remainingPoints ? loggedInWorker.remainingPoints.toLocaleString() : 0} P
                      </span>
                    </div>

                    {/* SECURE QR CODE COMPONENT */}
                    <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-lg flex flex-col items-center justify-center mt-2 relative">
                      <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2">DYNAMIC ONE-TIME SECURE QR</span>
                      
                      <div className="w-40 h-40 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center justify-center relative p-3">
                        <QrCode className="w-full h-full text-zinc-950" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white px-2 py-1 rounded shadow text-[9px] font-mono font-bold tracking-tight text-blue-600 border border-blue-100">
                            {workerQRValue ? workerQRValue.substring(0, 15) : 'USER_TOKEN'}
                          </div>
                        </div>
                      </div>

                      {/* Timer Bar */}
                      <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(qrCodeTimer / 30) * 100}%` }}></div>
                      </div>

                      {/* Remaining Timer display */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-800 font-extrabold font-mono">
                        <Clock className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>남은시간: </span>
                        <span className="text-blue-600 text-sm">{qrCodeTimer}초</span>
                      </div>
                    </div>

                    {/* Developer QR Scan Assist Shortcut */}
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedStore('양평신내서울해장국');
                          setQrInput(workerQRValue);
                          alert(`[개발 편의 조치]\n보안 QR 토큰 (${workerQRValue})이 Store POS의 결제 스캔창에 즉시 등록되었습니다.\n\n즉시 확인하시려면 상단 'Store POS & Scanner' 탭으로 이동 후 [가상 QR 스캔 실행]을 클릭하세요!`);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold py-2.5 rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                        POS 결제창에 이 QR 토큰 자동 입력
                      </button>
                    </div>

                    {/* Worker's meal history */}
                    <div className="mt-4 text-left">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">나의 금일 식사 이력</span>
                      <div className="max-h-28 overflow-y-auto pr-1 flex flex-col gap-1.5">
                        {sales
                          .filter(s => s.workerName === loggedInWorker.name)
                          .map(s => (
                            <div key={s.id} className="p-2 bg-zinc-900 border border-zinc-900/60 rounded-xl flex items-center justify-between text-[10px] text-zinc-400">
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-300">{s.storeName}</span>
                                <span className="text-[8px] text-zinc-500">{new Date(s.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className="font-mono text-zinc-200 font-bold">{s.amount.toLocaleString()}원 (정산)</span>
                            </div>
                          ))}
                        {sales.filter(s => s.workerName === loggedInWorker.name).length === 0 && (
                          <div className="text-center py-4 text-zinc-600 text-[10px]">
                            오늘 식사 이력이 아직 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile app footer */}
              <div className="mt-4 text-center">
                {loggedInWorker && (
                  <button 
                    onClick={() => {
                      setLoggedInWorker(null);
                      setLoginPhone('');
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 underline"
                  >
                    로그아웃 (계정 해제)
                  </button>
                )}
                <p className="text-[8px] text-zinc-600 mt-2 font-mono">YULIM FOOD MOBILE MEAL TICKETS V1.0</p>
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 5: KITCHEN_KDS (식당 주방 주문 KDS 모니터)       */}
        {/* ---------------------------------------------------- */}
        {role === 'Kitchen_KDS' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Filter Store Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold">주방 KDS 모니터 선택:</span>
                <select 
                  value={selectedKdsStore}
                  onChange={(e) => setSelectedKdsStore(e.target.value)}
                  className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                >
                  <option value="양평신내서울해장국">양평신내서울해장국 (한식)</option>
                  <option value="유림푸드 중화식당">유림푸드 중화식당 (중식)</option>
                  <option value="삼계탕&염소탕">삼계탕&염소탕 (보양식)</option>
                  <option value="장어&고기">장어&고기 (고기류)</option>
                  <option value="분식집">분식집 (분식)</option>
                </select>
              </div>

              <div className="flex items-center">
                <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-black px-3.5 py-1.5 rounded-full border border-rose-200 dark:border-rose-900 shadow-sm flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                  실시간 주문 대기열: {kitchenOrders.filter(o => o.storeName === selectedKdsStore).length}건
                </span>
              </div>
            </div>

            {/* Active kitchen orders grid */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex-1">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
                {selectedKdsStore} 주방 조리 대기 오더 리스트 (신규 주문 최상단)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kitchenOrders
                  .filter(order => order.storeName === selectedKdsStore)
                  .map((order, idx) => {
                    const elapsedMs = Date.now() - new Date(order.timestamp).getTime();
                    const elapsedSec = Math.floor(elapsedMs / 1000);
                    const min = Math.floor(elapsedSec / 60);
                    const sec = elapsedSec % 60;
                    
                    // Warning coloring for delayed cooking (> 3 minutes / 180 seconds)
                    const isDelayed = elapsedSec > 180;

                    return (
                      <div 
                        key={order.id} 
                        className={`p-5 rounded-2xl border flex flex-col justify-between h-52 transition-all duration-300 ${
                          isDelayed 
                            ? 'border-rose-500 bg-rose-500/[0.04] dark:bg-rose-500/[0.02] shadow-[0_0_12px_rgba(239,68,68,0.15)] ring-1 ring-rose-500/20' 
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black font-mono tracking-wide text-zinc-400">
                              NO. {kitchenOrders.length - idx}
                            </span>
                            
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isDelayed ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              {isDelayed ? '⚠️ 장기 지연' : '👨‍🍳 조리중'}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-zinc-800 dark:text-zinc-100 truncate mt-1">
                            {order.menuName}
                          </h4>
                          
                          <div className="mt-2 text-xs text-zinc-500 flex flex-col gap-0.5">
                            <span>수량: <b>{order.quantity || 1}개</b></span>
                            <span>주문자: <b>{order.workerName}</b></span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">경과 시간</span>
                            <span className={`font-mono text-xs font-black ${isDelayed ? 'text-rose-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {min > 0 ? `${min}분 ${sec}초` : `${sec}초`}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              completeKitchenOrder(order.id);
                              alert(`[조리 완료 처리]\n${order.workerName} 님의 [${order.menuName}] 조리 배차가 정상 완료되어 호출 처리되었습니다.`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-[0.98]"
                          >
                            <Check className="w-3.5 h-3.5" />
                            조리 완료
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {kitchenOrders.filter(order => order.storeName === selectedKdsStore).length === 0 && (
                  <div className="col-span-full border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 text-center text-zinc-400 flex flex-col items-center justify-center">
                    <Flame className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-3" />
                    <span className="text-sm font-bold">현재 주문이 비어 있습니다.</span>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-normal">
                      근로자가 식권 앱 또는 POS 카운터에서 식사 승인 시, 실시간으로 주방 모니터(KDS)로 주문이 접수됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ---------------------------------------------------- */}
      {/* GLOBAL FOOTER */}
      {/* ---------------------------------------------------- */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 py-6 px-6 bg-white dark:bg-zinc-950 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>© 2026 유림푸드 F&B 타운 스마트 통합 솔루션. All rights reserved.</p>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          Built with React, Vite, and Tailwind CSS for Yongin Hynix F&B Town ERP
        </p>
      </footer>

      {/* ---------------------------------------------------- */}
      {/* VIRTUAL ACCOUNT MODAL (CLIENT_B2B CHARGE) */}
      {/* ---------------------------------------------------- */}
      {virtualAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setVirtualAccountModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              가상계좌 발급 및 즉시 충전 (Fintech)
            </h4>
            <p className="text-xs text-zinc-500 mb-6">{activeCompany.name} 달장부 계정 전용</p>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2 text-xs mb-4">
              <div className="flex justify-between">
                <span>은행명:</span>
                <span className="font-bold">국민은행 (KB Bank)</span>
              </div>
              <div className="flex justify-between">
                <span>가상계좌번호:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">942-8883-999201</span>
              </div>
              <div className="flex justify-between">
                <span>예금주:</span>
                <span className="font-bold">유림푸드_현대건설</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 block">가상 입금할 금액 (원)</label>
              <input 
                type="number" 
                placeholder="예: 2000000"
                value={chargeInput}
                onChange={(e) => setChargeInput(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setVirtualAccountModalOpen(false)}
                className="flex-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  if (!chargeInput || isNaN(chargeInput)) return;
                  chargeCompanyBalance(activeCompany.id, chargeInput);
                  setChargeInput('');
                  setVirtualAccountModalOpen(false);
                  alert(`가상계좌 입금이 완료되었습니다! ${Number(chargeInput).toLocaleString()}원이 정상 충전되었습니다.`);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow"
              >
                입금 확인 시뮬레이션
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* QR MODAL PREVIEW FOR B2B PORTAL */}
      {/* ---------------------------------------------------- */}
      {qrModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative flex flex-col items-center text-center">
            
            <button 
              onClick={() => setQrModalWorker(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              현장 근로자 식권 QR 코드
            </h4>
            <p className="text-xs text-zinc-500 mb-6">{qrModalWorker.companyName} • {qrModalWorker.name} 님</p>

            <div className="p-4 bg-white rounded-xl border border-zinc-200 flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-zinc-50 border border-zinc-200 rounded flex flex-col items-center justify-center relative p-3">
                <QrCode className="w-full h-full text-zinc-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white px-2 py-1 rounded shadow text-[9px] font-mono font-bold tracking-tight text-blue-600 border border-blue-100">
                    {qrModalWorker.qrCode}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 w-full p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-left text-xs text-zinc-500 font-mono">
              <div className="flex justify-between mb-1">
                <span>잔여 포인트:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{qrModalWorker.remainingPoints ? qrModalWorker.remainingPoints.toLocaleString() : 0} P</span>
              </div>
              <div className="flex justify-between">
                <span>전화번호:</span>
                <span>{qrModalWorker.phone}</span>
              </div>
            </div>

            <button 
              onClick={() => setQrModalWorker(null)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors"
            >
              확인 완료
            </button>

          </div>
        </div>
      )}


    </div>
  );
}
