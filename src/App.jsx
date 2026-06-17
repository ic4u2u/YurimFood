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
  Thermometer
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { ERPContext, standardCatalog } from './context/ERPContext';

export default function App() {
  const {
    companies,
    workers,
    orders,
    sales,
    iot,
    buildings,
    kitchenOrders,
    coldChainTemp,
    setColdChainTemp,
    totalSavings,
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

  const [role, setRole] = useState('Super_Admin'); // Super_Admin, Client_B2B, Store_Manager
  const [theme, setTheme] = useState('dark'); // dark, light
  const [superScmTab, setSuperScmTab] = useState('consolidated'); // consolidated, individual
  const [negoResultModal, setNegoResultModal] = useState(null); // null or { savings, message }
  const [selectedBuilding, setSelectedBuilding] = useState(null); // null or building object

  // ----------------------------------------------------
  // MOBILE WORKER APP STATE & TIMER
  // ----------------------------------------------------
  const [loginPhone, setLoginPhone] = useState('');
  const [loggedInWorker, setLoggedInWorker] = useState(null);
  const [qrCodeTimer, setQrCodeTimer] = useState(30);
  const [workerQRValue, setWorkerQRValue] = useState('');

  // ----------------------------------------------------
  // KITCHEN KDS STATE
  // ----------------------------------------------------
  const [selectedKdsStore, setSelectedKdsStore] = useState('양평신내서울해장국');
  const [issuedInvoices, setIssuedInvoices] = useState({});

  // ----------------------------------------------------
  // CLIENT_B2B STATE
  // ----------------------------------------------------
  const [selectedCompanyId, setSelectedCompanyId] = useState('c4'); // Default to Hyundai Construction (c4) for demo
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [virtualAccountModalOpen, setVirtualAccountModalOpen] = useState(false);
  const [chargeInput, setChargeInput] = useState('');
  const [qrModalWorker, setQrModalWorker] = useState(null);

  // ----------------------------------------------------
  // STORE_MANAGER POS STATE (Phase 2 Split POS & Scanner)
  // ----------------------------------------------------
  const [selectedStore, setSelectedStore] = useState('양평신내서울해장국');
  const [selectedMenu, setSelectedMenu] = useState('양평해장국 특');
  const [qrInput, setQrInput] = useState('');
  
  // POS Scan alert states
  const [posState, setPosState] = useState('idle'); // idle, success, error
  const [posResult, setPosResult] = useState({
    workerName: '',
    companyName: '',
    menuName: '',
    remainingBalance: 0,
    errorMsg: ''
  });
  const [posOpacity, setPosOpacity] = useState(1); // 1 to 0 fade out
  const fadeTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // SCM Form States
  const [scmItem, setScmItem] = useState('');
  const [scmQty, setScmQty] = useState('');
  const [scmPrice, setScmPrice] = useState('');
  const [scmUnit, setScmUnit] = useState('개');
  const [cart, setCart] = useState([]);

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

  // ----------------------------------------------------
  // DYNAMIC QR COUNTDOWN & REFRESH LOGIC
  // ----------------------------------------------------
  useEffect(() => {
    if (!loggedInWorker) {
      setWorkerQRValue('');
      return;
    }

    setWorkerQRValue(loggedInWorker.qrCode + "_" + Math.floor(100 + Math.random() * 900));
    setQrCodeTimer(30);

    const interval = setInterval(() => {
      setQrCodeTimer(prev => {
        if (prev <= 1) {
          setWorkerQRValue(loggedInWorker.qrCode + "_" + Math.floor(100 + Math.random() * 900));
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loggedInWorker]);

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

  // Total B2B Balance
  const totalB2BBalance = companies.reduce((acc, curr) => acc + curr.balance, 0);

  // ----------------------------------------------------
  // QR POS CHECKOUT FLOW WITH 3-SECOND FADE OUT
  // ----------------------------------------------------
  const handleQRCheckout = (codeToScan) => {
    // Clear existing timers
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    
    // Reset opacity and state
    setPosOpacity(1);

    const price = selectedMenu === '양평해장국 특' ? 11000 : 
                  selectedMenu === '국내산 돈육 삼겹살' ? 18000 : 
                  selectedMenu === '무항생제 영계 삼계탕' ? 16000 : 9000;

    const res = scanQRAndPay(codeToScan, selectedStore, price, selectedMenu);

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

      // Start fade out after 2.5s (to complete in 3.0s)
      fadeTimeoutRef.current = setTimeout(() => {
        setPosOpacity(0);
      }, 2500);

      // Reset to idle after 3s complete
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
      
      // Error alerts do not fade out automatically to let the cashier read the reason
    }
  };

  // Reset function wrap
  const handleReset = () => {
    resetToInitial();
    setSelectedCompanyId('c4');
    setPosState('idle');
    setQrInput('');
  };

  // Sales by Store for ECharts (Phase 4 Pie Chart)
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

  // Hourly Traffic and Meal checkout Area Chart (Phase 4)
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
  const unpaidBuildingsCount = buildings ? buildings.filter(b => !b.rentPaid).length : 1;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">유림푸드 F&B 타운 통합 ERP</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Yulim Food Digital Smart Solution v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Role Selector Tab */}
          <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg flex gap-1 border border-zinc-200/50 dark:border-zinc-800/50">
            <button 
              onClick={() => setRole('Super_Admin')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Super_Admin' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
            >
              Super Admin
            </button>
            <button 
              onClick={() => setRole('Client_B2B')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Client_B2B' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
            >
              B2B Portal (식권대장)
            </button>
            <button 
              onClick={() => setRole('Store_Manager')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Store_Manager' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
            >
              Store POS & Scanner
            </button>
            <button 
              onClick={() => setRole('Worker_Mobile')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Worker_Mobile' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
            >
              인부 모바일 식권
            </button>
            <button 
              onClick={() => setRole('Kitchen_KDS')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${role === 'Kitchen_KDS' ? 'bg-blue-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
            >
              주방 KDS 모니터
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* System Reset */}
          <button 
            onClick={handleReset}
            title="데이터 초기화"
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTAINER */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* ROLE INFO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {role === 'Super_Admin' ? '건물주 / 총괄 관리자 모드' : 
                 role === 'Client_B2B' ? '협력 건설사 장부 관리 포털' : 
                 role === 'Store_Manager' ? '매장 POS 및 식자재 발주 연동' :
                 role === 'Worker_Mobile' ? '현장 근로자용 모바일 식권 앱' : '식당 주방 주문 KDS 모니터'}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {role === 'Super_Admin' ? 'F&B 타운 전사적 자원 관리 대시보드' : 
               role === 'Client_B2B' ? 'B2B 달장부 잔액 및 식수 정산 관리' : 
               role === 'Store_Manager' ? `${selectedStore} 태블릿 POS 카운터` :
               role === 'Worker_Mobile' ? '내 스마트폰 모바일 식권' : `${selectedKdsStore} 주방 KDS 화면`}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-sm">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono">현장: 용인 하이닉스 반도체 건설 기지 배후</span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: SUPER_ADMIN */}
        {/* ---------------------------------------------------- */}
        {role === 'Super_Admin' && (
          <div className="flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="text-sm font-medium">금일 타운 총매출액</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black font-mono">
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

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="text-sm font-medium">B2B 식권 총 선불 예치금</span>
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black font-mono">
                    {totalB2BBalance.toLocaleString()}원
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold">자금 흐름</span>
                  <span>가용 선결제 자금 흐름 스코어: 우수</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="text-sm font-medium">6개 동 통합 인건비 효율</span>
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black font-mono">
                    2,450,000원
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold">+8.5% 절감</span>
                  <span>교차 근무 조율 누적치</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="text-sm font-medium">상층부 임대 및 공실률</span>
                    <Building2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-lg font-black tracking-tight">
                    공실 {vacantCount}개 잔여 / {occupancyRate}% 가동 중
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 font-bold">수익률 6.2%</span>
                  <span>전월 대비 보합세 유지</span>
                </div>
              </div>
            </div>

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
                                <p className="text-xs text-zinc-500 mt-1">각 매장 점장/주방장 화면에서 원자재 공동 발주 신청을 진행하면 이곳에 실시간 합산 집계됩니다.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 2: INDIVIDUAL VIEW */}
                  {superScmTab === 'individual' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                            <th className="py-2.5 px-3">발주 매장</th>
                            <th className="py-2.5 px-3">발주 품목</th>
                            <th className="py-2.5 px-3 text-right">수량</th>
                            <th className="py-2.5 px-3 text-right">기본가</th>
                            <th className="py-2.5 px-3 text-center">상태</th>
                            <th className="py-2.5 px-3 text-center">결정</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="py-3 px-3 font-semibold text-xs">{order.storeName}</td>
                              <td className="py-3 px-3 text-xs">{order.itemName}</td>
                              <td className="py-3 px-3 text-right text-xs font-mono font-bold">
                                {order.quantity} {order.unit}
                              </td>
                              <td className="py-3 px-3 text-right text-xs font-mono">
                                {((order.originalPrice || order.price) * order.quantity).toLocaleString()}원
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                                  order.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                  'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                                }`}>
                                  {order.status === 'pending' ? '합산대기' : order.status === 'approved' ? '승인' : '반려'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {order.status === 'pending' ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button 
                                      onClick={() => updateSCMOrderStatus(order.id, 'approved')}
                                      className="p-1 hover:bg-emerald-600 bg-emerald-500 text-white rounded transition-colors"
                                      title="단일 승인"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => updateSCMOrderStatus(order.id, 'rejected')}
                                      className="p-1 hover:bg-rose-600 bg-rose-500 text-white rounded transition-colors"
                                      title="반려"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-zinc-400 text-xs font-mono">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bulk Negotiation Execution & API/PDF Transmission Buttons */}
                {/* Bulk Negotiation Execution & API/PDF Transmission Buttons */}
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
                          <span>누적 소모 식수:</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                            {comp.accumulatedMeals}식
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                        <span className="text-xs font-bold font-mono">{iot.septicTankLevel}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-amber-500" style={{ width: `${iot.septicTankLevel}%` }}></div>
                      </div>
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
                      className={`relative bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 hover:scale-[1.02] ${
                        isUnpaid
                          ? 'border-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.02] shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {/* Top Header inside Block */}
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

                        {/* Stores and Vacancy Info */}
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

                      {/* Bottom values and Dunning Action */}
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

            {/* Phase 5: B2B Settlement & Billing and Cold Chain IoT Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* B2B Settlement & Billing Panel */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    B2B 정산 대시보드 및 전자세금계산서 가상 발행
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    협력 건설사별 누적 식수 및 당월 청구 금액 현황입니다. 국세청 전자세금계산서를 가상으로 즉시 발행할 수 있습니다.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                        <th className="py-2.5 px-3">협력사명</th>
                        <th className="py-2.5 px-3">사업자번호</th>
                        <th className="py-2.5 px-3 text-right">당월 식수</th>
                        <th className="py-2.5 px-3 text-right">정산 금액</th>
                        <th className="py-2.5 px-3 text-center">세금계산서 상태</th>
                        <th className="py-2.5 px-3 text-center">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((comp, idx) => {
                        const amount = comp.accumulatedMeals * 8000;
                        const invoice = issuedInvoices[comp.id];
                        const bizNum = comp.businessNumber || `120-81-${12345 + idx}`;
                        return (
                          <tr key={comp.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-3 font-extrabold text-xs">{comp.name}</td>
                            <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">{bizNum}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {comp.accumulatedMeals}식
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

              {/* Cold Chain IoT Monitor Panel */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-rose-500" />
                    콜드체인(Cold Chain) IoT 원격 온도 관리 시스템
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    식자재 저온 창고 및 냉동창고의 IoT 실시간 온도입니다. 기준 임계 온도(-15.0°C) 이상 상승 시 비상 알림이 작동합니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Temp Card */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-36 transition-all duration-300 ${
                    coldChainTemp > -15.0
                      ? 'border-rose-500 bg-rose-500/[0.06] shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-500">메인 냉동보관소 현지 온도</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        coldChainTemp > -15.0 ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {coldChainTemp > -15.0 ? '⚠️ 위험 수치 초과' : '🟢 정상 보관 (-15°C 이하)'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 mt-2">
                      <span className={`text-3xl font-black font-mono tracking-tight ${coldChainTemp > -15.0 ? 'text-rose-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {coldChainTemp.toFixed(1)}
                      </span>
                      <span className="text-base font-extrabold text-zinc-400">°C</span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-2">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      실시간 센서 정상 작동 중 (갱신 주기: 5초)
                    </div>
                  </div>

                  {/* Temp Manipulation Controls */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex flex-col justify-between h-36">
                    <span className="text-xs font-bold text-zinc-500">센서 강제 온도 조작 & 고장 시뮬레이션</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => setColdChainTemp(prev => prev - 0.5)}
                        className="px-2 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-extrabold text-[10px] rounded-lg transition-all"
                      >
                        온도 0.5°C 낮추기
                      </button>
                      <button
                        onClick={() => setColdChainTemp(prev => prev + 0.5)}
                        className="px-2 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-extrabold text-[10px] rounded-lg transition-all"
                      >
                        온도 0.5°C 높이기
                      </button>
                      <button
                        onClick={() => setColdChainTemp(-25.0)}
                        className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg transition-all shadow-sm"
                      >
                        급속 냉동 가동 (-25°C)
                      </button>
                      <button
                        onClick={() => setColdChainTemp(-5.0)}
                        className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg transition-all shadow-sm"
                      >
                        온도 누출 고장 (-5°C)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alarm & Emergency Dispatch Panel */}
                {coldChainTemp > -15.0 && (
                  <div className="border border-rose-500 bg-rose-500/[0.05] p-4 rounded-xl flex flex-col gap-3 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.1)]">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span className="text-xs font-black">
                        [콜드체인 위험 감지] 냉동보관고 온도가 -15.0°C보다 높습니다!
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                      냉각 가스 유출 또는 서브 도어 개방 고장이 의심됩니다. 현장 담당자 긴급 통보 및 즉시 점검이 요구됩니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          alert(`[콜드체인 비상 SMS 소집 긴급 발송 완료]\n\n수신처: 현대건설 현장안전책임자, 유림푸드 마스터 점장, 보수기술팀\n발송내용: "유림푸드 타운 냉동저장고가 임계온도(-15도)를 초과해 현재 ${coldChainTemp.toFixed(1)}도에 도달했습니다. 신속히 현장 출동하시기 바랍니다."`);
                        }}
                        className="flex-1 text-center bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] py-2 rounded-xl transition-all shadow-md active:scale-[0.98]"
                      >
                        비상 경보 SMS 긴급 일괄 발송
                      </button>
                      <button
                        onClick={() => {
                          setColdChainTemp(-18.5);
                          alert("콜드체인 상태가 수동 리셋되었습니다. 온도가 정상치(-18.5°C)로 조율되었습니다.");
                        }}
                        className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-extrabold text-[10px] rounded-xl transition-all"
                      >
                        센서 수동 복구
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: CLIENT_B2B (식권대장 B2B 식수 정산 모듈) */}
        {/* ---------------------------------------------------- */}
        {role === 'Client_B2B' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Top Section: Split Card & Registration Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Top): Prepaid Balance Overview Card & Recharge */}
              <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">협력업체 식권 관리 계정</span>
                    
                    {/* B2B Company switcher */}
                    <select 
                      value={selectedCompanyId} 
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <span className="text-xs text-zinc-400 block mb-1">현재 선불 예치금 잔액</span>
                    
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-50">
                        {activeCompany.balance.toLocaleString()}
                      </span>
                      <span className="text-base font-bold text-zinc-500">원</span>
                      
                      {/* Blinking Red Warning Badge for balance <= 1,000,000 KRW */}
                      {activeCompany.balance <= 1000000 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-extrabold text-[10px] tracking-wide animate-pulse flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          경고: 잔액 100만원 이하!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Recharge Button (Opens Virtual Account Modal) */}
                  <button 
                    onClick={() => setVirtualAccountModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <DollarSign className="w-4 h-4" />
                    예치금 즉시 충전 (가상계좌 발급)
                  </button>
                </div>
              </div>

              {/* Right Column (Top): New Worker registration with Daily 3 Meals */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-blue-600" />
                    현장 인부 신규 등록 및 식권 배포 (식권대장 B2B)
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">현대건설 등 Hynix 협력사 전용</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 mb-1.5">근로자 이름</label>
                    <input 
                      type="text" 
                      placeholder="예: 홍길동"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      className="w-full bg-[#ffffff] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 mb-1.5">전화번호</label>
                    <input 
                      type="text" 
                      placeholder="예: 010-9999-8888"
                      value={newWorkerPhone}
                      onChange={(e) => setNewWorkerPhone(e.target.value)}
                      className="w-full bg-[#ffffff] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button 
                    onClick={() => {
                      if (!newWorkerName || !newWorkerPhone) {
                        alert('이름과 전화번호를 모두 입력해 주세요.');
                        return;
                      }
                      // Grant daily 3 meals (as specified)
                      addWorkerToken(activeCompany.id, newWorkerName, newWorkerPhone, 3);
                      setNewWorkerName('');
                      setNewWorkerPhone('');
                      alert(`${newWorkerName} 님에게 일일 3식 식사 권한이 정상 부여되었습니다.`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    일일 3식 권한 부여 및 QR 발행
                  </button>
                </div>
              </div>

            </div>

            {/* Middle Section: Active worker cards (Quick check QR codes) */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <Users className="w-4 h-4 text-emerald-500" />
                {activeCompany.name} 소속 근로자 식권 리스트 ({workers.filter(w => w.companyId === activeCompany.id).length}명)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {workers
                  .filter(w => w.companyId === activeCompany.id)
                  .map(worker => (
                    <div key={worker.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-sm">{worker.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{worker.phone}</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded w-max">
                          {worker.qrCode}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          오늘 {worker.remainingMeals}식
                        </span>
                        <button 
                          onClick={() => setQrModalWorker(worker)}
                          className="px-2 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR코드 보기
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bottom Section: Real-time Meal History list (sorted newest first) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-blue-600" />
                {activeCompany.name} 근로자 실시간 식사 이력 리스트 (최신순)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 font-semibold">
                      <th className="py-2.5 px-3">일시</th>
                      <th className="py-2.5 px-3">이름</th>
                      <th className="py-2.5 px-3">이용 매장</th>
                      <th className="py-2.5 px-3">메뉴</th>
                      <th className="py-2.5 px-3 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales
                      .filter(sale => sale.companyName === activeCompany.name)
                      .map(sale => (
                        <tr key={sale.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3 px-3 text-xs font-mono">
                            {new Date(sale.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-semibold text-xs">{sale.workerName}</td>
                          <td className="py-3 px-3 text-xs">{sale.storeName}</td>
                          <td className="py-3 px-3 text-xs">{sale.menuName || '일반 식사'}</td>
                          <td className="py-3 px-3 text-right text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {sale.amount.toLocaleString()}원
                          </td>
                        </tr>
                      ))}
                    {sales.filter(sale => sale.companyName === activeCompany.name).length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-zinc-400 text-sm">
                          최근 식사 기록이 없습니다. POS 화면에서 결제 시뮬레이션을 실행해 주세요.
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
                          {w.name} ({w.companyName}) - 잔여 {w.remainingMeals}식 [토큰: {w.qrCode}]
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
                          alert(`등록된 근로자 정보를 찾을 수 없습니다.\n입력하신 번호: ${cleanPhone}\n\n팁: B2B Portal (식권대장) 화면에서 근로자를 등록할 때 지정한 전화번호를 정확히 입력해 주세요. (예: 010-9999-8888)`);
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
                      <span className="text-xs font-bold text-zinc-400">오늘 남은 식사 권한:</span>
                      <span className="text-sm font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1 rounded-lg">
                        {loggedInWorker.remainingMeals}식 가능
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
                <span>일일 남은 식수:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{qrModalWorker.remainingMeals}식</span>
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

      {/* ---------------------------------------------------- */}
      {/* SCM NEGO RESULT MODAL */}
      {/* ---------------------------------------------------- */}
      {negoResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative flex flex-col items-center text-center">
            
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

      {/* ---------------------------------------------------- */}
      {/* PROPTECH DETAIL LEASE MODAL */}
      {/* ---------------------------------------------------- */}
      {selectedBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl animate-scaleIn">
            
            <button 
              id="close-building-modal-btn"
              onClick={() => setSelectedBuilding(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                  {selectedBuilding.name} 상세 임대 정보
                </h4>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">유림푸드 F&B 타운 스마트 프롭테크</p>
              </div>
            </div>

            {/* Content Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-left mb-6">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">1층 상가 매장</span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{selectedBuilding.storeName}</span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">2층 사무실 정보</span>
                <span className={`font-extrabold ${selectedBuilding.officeVacant ? 'text-amber-500 font-extrabold animate-pulse' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {selectedBuilding.officeName} {selectedBuilding.officeVacant && '(임대 대기)'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">임대 계약 만기일</span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{selectedBuilding.expiryDate}</span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">월세 임대료</span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{(selectedBuilding.monthlyRent).toLocaleString()}원</span>
              </div>
            </div>

            {/* IoT Stats section */}
            <div className="mb-6">
              <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                IoT 실시간 에너지 사용 현황
              </h5>
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">전력 사용량:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedBuilding.electricity} kWh / 800 kWh 한도</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${(selectedBuilding.electricity / 800 * 100).toFixed(0)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">수도 사용량:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedBuilding.water} 톤 / 150 톤 한도</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(selectedBuilding.water / 150 * 100).toFixed(0)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Action Footer */}
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6 gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedBuilding.rentPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                <span className="text-xs font-extrabold">
                  임대료 수납 상태: {selectedBuilding.rentPaid ? '완납' : '미납 (연체)'}
                </span>
              </div>

              <div className="flex gap-2">
                {!selectedBuilding.rentPaid && (
                  <button
                    id="modal-dunning-btn"
                    onClick={() => {
                      sendDunningNotice(selectedBuilding.id);
                      setSelectedBuilding(prev => ({ ...prev, rentPaid: true }));
                      alert(`${selectedBuilding.name}에 독촉 고지서가 발송되었습니다. 임대 상태가 완납으로 즉시 전환됩니다.`);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow active:scale-[0.98]"
                  >
                    독촉장 발송
                  </button>
                )}
                <button
                  id="modal-close-btn"
                  onClick={() => setSelectedBuilding(null)}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-extrabold text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all active:scale-[0.98]"
                >
                  닫기
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
