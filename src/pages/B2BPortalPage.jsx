import React, { useState, useContext } from 'react';
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  QrCode, 
  Clock, 
  Download,
  Plus,
  X,
  TrendingUp,
  Sliders,
  PieChart
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { ERPContext } from '../context/ERPContext';

export default function B2BPortalPage({ selectedCompanyId, setSelectedCompanyId }) {
  const {
    companies,
    workers,
    sales,
    addWorkerToken,
    chargeCompanyBalance,
    updateCompanyPolicy,
    addCompany,
    deleteCompany
  } = useContext(ERPContext);

  // 로컬 상태 정의
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerGrade, setNewWorkerGrade] = useState('일반'); // 일반, 반장, 관리자
  const [virtualAccountModalOpen, setVirtualAccountModalOpen] = useState(false);
  const [chargeInput, setChargeInput] = useState('');
  const [qrModalWorker, setQrModalWorker] = useState(null);

  // 협력업체 신규 추가 입력값
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyBusinessNum, setNewCompanyBusinessNum] = useState('');
  const [newCompanyBalance, setNewCompanyBalance] = useState('1000000');

  // 현재 선택된 협력업체 정보 계산
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0] || {
    id: 'c1',
    name: '-',
    balance: 0,
    businessNumber: '-',
    allowedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    allowedTimes: {
      breakfast: { active: true, start: '06:00', end: '09:00' },
      lunch: { active: true, start: '11:00', end: '14:00' },
      dinner: { active: true, start: '17:00', end: '20:00' }
    }
  };

  const allowedDays = activeCompany.allowedDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const allowedTimes = activeCompany.allowedTimes || {
    breakfast: { active: true, start: '06:00', end: '09:00' },
    lunch: { active: true, start: '11:00', end: '14:00' },
    dinner: { active: true, start: '17:00', end: '20:00' }
  };

  // 등급별 자동 포인트 세팅
  const gradePointsMap = {
    '일반': 15000,
    '반장': 25000,
    '관리자': 50000
  };

  // 요일 토글 핸들러
  const handleDayToggle = (day) => {
    let nextDays = [...allowedDays];
    if (nextDays.includes(day)) {
      nextDays = nextDays.filter(d => d !== day);
    } else {
      nextDays.push(day);
    }
    updateCompanyPolicy(activeCompany.id, nextDays, allowedTimes);
  };

  // 시간 제한 정책 변경 핸들러
  const handleTimeChange = (meal, field, value) => {
    const nextTimes = {
      ...allowedTimes,
      [meal]: {
        ...allowedTimes[meal],
        [field]: value
      }
    };
    updateCompanyPolicy(activeCompany.id, allowedDays, nextTimes);
  };

  // 엑셀 내보내기 (CSV) 함수
  const handleExportCSV = () => {
    if (!activeCompany) return;
    const companySales = sales.filter(sale => sale.companyName === activeCompany.name);
    if (companySales.length === 0) {
      alert('정산 내역이 존재하지 않습니다.');
      return;
    }
    
    let csvContent = "\uFEFF"; // 엑셀에서 한글 깨짐 방지를 위한 UTF-8 BOM
    csvContent += "사용일시,이름,직급,이용 매장,메뉴,결제 금액(원)\n";
    
    companySales.forEach(sale => {
      const date = new Date(sale.timestamp).toLocaleString().replace(/,/g, '');
      const workerObj = workers.find(w => w.name === sale.workerName) || {};
      const gradeText = workerObj.grade || '일반';
      const row = `"${date}","${sale.workerName}","${gradeText}","${sale.storeName}","${sale.menuName || '일반 식사'}",${sale.amount}\n`;
      csvContent += row;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `유림푸드_정산내역_${activeCompany.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. 매장별 식수 이용 비중 ECharts 옵션 생성
  const getStoreRatioOption = () => {
    const companySales = sales.filter(sale => sale.companyName === activeCompany.name);
    
    const storeCount = {};
    companySales.forEach(s => {
      storeCount[s.storeName] = (storeCount[s.storeName] || 0) + 1;
    });

    const data = Object.keys(storeCount).map(store => ({
      name: store.replace('유림푸드 ', '').replace('양평신내서울', ''),
      value: storeCount[store]
    }));

    if (data.length === 0) {
      return {
        backgroundColor: 'transparent',
        title: {
          text: '식수 기록 없음',
          left: 'center',
          top: 'center',
          textStyle: { color: '#71717a', fontSize: 11 }
        }
      };
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '<div class="p-1 text-xs text-zinc-100 bg-zinc-950 rounded border border-zinc-800"><b>{b}</b>: {c}건 ({d}%)</div>'
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#18181b',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            color: '#a1a1aa',
            fontSize: 9
          },
          data: data
        }
      ]
    };
  };

  // 2. 시간대별 식수 트렌드 ECharts 옵션 생성
  const getHourTrendOption = () => {
    const companySales = sales.filter(sale => sale.companyName === activeCompany.name);
    
    // 시간대 분류 (06~09 조식, 11~14 중식, 17~20 석식, 기타)
    const mealCount = { '조식': 0, '중식': 0, '석식': 0, '기타': 0 };
    
    companySales.forEach(s => {
      const hour = new Date(s.timestamp).getHours();
      if (hour >= 6 && hour < 9) mealCount['조식']++;
      else if (hour >= 11 && hour < 14) mealCount['중식']++;
      else if (hour >= 17 && hour < 20) mealCount['석식']++;
      else mealCount['기타']++;
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: '<div class="p-1 text-xs text-zinc-100 bg-zinc-955 rounded border border-zinc-800"><b>{b}</b>: {c}건</div>'
      },
      grid: { left: '8%', right: '8%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['조식(06~09)', '중식(11~14)', '석식(17~20)', '기타 시간'],
        axisLabel: { color: '#a1a1aa', fontSize: 9 }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#a1a1aa', fontSize: 9 },
        splitLine: { lineStyle: { color: '#27272a' } }
      },
      series: [
        {
          type: 'bar',
          data: [mealCount['조식'], mealCount['중식'], mealCount['석식'], mealCount['기타']],
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '40%'
        }
      ]
    };
  };

  const daysLabelMap = { 'Mon': '월', 'Tue': '화', 'Wed': '수', 'Thu': '목', 'Fri': '금', 'Sat': '토', 'Sun': '일' };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* Top Section: 예치금 카드 & 협력업체 신규 추가 & 신규 인부 등록 폼 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 선불 예치금 잔액 카드 & 충전 */}
        <div className="lg:col-span-1 glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-550 dark:text-zinc-400">협력업체 식권 관리 계정</span>
              
              {/* 협력사 전환 드롭다운 및 삭제 버튼 */}
              <div className="flex items-center gap-1.5">
                <select 
                  value={selectedCompanyId} 
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (companies.length <= 1) {
                      alert('최소 하나의 협력업체는 유지되어야 합니다.');
                      return;
                    }
                    if (window.confirm(`정말로 B2B 협력업체 [${activeCompany.name}]을(를) 삭제하시겠습니까?\n소속 근로자 (${workers.filter(w => w.companyId === activeCompany.id).length}명) 정보도 함께 완전히 삭제됩니다.`)) {
                      deleteCompany(activeCompany.id);
                      const remaining = companies.filter(c => c.id !== activeCompany.id);
                      if (remaining.length > 0) {
                        setSelectedCompanyId(remaining[0].id);
                      }
                      alert('협력업체가 정상적으로 삭제되었습니다.');
                    }
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-2 py-1.5 rounded-xl text-[10px] transition-all active:scale-95 shadow-sm"
                  title="현재 선택된 협력업체 계정 삭제"
                >
                  삭제
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mb-1 font-bold">현재 선불 예치금 잔액</span>
              
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-55 tracking-tight">
                  {activeCompany.balance.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">원</span>
                
                {/* 잔액이 100만원 이하일 때 깜빡이는 빨간 경고창 */}
                {activeCompany.balance <= 1000000 && (
                  <span className="px-2.5 py-1.5 rounded-lg bg-rose-500 text-white font-extrabold text-[10px] tracking-wide animate-pulse flex items-center gap-1 shadow-sm mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    경고: 잔액 부족!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => setVirtualAccountModalOpen(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold rounded-xl py-3.5 text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/20 active:scale-98"
            >
              <DollarSign className="w-4 h-4" />
              예치금 즉시 충전 (가상계좌 발급)
            </button>
          </div>
        </div>

        {/* B2B 협력업체 추가 등록 폼 */}
        <div className="lg:col-span-1 glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg transition-all duration-300 hover:shadow-xl flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
              <h3 className="text-xs font-extrabold flex items-center gap-1.5 text-zinc-850 dark:text-zinc-200">
                <Plus className="w-4 h-4 text-emerald-500" />
                협력업체 신규 추가
              </h3>
              <span className="text-[9px] text-zinc-450 font-mono font-bold">New Partner</span>
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">B2B 업체명</label>
                <input 
                  type="text" 
                  placeholder="예: 현대건설 (주)"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">사업자등록번호</label>
                <input 
                  type="text" 
                  placeholder="예: 123-45-67890"
                  value={newCompanyBusinessNum}
                  onChange={(e) => setNewCompanyBusinessNum(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">초기 예치금 (원)</label>
                <input 
                  type="number" 
                  placeholder="예: 1000000"
                  value={newCompanyBalance}
                  onChange={(e) => setNewCompanyBalance(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button 
              onClick={() => {
                if (!newCompanyName || !newCompanyBusinessNum) {
                  alert('업체명과 사업자등록번호를 입력해 주세요.');
                  return;
                }
                addCompany(newCompanyName, newCompanyBusinessNum, newCompanyBalance || 0);
                alert(`협력업체 [${newCompanyName}]이(가) 정상 등록되었습니다.`);
                setNewCompanyName('');
                setNewCompanyBusinessNum('');
                setNewCompanyBalance('1000000');
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl py-3 text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              협력업체 계정 개설
            </button>
          </div>
        </div>

        {/* 신규 근로자 등록 및 식권 배포 */}
        <div className="lg:col-span-2 glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 mb-4">
            <h3 className="text-sm font-extrabold flex items-center gap-2 text-zinc-850 dark:text-zinc-200">
              <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              현장 인부 신규 등록 및 식권 배포 (식권대장 B2B)
            </h3>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold">Hynix 협력사 근로권한 설정</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 이름 입력창 */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">근로자 이름</label>
              <input 
                type="text" 
                placeholder="예: 홍길동"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2.5 text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              />
            </div>

            {/* 전화번호 입력창 */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">전화번호</label>
              <input 
                type="text" 
                placeholder="예: 010-9999-8888"
                value={newWorkerPhone}
                onChange={(e) => setNewWorkerPhone(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2.5 text-sm text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              />
            </div>

            {/* 등급 선택 드롭다운 */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">직급 등급 (포인트 차등)</label>
              <select
                value={newWorkerGrade}
                onChange={(e) => setNewWorkerGrade(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2.5 text-sm text-zinc-855 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              >
                <option value="일반">일반 (일일 15,000 P)</option>
                <option value="반장">반장 (일일 25,000 P)</option>
                <option value="관리자">관리자 (일일 50,000 P)</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button 
              onClick={() => {
                if (!newWorkerName || !newWorkerPhone) {
                  alert('이름과 전화번호를 모두 입력해 주세요.');
                  return;
                }
                const points = gradePointsMap[newWorkerGrade];
                addWorkerToken(activeCompany.id, newWorkerName, newWorkerPhone, points, newWorkerGrade);
                setNewWorkerName('');
                setNewWorkerPhone('');
                alert(`${newWorkerName} 님에게 ${newWorkerGrade} 등급 권한(일일 ${points.toLocaleString()} P)이 부여되어 식권이 정상 발급되었습니다.`);
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold rounded-xl px-6 py-3 text-xs transition-all flex items-center gap-1.5 shadow active:scale-97"
            >
              <Plus className="w-4 h-4" />
              신규 근로자 식권 배포
            </button>
          </div>
        </div>

      </div>

      {/* 시간 통제 정책 설정 (요일 제한은 상시 가동을 위해 제거) */}
      <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg transition-all duration-300 hover:shadow-xl">
        <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 text-zinc-800 dark:text-zinc-200">
          <Sliders className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          {activeCompany.name} 식권 사용 통제 및 보안 제한 정책 (시간대 제약)
        </h3>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-zinc-555 dark:text-zinc-400">식사 허용 시간대 정책 설정:</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'breakfast', label: '🌅 조식' },
              { key: 'lunch', label: '☀️ 중식' },
              { key: 'dinner', label: '🌙 석식' }
            ].map(meal => {
              const policy = allowedTimes[meal.key] || { active: false, start: '00:00', end: '00:00' };
              return (
                <div key={meal.key} className="flex items-center justify-between p-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl gap-4 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={policy.active}
                      onChange={(e) => handleTimeChange(meal.key, 'active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-zinc-100 border-zinc-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{meal.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                    <input 
                      type="time" 
                      value={policy.start}
                      disabled={!policy.active}
                      onChange={(e) => handleTimeChange(meal.key, 'start', e.target.value)}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-center text-xs focus:outline-none disabled:opacity-40"
                    />
                    <span className="text-zinc-400">~</span>
                    <input 
                      type="time" 
                      value={policy.end}
                      disabled={!policy.active}
                      onChange={(e) => handleTimeChange(meal.key, 'end', e.target.value)}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-center text-xs focus:outline-none disabled:opacity-40"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-450 leading-relaxed mt-2">
            ※ 거의 매일(주말 포함) 상시 가동되는 현장을 위해 요일 제약은 해제되었습니다. 지정된 시간대 이외에 결제 시에만 차단 정책이 적용됩니다.
          </p>
        </div>
      </div>

      {/* ECharts 시각 통계 분석판 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 매장별 식수 이용 비중 */}
        <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg">
          <h4 className="text-xs font-extrabold mb-4 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <PieChart className="w-4 h-4 text-emerald-500" />
            {activeCompany.name} 소속 근로자 식당별 식수 비중 (실시간)
          </h4>
          <div className="h-64 relative">
            <ReactECharts 
              option={getStoreRatioOption()} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>

        {/* 시간대별 식수 트렌드 */}
        <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg">
          <h4 className="text-xs font-extrabold mb-4 flex items-center gap-2 text-zinc-850 dark:text-zinc-200">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {activeCompany.name} 시간대별 식수 집중도 분석 (실시간)
          </h4>
          <div className="h-64 relative">
            <ReactECharts 
              option={getHourTrendOption()} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>

      </div>

      {/* Middle Section: 소속 근로자 식권 목록 */}
      <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg transition-all duration-300 hover:shadow-xl">
        <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 text-zinc-800 dark:text-zinc-200">
          <Users className="w-4.5 h-4.5 text-emerald-500" />
          {activeCompany.name} 소속 근로자 식권 리스트 ({workers.filter(w => w.companyId === activeCompany.id).length}명)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers
            .filter(w => w.companyId === activeCompany.id)
            .map(worker => (
              <div key={worker.id} className="p-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-250 dark:border-zinc-855 rounded-2xl flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100">{worker.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                      worker.grade === '관리자' ? 'bg-purple-100 text-purple-800 dark:bg-purple-955/40 dark:text-purple-400 border border-purple-200/30' :
                      worker.grade === '반장' ? 'bg-blue-100 text-blue-800 dark:bg-blue-955/40 dark:text-blue-400 border border-blue-200/30' :
                      'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {worker.grade || '일반'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">{worker.phone}</span>
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 font-mono mt-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded w-max border border-blue-200/30">
                    {worker.qrCode}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-955/40 dark:text-emerald-400 px-2.5 py-1 rounded-xl font-black shadow-sm">
                    {worker.remainingPoints ? worker.remainingPoints.toLocaleString() : 0} P
                  </span>
                  <button 
                    onClick={() => setQrModalWorker(worker)}
                    className="px-2.5 py-1.5 bg-zinc-250 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR코드 보기
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Bottom Section: 근로자 식수 이력 및 정산 엑셀 다운로드 */}
      <div className="glass-premium p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <h3 className="text-sm font-extrabold flex items-center gap-2 text-zinc-805 dark:text-zinc-205">
            <Clock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            {activeCompany.name} 근로자 실시간 식사 이력 리스트 (최신순)
          </h3>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-97"
          >
            <Download className="w-3.5 h-3.5" />
            엑셀 정산 다운로드 (CSV)
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50/40 dark:bg-zinc-950/40 font-bold">
                <th className="py-3 px-3 rounded-tl-xl">일시</th>
                <th className="py-3 px-3">이름</th>
                <th className="py-3 px-3">이용 매장</th>
                <th className="py-3 px-3">메뉴</th>
                <th className="py-3 px-3 text-right rounded-tr-xl">금액</th>
              </tr>
            </thead>
            <tbody>
              {sales
                .filter(sale => sale.companyName === activeCompany.name)
                .map(sale => (
                  <tr key={sale.id} className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 transition-all duration-200">
                    <td className="py-3.5 px-3 text-xs font-mono text-zinc-650 dark:text-zinc-450">
                      {new Date(sale.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-xs text-zinc-850 dark:text-zinc-200">{sale.workerName}</td>
                    <td className="py-3.5 px-3 text-xs text-zinc-850 dark:text-zinc-200">{sale.storeName}</td>
                    <td className="py-3.5 px-3 text-xs text-zinc-850 dark:text-zinc-200">{sale.menuName || '일반 식사'}</td>
                    <td className="py-3.5 px-3 text-right text-xs font-mono font-black text-zinc-900 dark:text-zinc-100">
                      {sale.amount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              {sales.filter(sale => sale.companyName === activeCompany.name).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs font-bold bg-zinc-50/10 dark:bg-zinc-950/10 rounded-b-xl">
                    최근 식사 기록이 없습니다. POS 화면에서 결제 시뮬레이션을 실행해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 가상계좌 발급 및 예치금 즉시 충전 모달 */}
      {virtualAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-955/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setVirtualAccountModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-55 mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              가상계좌 발급 및 즉시 충전 (Fintech)
            </h4>
            <p className="text-xs text-zinc-500 mb-6">{activeCompany.name} 달장부 계정 전용</p>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2 text-xs mb-4 shadow-inner">
              <div className="flex justify-between">
                <span className="text-zinc-500">은행명:</span>
                <span className="font-extrabold">국민은행 (KB Bank)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">가상계좌번호:</span>
                <span className="font-black text-blue-600 dark:text-blue-400 font-mono text-sm">942-8883-999201</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">예금주:</span>
                <span className="font-extrabold">유림푸드_{activeCompany.name}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-550 block">가상 입금할 금액 (원)</label>
              <input 
                type="number" 
                placeholder="예: 2,000,000"
                value={chargeInput}
                onChange={(e) => setChargeInput(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setVirtualAccountModalOpen(false)}
                className="flex-1 bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-3 rounded-xl text-xs transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  if (!chargeInput || isNaN(chargeInput)) return;
                  chargeCompanyBalance(activeCompany.id, Number(chargeInput));
                  setChargeInput('');
                  setVirtualAccountModalOpen(false);
                  alert(`가상계좌 입금이 완료되었습니다! ${Number(chargeInput).toLocaleString()}원이 정상 충전되었습니다.`);
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow"
              >
                입금 확인 시뮬레이션
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 근로자 식권 QR 팝업 모달 */}
      {qrModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-955/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative flex flex-col items-center text-center">
            
            <button 
              onClick={() => setQrModalWorker(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 mb-1">
              현장 근로자 식권 QR 코드
            </h4>
            <p className="text-xs text-zinc-500 mb-6">{qrModalWorker.companyName} • {qrModalWorker.name} 님</p>

            <div className="p-4 bg-white rounded-3xl border border-zinc-200 shadow-lg flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-zinc-50 border border-zinc-200 rounded flex flex-col items-center justify-center relative p-3">
                <QrCode className="w-full h-full text-zinc-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white px-2.5 py-1 rounded shadow text-[9px] font-mono font-bold tracking-tight text-blue-600 border border-blue-100">
                    {qrModalWorker.qrCode}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 w-full p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl text-left text-xs text-zinc-500 dark:text-zinc-450 font-mono shadow-inner border border-zinc-200/40 dark:border-zinc-800/40">
              <div className="flex justify-between mb-1">
                <span>직급 등급:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{qrModalWorker.grade || '일반'}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>잔여 포인트:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{qrModalWorker.remainingPoints ? qrModalWorker.remainingPoints.toLocaleString() : 0} P</span>
              </div>
              <div className="flex justify-between">
                <span>전화번호:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{qrModalWorker.phone}</span>
              </div>
            </div>

            <button 
              onClick={() => setQrModalWorker(null)}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow active:scale-97"
            >
              확인 완료
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
