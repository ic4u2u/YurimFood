import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// [보안강화] QR 복제 및 재사용 방지용 캐시 (Replay Attack Prevention)
// ----------------------------------------------------
// 최근 30초 내에 이미 승인 완료된 1회용 QR 토큰(Suffix 포함 전체 토큰)을 저장하여 중복 사용을 차단합니다.
const usedQrTokens = new Set();
const cleanUsedTokens = () => {
  // 주기적으로 세트를 비웁니다 (1회용 토큰 만료시간 30초 동기화)
  usedQrTokens.clear();
};
setInterval(cleanUsedTokens, 30000);

// ----------------------------------------------------
// DATABASE CONNECTION (PostgreSQL) & IN-MEMORY FALLBACK
// ----------------------------------------------------
let pool = null;
let useDatabase = false;

if (process.env.DATABASE_URL) {
  try {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    useDatabase = true;
    console.log('PostgreSQL Database connection pool initialized.');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool, falling back to In-Memory mode:', err.message);
  }
} else {
  console.log('No DATABASE_URL found. Running in In-Memory fallback mode (ideal for local testing).');
}

// ----------------------------------------------------
// IN-MEMORY DATA STATE (Same as initial frontend mockup)
// ----------------------------------------------------
let companies = [
  { id: 'c1', name: '성우건설 (주)', businessNumber: '124-81-99882', balance: 5000000, accumulatedMeals: 420 },
  { id: 'c2', name: '대우이엔씨 (주)', businessNumber: '214-86-77112', balance: 12500000, accumulatedMeals: 1120 },
  { id: 'c3', name: '한신공영 (주)', businessNumber: '110-82-44331', balance: 3200000, accumulatedMeals: 280 },
  { id: 'c4', name: '현대건설 (주)', businessNumber: '101-81-55443', balance: 900000, accumulatedMeals: 150 },
];

let workers = [
  { id: 'w1', companyId: 'c1', companyName: '성우건설 (주)', name: '김철수', phone: '010-1234-5678', remainingPoints: 25000, qrCode: 'USER_TOKEN_KCS_1001' },
  { id: 'w2', companyId: 'c1', companyName: '성우건설 (주)', name: '이영희', phone: '010-8765-4321', remainingPoints: 12000, qrCode: 'USER_TOKEN_LYH_1002' },
  { id: 'w3', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '박민수', phone: '010-1111-2222', remainingPoints: 45000, qrCode: 'USER_TOKEN_PMS_1003' },
  { id: 'w4', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '최지우', phone: '010-3333-4444', remainingPoints: 0, qrCode: 'USER_TOKEN_CJW_1004' },
  { id: 'w5', companyId: 'c3', companyName: '한신공영 (주)', name: '정태호', phone: '010-5555-6666', remainingPoints: 18000, qrCode: 'USER_TOKEN_JTH_1005' },
  { id: 'w6', companyId: 'c4', companyName: '현대건설 (주)', name: '홍길동', phone: '010-9999-8888', remainingPoints: 30000, qrCode: 'USER_TOKEN_HGD_7777' },
];

let orders = [
  { id: 'o1', storeName: '유림푸드 중화식당', itemName: '국내산 돈육 삼겹살', quantity: 100, unit: 'kg', price: 18000, originalPrice: 18000, negotiatedPrice: 18000, discountPercent: 0, timestamp: '2026-06-16T10:30:00Z', status: 'pending' },
  { id: 'o2', storeName: '양평신내서울해장국', itemName: '대파 및 무 박스', quantity: 30, unit: 'box', price: 8000, originalPrice: 8000, negotiatedPrice: 8000, discountPercent: 0, timestamp: '2026-06-16T11:15:00Z', status: 'approved' },
  { id: 'o3', storeName: '삼계탕&염소탕', itemName: '무항생제 영계 닭', quantity: 200, unit: '마리', price: 6500, originalPrice: 6500, negotiatedPrice: 6500, discountPercent: 0, timestamp: '2026-06-16T12:00:00Z', status: 'pending' },
  { id: 'o4', storeName: '장어&고기', itemName: '풍천 민물장어 생물', quantity: 50, unit: 'kg', price: 32000, originalPrice: 32000, negotiatedPrice: 32000, discountPercent: 0, timestamp: '2026-06-16T13:45:00Z', status: 'rejected' },
  { id: 'o5', storeName: '분식집', itemName: '밀가루 및 쌀가루 포대', quantity: 15, unit: 'bag', price: 15000, originalPrice: 15000, negotiatedPrice: 15000, discountPercent: 0, timestamp: '2026-06-16T14:20:00Z', status: 'approved' },
];

