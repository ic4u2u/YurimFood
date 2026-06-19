import React, { useState, useContext, useRef } from 'react';
import { 
  Coffee, 
  QrCode, 
  Activity, 
  Check, 
  AlertTriangle, 
  Volume2, 
  ShoppingBag, 
  Truck 
} from 'lucide-react';
import { ERPContext, standardCatalog } from '../context/ERPContext';

export default function StorePOSPage({
  selectedStore,
  setSelectedStore,
  selectedMenu,
  setSelectedMenu,
  qrInput,
  setQrInput,
  posState,
  setPosState
}) {
  const {
    workers,
    sales,
    orders,
    addBulkSCMOrders,
    scanQRAndPay
  } = useContext(ERPContext);

  // 로컬 상태 및 Ref 정의
  const [posResult, setPosResult] = useState({
    workerName: '',
    companyName: '',
    menuName: '',
    remainingBalance: 0,
    errorMsg: ''
  });
  const [posOpacity, setPosOpacity] = useState(1);
  const [cart, setCart] = useState([]);

  const fadeTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // 메뉴판 가격 매핑
  const menuPriceMap = {
    '양평해장국 특': 11000,
    '무항생제 영계 삼계탕': 16000,
    '국내산 돈육 삼겹살': 18000,
    '자장면 곱빼기': 9000
  };
  const price = menuPriceMap[selectedMenu] || 9000;

  // TTS 음성 안내 지원 함수
  const speakTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // QR 결제 처리 함수
  const handleQRCheckout = async (codeToScan) => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    
    setPosOpacity(1);

    let finalCode = codeToScan;
    if (codeToScan && codeToScan.split('_').length <= 4) {
      finalCode = `${codeToScan}_999_${Date.now()}`;
    }

    const res = await scanQRAndPay(finalCode, selectedStore, price, selectedMenu);

    if (res.success) {
      setPosState('success');
      setPosResult({
        workerName: res.workerName,
        companyName: res.companyName,
        menuName: res.menuName,
        remainingBalance: res.remainingBalance,
        errorMsg: ''
      });
      setQrInput('');

      speakTTS("결제가 완료되었습니다. 맛있게 드십시오!");

      fadeTimeoutRef.current = setTimeout(() => {
        setPosOpacity(0);
      }, 2500);

      hideTimeoutRef.current = setTimeout(() => {
        setPosState('idle');
      }, 3000);

    } else {
      setPosState('error');
      setPosResult({
        workerName: '',
        companyName: '',
        menuName: '',
        remainingBalance: 0,
        errorMsg: res.message
      });
      
      // B2B 요일/시간대 및 기타 오류 음성 피드백 분기 처리
      let ttsMsg = res.message;
      if (res.message.includes('요일')) {
        ttsMsg = "허용된 식사 요일이 아닙니다.";
      } else if (res.message.includes('시간대') || res.message.includes('시간')) {
        ttsMsg = "허용된 식사 시간대가 아닙니다.";
      } else if (res.message.includes('포인트') && res.message.includes('부족')) {
        ttsMsg = "잔여 포인트가 부족합니다.";
      } else if (res.message.includes('예치 자금') || res.message.includes('예치')) {
        ttsMsg = "소속사의 예치 자금이 부족합니다.";
      } else if (res.message.includes('만료')) {
        ttsMsg = "만료된 QR 식권입니다.";
      }
      
      speakTTS(ttsMsg);
    }
  };

  // 장바구니 수량 실시간 변경 핸들러
  const handleQtyChange = (itemId, val) => {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      num = 0;
    }
    const item = standardCatalog.find(c => c.id === itemId);
    if (!item) return;

    setCart(prev => {
      if (num === 0) {
        return prev.filter(c => c.id !== itemId);
      }
      const existing = prev.find(c => c.id === itemId);
      if (existing) {
        return prev.map(c => c.id === itemId ? { ...c, quantity: num } : c);
      } else {
        return [...prev, { ...item, quantity: num }];
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* Store Configuration Bar */}
      <div className="glass-premium p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-md neon-shadow-blue flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-bold text-zinc-850 dark:text-zinc-200">카운터 태블릿 매장 설정:</span>
          <select 
            value={selectedStore}
            onChange={(e) => {
              setSelectedStore(e.target.value);
              setPosState('idle');
            }}
            className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
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
            className="bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
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
        <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg flex flex-col justify-between transition-all hover:shadow-xl hover:translate-y-[-2px] duration-300">
          <div>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-zinc-850 dark:text-zinc-200">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              가상 QR 식권 스캐너 카메라 뷰
            </h3>
            
            {/* Camera Simulator box */}
            <div className="relative aspect-video w-full max-w-md mx-auto bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl group">
              <div className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md transition-all group-hover:border-emerald-300 group-hover:scale-105"></div>
              <div className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md transition-all group-hover:border-emerald-300 group-hover:scale-105"></div>
              <div className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md transition-all group-hover:border-emerald-300 group-hover:scale-105"></div>
              <div className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md transition-all group-hover:border-emerald-300 group-hover:scale-105"></div>

              <div className="absolute left-6 right-6 h-[3px] bg-emerald-400 shadow-[0_0_15px_#34d399,0_0_5px_#10b981] rounded-full animate-scan z-10"></div>

              <QrCode className="w-24 h-24 text-zinc-800 group-hover:text-emerald-400/30 transition-colors duration-700 ease-out" />
              <span className="text-[9px] text-emerald-400/80 font-mono absolute bottom-4 tracking-widest animate-pulse">SCANNING CAMERA FEED ACTIVE</span>
            </div>

            {/* Test Scanner options */}
            <div className="mt-6 flex flex-col gap-3 max-w-md mx-auto">
              <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400">가상 스캔 테스트 근로자 토큰 선택:</label>
              <select 
                value={qrInput} 
                onChange={(e) => setQrInput(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-3 text-xs font-mono text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              >
                <option value="">-- 결제할 근로자를 선택해 주세요 --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.qrCode}>
                    {w.name} ({w.companyName}) - 잔여 {w.remainingPoints ? w.remainingPoints.toLocaleString() : 0} P
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold rounded-xl py-4 text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/20 active:scale-98"
            >
              <QrCode className="w-4.5 h-4.5" />
              가상 QR 스캔 실행
            </button>
          </div>
        </div>

        {/* Right Column: Authorization Alert Window (Pop-up alert) */}
        <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg flex flex-col justify-between transition-all hover:shadow-xl hover:translate-y-[-2px] duration-300">
          <div>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-zinc-850 dark:text-zinc-200">
              <Activity className="w-5 h-5 text-emerald-500" />
              실시간 결제 승인 알림창
            </h3>

            {/* IDLE STATE */}
            {posState === 'idle' && (
              <div className="h-64 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-400 text-center p-6 bg-zinc-50/30 dark:bg-zinc-950/20">
                <Coffee className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-3 animate-pulse" />
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">카운터 식사 결제 대기 중...</span>
                <p className="text-[10px] text-zinc-400 mt-1.5 max-w-xs leading-normal">
                  왼쪽 카메라 영역에서 근로자를 고르고 가상 QR 스캔을 실행하면 결제 상태가 표시됩니다.
                </p>
              </div>
            )}

            {/* SUCCESS STATE */}
            {posState === 'success' && (
              <div 
                style={{ opacity: posOpacity }}
                className="h-64 glass-premium dark:glass-premium border-2 border-emerald-500/80 neon-shadow-emerald rounded-2xl p-6 flex flex-col justify-between items-center text-center text-zinc-900 dark:text-emerald-300 transition-all duration-500 shadow-xl animate-slide-down-fade transform hover:scale-[1.02]"
              >
                <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full text-white mt-4 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse">
                  <Check className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-lg font-black tracking-wide text-emerald-600 dark:text-emerald-400">결제 승인 완료</span>
                  <p className="text-sm font-extrabold px-2 leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {posResult.companyName} <span className="text-emerald-600 dark:text-emerald-400">[{posResult.workerName}]</span> 님 <br/> [{posResult.menuName}] 결제 완료
                  </p>
                </div>
                <div className="mb-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50 shadow-inner">
                  잔여 예치금: {posResult.remainingBalance.toLocaleString()}원
                </div>
              </div>
            )}

            {/* ERROR STATE */}
            {posState === 'error' && (
              <div className="h-64 glass-premium dark:glass-premium border-2 border-rose-500/80 neon-shadow-rose rounded-2xl p-6 flex flex-col justify-between items-center text-center text-zinc-900 dark:text-rose-300 shadow-xl animate-shake transform hover:scale-[1.02]">
                <div className="p-3 bg-gradient-to-tr from-rose-600 to-pink-500 rounded-full text-white mt-4 flex items-center justify-center relative shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                  <Volume2 className="w-8 h-8 animate-pulse" />
                  <AlertTriangle className="w-5 h-5 absolute text-amber-300 -right-1 -top-1" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-black tracking-wide text-rose-600 dark:text-rose-400">
                    {posResult.errorMsg.includes('요일') ? '결제 실패 (요일 제한 정책)' :
                     posResult.errorMsg.includes('시간') ? '결제 실패 (시간 제한 정책)' :
                     posResult.errorMsg.includes('만료') ? '결제 실패 (만료된 QR)' :
                     posResult.errorMsg.includes('포인트') ? '결제 실패 (개인 포인트 부족)' :
                     posResult.errorMsg.includes('예치') ? '결제 실패 (소속사 예치금 부족)' :
                     '결제 실패 (결제 반려)'}
                  </span>
                  <p className="text-xs font-bold px-4 leading-normal mt-1 text-zinc-500 dark:text-zinc-350">
                    {posResult.errorMsg}
                  </p>
                </div>
                <button 
                  onClick={() => setPosState('idle')}
                  className="mb-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md transform active:scale-95"
                >
                  확인 및 재시도
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-xs text-zinc-550 dark:text-zinc-405 font-semibold">
              <span>이 매장 실시간 매출 통계:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                오늘 누적 {sales.filter(s => s.storeName === selectedStore).reduce((acc, c) => acc + c.amount, 0).toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SCM 식자재 통합 자동 발주 시스템 */}
      <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg flex flex-col gap-4 relative transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 gap-2">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-2 text-zinc-850 dark:text-zinc-200">
              <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              식자재 도매 발주 센터 (식봄 SCM 연동)
            </h3>
            <p className="text-[10px] text-zinc-450 mt-1">매장별 필요한 식자재 수량을 조율하여 본사 공동구매 대기열에 합산시킵니다.</p>
          </div>
          
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-955/40 text-blue-800 dark:text-blue-300 text-xs font-black px-4.5 py-2 rounded-full border border-blue-250 dark:border-blue-900/60 shadow-sm animate-pulse">
              <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
              📍 발주 매장: {selectedStore}
            </span>
          </div>
        </div>

        {/* Grid: Catalog and Cart Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Left 2 Columns: scrollable catalog list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="text-xs text-zinc-500 font-bold dark:text-zinc-400">식자재 품목 리스트 (수량을 입력하거나 조절해 주세요)</div>
            
            <div className="max-h-[380px] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {standardCatalog.map(item => {
                const cartItem = cart.find(c => c.id === item.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;

                return (
                  <div key={item.id} className="p-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl flex items-center justify-between hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-900/40 transition-all duration-300 group shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 flex-shrink-0 relative overflow-hidden shadow-inner transition-transform group-hover:scale-105 duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-zinc-400/10 dark:to-black/30"></div>
                        <span className="text-2xl filter drop-shadow z-10">{item.icon}</span>
                        <span className="absolute bottom-0 text-[7px] text-zinc-400 dark:text-zinc-500 font-mono tracking-tighter bg-zinc-200/50 dark:bg-black/50 w-full text-center">IMAGE</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 font-mono mb-0.5">{item.category}</span>
                        <span className="font-extrabold text-xs text-zinc-855 dark:text-zinc-100">{item.name}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                          {item.price.toLocaleString()}원 / {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
                      <button 
                        onClick={() => handleQtyChange(item.id, Math.max(0, qtyInCart - 1))}
                        className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center font-bold text-xs hover:bg-zinc-150 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 transition-colors"
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
                        className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-855 flex items-center justify-center font-bold text-xs hover:bg-zinc-150 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 transition-colors"
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
          <div className="bg-zinc-50/50 dark:bg-zinc-950/45 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col justify-between shadow-inner">
            <div>
              <h4 className="text-xs font-bold mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center gap-1.5 text-zinc-750 dark:text-zinc-200">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                실시간 발주 희망 내역 ({cart.length}개)
              </h4>
              
              {cart.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-zinc-400 text-center">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-3 shadow-inner">
                    <ShoppingBag className="w-7 h-7 text-zinc-350 dark:text-zinc-700" />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">선택한 품목이 없습니다.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map(cItem => (
                    <div key={cItem.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl shadow-sm hover:border-zinc-300/80 dark:hover:border-zinc-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cItem.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{cItem.name}</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono">
                            {cItem.price.toLocaleString()}원 × {cItem.quantity}{cItem.unit}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold font-mono text-zinc-800 dark:text-zinc-200">
                        {(cItem.price * cItem.quantity).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-3 mt-4 text-xs">
              <div className="flex justify-between text-zinc-555">
                <span className="text-[10px] font-bold text-zinc-500">매장 전용 발주 배송처:</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200">{selectedStore} 주방</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 z-35 -mx-6 -mb-6 mt-6 bg-zinc-950/90 border-t border-zinc-800/60 p-4.5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-between rounded-b-3xl">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-455 font-bold uppercase tracking-wider">오늘의 총 발주 예정 금액 (실시간)</span>
            <span className="text-lg font-black font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              {cart.reduce((sum, c) => sum + c.price * c.quantity, 0).toLocaleString()}원
            </span>
          </div>
          
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
            className={`px-6 py-3 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 transform active:scale-95 ${
              cart.length === 0 
                ? 'bg-zinc-900 text-zinc-650 cursor-not-allowed border border-zinc-800/60' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-emerald-500/20'
            }`}
          >
            <Truck className="w-4 h-4" />
            발주 요청 전송
          </button>
        </div>

      </div>

      {/* SCM 신청 현황 */}
      <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg transition-all duration-300 hover:shadow-xl">
        <h3 className="text-xs font-bold mb-4 flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 text-zinc-850 dark:text-zinc-200">
          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {selectedStore} 식자재 통합 공동구매 신청 현황 (실시간 추적)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-855 text-zinc-550 dark:text-zinc-400 bg-zinc-50/40 dark:bg-zinc-950/40 font-bold">
                <th className="py-3 px-3 rounded-tl-xl">신청일시</th>
                <th className="py-3 px-3">식자재 품목</th>
                <th className="py-3 px-3 text-right">요청 수량</th>
                <th className="py-3 px-3 text-right">기본 단가 (매입가)</th>
                <th className="py-3 px-3 text-right">네고 합의 단가</th>
                <th className="py-3 px-3 text-center">절감율</th>
                <th className="py-3 px-3 text-center rounded-tr-xl">진행 단계</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(order => order.storeName === selectedStore)
                .map(order => {
                  const isNegotiated = order.discountPercent > 0;
                  return (
                    <tr key={order.id} className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 transition-all duration-200">
                      <td className="py-3.5 px-3 text-xs font-mono text-zinc-650 dark:text-zinc-450">
                        {new Date(order.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-xs text-zinc-850 dark:text-zinc-200">{order.itemName}</td>
                      <td className="py-3.5 px-3 text-right text-xs font-mono font-bold text-zinc-850 dark:text-zinc-200">
                        {order.quantity} {order.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right text-xs font-mono text-zinc-400 dark:text-zinc-550 line-through">
                        {(order.originalPrice || order.price).toLocaleString()}원
                      </td>
                      <td className="py-3.5 px-3 text-right text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                        {(order.negotiatedPrice || order.price).toLocaleString()}원
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs font-black text-emerald-500 font-mono">
                        {isNegotiated ? `${order.discountPercent}%` : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${
                          order.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50' :
                          order.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50'
                        }`}>
                          {order.status === 'pending' ? '🥬 공동구매 합산 대기' : order.status === 'approved' ? '🚚 협상가 발송 완료' : '반려됨'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {orders.filter(order => order.storeName === selectedStore).length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs font-bold bg-zinc-50/10 dark:bg-zinc-950/10 rounded-b-xl">
                    이 매장의 최근 식자재 발주 신청 내역이 없습니다. 위의 도매 카탈로그에서 장바구니에 담아 신청해 보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
