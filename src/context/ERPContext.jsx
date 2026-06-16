import React, { createContext, useState, useEffect } from 'react';

export const ERPContext = createContext();

const initialCompanies = [
  { id: 'c1', name: '성우건설 (주)', businessNumber: '124-81-99882', balance: 5000000, accumulatedMeals: 420 },
  { id: 'c2', name: '대우이엔씨 (주)', businessNumber: '214-86-77112', balance: 12500000, accumulatedMeals: 1120 },
  { id: 'c3', name: '한신공영 (주)', businessNumber: '110-82-44331', balance: 3200000, accumulatedMeals: 280 },
  { id: 'c4', name: '현대건설 (주)', businessNumber: '101-81-55443', balance: 900000, accumulatedMeals: 150 }, // <= 1,000,000 for warning badge demo
];

const initialWorkers = [
  { id: 'w1', companyId: 'c1', companyName: '성우건설 (주)', name: '김철수', phone: '010-1234-5678', remainingMeals: 2, qrCode: 'USER_TOKEN_KCS_1001' },
  { id: 'w2', companyId: 'c1', companyName: '성우건설 (주)', name: '이영희', phone: '010-8765-4321', remainingMeals: 1, qrCode: 'USER_TOKEN_LYH_1002' },
  { id: 'w3', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '박민수', phone: '010-1111-2222', remainingMeals: 2, qrCode: 'USER_TOKEN_PMS_1003' },
  { id: 'w4', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '최지우', phone: '010-3333-4444', remainingMeals: 0, qrCode: 'USER_TOKEN_CJW_1004' },
  { id: 'w5', companyId: 'c3', companyName: '한신공영 (주)', name: '정태호', phone: '010-5555-6666', remainingMeals: 2, qrCode: 'USER_TOKEN_JTH_1005' },
  { id: 'w6', companyId: 'c4', companyName: '현대건설 (주)', name: '홍길동', phone: '010-9999-8888', remainingMeals: 3, qrCode: 'USER_TOKEN_HGD_7777' }, // Default worker for POS demo
];

const initialOrders = [
  { id: 'o1', storeName: '유림푸드 중화식당', itemName: '국내산 돈육 삼겹살', quantity: 100, unit: 'kg', price: 18000, timestamp: '2026-06-16T10:30:00Z', status: 'pending' },
  { id: 'o2', storeName: '양평신내서울해장국', itemName: '대파 및 무 박스', quantity: 30, unit: 'box', price: 8000, timestamp: '2026-06-16T11:15:00Z', status: 'approved' },
  { id: 'o3', storeName: '삼계탕&염소탕', itemName: '무항생제 영계 닭', quantity: 200, unit: '마리', price: 6500, timestamp: '2026-06-16T12:00:00Z', status: 'pending' },
  { id: 'o4', storeName: '장어&고기', itemName: '풍천 민물장어 생물', quantity: 50, unit: 'kg', price: 32000, timestamp: '2026-06-16T13:45:00Z', status: 'rejected' },
  { id: 'o5', storeName: '분식집', itemName: '밀가루 및 쌀가루 포대', quantity: 15, unit: 'bag', price: 15000, timestamp: '2026-06-16T14:20:00Z', status: 'approved' },
];

const initialSales = [
  { id: 's1', storeName: '양평신내서울해장국', timestamp: '2026-06-16T08:15:00Z', amount: 11000, paymentType: 'B2B Coupon', workerName: '김철수', companyName: '성우건설 (주)', menuName: '양평해장국 특' },
  { id: 's2', storeName: 'CU 편의점', timestamp: '2026-06-16T09:30:00Z', amount: 4500, paymentType: 'General', workerName: '일반고객', companyName: '-', menuName: '도시락 및 음료' },
  { id: 's3', storeName: '유림푸드 중화식당', timestamp: '2026-06-16T12:10:00Z', amount: 9000, paymentType: 'B2B Coupon', workerName: '박민수', companyName: '대우이엔씨 (주)', menuName: '자장면 세트' },
  { id: 's4', storeName: '삼계탕&염소탕', timestamp: '2026-06-16T13:05:00Z', amount: 16000, paymentType: 'B2B Coupon', workerName: '정태호', companyName: '한신공영 (주)', menuName: '한방 삼계탕' },
  { id: 's5', storeName: '분식집', timestamp: '2026-06-16T14:40:00Z', amount: 7500, paymentType: 'General', workerName: '일반고객', companyName: '-', menuName: '떡튀순 세트' },
];

