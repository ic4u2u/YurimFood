import React, { useContext, useState, useEffect } from 'react';
import { Coffee, Flame, Check } from 'lucide-react';
import { ERPContext } from '../context/ERPContext';

export default function KitchenKDSPage({ selectedKdsStore, setSelectedKdsStore }) {
  const { kitchenOrders, completeKitchenOrder } = useContext(ERPContext);

  // 실시간 경과 시간 계산을 위한 초(Second) 단위 갱신 타이머 가동
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Filter Store Bar */}
      <div className="glass-premium p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-md neon-shadow-blue flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-bold text-zinc-805 dark:text-zinc-200">주방 KDS 모니터 선택:</span>
          <select 
            value={selectedKdsStore}
            onChange={(e) => setSelectedKdsStore(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
          >
            <option value="양평신내서울해장국">양평신내서울해장국 (한식)</option>
            <option value="유림푸드 중화식당">유림푸드 중화식당 (중식)</option>
            <option value="삼계탕&염소탕">삼계탕&염소탕 (보양식)</option>
            <option value="장어&고기">장어&고기 (고기류)</option>
            <option value="분식집">분식집 (분식)</option>
          </select>
        </div>

        <div className="flex items-center">
          <span className="bg-rose-100 dark:bg-rose-955/40 text-rose-800 dark:text-rose-305 text-xs font-black px-4.5 py-2 rounded-full border border-rose-250 dark:border-rose-900/60 shadow-sm flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-600 dark:bg-rose-455"></span>
            실시간 주문 대기열: {kitchenOrders.filter(o => o.storeName === selectedKdsStore).length}건
          </span>
        </div>
      </div>

      {/* Active kitchen orders grid */}
      <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg flex-1 transition-all duration-305">
        <h3 className="text-sm font-bold mb-6 flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 text-zinc-850 dark:text-zinc-200">
          <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
          {selectedKdsStore} 주방 조리 대기 오더 리스트 (신규 주문 최상단)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kitchenOrders
            .filter(order => order.storeName === selectedKdsStore)
            .map((order, idx) => {
              const elapsedMs = now - new Date(order.timestamp).getTime();
              const elapsedSec = Math.floor(elapsedMs / 1000);
              const min = Math.floor(elapsedSec / 60);
              const sec = elapsedSec % 60;
              const isDelayed = min >= 3; // 3분 초과 시 지연 경고 활성화

              return (
                <div 
                  key={order.id} 
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-52 shadow-sm ${
                    isDelayed 
                      ? 'border-rose-500/80 bg-rose-500/[0.05] dark:bg-rose-950/20 neon-shadow-rose animate-pulse-red' 
                      : 'border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-900/50 hover:translate-y-[-2px] hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black font-mono tracking-wide text-zinc-400 dark:text-zinc-550">
                        NO. {kitchenOrders.filter(o => o.storeName === selectedKdsStore).length - idx}
                      </span>
                      
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm ${
                        isDelayed ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400'
                      }`}>
                        {isDelayed ? '⚠️ 장기 지연' : '👨‍🍳 조리중'}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-zinc-850 dark:text-zinc-100 truncate mt-1">
                      {order.menuName}
                    </h4>
                    
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-450 flex flex-col gap-0.5">
                      <span>수량: <b className="text-zinc-800 dark:text-zinc-200">{order.quantity || 1}개</b></span>
                      <span>주문자: <b className="text-zinc-850 dark:text-zinc-200">{order.workerName}</b></span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider font-bold">경과 시간</span>
                      <span className={`font-mono text-xs font-black ${isDelayed ? 'text-rose-600 dark:text-rose-455' : 'text-zinc-705 dark:text-zinc-300'}`}>
                        {min > 0 ? `${min}분 ${sec}초` : `${sec}초`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        completeKitchenOrder(order.id);
                        alert(`[조리 완료 처리]\n${order.workerName} 님의 [${order.menuName}] 조리 배차가 정상 완료되어 호출 처리되었습니다.`);
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 flex items-center gap-1 transform active:scale-95 duration-200"
                    >
                      <Check className="w-3.5 h-3.5" />
                      조리 완료
                    </button>
                  </div>
                </div>
              );
            })}

          {kitchenOrders.filter(order => order.storeName === selectedKdsStore).length === 0 && (
            <div className="col-span-full border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 text-center text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center bg-zinc-50/10 dark:bg-zinc-950/10">
              <Flame className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-3" />
              <span className="text-sm font-bold text-zinc-650 dark:text-zinc-400">현재 주문이 비어 있습니다.</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-550 mt-2 max-w-xs leading-normal">
                근로자가 식권 앱 또는 POS 카운터에서 식사 승인 시, 실시간으로 주방 모니터(KDS)로 주문이 접수됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
