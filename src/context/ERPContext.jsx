import React, { createContext, useState, useEffect } from 'react';

export const ERPContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

const initialCompanies = [
  { id: 'c1', name: '성우건설 (주)', businessNumber: '124-81-99882', balance: 5000000, accumulatedMeals: 420 },
  { id: 'c2', name: '대우이엔씨 (주)', businessNumber: '214-86-77112', balance: 12500000, accumulatedMeals: 1120 },
  { id: 'c3', name: '한신공영 (주)', businessNumber: '110-82-44331', balance: 3200000, accumulatedMeals: 280 },
  { id: 'c4', name: '현대건설 (주)', businessNumber: '101-81-55443', balance: 900000, accumulatedMeals: 150 },
];

const initialWorkers = [
  { id: 'w1', companyId: 'c1', companyName: '성우건설 (주)', name: '김철수', phone: '010-1234-5678', remainingPoints: 25000, qrCode: 'USER_TOKEN_KCS_1001' },
  { id: 'w2', companyId: 'c1', companyName: '성우건설 (주)', name: '이영희', phone: '010-8765-4321', remainingPoints: 12000, qrCode: 'USER_TOKEN_LYH_1002' },
  { id: 'w3', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '박민수', phone: '010-1111-2222', remainingPoints: 45000, qrCode: 'USER_TOKEN_PMS_1003' },
  { id: 'w4', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '최지우', phone: '010-3333-4444', remainingPoints: 0, qrCode: 'USER_TOKEN_CJW_1004' },
  { id: 'w5', companyId: 'c3', companyName: '한신공영 (주)', name: '정태호', phone: '010-5555-6666', remainingPoints: 18000, qrCode: 'USER_TOKEN_JTH_1005' },
  { id: 'w6', companyId: 'c4', companyName: '현대건설 (주)', name: '홍길동', phone: '010-9999-8888', remainingPoints: 30000, qrCode: 'USER_TOKEN_HGD_7777' },
];

const initialOrders = [
  { id: 'o1', storeName: '유림푸드 중화식당', itemName: '국내산 돈육 삼겹살', quantity: 100, unit: 'kg', price: 18000, originalPrice: 18000, negotiatedPrice: 18000, discountPercent: 0, timestamp: '2026-06-16T10:30:00Z', status: 'pending' },
  { id: 'o2', storeName: '양평신내서울해장국', itemName: '대파 및 무 박스', quantity: 30, unit: 'box', price: 8000, originalPrice: 8000, negotiatedPrice: 8000, discountPercent: 0, timestamp: '2026-06-16T11:15:00Z', status: 'approved' },
  { id: 'o3', storeName: '삼계탕&염소탕', itemName: '무항생제 영계 닭', quantity: 200, unit: '마리', price: 6500, originalPrice: 6500, negotiatedPrice: 6500, discountPercent: 0, timestamp: '2026-06-16T12:00:00Z', status: 'pending' },
  { id: 'o4', storeName: '장어&고기', itemName: '풍천 민물장어 생물', quantity: 50, unit: 'kg', price: 32000, originalPrice: 32000, negotiatedPrice: 32000, discountPercent: 0, timestamp: '2026-06-16T13:45:00Z', status: 'rejected' },
  { id: 'o5', storeName: '분식집', itemName: '밀가루 및 쌀가루 포대', quantity: 15, unit: 'bag', price: 15000, originalPrice: 15000, negotiatedPrice: 15000, discountPercent: 0, timestamp: '2026-06-16T14:20:00Z', status: 'approved' },
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
  drainageSystem: '정상',
  coldChainTemp: -18.5
};

const initialBuildings = [
  { id: 'b1', name: '유림타운 1동', storeName: '유림푸드 중화식당', officeName: '한성 무역 (사무실)', expiryDate: '2027-04-10', monthlyRent: 3500000, rentPaid: true, electricity: 420, water: 85, officeVacant: false },
  { id: 'b2', name: '유림타운 2동', storeName: '양평신내서울해장국', officeName: '대원 물류 (사무실)', expiryDate: '2026-11-20', monthlyRent: 4200000, rentPaid: true, electricity: 510, water: 92, officeVacant: false },
  { id: 'b3', name: '유림타운 3동', storeName: '삼계탕&염소탕', officeName: '(공실)', expiryDate: '2026-08-15', monthlyRent: 3000000, rentPaid: false, electricity: 310, water: 60, officeVacant: true },
  { id: 'b4', name: '유림타운 4동', storeName: '장어&고기', officeName: '세움 디자인 (사무실)', expiryDate: '2027-01-30', monthlyRent: 5000000, rentPaid: true, electricity: 680, water: 115, officeVacant: false },
  { id: 'b5', name: '유림타운 5동', storeName: '분식집', officeName: '에스에이치 파트너스', expiryDate: '2026-12-05', monthlyRent: 2800000, rentPaid: true, electricity: 290, water: 45, officeVacant: false },
  { id: 'b6', name: '유림타운 6동', storeName: 'CU 편의점', officeName: '태양 기획 (사무실)', expiryDate: '2027-05-18', monthlyRent: 3800000, rentPaid: true, electricity: 480, water: 70, officeVacant: false }
];