const initialIotFacilities = {
  acStatus: 'auto',
  tempSetting: 23.5,
  acPeakControl: true,
  powerUsage: 145.2,
  fireAlertSystem: '정상',
  septicTankLevel: 62.5,
  lastSepticCleanDate: '2026-05-15',
  nextSepticCleanDate: '2026-07-15',
  drainageSystem: '정상'
};

const initialBuildings = [
  { id: 'b1', name: '유림타운 1동', storeName: '유림푸드 중화식당', officeName: '한성 무역 (사무실)', expiryDate: '2027-04-10', monthlyRent: 3500000, rentPaid: true, electricity: 420, water: 85, officeVacant: false },
  { id: 'b2', name: '유림타운 2동', storeName: '양평신내서울해장국', officeName: '대원 물류 (사무실)', expiryDate: '2026-11-20', monthlyRent: 4200000, rentPaid: true, electricity: 510, water: 92, officeVacant: false },
  { id: 'b3', name: '유림타운 3동', storeName: '삼계탕&염소탕', officeName: '(공실)', expiryDate: '2026-08-15', monthlyRent: 3000000, rentPaid: false, electricity: 310, water: 60, officeVacant: true },
  { id: 'b4', name: '유림타운 4동', storeName: '장어&고기', officeName: '세움 디자인 (사무실)', expiryDate: '2027-01-30', monthlyRent: 5000000, rentPaid: true, electricity: 680, water: 115, officeVacant: false },
  { id: 'b5', name: '유림타운 5동', storeName: '분식집', officeName: '에스에이치 파트너스', expiryDate: '2026-12-05', monthlyRent: 2800000, rentPaid: true, electricity: 290, water: 45, officeVacant: false },
  { id: 'b6', name: '유림타운 6동', storeName: 'CU 편의점', officeName: '태양 기획 (사무실)', expiryDate: '2027-05-18', monthlyRent: 3800000, rentPaid: true, electricity: 480, water: 70, officeVacant: false }
];

export const standardCatalog = [
  { id: 'cat1', name: '양파 망', category: '야채류', unit: '망', price: 15000, icon: '🥬' },
  { id: 'cat2', name: '의성 마늘 kg', category: '야채류', unit: 'kg', price: 9500, icon: '🧄' },
  { id: 'cat3', name: '쌀 20kg', category: '곡물류', unit: '포대', price: 58000, icon: '🌾' },
  { id: 'cat4', name: '삼겹살 kg', category: '육류', unit: 'kg', price: 18000, icon: '🥩' },
  { id: 'cat5', name: '고춧가루 kg', category: '조미료', unit: 'kg', price: 24000, icon: '🌶️' },
  { id: 'cat6', name: '대파 단', category: '야채류', unit: '단', price: 3200, icon: '🌱' },
];

