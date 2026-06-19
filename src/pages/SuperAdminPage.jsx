import React, { useState, useContext } from 'react';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Truck, 
  Activity, 
  RefreshCw, 
  Flame, 
  Check, 
  X, 
  TrendingUp, 
  Cpu, 
  Clock, 
  AlertTriangle, 
  FileText
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { ERPContext, standardCatalog } from '../context/ERPContext';

export default function SuperAdminPage({ theme }) {
  const {
    companies,
    sales,
    buildings,
    orders,
    iot,
    coldChainTemp,
    totalSavings,
    chargeCompanyBalance,
    sendDunningNotice,
    consolidateAndNegotiateOrders,
    updateTempSetting,
    toggleAcPeakControl
  } = useContext(ERPContext);

  // 최고 관리자 전용 상태들
  const [activeKpiDetail, setActiveKpiDetail] = useState(null); // null, sales, b2b, labor, lease
  const [isLaborCoordinating, setIsLaborCoordinating] = useState(false);
  const [laborMsg, setLaborMsg] = useState('');
  const [rechargeAmounts, setRechargeAmounts] = useState({});
  const [recruitingStatus, setRecruitingStatus] = useState({ b3: 'active' });
  const [superScmTab, setSuperScmTab] = useState('consolidated'); // consolidated, individual
  const [issuedInvoices, setIssuedInvoices] = useState({});
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [negoResultModal, setNegoResultModal] = useState(null); // SCM Nego Result Modal State

  // SCM 계산 로직
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const consolidatedMap = {};
  pendingOrders.forEach(o => {
    if (!consolidatedMap[o.itemName]) {
      consolidatedMap[o.itemName] = {
        itemName: o.itemName,
        unit: o.unit,
        totalQuantity: 0,
        originalPrice: o.originalPrice || o.price,
        numStores: 0,
        stores: new Set()
      };
    }
    consolidatedMap[o.itemName].totalQuantity += o.quantity;
    consolidatedMap[o.itemName].stores.add(o.storeName);
  });

  const consolidatedList = Object.values(consolidatedMap).map(c => {
    c.numStores = c.stores.size;
    let discount = 0.05;
    if (c.totalQuantity >= 100) discount = 0.20;
    else if (c.totalQuantity >= 50) discount = 0.15;
    else if (c.totalQuantity >= 20) discount = 0.10;
    
    c.discountPercent = Math.round(discount * 100);
    c.negotiatedPrice = Math.round(c.originalPrice * (1 - discount));
    c.savings = (c.originalPrice - c.negotiatedPrice) * c.totalQuantity;
    return c;
  });

  const pendingOriginalTotal = pendingOrders.reduce((sum, o) => sum + (o.originalPrice || o.price) * o.quantity, 0);
  const pendingNegotiatedTotal = consolidatedList.reduce((sum, c) => sum + (c.negotiatedPrice * c.totalQuantity), 0);
  const pendingSavings = pendingOriginalTotal - pendingNegotiatedTotal;
  const pendingSavingsRate = pendingOriginalTotal > 0 ? (pendingSavings / pendingOriginalTotal) * 100 : 0;

  const vacantCount = buildings ? buildings.filter(b => b.officeVacant).length : 1;
  const occupancyRate = buildings ? (((buildings.length - vacantCount) / buildings.length) * 100).toFixed(1) : '83.3';

  // B2B 식권 총 선불 예치금
  const totalB2BBalance = companies.reduce((acc, curr) => acc + curr.balance, 0);

  // ECharts 차트 옵션 생성기
  const getSalesChartOption = () => {
    const defaultStores = [
      { name: '유림푸드 중화식당', color: '#3b82f6' },
      { name: '양평신내서울해장국', color: '#ef4444' },
      { name: '분식집', color: '#f59e0b' },
      { name: '삼계탕&염소탕', color: '#10b981' },
      { name: '장어&고기', color: '#8b5cf6' },
      { name: 'CU 편의점', color: '#ec4899' }
    ];

    const storeSales = sales.reduce((acc, sale) => {
      acc[sale.storeName] = (acc[sale.storeName] || 0) + sale.amount;
      return acc;
    }, {});

    const displayData = defaultStores.map(store => ({
      value: storeSales[store.name] || 0,
      name: store.name.replace('유림푸드 ', '').replace('양평신내서울', ''),
      itemStyle: { color: store.color }
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `<div class="p-2 font-sans bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-md">
            <span class="font-bold">${params.name}</span><br/>
            <span>매출: <b>${params.value.toLocaleString()}원</b> (${params.percent}%)</span>
          </div>`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: '0',
        textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#52525b', fontSize: 10 }
      },
      series: [
        {
          name: '매출 기여도',
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: theme === 'dark' ? '#09090b' : '#ffffff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            color: theme === 'dark' ? '#a1a1aa' : '#52525b',
            fontSize: 10
          },
          emphasis: {
            label: { show: true, fontSize: 11, fontWeight: 'bold' }
          },
          data: displayData
        }
      ]
    };
  };

  const getTrafficChartOption = () => {
    const xAxisData = ['06:00', '08:00', '10:00', '11:00', '11:30', '12:00', '12:30', '13:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const trafficData = [25, 80, 45, 90, 220, 380, 290, 150, 60, 50, 180, 95, 30];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const item = params[0];
          return `<div class="p-2 font-sans bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-md">
            <span class="font-bold">${item.name}</span><br/>
            <span>유동인구/식수: <b>${item.value}명</b></span>
          </div>`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#52525b', fontSize: 10 },
        axisLine: { lineStyle: { color: theme === 'dark' ? '#27272a' : '#e4e4e7' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#52525b', fontSize: 10 },
        splitLine: { lineStyle: { color: theme === 'dark' ? '#27272a' : '#e4e4e7' } }
      },
      series: [
        {
          name: '유동인구 및 식수',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: trafficData,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.0)' }
              ]
            }
          },
          markArea: {
            itemStyle: {
              color: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.09)'
            },
            data: [
              [
                {
                  name: '점심 피크\n(11:30~13:00)',
                  xAxis: '11:30',
                  label: {
                    position: 'insideTop',
                    color: theme === 'dark' ? '#fca5a5' : '#b91c1c',
                    fontSize: 9,
                    fontWeight: 'bold',
                    offset: [0, 8]
                  }
                },
                {
                  xAxis: '13:00'
                }
              ]
            ]
          }
        }
      ]
    };
  };

  const getScmSavingsChartOption = () => {
    const savingsByItem = orders.reduce((acc, order) => {
      if (order.status === 'approved' && order.discountPercent > 0) {
        const original = order.originalPrice || order.price;
        const discountAmt = (original - (order.negotiatedPrice || order.price)) * order.quantity;
        acc[order.itemName] = (acc[order.itemName] || 0) + discountAmt;
      }
      return acc;
    }, {});

    const items = Object.keys(savingsByItem);
    const data = Object.values(savingsByItem);

    if (items.length === 0) {
      return {
        backgroundColor: 'transparent',
        title: { 
          text: '공동구매 절감 내역 없음', 
          left: 'center', 
          top: 'center', 
          textStyle: { color: theme === 'dark' ? '#71717a' : '#a1a1aa', fontSize: 12 } 
        }
      };
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params) => `<div class="p-2 font-sans bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-md">
          <span>${params.name}: <b>${params.value.toLocaleString()}원 절감</b> (${params.percent}%)</span>
        </div>`
      },
      series: [
        {
          name: '품목별 절감액',
          type: 'pie',
          radius: ['40%', '65%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: theme === 'dark' ? '#09090b' : '#ffffff',
            borderWidth: 1.5
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}원',
            color: theme === 'dark' ? '#a1a1aa' : '#52525b',
            fontSize: 10
          },
          data: items.map((item, idx) => ({
            value: savingsByItem[item],
            name: item,
            itemStyle: {
              color: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'][idx % 6]
            }
          }))
        }
      ]
    };
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => setActiveKpiDetail(prev => prev === 'sales' ? null : 'sales')}
          className={`cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg bg-white dark:bg-zinc-900 p-5 rounded-2xl border flex flex-col justify-between ${
            activeKpiDetail === 'sales' 
              ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/10 neon-shadow-emerald' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-sm font-medium">금일 타운 총매출액</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-50">
              {sales.reduce((acc, c) => acc + c.amount, 0).toLocaleString()}원
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              +14.8% ▲
            </span>
            <span className="text-zinc-500">전일 대비 증감율</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveKpiDetail(prev => prev === 'b2b' ? null : 'b2b')}
          className={`cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg bg-white dark:bg-zinc-900 p-5 rounded-2xl border flex flex-col justify-between ${
            activeKpiDetail === 'b2b' 
              ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50/5 dark:bg-blue-950/10 neon-shadow-blue' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-sm font-medium">B2B 식권 총 선불 예치금</span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-50">
              {totalB2BBalance.toLocaleString()}원
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold">자금 흐름</span>
            <span>가용 선결제 자금 흐름 스코어: 우수</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveKpiDetail(prev => prev === 'labor' ? null : 'labor')}
          className={`cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg bg-white dark:bg-zinc-900 p-5 rounded-2xl border flex flex-col justify-between ${
            activeKpiDetail === 'labor' 
              ? 'border-amber-500 ring-2 ring-amber-500 bg-amber-50/5 dark:bg-amber-950/10 neon-shadow-emerald' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-sm font-medium">6개 동 통합 인건비 효율</span>
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-50">
              2,450,000원
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold">+8.5% 절감</span>
            <span>교차 근무 조율 누적치</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveKpiDetail(prev => prev === 'lease' ? null : 'lease')}
          className={`cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg bg-white dark:bg-zinc-900 p-5 rounded-2xl border flex flex-col justify-between ${
            activeKpiDetail === 'lease' 
              ? 'border-purple-500 ring-2 ring-purple-500 bg-purple-50/5 dark:bg-purple-950/10 neon-shadow-rose' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-sm font-medium">상층부 임대 및 공실률</span>
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              공실 {vacantCount}개 잔여 / {occupancyRate}% 가동 중
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 font-bold">수익률 6.2%</span>
            <span>전월 대비 보합세 유지</span>
          </div>
        </div>
      </div>

      {/* KPI Drilldown Detail Panel (Top-down Collapsible) */}
      {activeKpiDetail && (
        <div className="glass-premium p-6 rounded-2xl shadow-md animate-slide-down-fade flex flex-col gap-6 relative border border-zinc-200 dark:border-zinc-800/80">
          
          {/* 1. SALES DETAIL PANEL */}
          {activeKpiDetail === 'sales' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                    금일 타운 매출 상세 분석 (실시간)
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    타운 내 각 매장의 오늘 매출 기여도와 실시간 결제 분포입니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveKpiDetail(null)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">오늘 총 매출</span>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    {sales.reduce((acc, c) => acc + c.amount, 0).toLocaleString()}원
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">B2B 식권 결제 건수</span>
                  <div className="text-xl font-bold font-mono mt-1 text-blue-500">
                    {sales.filter(s => s.paymentType === 'B2B Coupon').length}건
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">일반 고객 결제 건수</span>
                  <div className="text-xl font-bold font-mono mt-1 text-amber-500">
                    {sales.filter(s => s.paymentType === 'General').length}건
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                      <th className="py-3 font-semibold">상점명</th>
                      <th className="py-3 font-semibold text-right">오늘 총 매출액</th>
                      <th className="py-3 font-semibold text-center">총 결제 건수</th>
                      <th className="py-3 font-semibold text-center">B2B 식권</th>
                      <th className="py-3 font-semibold text-center">일반 결제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: '양평신내서울해장국', color: '#ef4444' },
                      { name: '유림푸드 중화식당', color: '#3b82f6' },
                      { name: '분식집', color: '#f59e0b' },
                      { name: '삼계탕&염소탕', color: '#10b981' },
                      { name: '장어&고기', color: '#8b5cf6' },
                      { name: 'CU 편의점', color: '#ec4899' }
                    ].map(store => {
                      const storeSales = sales.filter(s => s.storeName === store.name);
                      const totalAmount = storeSales.reduce((sum, s) => sum + s.amount, 0);
                      const txCount = storeSales.length;
                      const b2bCount = storeSales.filter(s => s.paymentType === 'B2B Coupon').length;
                      const generalCount = storeSales.filter(s => s.paymentType === 'General').length;

                      return (
                        <tr key={store.name} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                          <td className="py-3 font-bold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: store.color }}></span>
                            {store.name}
                          </td>
                          <td className="py-3 text-right font-bold font-mono">{totalAmount.toLocaleString()}원</td>
                          <td className="py-3 text-center font-mono">{txCount}건</td>
                          <td className="py-3 text-center text-blue-500 font-mono font-bold">{b2bCount}건</td>
                          <td className="py-3 text-center text-amber-500 font-mono font-bold">{generalCount}건</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h5 className="text-xs font-bold text-zinc-500 mb-2">실시간 최근 트랜잭션 내역 (최신 5건)</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px] text-zinc-600 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                        <th className="py-2 font-medium">시간</th>
                        <th className="py-2 font-medium">매장</th>
                        <th className="py-2 font-medium">소속 / 고객명</th>
                        <th className="py-2 font-medium">주문 메뉴</th>
                        <th className="py-2 font-medium text-right">결제 금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 5).map((sale) => (
                        <tr key={sale.id} className="border-b border-zinc-100/50 dark:border-zinc-800/30">
                          <td className="py-2 font-mono text-zinc-400">
                            {new Date(sale.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2 font-medium">{sale.storeName}</td>
                          <td className="py-2">
                            {sale.paymentType === 'B2B Coupon' ? (
                              <span className="text-blue-500 font-semibold">{sale.companyName} ({sale.workerName})</span>
                            ) : (
                              <span className="text-zinc-500">{sale.workerName}</span>
                            )}
                          </td>
                          <td className="py-2">{sale.menuName}</td>
                          <td className="py-2 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">{sale.amount.toLocaleString()}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. B2B BALANCE DETAIL PANEL */}
          {activeKpiDetail === 'b2b' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <DollarSign className="w-5 h-5" />
                    B2B 협력업체 선불 예치금 및 식권 관리
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    협력사별 예치금 잔액 모니터링, 경고 상태 확인 및 가상 계좌 실시간 충전을 지원합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveKpiDetail(null)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {companies.some(c => c.balance < 1000000) && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-red-800 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <strong>예치금 경고:</strong> 잔액이 1,000,000원 미만인 협력업체가 존재합니다. 즉시 해당 협력사에 선납 요청 알림이 필요합니다.
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                      <th className="py-3 font-semibold">협력업체명</th>
                      <th className="py-3 font-semibold">사업자등록번호</th>
                      <th className="py-3 font-semibold text-center">누적 이용 포인트</th>
                      <th className="py-3 font-semibold text-right">가용 예치 잔액</th>
                      <th className="py-3 font-semibold text-center">운영 상태</th>
                      <th className="py-3 font-semibold text-center w-64">예치금 즉시 충전</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => {
                      const isLow = company.balance < 1000000;
                      return (
                        <tr key={company.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                          <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">{company.name}</td>
                          <td className="py-3 font-mono text-zinc-500">{company.businessNumber}</td>
                          <td className="py-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">{(company.accumulatedMeals * 9000).toLocaleString()} P</td>
                          <td className={`py-3 text-right font-mono font-bold ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {company.balance.toLocaleString()}원
                          </td>
                          <td className="py-3 text-center">
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30">
                                🔴 잔액 부족 경고
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                                🟢 정상 운영
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            <div className="flex items-center gap-1.5 justify-end">
                              <input 
                                type="number"
                                placeholder="충전액(원)"
                                value={rechargeAmounts[company.id] || ''}
                                onChange={(e) => setRechargeAmounts(prev => ({ ...prev, [company.id]: e.target.value }))}
                                className="w-28 px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button 
                                onClick={() => {
                                  const amt = Number(rechargeAmounts[company.id]);
                                  if (!amt || isNaN(amt) || amt <= 0) return;
                                  chargeCompanyBalance(company.id, amt);
                                  setRechargeAmounts(prev => ({ ...prev, [company.id]: '' }));
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              >
                                충전
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. LABOR EFFICIENCY DETAIL PANEL */}
          {activeKpiDetail === 'labor' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Users className="w-5 h-5" />
                    6개 동 통합 인건비 효율 및 교차 근무 현황
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    타운 내 다중 요식업 매장 간의 실시간 인력 교차 매칭 지원 현황을 모니터링하고 조율합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveKpiDetail(null)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">이번 달 누적 인건비 절감액</span>
                  <div className="text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    2,450,000원 (+8.5%)
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">활성 교차 근무 인원</span>
                  <div className="text-2xl font-black font-mono mt-1 text-amber-500">
                    3개 조 (총 4명 현장 투입 중)
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                      <th className="py-3 font-semibold">교차 근무 조율 대상 매장</th>
                      <th className="py-3 font-semibold text-center">지원 인력</th>
                      <th className="py-3 font-semibold">지원 피크 시간대</th>
                      <th className="py-3 font-semibold text-center">효율 시너지</th>
                      <th className="py-3 font-semibold text-center">현재 매칭 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { shops: '양평신내서울해장국 ↔ 분식집', count: '2명', time: '점심 피크 (11:00 ~ 13:30)', grade: 'S등급 (최우수)', status: '🟢 매칭 가동 중' },
                      { shops: '유림푸드 중화식당 ↔ 삼계탕&염소탕', count: '1명', time: '저녁 준비 (16:30 ~ 18:30)', grade: 'A등급 (우수)', status: '🟢 매칭 가동 중' },
                      { shops: '장어&고기 ↔ CU 편의점', count: '1명', time: '야간 교대 (20:00 ~ 22:00)', grade: 'B등급 (보통)', status: '🟢 매칭 가동 중' }
                    ].map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                        <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">{item.shops}</td>
                        <td className="py-3 text-center font-semibold text-amber-600 dark:text-amber-400">{item.count}</td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-400 font-medium">{item.time}</td>
                        <td className="py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{item.grade}</td>
                        <td className="py-3 text-center text-zinc-500 dark:text-zinc-400 font-semibold">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">GCP AI 실시간 유동인구 기반 교차 근무 인력 재배치 조율</h5>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    피크 시간 및 예약 데이터에 맞춰 실시간으로 동 간의 인력 배치 스케줄러를 재가동하여 초과 인건비를 방지합니다.
                  </p>
                </div>
                <div>
                  <button 
                    disabled={isLaborCoordinating}
                    onClick={() => {
                      setIsLaborCoordinating(true);
                      setLaborMsg('');
                      setTimeout(() => {
                        setIsLaborCoordinating(false);
                        setLaborMsg('교차 조율 성공! 양평신내서울해장국 점심 피크 혼잡도 증가 예상에 따라 분식집 인력 1명을 실시간 추가 지원 교차 배치하였습니다. (추가 비용 절감 예상치: +120,000원)');
                      }, 1500);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all flex items-center gap-1.5 shadow-md ${
                      isLaborCoordinating 
                        ? 'bg-zinc-500 cursor-not-allowed' 
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    }`}
                  >
                    {isLaborCoordinating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        스케줄 재조율 중...
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5" />
                        🤖 AI 인력 교차 근무 자동 조율 실행
                      </>
                    )}
                  </button>
                </div>
              </div>

              {laborMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3.5 rounded-xl flex items-start justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-slideDown">
                  <div className="flex gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>{laborMsg}</div>
                  </div>
                  <button onClick={() => setLaborMsg('')} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. LEASE AND VACANCY DETAIL PANEL */}
          {activeKpiDetail === 'lease' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Building2 className="w-5 h-5" />
                    유림타운 상층부 오피스 임대 및 공실 현황
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    각 동 1층 매장과 연동된 2~3층 오피스의 월세 완납/미납 모니터링 및 즉시 납부 독촉장 전송이 가능합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveKpiDetail(null)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                      <th className="py-3 font-semibold">건물명 (동)</th>
                      <th className="py-3 font-semibold">1층 가맹상점</th>
                      <th className="py-3 font-semibold">상층부 입주사</th>
                      <th className="py-3 font-semibold">계약 만료일</th>
                      <th className="py-3 font-semibold text-right">월 임대료</th>
                      <th className="py-3 font-semibold text-center">임대료 납부</th>
                      <th className="py-3 font-semibold text-center">공실 여부 / 모집</th>
                      <th className="py-3 font-semibold text-center w-36">관리 액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map(building => {
                      return (
                        <tr key={building.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                          <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">{building.name}</td>
                          <td className="py-3 font-medium text-zinc-600 dark:text-zinc-400">{building.storeName}</td>
                          <td className="py-3 text-zinc-700 dark:text-zinc-300 font-semibold">{building.officeName}</td>
                          <td className="py-3 font-mono text-zinc-500">{building.expiryDate}</td>
                          <td className="py-3 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                            {building.monthlyRent.toLocaleString()}원
                          </td>
                          <td className="py-3 text-center">
                            {building.rentPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 완납</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-bold animate-pulse">🔴 미납</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {building.officeVacant ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-zinc-500 font-bold text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/30">
                                  ⚪ 공실
                                </span>
                                <span className="text-[9px] mt-0.5 font-bold">
                                  {recruitingStatus[building.id] === 'active' || recruitingStatus[building.id] === undefined ? (
                                    <span className="text-blue-600 dark:text-blue-400">📢 입주사 모집 중</span>
                                  ) : (
                                    <span className="text-zinc-400">🔇 모집 보류</span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-700 dark:text-zinc-300 text-[10px]">입주 완료</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            {building.officeVacant ? (
                              <button 
                                onClick={() => {
                                  setRecruitingStatus(prev => ({
                                    ...prev,
                                    [building.id]: (prev[building.id] === 'active' || prev[building.id] === undefined) ? 'paused' : 'active'
                                  }));
                                }}
                                className="px-2 py-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                모집상태 변경
                              </button>
                            ) : (
                              !building.rentPaid && (
                                <button 
                                  onClick={() => sendDunningNotice(building.id)}
                                  className="px-2.5 py-1 text-[10px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                                >
                                  독촉장 송부
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            식당별 매출 기여도 비교 (원형 차트)
          </h3>
          <div className="h-72">
            <ReactECharts option={getSalesChartOption()} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            시간대별 유동인구 및 식수 분산 (점심 피크 타임)
          </h3>
          <div className="h-72">
            <ReactECharts option={getTrafficChartOption()} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      {/* SCM Procurement Approvals & SCM Savings Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SCM 공동구매 관리 판넬 */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                '식봄' 통합 SCM - 식자재 공동구매 협상 대시보드
              </h3>
              
              {/* Tab Buttons */}
              <div className="bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg flex border border-zinc-200/50 dark:border-zinc-800/50 text-[10px]">
                <button 
                  onClick={() => setSuperScmTab('consolidated')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${superScmTab === 'consolidated' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500'}`}
                >
                  공동구매 합산 ({consolidatedList.length}건)
                </button>
                <button 
                  onClick={() => setSuperScmTab('individual')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${superScmTab === 'individual' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500'}`}
                >
                  개별 대기열 ({orders.filter(o => o.status === 'pending').length}건)
                </button>
              </div>
            </div>

            {/* 오늘의 통합 매입 시너지 효과 요약 카드 */}
            {superScmTab === 'consolidated' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">오늘의 통합 매입 시너지 효과</span>
                  <div className="flex items-baseline gap-1.5 mt-1 text-xs">
                    <span className="text-zinc-500">개별 구매 시 총액:</span>
                    <span className="font-semibold font-mono text-zinc-400 dark:text-zinc-500 line-through">{pendingOriginalTotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 text-xs">
                    <span className="text-zinc-500">대량 통합 구매 시 총액:</span>
                    <span className="font-black font-mono text-blue-600 dark:text-blue-400">{pendingNegotiatedTotal.toLocaleString()}원</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center md:items-end">
                  <span className="text-[10px] text-zinc-500 font-bold">오늘 아낀 원가 (절감률)</span>
                  <div className="flex items-baseline gap-1.5 text-emerald-500 font-black">
                    <span className="text-lg font-mono">+{pendingSavings.toLocaleString()}원</span>
                    <span className="text-xs">({pendingSavingsRate.toFixed(1)}% 절감)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: CONSOLIDATED SCM VIEW */}
            {superScmTab === 'consolidated' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                      <th className="py-2.5 px-3">통합 품목명</th>
                      <th className="py-2.5 px-3 text-right">전체 필요 수량</th>
                      <th className="py-2.5 px-3 text-right">최종 제안 도매 단가</th>
                      <th className="py-2.5 px-3 text-right">총 매입액</th>
                      <th className="py-2.5 px-3 text-center">공급업체 선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidatedList.map((c, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-xs flex items-center gap-1.5">
                          <span className="text-base">{standardCatalog.find(item => item.name === c.itemName)?.icon || '🥬'}</span>
                          {c.itemName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {c.totalQuantity} {c.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {c.negotiatedPrice.toLocaleString()}원
                          <span className="text-[9px] text-emerald-500 ml-1 font-bold">(-{c.discountPercent}%)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {(c.negotiatedPrice * c.totalQuantity).toLocaleString()}원
                        </td>
                        <td className="py-3 px-3 text-center">
                          <select className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none">
                            <option value="cj">CJ프레시웨이</option>
                            <option value="hyundai">현대그린푸드</option>
                            <option value="ourhome">아워홈</option>
                            <option value="samsung">삼성웰스토리</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {consolidatedList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-zinc-400 text-sm">
                          현재 공동구매를 대기 중인 발주 신청서가 없습니다.
                          <p className="text-xs text-zinc-500 mt-1">각 매장 점장/주방장 화면에서 원자재 공동 발주 신청이 등록되면 여기에 합산되어 나타납니다.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: INDIVIDUAL SCM VIEW */}
            {superScmTab === 'individual' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                      <th className="py-2.5 px-3">요청 매장</th>
                      <th className="py-2.5 px-3">발주 품목</th>
                      <th className="py-2.5 px-3 text-right">수량</th>
                      <th className="py-2.5 px-3 text-right">원가 단가</th>
                      <th className="py-2.5 px-3 text-right">발주 금액</th>
                      <th className="py-2.5 px-3 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.status === 'pending').map((order) => (
                      <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{order.storeName}</td>
                        <td className="py-3 px-3 font-bold text-xs flex items-center gap-1.5">
                          <span className="text-base">{standardCatalog.find(item => item.name === order.itemName)?.icon || '🥬'}</span>
                          {order.itemName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{order.quantity} {order.unit}</td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-500">{(order.originalPrice || order.price).toLocaleString()}원</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {((order.originalPrice || order.price) * order.quantity).toLocaleString()}원
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                            통합 대기
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(o => o.status === 'pending').length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-400 text-sm">
                          개별 발주 대기열이 비어 있습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SCM Negotiation Buttons Section */}
          {superScmTab === 'consolidated' && (
            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-4">
              <div className="text-xs text-zinc-500">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">식봄 대량 공동구매 혜택: </span>
                합산 발주량이 많을수록 동적 볼륨 할인(5% ~ 20%)이 적용되어 대기업 식자재 매입단가를 즉시 낮춥니다.
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                <button 
                  onClick={() => {
                    const res = consolidateAndNegotiateOrders();
                    if (res.success) {
                      setNegoResultModal({
                        savings: res.savings,
                        message: res.message
                      });
                    } else {
                      alert(res.message);
                    }
                  }}
                  disabled={consolidatedList.length === 0}
                  className={`font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md ${
                    consolidatedList.length === 0
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  대량 공동구매 협상 및 일괄 발주 실행
                </button>

                <button 
                  onClick={() => {
                    alert("CJ프레시웨이 통합 SCM API 전송 성공! 마스터 발주서가 전송되었습니다.");
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow"
                >
                  <Cpu className="w-4 h-4 text-blue-400" />
                  CJ프레시웨이 발주서 API 전송
                </button>

                <button 
                  onClick={() => {
                    alert("공동구매 원가 절감 명세서 PDF 다운로드가 시작됩니다.");
                  }}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow"
                >
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  명세서 PDF 다운로드
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: SCM Savings Chart & Company Status */}
        <div className="flex flex-col gap-6">
          
          {/* Cumulative SCM Savings Card */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                공동구매 원가 절감 분석 (식봄)
              </h3>
              
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex flex-col gap-1 mb-4">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">공동구매 누적 원가 절감액</span>
                <span className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-300">
                  {totalSavings.toLocaleString()}원
                </span>
              </div>
              
              <div className="h-44">
                <ReactECharts option={getScmSavingsChartOption()} style={{ height: '100%' }} />
              </div>
            </div>
          </div>

          {/* B2B Company Directory */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              B2B 달장부 협력업체 상태
            </h3>

            <div className="flex flex-col gap-4">
              {companies.map(comp => (
                <div key={comp.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{comp.name}</span>
                    {comp.balance <= 1000000 && (
                      <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-extrabold animate-pulse">
                        경고: 잔액 부족!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>예치 잔액:</span>
                    <span className={`font-bold font-mono ${comp.balance <= 1000000 ? 'text-rose-500 font-extrabold' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {comp.balance.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>누적 사용 포인트:</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                      {(comp.accumulatedMeals * 9000).toLocaleString()} P
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* IoT & Facility System */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proptech IoT Controller */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                프롭테크(Proptech) - 6개동 IoT 통합 제어 및 배수구/정화조 스케줄
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>식당가 냉난방 제어</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${iot.acStatus === 'auto' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                    {iot.acStatus === 'auto' ? '자동' : '수동'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-lg font-mono">{iot.tempSetting}°C</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateTempSetting(Math.max(18, iot.tempSetting - 0.5))} className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">-</button>
                    <button onClick={() => updateTempSetting(Math.min(30, iot.tempSetting + 0.5))} className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">+</button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>에너지 피크 제어</span>
                  <span className="text-xs font-bold text-zinc-400">Peak Control</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold">피크 제어 가동</span>
                  <button 
                    onClick={toggleAcPeakControl}
                    className={`w-9 h-5 rounded-full transition-colors relative ${iot.acPeakControl ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${iot.acPeakControl ? 'left-4.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>통합 정화조 용량</span>
                  <span className={`text-xs font-bold font-mono ${
                    iot.septicTankLevel >= 85 ? 'text-rose-500 font-extrabold animate-pulse' :
                    iot.septicTankLevel >= 70 ? 'text-amber-500 font-bold' :
                    'text-emerald-500 font-bold'
                  }`}>{iot.septicTankLevel}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-1.5 relative">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      iot.septicTankLevel >= 85 ? 'bg-rose-500 animate-pulse' :
                      iot.septicTankLevel >= 70 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} 
                    style={{ width: `${iot.septicTankLevel}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 block">
                  {iot.septicTankLevel >= 85 ? '🚨 위태: 즉시 흡입 청소 필요' :
                   iot.septicTankLevel >= 70 ? '⚠️ 주의: 정화조 점검 요망' :
                   '✓ 정상: 배수 상태 원활'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>식자재 저온창고 콜드체인</span>
                  <span className={`text-xs font-bold font-mono ${
                    coldChainTemp >= -12 ? 'text-rose-500 font-extrabold animate-pulse' :
                    coldChainTemp >= -17 ? 'text-amber-500 font-bold' :
                    'text-emerald-500 font-bold'
                  }`}>{coldChainTemp}°C</span>
                </div>
                {(() => {
                  const pct = Math.min(100, Math.max(0, ((coldChainTemp + 30) / 30) * 100));
                  return (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-1.5 relative">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          coldChainTemp >= -12 ? 'bg-rose-500 animate-pulse' :
                          coldChainTemp >= -17 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  );
                })()}
                <span className="text-[9px] text-zinc-400 mt-1 block">
                  {coldChainTemp >= -12 ? '🚨 경보: 식품 부패 위험 (즉시 조치)' :
                   coldChainTemp >= -17 ? '⚠️ 주의: 냉동기 효율 체크 필요' :
                   '✓ 정상: 신선 냉동 온도 유지 중'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hynix Predictor */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              하이닉스 공사 일정 연동 수요 예측
            </h3>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-400">내일 현장 투입 인원</span>
                <span className="font-mono text-blue-800 dark:text-blue-300 font-extrabold">약 4,200명</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proptech Smart Building Block Map (Phase 4) */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            프롭테크 건물 임대 및 관리 스마트 맵
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            유림 F&B 타운 내 6개 동의 실시간 임대 수납 상태 및 IoT 에너지 통계 정보입니다. 카드를 클릭하면 상세 모달이 오픈됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {buildings && buildings.map((building) => {
            const isUnpaid = !building.rentPaid;
            return (
              <div
                key={building.id}
                onClick={() => setSelectedBuilding(building)}
                className={`relative p-4 rounded-2xl border cursor-pointer flex flex-col justify-between h-48 
                  bg-zinc-50 dark:bg-zinc-950 transition-all duration-500 ease-out
                  hover:-translate-y-2.5 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-950/20 hover:border-indigo-400 dark:hover:border-indigo-600
                  ${isUnpaid
                    ? 'border-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.02] shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                    : 'border-zinc-200 dark:border-zinc-800'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-extrabold text-xs font-mono tracking-tight text-zinc-700 dark:text-zinc-300">
                      {building.name}
                    </span>
                    {isUnpaid ? (
                      <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                        미납 독촉
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                        완납
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="px-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-[9px]">1F</span>
                      <span className="truncate text-zinc-600 dark:text-zinc-400 font-semibold">{building.storeName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="px-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 font-extrabold text-[9px]">2F</span>
                      <span className={`truncate font-semibold ${building.officeVacant ? 'text-amber-500 font-extrabold font-black' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {building.officeName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1">
                    <span>월세: <b className="text-zinc-700 dark:text-zinc-300 font-mono">{(building.monthlyRent / 10000).toFixed(0)}만</b></span>
                    {building.officeVacant && (
                      <span className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-bold text-[8px]">
                        공실 있음
                      </span>
                    )}
                  </div>

                  {isUnpaid ? (
                    <button
                      id={`dunning-btn-${building.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        sendDunningNotice(building.id);
                        alert(`${building.name} (${building.storeName})에 연체 독촉 고지서가 정상 발송되었습니다. 납부 상태가 완납으로 즉시 전환됩니다.`);
                      }}
                      className="w-full text-center bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      독촉장 즉시 발송
                    </button>
                  ) : (
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono text-right flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      만기: {building.expiryDate}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase 5: B2B Settlement & Billing */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              B2B 정산 대시보드 및 전자세금계산서 가상 발행
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              협력 건설사별 누적 사용 포인트 및 당월 청구 금액 현황입니다. 국세청 전자세금계산서를 가상으로 즉시 발행할 수 있습니다.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                  <th className="py-2.5 px-3">협력사명</th>
                  <th className="py-2.5 px-3">사업자번호</th>
                  <th className="py-2.5 px-3 text-right">당월 이용 포인트</th>
                  <th className="py-2.5 px-3 text-right">정산 금액</th>
                  <th className="py-2.5 px-3 text-center">세금계산서 상태</th>
                  <th className="py-2.5 px-3 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((comp, idx) => {
                  const amount = comp.accumulatedMeals * 9000;
                  const invoice = issuedInvoices[comp.id];
                  const bizNum = comp.businessNumber || `120-81-${12345 + idx}`;
                  return (
                    <tr key={comp.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-xs">{comp.name}</td>
                      <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">{bizNum}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {(comp.accumulatedMeals * 9000).toLocaleString()} P
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {amount.toLocaleString()}원
                      </td>
                      <td className="py-3 px-3 text-center">
                        {invoice ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-extrabold text-[9px]">
                              발행완료
                            </span>
                            <span className="text-[7px] text-zinc-400 font-mono mt-0.5 tracking-tight truncate max-w-[100px]" title={invoice.approvalNumber}>
                              {invoice.approvalNumber.substring(0, 17)}...
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-[9px]">
                            미발행
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const approvalNumber = `20260617-${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(10000000 + Math.random() * 90000000)}`;
                              setIssuedInvoices(prev => ({
                                ...prev,
                                [comp.id]: {
                                  issuedAt: new Date().toISOString(),
                                  approvalNumber
                                }
                              }));
                              alert(`[국세청 전자세금계산서 가상 발행 완료]\n\n공급업체: 유림푸드\n공급받는자: ${comp.name}\n사업자번호: ${bizNum}\n합계금액: ${amount.toLocaleString()}원\n\n국세청 승인번호: ${approvalNumber}`);
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-all shadow-sm"
                          >
                            계산서 발행
                          </button>
                          <button
                            onClick={() => {
                              const headers = "일자,이름,매장,메뉴,금액,정산유형\n";
                              const rows = sales
                                .filter(s => s.companyName === comp.name)
                                .map(s => `${new Date(s.timestamp).toLocaleDateString()},${s.workerName},${s.storeName},${s.menuName || '일반 식사'},${s.amount},B2B식권`)
                                .join("\n");
                              const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `${comp.name}_식사정산내역_${new Date().toISOString().slice(0,10)}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-2 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded text-[10px] font-bold transition-all"
                          >
                            Excel 다운
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 스마트 빌딩 맵 빌딩 상세 모달 */}
      {selectedBuilding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                {selectedBuilding.name} 상세 임대 정보
              </h3>
              <button 
                onClick={() => setSelectedBuilding(null)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">1층 가맹 상점</span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{selectedBuilding.storeName}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">2/3층 입주 오피스</span>
                  <span className={`font-extrabold ${selectedBuilding.officeVacant ? 'text-amber-500 font-extrabold animate-pulse' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {selectedBuilding.officeName} {selectedBuilding.officeVacant && '(임대 대기)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">임대차 만기일</span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{selectedBuilding.expiryDate}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">월 임대료 (월세)</span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{(selectedBuilding.monthlyRent).toLocaleString()}원</span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedBuilding.rentPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    임대료 수납 상태: {selectedBuilding.rentPaid ? '완납' : '미납 (연체)'}
                  </span>
                </div>
                
                {!selectedBuilding.rentPaid && (
                  <button
                    onClick={() => {
                      sendDunningNotice(selectedBuilding.id);
                      setSelectedBuilding(prev => ({ ...prev, rentPaid: true }));
                      alert(`${selectedBuilding.name}에 독촉 고지서가 발송되었습니다. 임대 상태가 완납으로 즉시 전환됩니다.`);
                    }}
                    className="px-3 py-1.5 font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all"
                  >
                    독촉장 즉시 발송
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button 
                onClick={() => setSelectedBuilding(null)}
                className="px-5 py-2.5 rounded-xl font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SCM 가격 협상 완료 모달 */}
      {negoResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative flex flex-col items-center text-center animate-scaleUp">
            
            <button 
              onClick={() => setNegoResultModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-3 bg-emerald-500 rounded-full text-white mb-4 animate-bounce">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              공동구매 단가 네고 타결 완료!
            </h4>
            <p className="text-xs text-zinc-500 mb-6">식봄 SCM 유통 파트너 협상 단가 적용서</p>

            <div className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-left text-xs mb-6 flex flex-col gap-2 font-mono">
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-1">
                <span className="font-bold">발주 분류:</span>
                <span>유림푸드 6개 매장 통합 발주</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>기존 원가 총액:</span>
                <span className="line-through">
                  {(orders.filter(o => o.status === 'approved' && o.discountPercent > 0).reduce((sum, o) => sum + (o.originalPrice || o.price) * o.quantity, 0) || 0).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                <span>공동구매 협상 총액:</span>
                <span>
                  {(orders.filter(o => o.status === 'approved' && o.discountPercent > 0).reduce((sum, o) => sum + (o.negotiatedPrice || o.price) * o.quantity, 0) || 0).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between text-emerald-500 font-black text-sm border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2 mt-1">
                <span>이번 네고 총 절감액:</span>
                <span>+{negoResultModal.savings.toLocaleString()}원</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-6 px-4 leading-normal">
              {negoResultModal.message}
            </p>

            <button 
              onClick={() => setNegoResultModal(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow"
            >
              확인 완료
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
