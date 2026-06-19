import React, { useState, useEffect, useContext } from 'react';
import { 
  MapPin, 
  QrCode, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { ERPContext } from '../context/ERPContext';

export default function WorkerMobilePage({
  loggedInWorker,
  setLoggedInWorker,
  loginPhone,
  setLoginPhone,
  setSelectedStore,
  setQrInput
}) {
  const { workers, sales } = useContext(ERPContext);

  // 로컬 상태 정의 (OTP 타이머 및 QR 값은 이 컴포넌트 내부에서만 상태 관리하도록 최적화)
  const [qrCodeTimer, setQrCodeTimer] = useState(30);
  const [workerQRValue, setWorkerQRValue] = useState('');

  // 30초마다 OTP 용 QR 값을 갱신하는 타이머 Logic
  useEffect(() => {
    if (!loggedInWorker) {
      setWorkerQRValue('');
      return;
    }

    // 초기 난수 토큰 생성
    setWorkerQRValue(loggedInWorker.qrCode + "_" + Math.floor(100 + Math.random() * 900) + "_" + Date.now());
    setQrCodeTimer(30);

    const interval = setInterval(() => {
      setQrCodeTimer(prev => {
        if (prev <= 1) {
          // 30초 만료 시 새로운 난수와 타임스탬프를 붙여 OTP QR 값 갱신
          setWorkerQRValue(loggedInWorker.qrCode + "_" + Math.floor(100 + Math.random() * 900) + "_" + Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loggedInWorker]);

  return (
    <div className="flex flex-col items-center justify-center p-4 animate-fadeIn">
      {/* Smartphone Container Mockup (움직이는 부유 애니메이션 및 광원 반사 레이어 탑재) */}
      <div className="relative w-full max-w-sm bg-zinc-950 p-6 rounded-[3.2rem] border-[10px] border-zinc-800 dark:border-zinc-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col justify-between min-h-[690px] animate-float-phone">
        
        {/* 스마트폰 내부 액정 유리 빛 반사 광원 글래스 데코레이션 */}
        <div className="absolute top-0 left-0 w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent -translate-x-1/2 -translate-y-1/2 rotate-[35deg] pointer-events-none z-20"></div>

        {/* Smartphone Notch / Camera */}
        <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-36 h-5 bg-zinc-800 rounded-full flex items-center justify-center z-30 border border-zinc-750/30">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-950"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 ml-2"></span>
        </div>

        {/* Mobile app header */}
        <div className="flex justify-between items-center mt-4 text-white text-xs font-bold font-mono border-b border-zinc-900 pb-3.5 z-10">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="tracking-wider">YURIM MOBILE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LTE</span>
            <span>09:30 AM</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center my-6 z-10">
          {!loggedInWorker ? (
            /* 로그인 화면 */
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
                    alert(`등록된 근로자 정보를 찾을 수 없습니다.\n입력하신 번호: ${cleanPhone}\n\n팁: B2B Portal (식권대장) 화면에서 근로자를 등록할 때 지정한 전화번호를 정확히 입력해 주세요. (예: 010-9999-8888)`);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl py-3.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md mt-2"
              >
                식권 앱 로그인
              </button>
            </div>
          ) : (
            /* 로그인 완료 및 OTP QR 화면 */
            <div className="flex flex-col gap-4 text-center px-2">
              <div className="flex justify-between items-center p-3.5 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-left shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-zinc-500 text-[9px] font-bold">근로자 본인 계정</span>
                  <span className="text-sm font-extrabold text-zinc-100">{loggedInWorker.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{loggedInWorker.phone}</span>
                </div>
                <div className="text-right flex flex-col gap-0.5">
                  <span className="text-zinc-500 text-[9px] font-bold">소속사</span>
                  <span className="text-xs font-black text-blue-400">{loggedInWorker.companyName.split(' ')[0]}</span>
                </div>
              </div>

              {/* 포인트 현황 */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl flex items-center justify-between shadow-inner">
                <span className="text-xs font-bold text-zinc-400">오늘 식사 잔여 포인트:</span>
                <span className="text-sm font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1 rounded-lg">
                  {loggedInWorker.remainingPoints ? loggedInWorker.remainingPoints.toLocaleString() : 0} P
                </span>
              </div>

              {/* 실시간 OTP QR 코드 박스 */}
              <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-lg flex flex-col items-center justify-center mt-2 relative">
                <span className="text-[8px] font-black text-zinc-450 uppercase tracking-wider mb-2 text-zinc-500">DYNAMIC ONE-TIME SECURE QR</span>
                
                <div className="w-40 h-40 bg-zinc-50 border border-zinc-150 rounded-2xl flex flex-col items-center justify-center relative p-3 shadow-inner">
                  <QrCode className="w-full h-full text-zinc-950" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white px-2 py-1 rounded shadow text-[9px] font-mono font-bold tracking-tight text-blue-600 border border-blue-100">
                      {workerQRValue ? workerQRValue.substring(0, 15) : 'USER_TOKEN'}
                    </div>
                  </div>
                </div>

                {/* 타이머 바 (부드러운 linear 전환 및 소진 시 붉은 경고) */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-4">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${qrCodeTimer <= 5 ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                    style={{ width: `${(qrCodeTimer / 30) * 100}%` }}
                  ></div>
                </div>

                {/* 타이머 표시 */}
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-800 font-extrabold font-mono">
                  <Clock className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>남은시간: </span>
                  <span className={`text-sm ${qrCodeTimer <= 5 ? 'text-rose-600 animate-pulse' : 'text-blue-600'}`}>{qrCodeTimer}초</span>
                </div>
              </div>

              {/* 개발/테스트 편의를 위한 POS 자동 입력 단축키 */}
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

              {/* 근로자 본인 식사이력 */}
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
        <div className="mt-4 text-center z-10">
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
  );
}