export const ERPProvider = ({ children }) => {
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('erp_companies');
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('erp_workers');
    return saved ? JSON.parse(saved) : initialWorkers;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('erp_orders');
    const parsed = saved ? JSON.parse(saved) : initialOrders;
    return parsed.map(o => ({
      ...o,
      originalPrice: o.originalPrice !== undefined ? o.originalPrice : o.price,
      negotiatedPrice: o.negotiatedPrice !== undefined ? o.negotiatedPrice : o.price,
      discountPercent: o.discountPercent !== undefined ? o.discountPercent : 0
    }));
  });

  const [totalSavings, setTotalSavings] = useState(() => {
    const saved = localStorage.getItem('erp_total_savings');
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('erp_total_savings', totalSavings.toString());
  }, [totalSavings]);

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('erp_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [iot, setIot] = useState(() => {
    const saved = localStorage.getItem('erp_iot');
    return saved ? JSON.parse(saved) : initialIotFacilities;
  });

  const [buildings, setBuildings] = useState(() => {
    const saved = localStorage.getItem('erp_buildings');
    return saved ? JSON.parse(saved) : initialBuildings;
  });

  useEffect(() => {
    localStorage.setItem('erp_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('erp_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('erp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('erp_iot', JSON.stringify(iot));
  }, [iot]);

  useEffect(() => {
    localStorage.setItem('erp_buildings', JSON.stringify(buildings));
  }, [buildings]);

  // SCM / ERP Actions
  const addSCMOrder = (storeName, itemName, quantity, unit, price) => {
    const newOrder = {
      id: `o${Date.now()}`,
      storeName,
      itemName,
      quantity: Number(quantity),
      unit,
      price: Number(price),
      originalPrice: Number(price),
      negotiatedPrice: Number(price),
      discountPercent: 0,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const addBulkSCMOrders = (storeName, cartItems) => {
    const newOrders = cartItems.map((item, index) => ({
      id: `o${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      storeName,
      itemName: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      price: Number(item.price),
      originalPrice: Number(item.price),
      negotiatedPrice: Number(item.price),
      discountPercent: 0,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }));
    setOrders(prev => [...newOrders, ...prev]);
  };

  const consolidateAndNegotiateOrders = () => {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) return { success: false, message: '협상할 대기 중인 발주 건이 없습니다.' };

    const quantityMap = {};
    pendingOrders.forEach(o => {
      quantityMap[o.itemName] = (quantityMap[o.itemName] || 0) + o.quantity;
    });

    let roundSavings = 0;
    const updatedOrders = orders.map(o => {
      if (o.status !== 'pending') return o;

      const totalQty = quantityMap[o.itemName];
      let discount = 0.05;
      if (totalQty >= 100) discount = 0.20;
      else if (totalQty >= 50) discount = 0.15;
      else if (totalQty >= 20) discount = 0.10;

      const originalUnitPrice = o.originalPrice || o.price;
      const negotiatedUnitPrice = Math.round(originalUnitPrice * (1 - discount));
      const totalSavingForOrder = (originalUnitPrice - negotiatedUnitPrice) * o.quantity;

      roundSavings += totalSavingForOrder;

      return {
        ...o,
        price: negotiatedUnitPrice,
        negotiatedPrice: negotiatedUnitPrice,
        discountPercent: Math.round(discount * 100),
        status: 'approved'
      };
    });

    setOrders(updatedOrders);
    setTotalSavings(prev => prev + roundSavings);

    return {
      success: true,
      savings: roundSavings,
      message: `성공적으로 대량 공동구매 단가 조율 완료! 총 ${roundSavings.toLocaleString()}원 원가 절감 달성.`
    };
  };

  const updateSCMOrderStatus = (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // B2B Actions
  const chargeCompanyBalance = (companyId, amount) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, balance: c.balance + Number(amount) } : c));
  };

  const addWorkerToken = (companyId, name, phone, dailyMeals = 2) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const newWorker = {
      id: `w${Date.now()}`,
      companyId,
      companyName: company.name,
      name,
      phone,
      remainingMeals: Number(dailyMeals),
      qrCode: `USER_TOKEN_${name.substring(0, 3)}_${Math.floor(1000 + Math.random() * 9000)}`
    };
    setWorkers(prev => [...prev, newWorker]);
  };

  const deleteWorkerToken = (workerId) => {
    setWorkers(prev => prev.filter(w => w.id !== workerId));
  };

  // QR POS Check-out simulator action (Phase 2 Enhanced)
  const scanQRAndPay = (qrCode, storeName, mealPrice = 9000, customMenuName = '양평해장국 특') => {
    const workerIndex = workers.findIndex(w => w.qrCode === qrCode);
    if (workerIndex === -1) {
      return { success: false, message: '유효하지 않은 QR 코드 토큰입니다.' };
    }

    const worker = workers[workerIndex];
    if (worker.remainingMeals <= 0) {
      return { success: false, message: `${worker.name} 님의 오늘 남은 식권 한도가 소진되었습니다.` };
    }

    const companyIndex = companies.findIndex(c => c.id === worker.companyId);
    if (companyIndex === -1) {
      return { success: false, message: '등록되지 않은 건설 협력업체입니다.' };
    }

    const company = companies[companyIndex];
    if (company.balance < mealPrice) {
      return { 
        success: false, 
        message: `소속 건설사(${company.name})의 예치 자금이 부족하여 결제할 수 없습니다. (현재 잔액: ${company.balance.toLocaleString()}원)` 
      };
    }

    // Process Deduction
    // 1. Deduct worker daily meals
    const updatedWorkers = [...workers];
    updatedWorkers[workerIndex] = { ...worker, remainingMeals: worker.remainingMeals - 1 };
    setWorkers(updatedWorkers);

    // 2. Deduct company balance & increment accumulated meals
    const updatedCompanies = [...companies];
    const newBalance = company.balance - mealPrice;
    updatedCompanies[companyIndex] = { 
      ...company, 
      balance: newBalance,
      accumulatedMeals: company.accumulatedMeals + 1 
    };
    setCompanies(updatedCompanies);

    // 3. Log sales transaction with menu name
    const newSale = {
      id: `s${Date.now()}`,
      storeName,
      timestamp: new Date().toISOString(),
      amount: mealPrice,
      paymentType: 'B2B Coupon',
      workerName: worker.name,
      companyName: company.name,
      menuName: customMenuName
    };
    setSales(prev => [newSale, ...prev]);

    return { 
      success: true, 
      workerName: worker.name,
      companyName: company.name,
      menuName: customMenuName,
      remainingBalance: newBalance,
      message: `${company.name} [${worker.name}] 님 - [${customMenuName}] 결제 완료. 잔여 예치금: ${newBalance.toLocaleString()}원` 
    };
  };

  // General Cash/Card payment log
  const logGeneralSale = (storeName, amount, menuName = '일반 식사') => {
    const newSale = {
      id: `s${Date.now()}`,
      storeName,
      timestamp: new Date().toISOString(),
      amount: Number(amount),
      paymentType: 'General',
      workerName: '일반고객',
      companyName: '-',
      menuName: menuName
    };
    setSales(prev => [newSale, ...prev]);
  };

  // IoT Controls
  const toggleAcPeakControl = () => {
    setIot(prev => ({ ...prev, acPeakControl: !prev.acPeakControl }));
  };

  const updateAcStatus = (status) => {
    setIot(prev => ({ ...prev, acStatus: status }));
  };

  const updateTempSetting = (temp) => {
    setIot(prev => ({ ...prev, tempSetting: temp }));
  };

  // Reset data function
  const resetToInitial = () => {
    setCompanies(initialCompanies);
    setWorkers(initialWorkers);
    setOrders(initialOrders);
    setSales(initialSales);
    setIot(initialIotFacilities);
    setBuildings(initialBuildings);
    setTotalSavings(0);
  };

  const sendDunningNotice = (buildingId) => {
    setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, rentPaid: true } : b));
  };

  return (
    <ERPContext.Provider value={{
      companies,
      workers,
      orders,
      sales,
      iot,
      buildings,
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
      resetToInitial
    }}>
      {children}
    </ERPContext.Provider>
  );
};