const initialKitchenOrders = [
  { id: 'ko1', storeName: '양평신내서울해장국', menuName: '양평해장국 특', quantity: 1, workerName: '김철수', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'ko2', storeName: '유림푸드 중화식당', menuName: '자장면 세트', quantity: 1, workerName: '이영희', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() }
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

  const [kitchenOrders, setKitchenOrders] = useState(() => {
    const saved = localStorage.getItem('erp_kitchen_orders');
    return saved ? JSON.parse(saved) : initialKitchenOrders;
  });

  const [coldChainTemp, setColdChainTemp] = useState(() => {
    const saved = localStorage.getItem('erp_cold_chain_temp');
    return saved ? Number(saved) : -18.5;
  });

  const [backendAvailable, setBackendAvailable] = useState(false);

  // ----------------------------------------------------
  // LOAD DATA FROM BACKEND API (WITH MOCK FALLBACK)
  // ----------------------------------------------------
  const syncFromBackend = async () => {
    try {
      const [compRes, workRes, ordRes, saleRes, iotRes, bldRes, kitRes, savRes] = await Promise.all([
        fetch(`${API_BASE_URL}/companies`).then(r => r.json()),
        fetch(`${API_BASE_URL}/workers`).then(r => r.json()),
        fetch(`${API_BASE_URL}/orders`).then(r => r.json()),
        fetch(`${API_BASE_URL}/sales`).then(r => r.json()),
        fetch(`${API_BASE_URL}/iot`).then(r => r.json()),
        fetch(`${API_BASE_URL}/buildings`).then(r => r.json()),
        fetch(`${API_BASE_URL}/kitchen-orders`).then(r => r.json()),
        fetch(`${API_BASE_URL}/stats/savings`).then(r => r.json())
      ]);

      setCompanies(compRes);
      setWorkers(workRes);
      setOrders(ordRes);
      setSales(saleRes);
      setIot(iotRes);
      setBuildings(bldRes);
      setKitchenOrders(kitRes);
      setTotalSavings(savRes.totalSavings);
      if (iotRes.coldChainTemp !== undefined) {
        setColdChainTemp(Number(iotRes.coldChainTemp));
      }
      setBackendAvailable(true);
    } catch (err) {
      console.warn("Backend API not reachable. Operating in local storage mode:", err.message);
      setBackendAvailable(false);
    }
  };

  useEffect(() => {
    syncFromBackend();
  }, []);

  // Sync state to local storage for local/fallback persistence
  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_companies', JSON.stringify(companies));
    }
  }, [companies, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_workers', JSON.stringify(workers));
    }
  }, [workers, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_orders', JSON.stringify(orders));
    }
  }, [orders, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_sales', JSON.stringify(sales));
    }
  }, [sales, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_iot', JSON.stringify(iot));
    }
  }, [iot, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_buildings', JSON.stringify(buildings));
    }
  }, [buildings, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_kitchen_orders', JSON.stringify(kitchenOrders));
    }
  }, [kitchenOrders, backendAvailable]);

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem('erp_cold_chain_temp', coldChainTemp.toString());
      localStorage.setItem('erp_total_savings', totalSavings.toString());
    }
  }, [coldChainTemp, totalSavings, backendAvailable]);

  // SCM / ERP Actions
  const addSCMOrder = async (storeName, itemName, quantity, unit, price) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeName, itemName, quantity, unit, price })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }

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

  const addBulkSCMOrders = async (storeName, cartItems) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/orders/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeName, cartItems })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }

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

  const consolidateAndNegotiateOrders = async () => {
    if (backendAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/negotiate`, { method: 'POST' }).then(r => r.json());
        await syncFromBackend();
        return res;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }

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

  const updateSCMOrderStatus = async (orderId, status) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // B2B Actions
  const chargeCompanyBalance = async (companyId, amount) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/companies/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, amount })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, balance: c.balance + Number(amount) } : c));
  };

  const addWorkerToken = async (companyId, name, phone, dailyPoints = 25000) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/workers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, name, phone, dailyPoints })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }

    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const newWorker = {
      id: `w${Date.now()}`,
      companyId,
      companyName: company.name,
      name,
      phone,
      remainingPoints: Number(dailyPoints),
      qrCode: `USER_TOKEN_${name.substring(0, 3)}_${Math.floor(1000 + Math.random() * 9000)}`
    };
    setWorkers(prev => [...prev, newWorker]);
  };

  const deleteWorkerToken = async (workerId) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/workers/${workerId}`, { method: 'DELETE' });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setWorkers(prev => prev.filter(w => w.id !== workerId));
  };

  // QR POS Check-out simulator action (Secure API Checkout with used tokens check)
  const scanQRAndPay = async (qrCode, storeName, mealPrice = 9000, customMenuName = '양평해장국 특') => {
    if (backendAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/sales/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode, storeName, mealPrice, menuName: customMenuName })
        });
        const data = await res.json();
        await syncFromBackend();
        return data; // returns { success, message, ... }
      } catch (err) {
        console.error("API error, falling back:", err);
        return { success: false, message: '네트워크 연결 오류로 결제를 완료할 수 없습니다.' };
      }
    }

    // In-memory fallback
    const workerIndex = workers.findIndex(w => w.qrCode === qrCode.split('_')[0]);
    if (workerIndex === -1) {
      return { success: false, message: '유효하지 않은 QR 코드 토큰입니다.' };
    }

    const worker = workers[workerIndex];
    if (worker.remainingPoints < mealPrice) {
      return { 
        success: false, 
        message: `${worker.name} 님의 남은 포인트가 부족합니다. (보유 포인트: ${worker.remainingPoints.toLocaleString()} P)` 
      };
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

    // Deduct
    const updatedWorkers = [...workers];
    updatedWorkers[workerIndex] = { ...worker, remainingPoints: worker.remainingPoints - mealPrice };
    setWorkers(updatedWorkers);

    const updatedCompanies = [...companies];
    const newBalance = company.balance - mealPrice;
    updatedCompanies[companyIndex] = { 
      ...company, 
      balance: newBalance,
      accumulatedMeals: company.accumulatedMeals + 1 
    };
    setCompanies(updatedCompanies);

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

    const newKitchenOrder = {
      id: `ko_${Date.now()}`,
      storeName,
      menuName: customMenuName,
      quantity: 1,
      workerName: worker.name,
      timestamp: new Date().toISOString()
    };
    setKitchenOrders(prev => [newKitchenOrder, ...prev]);

    return { 
      success: true, 
      workerName: worker.name,
      companyName: company.name,
      menuName: customMenuName,
      remainingBalance: newBalance,
      message: `${company.name} [${worker.name}] 님 - [${customMenuName}] 결제 완료 (로컬). 잔여 예치금: ${newBalance.toLocaleString()}원` 
    };
  };

  const logGeneralSale = async (storeName, amount, menuName = '일반 식사') => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/sales/general`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeName, amount, menuName })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }

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
  const toggleAcPeakControl = async () => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/iot/ac-peak`, { method: 'POST' });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setIot(prev => ({ ...prev, acPeakControl: !prev.acPeakControl }));
  };

  const updateAcStatus = async (status) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/iot/ac-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setIot(prev => ({ ...prev, acStatus: status }));
  };

  const updateTempSetting = async (temp) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/iot/temp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp })
        });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setIot(prev => ({ ...prev, tempSetting: temp }));
  };

  const updateColdChainTempApi = async (temp) => {
    setColdChainTemp(temp);
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/iot/coldchain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp })
        });
      } catch (err) {
        console.error("API error:", err);
      }
    }
  };

  const sendDunningNotice = async (buildingId) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/buildings/${buildingId}/dunning`, { method: 'POST' });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, rentPaid: true } : b));
  };

  const completeKitchenOrder = async (orderId) => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/kitchen-orders/${orderId}`, { method: 'DELETE' });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setKitchenOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Reset function
  const resetToInitial = async () => {
    if (backendAvailable) {
      try {
        await fetch(`${API_BASE_URL}/system/reset`, { method: 'POST' });
        await syncFromBackend();
        return;
      } catch (err) {
        console.error("API error, falling back:", err);
      }
    }
    setCompanies(initialCompanies);
    setWorkers(initialWorkers);
    setOrders(initialOrders);
    setSales(initialSales);
    setIot(initialIotFacilities);
    setBuildings(initialBuildings);
    setKitchenOrders(initialKitchenOrders);
    setColdChainTemp(-18.5);
    setTotalSavings(0);
  };

  return (
    <ERPContext.Provider value={{
      companies,
      workers,
      orders,
      sales,
      iot,
      buildings,
      kitchenOrders,
      coldChainTemp,
      setColdChainTemp: updateColdChainTempApi,
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
    }}>
      {children}
    </ERPContext.Provider>
  );
};