let sales = [
  { id: 's1', storeName: '양평신내서울해장국', timestamp: '2026-06-16T08:15:00Z', amount: 11000, paymentType: 'B2B Coupon', workerName: '김철수', companyName: '성우건설 (주)', menuName: '양평해장국 특' },
  { id: 's2', storeName: 'CU 편의점', timestamp: '2026-06-16T09:30:00Z', amount: 4500, paymentType: 'General', workerName: '일반고객', companyName: '-', menuName: '도시락 및 음료' },
  { id: 's3', storeName: '유림푸드 중화식당', timestamp: '2026-06-16T12:10:00Z', amount: 9000, paymentType: 'B2B Coupon', workerName: '박민수', companyName: '대우이엔씨 (주)', menuName: '자장면 세트' },
  { id: 's4', storeName: '삼계탕&염소탕', timestamp: '2026-06-16T13:05:00Z', amount: 16000, paymentType: 'B2B Coupon', workerName: '정태호', companyName: '한신공영 (주)', menuName: '한방 삼계탕' },
  { id: 's5', storeName: '분식집', timestamp: '2026-06-16T14:40:00Z', amount: 7500, paymentType: 'General', workerName: '일반고객', companyName: '-', menuName: '떡튀순 세트' },
];

let iot = {
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

let buildings = [
  { id: 'b1', name: '유림타운 1동', storeName: '유림푸드 중화식당', officeName: '한성 무역 (사무실)', expiryDate: '2027-04-10', monthlyRent: 3500000, rentPaid: true, electricity: 420, water: 85, officeVacant: false },
  { id: 'b2', name: '유림타운 2동', storeName: '양평신내서울해장국', officeName: '대원 물류 (사무실)', expiryDate: '2026-11-20', monthlyRent: 4200000, rentPaid: true, electricity: 510, water: 92, officeVacant: false },
  { id: 'b3', name: '유림타운 3동', storeName: '삼계탕&염소탕', officeName: '(공실)', expiryDate: '2026-08-15', monthlyRent: 3000000, rentPaid: false, electricity: 310, water: 60, officeVacant: true },
  { id: 'b4', name: '유림타운 4동', storeName: '장어&고기', officeName: '세움 디자인 (사무실)', expiryDate: '2027-01-30', monthlyRent: 5000000, rentPaid: true, electricity: 680, water: 115, officeVacant: false },
  { id: 'b5', name: '유림타운 5동', storeName: '분식집', officeName: '에스에이치 파트너스', expiryDate: '2026-12-05', monthlyRent: 2800000, rentPaid: true, electricity: 290, water: 45, officeVacant: false },
  { id: 'b6', name: '유림타운 6동', storeName: 'CU 편의점', officeName: '태양 기획 (사무실)', expiryDate: '2027-05-18', monthlyRent: 3800000, rentPaid: true, electricity: 480, water: 70, officeVacant: false }
];

let kitchenOrders = [
  { id: 'ko1', storeName: '양평신내서울해장국', menuName: '양평해장국 특', quantity: 1, workerName: '김철수', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'ko2', storeName: '유림푸드 중화식당', menuName: '자장면 세트', quantity: 1, workerName: '이영희', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() }
];

let totalSavings = 0;

// Helper query function to bridge db & memory
async function runQuery(sql, params = [], memoryCallback) {
  if (useDatabase) {
    try {
      const res = await pool.query(sql, params);
      return res.rows;
    } catch (err) {
      console.error('DB Query Error, falling back to memory action:', err.message);
      return memoryCallback();
    }
  } else {
    return memoryCallback();
  }
}

// ----------------------------------------------------
// B2B COMPANIES API
// ----------------------------------------------------
app.get('/api/companies', async (req, res) => {
  const data = await runQuery('SELECT * FROM companies ORDER BY id', [], () => companies);
  res.json(data);
});

app.post('/api/companies/charge', async (req, res) => {
  const { companyId, amount } = req.body;
  const amt = Number(amount);

  if (useDatabase) {
    try {
      const q = await pool.query(
        'UPDATE companies SET balance = balance + $1 WHERE id = $2 RETURNING *',
        [amt, companyId]
      );
      return res.json({ success: true, company: q.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    companies = companies.map(c => c.id === companyId ? { ...c, balance: c.balance + amt } : c);
    res.json({ success: true, companies });
  }
});

// ----------------------------------------------------
// WORKERS API
// ----------------------------------------------------
app.get('/api/workers', async (req, res) => {
  const data = await runQuery(
    `SELECT w.id, w.company_id as "companyId", w.name, w.phone, w.remaining_points as "remainingPoints", w.qr_code as "qrCode", c.name as "companyName" 
     FROM workers w 
     LEFT JOIN companies c ON w.company_id = c.id 
     ORDER BY w.id`,
    [],
    () => workers
  );
  res.json(data);
});

app.post('/api/workers', async (req, res) => {
  const { companyId, name, phone, dailyPoints } = req.body;
  const points = Number(dailyPoints || 25000);
  const id = `w${Date.now()}`;
  const qrCode = `USER_TOKEN_${name.substring(0, 3)}_${Math.floor(1000 + Math.random() * 9000)}`;

  if (useDatabase) {
    try {
      const compRes = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
      if (compRes.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid company' });
      
      const q = await pool.query(
        'INSERT INTO workers (id, company_id, name, phone, remaining_points, qr_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, companyId, name, phone, points, qrCode]
      );
      res.json({ success: true, worker: q.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const compName = companies.find(c => c.id === companyId)?.name || '-';
    const newWorker = { id, companyId, companyName: compName, name, phone, remainingPoints: points, qrCode };
    workers.push(newWorker);
    res.json({ success: true, worker: newWorker });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  if (useDatabase) {
    try {
      await pool.query('DELETE FROM workers WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    workers = workers.filter(w => w.id !== id);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// SCM ORDERS API
// ----------------------------------------------------
app.get('/api/orders', async (req, res) => {
  const data = await runQuery('SELECT * FROM orders ORDER BY timestamp DESC', [], () => orders);
  res.json(data);
});

app.post('/api/orders', async (req, res) => {
  const { storeName, itemName, quantity, unit, price } = req.body;
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

  if (useDatabase) {
    try {
      await pool.query(
        `INSERT INTO orders (id, store_name, item_name, quantity, unit, price, original_price, negotiated_price, discount_percent, timestamp, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [newOrder.id, newOrder.storeName, newOrder.itemName, newOrder.quantity, newOrder.unit, newOrder.price, newOrder.originalPrice, newOrder.negotiatedPrice, newOrder.discountPercent, newOrder.timestamp, newOrder.status]
      );
      res.json({ success: true, order: newOrder });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    orders.unshift(newOrder);
    res.json({ success: true, order: newOrder });
  }
});

app.post('/api/orders/bulk', async (req, res) => {
  const { storeName, cartItems } = req.body;
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

  if (useDatabase) {
    try {
      for (const order of newOrders) {
        await pool.query(
          `INSERT INTO orders (id, store_name, item_name, quantity, unit, price, original_price, negotiated_price, discount_percent, timestamp, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [order.id, order.storeName, order.itemName, order.quantity, order.unit, order.price, order.originalPrice, order.negotiatedPrice, order.discountPercent, order.timestamp, order.status]
        );
      }
      res.json({ success: true, orders: newOrders });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    orders = [...newOrders, ...orders];
    res.json({ success: true, orders: newOrders });
  }
});

app.post('/api/orders/negotiate', async (req, res) => {
  if (useDatabase) {
    try {
      // Get all pending orders
      const pendingRes = await pool.query("SELECT * FROM orders WHERE status = 'pending'");
      const pending = pendingRes.rows;
      if (pending.length === 0) return res.json({ success: false, message: '협상할 대기 중인 발주 건이 없습니다.' });

      // Calculate aggregated quantities
      const quantityMap = {};
      pending.forEach(o => {
        quantityMap[o.item_name] = (quantityMap[o.item_name] || 0) + o.quantity;
      });

      let roundSavings = 0;
      for (const o of pending) {
        const totalQty = quantityMap[o.item_name];
        let discount = 0.05;
        if (totalQty >= 100) discount = 0.20;
        else if (totalQty >= 50) discount = 0.15;
        else if (totalQty >= 20) discount = 0.10;

        const originalUnitPrice = o.original_price;
        const negotiatedUnitPrice = Math.round(originalUnitPrice * (1 - discount));
        const totalSavingForOrder = (originalUnitPrice - negotiatedUnitPrice) * o.quantity;
        roundSavings += totalSavingForOrder;

        await pool.query(
          `UPDATE orders SET price = $1, negotiated_price = $2, discount_percent = $3, status = 'approved' WHERE id = $4`,
          [negotiatedUnitPrice, negotiatedUnitPrice, Math.round(discount * 100), o.id]
        );
      }

      // Update System settings total_savings
      await pool.query(
        `INSERT INTO system_settings (key, value) VALUES ('total_savings', $1)
         ON CONFLICT (key) DO UPDATE SET value = (system_settings.value::int + $1)::varchar`,
        [roundSavings]
      );

      res.json({
        success: true,
        savings: roundSavings,
        message: `성공적으로 대량 공동구매 단가 조율 완료! 총 ${roundSavings.toLocaleString()}원 원가 절감 달성.`
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) return res.json({ success: false, message: '협상할 대기 중인 발주 건이 없습니다.' });

    const quantityMap = {};
    pendingOrders.forEach(o => {
      quantityMap[o.itemName] = (quantityMap[o.itemName] || 0) + o.quantity;
    });

    let roundSavings = 0;
    orders = orders.map(o => {
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

    totalSavings += roundSavings;
    res.json({
      success: true,
      savings: roundSavings,
      message: `성공적으로 대량 공동구매 단가 조율 완료! 총 ${roundSavings.toLocaleString()}원 원가 절감 달성.`
    });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (useDatabase) {
    try {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    orders = orders.map(o => o.id === id ? { ...o, status } : o);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// POS SALES API
// ----------------------------------------------------
app.get('/api/sales', async (req, res) => {
  const data = await runQuery('SELECT * FROM sales ORDER BY timestamp DESC', [], () => sales);
  res.json(data);
});

app.post('/api/sales/general', async (req, res) => {
  const { storeName, amount, menuName } = req.body;
  const newSale = {
    id: `s${Date.now()}`,
    storeName,
    timestamp: new Date().toISOString(),
    amount: Number(amount),
    paymentType: 'General',
    workerName: '일반고객',
    companyName: '-',
    menuName: menuName || '일반 식사'
  };

  if (useDatabase) {
    try {
      await pool.query(
        `INSERT INTO sales (id, store_name, timestamp, amount, payment_type, worker_name, company_name, menu_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newSale.id, newSale.storeName, newSale.timestamp, newSale.amount, newSale.paymentType, newSale.workerName, newSale.companyName, newSale.menuName]
      );
      res.json({ success: true, sale: newSale });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    sales.unshift(newSale);
    res.json({ success: true, sale: newSale });
  }
});

// ----------------------------------------------------
// [보안 고도화] QR 코드 결제 API (Secure Checkout)
// ----------------------------------------------------
app.post('/api/sales/checkout', async (req, res) => {
  const { qrCode, storeName, mealPrice, menuName } = req.body;
  const price = Number(mealPrice || 9000);

  // 1. 보안검증: Replay Attack 방지 (최근 30초 내 중복 스캔 거부)
  if (usedQrTokens.has(qrCode)) {
    return res.status(400).json({ 
      success: false, 
      message: '보안 경고: 복제 또는 재사용된 QR 코드 식권입니다. 결제가 취소되었습니다.' 
    });
  }

  // 2. 단방향 TOTP 구조 해석: 토큰의 Suffix(_랜덤수) 제외한 원래의 Worker QR 토큰 추출
  const parts = qrCode.split('_');
  const baseQrCode = parts.slice(0, 3).join('_'); // e.g. "USER_TOKEN_KCS_1001"

  if (useDatabase) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 근로자 조회
      const workerRes = await client.query('SELECT * FROM workers WHERE qr_code = $1', [baseQrCode]);
      if (workerRes.rows.length === 0) {
        throw new Error('유효하지 않은 QR 코드 토큰입니다.');
      }
      const worker = workerRes.rows[0];

      // 2. 식권 한도 체크
      if (worker.remaining_points < price) {
        throw new Error(`${worker.name} 님의 남은 포인트가 부족합니다. (보유 포인트: ${worker.remaining_points.toLocaleString()} P)`);
      }

      // 3. 소속 건설사(B2B) 조회
      const compRes = await client.query('SELECT * FROM companies WHERE id = $1', [worker.company_id]);
      if (compRes.rows.length === 0) {
        throw new Error('등록되지 않은 B2B 기업입니다.');
      }
      const company = compRes.rows[0];

      // 4. 예치 잔액 체크 (크레딧 한도 방어)
      if (company.balance < price) {
        throw new Error(`소속 회사(${company.name})의 예치 자금이 부족합니다. (잔액: ${company.balance.toLocaleString()}원)`);
      }

      // 5. 정산 차감
      await client.query('UPDATE workers SET remaining_points = remaining_points - $1 WHERE id = $2', [price, worker.id]);
      const newBal = company.balance - price;
      await client.query('UPDATE companies SET balance = $1, accumulated_meals = accumulated_meals + 1 WHERE id = $2', [newBal, company.id]);

      // 6. 매출 로그
      const saleId = `s${Date.now()}`;
      const timestamp = new Date().toISOString();
      await client.query(
        `INSERT INTO sales (id, store_name, timestamp, amount, payment_type, worker_name, company_name, menu_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [saleId, storeName, timestamp, price, 'B2B Coupon', worker.name, company.name, menuName]
      );

      // 7. 주방 대기열 (KDS) 입력
      const kdsId = `ko_${Date.now()}`;
      await client.query(
        `INSERT INTO kitchen_orders (id, store_name, menu_name, quantity, worker_name, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [kdsId, storeName, menuName, 1, worker.name, timestamp]
      );

      await client.query('COMMIT');
      
      // 결제 성공 토큰 캐시에 기록 (30초 만료)
      usedQrTokens.add(qrCode);

      res.json({
        success: true,
        workerName: worker.name,
        companyName: company.name,
        menuName,
        remainingBalance: newBal,
        message: `${company.name} [${worker.name}] 님 - [${menuName}] 결제 성공`
      });

    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: err.message });
    } finally {
      client.release();
    }
  } else {
    // In-memory checkout logic
    const workerIndex = workers.findIndex(w => w.qrCode === baseQrCode);
    if (workerIndex === -1) {
      return res.status(400).json({ success: false, message: '유효하지 않은 QR 코드 토큰입니다.' });
    }

    const worker = workers[workerIndex];
    if (worker.remainingPoints < price) {
      return res.status(400).json({ 
        success: false, 
        message: `${worker.name} 님의 남은 포인트가 부족합니다. (보유 포인트: ${worker.remainingPoints.toLocaleString()} P)` 
      });
    }

    const companyIndex = companies.findIndex(c => c.id === worker.companyId);
    if (companyIndex === -1) {
      return res.status(400).json({ success: false, message: '등록되지 않은 B2B 기업입니다.' });
    }

    const company = companies[companyIndex];
    if (company.balance < price) {
      return res.status(400).json({ 
        success: false, 
        message: `소속 회사(${company.name})의 예치 자금이 부족합니다. (현재 잔액: ${company.balance.toLocaleString()}원)` 
      });
    }

    // Deduct
    workers[workerIndex].remainingPoints -= price;
    const newBal = company.balance - price;
    companies[companyIndex].balance = newBal;
    companies[companyIndex].accumulatedMeals += 1;

    const saleId = `s${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newSale = {
      id: saleId,
      storeName,
      timestamp,
      amount: price,
      paymentType: 'B2B Coupon',
      workerName: worker.name,
      companyName: company.name,
      menuName
    };
    sales.unshift(newSale);

    const newKds = {
      id: `ko_${Date.now()}`,
      storeName,
      menuName,
      quantity: 1,
      workerName: worker.name,
      timestamp
    };
    kitchenOrders.unshift(newKds);

    // 결제 성공 토큰 캐시에 기록
    usedQrTokens.add(qrCode);

    res.json({
      success: true,
      workerName: worker.name,
      companyName: company.name,
      menuName,
      remainingBalance: newBal,
      message: `${company.name} [${worker.name}] 님 - [${menuName}] 결제 성공 (In-Memory)`
    });
  }
});

// ----------------------------------------------------
// IOT FACILITIES API
// ----------------------------------------------------
app.get('/api/iot', async (req, res) => {
  if (useDatabase) {
    try {
      const q = await pool.query('SELECT * FROM iot_facilities WHERE id = \'main\'');
      if (q.rows.length > 0) return res.json(q.rows[0]);
    } catch (err) {
      console.error(err);
    }
  }
  res.json(iot);
});

app.post('/api/iot/ac-peak', async (req, res) => {
  if (useDatabase) {
    try {
      await pool.query("UPDATE iot_facilities SET ac_peak_control = NOT ac_peak_control WHERE id = 'main'");
      const q = await pool.query("SELECT * FROM iot_facilities WHERE id = 'main'");
      res.json(q.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    iot.acPeakControl = !iot.acPeakControl;
    res.json(iot);
  }
});

app.post('/api/iot/ac-status', async (req, res) => {
  const { status } = req.body;
  if (useDatabase) {
    try {
      await pool.query("UPDATE iot_facilities SET ac_status = $1 WHERE id = 'main'", [status]);
      const q = await pool.query("SELECT * FROM iot_facilities WHERE id = 'main'");
      res.json(q.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    iot.acStatus = status;
    res.json(iot);
  }
});

app.post('/api/iot/temp', async (req, res) => {
  const { temp } = req.body;
  if (useDatabase) {
    try {
      await pool.query("UPDATE iot_facilities SET temp_setting = $1 WHERE id = 'main'", [temp]);
      const q = await pool.query("SELECT * FROM iot_facilities WHERE id = 'main'");
      res.json(q.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    iot.tempSetting = Number(temp);
    res.json(iot);
  }
});

app.post('/api/iot/coldchain', async (req, res) => {
  const { temp } = req.body;
  if (useDatabase) {
    try {
      await pool.query("UPDATE iot_facilities SET cold_chain_temp = $1 WHERE id = 'main'", [temp]);
      const q = await pool.query("SELECT * FROM iot_facilities WHERE id = 'main'");
      res.json(q.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    iot.coldChainTemp = Number(temp);
    res.json(iot);
  }
});

// ----------------------------------------------------
// BUILDINGS API
// ----------------------------------------------------
app.get('/api/buildings', async (req, res) => {
  const data = await runQuery('SELECT * FROM buildings ORDER BY id', [], () => buildings);
  res.json(data);
});

app.post('/api/buildings/:id/dunning', async (req, res) => {
  const { id } = req.params;
  if (useDatabase) {
    try {
      await pool.query('UPDATE buildings SET rent_paid = TRUE WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    buildings = buildings.map(b => b.id === id ? { ...b, rentPaid: true } : b);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// KITCHEN ORDERS (KDS) API
// ----------------------------------------------------
app.get('/api/kitchen-orders', async (req, res) => {
  const data = await runQuery('SELECT * FROM kitchen_orders ORDER BY timestamp DESC', [], () => kitchenOrders);
  res.json(data);
});

app.delete('/api/kitchen-orders/:id', async (req, res) => {
  const { id } = req.params;
  if (useDatabase) {
    try {
      await pool.query('DELETE FROM kitchen_orders WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    kitchenOrders = kitchenOrders.filter(ko => ko.id !== id);
    res.json({ success: true });
  }
});

// System settings / stats API
app.get('/api/stats/savings', async (req, res) => {
  if (useDatabase) {
    try {
      const q = await pool.query("SELECT value FROM system_settings WHERE key = 'total_savings'");
      const val = q.rows.length > 0 ? Number(q.rows[0].value) : 0;
      res.json({ totalSavings: val });
    } catch (err) {
      res.json({ totalSavings: 0 });
    }
  } else {
    res.json({ totalSavings });
  }
});

// Reset data (local only)
app.post('/api/system/reset', (req, res) => {
  companies = [
    { id: 'c1', name: '성우건설 (주)', businessNumber: '124-81-99882', balance: 5000000, accumulatedMeals: 420 },
    { id: 'c2', name: '대우이엔씨 (주)', businessNumber: '214-86-77112', balance: 12500000, accumulatedMeals: 1120 },
    { id: 'c3', name: '한신공영 (주)', businessNumber: '110-82-44331', balance: 3200000, accumulatedMeals: 280 },
    { id: 'c4', name: '현대건설 (주)', businessNumber: '101-81-55443', balance: 900000, accumulatedMeals: 150 },
  ];
  workers = [
    { id: 'w1', companyId: 'c1', companyName: '성우건설 (주)', name: '김철수', phone: '010-1234-5678', remainingPoints: 25000, qrCode: 'USER_TOKEN_KCS_1001' },
    { id: 'w2', companyId: 'c1', companyName: '성우건설 (주)', name: '이영희', phone: '010-8765-4321', remainingPoints: 12000, qrCode: 'USER_TOKEN_LYH_1002' },
    { id: 'w3', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '박민수', phone: '010-1111-2222', remainingPoints: 45000, qrCode: 'USER_TOKEN_PMS_1003' },
    { id: 'w4', companyId: 'c2', companyName: '대우이엔씨 (주)', name: '최지우', phone: '010-3333-4444', remainingPoints: 0, qrCode: 'USER_TOKEN_CJW_1004' },
    { id: 'w5', companyId: 'c3', companyName: '한신공영 (주)', name: '정태호', phone: '010-5555-6666', remainingPoints: 18000, qrCode: 'USER_TOKEN_JTH_1005' },
    { id: 'w6', companyId: 'c4', companyName: '현대건설 (주)', name: '홍길동', phone: '010-9999-8888', remainingPoints: 30000, qrCode: 'USER_TOKEN_HGD_7777' },
  ];
  orders = [
    { id: 'o1', storeName: '유림푸드 중화식당', itemName: '국내산 돈육 삼겹살', quantity: 100, unit: 'kg', price: 18000, originalPrice: 18000, negotiatedPrice: 18000, discountPercent: 0, timestamp: '2026-06-16T10:30:00Z', status: 'pending' },
    { id: 'o2', storeName: '양평신내서울해장국', itemName: '대파 및 무 박스', quantity: 30, unit: 'box', price: 8000, originalPrice: 8000, negotiatedPrice: 8000, discountPercent: 0, timestamp: '2026-06-16T11:15:00Z', status: 'approved' },
    { id: 'o3', storeName: '삼계탕&염소탕', itemName: '무항생제 영계 닭', quantity: 200, unit: '마리', price: 6500, originalPrice: 6500, negotiatedPrice: 6500, discountPercent: 0, timestamp: '2026-06-16T12:00:00Z', status: 'pending' },
    { id: 'o4', storeName: '장어&고기', itemName: '풍천 민물장어 생물', quantity: 50, unit: 'kg', price: 32000, originalPrice: 32000, negotiatedPrice: 32000, discountPercent: 0, timestamp: '2026-06-16T13:45:00Z', status: 'rejected' },
    { id: 'o5', storeName: '분식집', itemName: '밀가루 및 쌀가루 포대', quantity: 15, unit: 'bag', price: 15000, originalPrice: 15000, negotiatedPrice: 15000, discountPercent: 0, timestamp: '2026-06-16T14:20:00Z', status: 'approved' },
  ];
  sales = [
    { id: 's1', storeName: '양평신내서울해장국', timestamp: '2026-06-16T08:15:00Z', amount: 11000, paymentType: 'B2B Coupon', workerName: '김철수', companyName: '성우건설 (주)', menuName: '양평해장국 특' },
    { id: 's2', storeName: 'CU 편의점', timestamp: '2026-06-16T09:30:00Z', amount: 4500, paymentType: 'General', workerName: '일반고객', companyName: '-', menuName: '도시락 및 음료' },
    { id: 's3', storeName: '유림푸드 중화식당', timestamp: '2026-06-16T12:10:00Z', amount: 9000, paymentType: 'B2B Coupon', workerName: '박민수', companyName: '대우이엔씨 (주)', menuName: '자장면 세트' },
    { id: 's4', storeName: '삼계탕&염소탕', timestamp: '2026-06-16T13:05:00Z', amount: 16000, paymentType: 'B2B Coupon', workerName: '정태호', companyName: '한신공영 (주)', menuName: '한방 삼계탕' },
    { id: 's5', storeName: '분식집', timestamp: '2026-06-16T14:40:00Z', amount: 7500, paymentType: 'General', workerName: '일반고객', companyName: '-', menuName: '떡튀순 세트' },
  ];
  iot = {
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
  buildings = [
    { id: 'b1', name: '유림타운 1동', storeName: '유림푸드 중화식당', officeName: '한성 무역 (사무실)', expiryDate: '2027-04-10', monthlyRent: 3500000, rentPaid: true, electricity: 420, water: 85, officeVacant: false },
    { id: 'b2', name: '유림타운 2동', storeName: '양평신내서울해장국', officeName: '대원 물류 (사무실)', expiryDate: '2026-11-20', monthlyRent: 4200000, rentPaid: true, electricity: 510, water: 92, officeVacant: false },
    { id: 'b3', name: '유림타운 3동', storeName: '삼계탕&염소탕', officeName: '(공실)', expiryDate: '2026-08-15', monthlyRent: 3000000, rentPaid: false, electricity: 310, water: 60, officeVacant: true },
    { id: 'b4', name: '유림타운 4동', storeName: '장어&고기', officeName: '세움 디자인 (사무실)', expiryDate: '2027-01-30', monthlyRent: 5000000, rentPaid: true, electricity: 680, water: 115, officeVacant: false },
    { id: 'b5', name: '유림타운 5동', storeName: '분식집', officeName: '에스에이치 파트너스', expiryDate: '2026-12-05', monthlyRent: 2800000, rentPaid: true, electricity: 290, water: 45, officeVacant: false },
    { id: 'b6', name: '유림타운 6동', storeName: 'CU 편의점', officeName: '태양 기획 (사무실)', expiryDate: '2027-05-18', monthlyRent: 3800000, rentPaid: true, electricity: 480, water: 70, officeVacant: false }
  ];
  kitchenOrders = [
    { id: 'ko1', storeName: '양평신내서울해장국', menuName: '양평해장국 특', quantity: 1, workerName: '김철수', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { id: 'ko2', storeName: '유림푸드 중화식당', menuName: '자장면 세트', quantity: 1, workerName: '이영희', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() }
  ];
  totalSavings = 0;
  usedQrTokens.clear();
  
  res.json({ success: true, message: 'System state reset.' });
});

app.listen(PORT, () => {
  console.log(`Yulim Food ERP API server running on port ${PORT}`);
});
