-- 유림푸드 F&B 타운 통합 ERP 데이터베이스 스키마 (PostgreSQL)

-- 1. B2B 협력사(건설사 등) 테이블
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    business_number VARCHAR(50) NOT NULL,
    balance INT NOT NULL DEFAULT 0,
    accumulated_meals INT NOT NULL DEFAULT 0
);

-- 2. 근로자 테이블
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    remaining_points INT NOT NULL DEFAULT 0,
    qr_code VARCHAR(100) UNIQUE NOT NULL
);

-- 3. SCM 식자재 발주 테이블
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price INT NOT NULL,
    original_price INT NOT NULL,
    negotiated_price INT NOT NULL,
    discount_percent INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' -- pending, approved, rejected
);

-- 4. POS 매출 내역 테이블
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount INT NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- B2B Coupon, General
    worker_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    menu_name VARCHAR(100) NOT NULL
);

-- 5. IoT 시설 관리 상태 테이블
CREATE TABLE IF NOT EXISTS iot_facilities (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    ac_status VARCHAR(50) NOT NULL DEFAULT 'auto',
    temp_setting NUMERIC(4, 2) NOT NULL DEFAULT 23.50,
    ac_peak_control BOOLEAN NOT NULL DEFAULT TRUE,
    power_usage NUMERIC(6, 2) NOT NULL DEFAULT 145.20,
    fire_alert_system VARCHAR(50) NOT NULL DEFAULT '정상',
    septic_tank_level NUMERIC(5, 2) NOT NULL DEFAULT 62.50,
    last_septic_clean_date DATE NOT NULL DEFAULT '2026-05-15',
    next_septic_clean_date DATE NOT NULL DEFAULT '2026-07-15',
    drainage_system VARCHAR(50) NOT NULL DEFAULT '정상',
    cold_chain_temp NUMERIC(4, 2) NOT NULL DEFAULT -18.50
);

-- 6. F&B 타운 빌딩 임대 상태 테이블
CREATE TABLE IF NOT EXISTS buildings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    office_name VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    monthly_rent INT NOT NULL,
    rent_paid BOOLEAN NOT NULL DEFAULT TRUE,
    electricity INT NOT NULL DEFAULT 0,
    water INT NOT NULL DEFAULT 0,
    office_vacant BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. 주방 주문 대기열 (KDS) 테이블
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id VARCHAR(50) PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    worker_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. 전역 변수(설정/공동구매 누적 절감액 등) 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
);

-- ----------------------------------------------------
-- 초기 더미 데이터 시드 (초기 데이터 제공)
-- ----------------------------------------------------

-- Companies 시드
INSERT INTO companies (id, name, business_number, balance, accumulated_meals) VALUES
('c1', '성우건설 (주)', '124-81-99882', 5000000, 420),
('c2', '대우이엔씨 (주)', '214-86-77112', 12500000, 1120),
('c3', '한신공영 (주)', '110-82-44331', 3200000, 280),
('c4', '현대건설 (주)', '101-81-55443', 900000, 150)
ON CONFLICT (id) DO NOTHING;

-- Workers 시드
INSERT INTO workers (id, company_id, name, phone, remaining_points, qr_code) VALUES
('w1', 'c1', '김철수', '010-1234-5678', 25000, 'USER_TOKEN_KCS_1001'),
('w2', 'c1', '이영희', '010-8765-4321', 12000, 'USER_TOKEN_LYH_1002'),
('w3', 'c2', '박민수', '010-1111-2222', 45000, 'USER_TOKEN_PMS_1003'),
('w4', 'c2', '최지우', '010-3333-4444', 0, 'USER_TOKEN_CJW_1004'),
('w5', 'c3', '정태호', '010-5555-6666', 18000, 'USER_TOKEN_JTH_1005'),
('w6', 'c4', '홍길동', '010-9999-8888', 30000, 'USER_TOKEN_HGD_7777')
ON CONFLICT (id) DO NOTHING;

-- Orders 시드
INSERT INTO orders (id, store_name, item_name, quantity, unit, price, original_price, negotiated_price, discount_percent, timestamp, status) VALUES
('o1', '유림푸드 중화식당', '국내산 돈육 삼겹살', 100, 'kg', 18000, 18000, 18000, 0, '2026-06-16 10:30:00+09', 'pending'),
('o2', '양평신내서울해장국', '대파 및 무 박스', 30, 'box', 8000, 8000, 8000, 0, '2026-06-16 11:15:00+09', 'approved'),
('o3', '삼계탕&염소탕', '무항생제 영계 닭', 200, '마리', 6500, 6500, 6500, 0, '2026-06-16 12:00:00+09', 'pending'),
('o4', '장어&고기', '풍천 민물장어 생물', 50, 'kg', 32000, 32000, 32000, 0, '2026-06-16 13:45:00+09', 'rejected'),
('o5', '분식집', '밀가루 및 쌀가루 포대', 15, 'bag', 15000, 15000, 15000, 0, '2026-06-16 14:20:00+09', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Sales 시드
INSERT INTO sales (id, store_name, timestamp, amount, payment_type, worker_name, company_name, menu_name) VALUES
('s1', '양평신내서울해장국', '2026-06-16 08:15:00+09', 11000, 'B2B Coupon', '김철수', '성우건설 (주)', '양평해장국 특'),
('s2', 'CU 편의점', '2026-06-16 09:30:00+09', 4500, 'General', '일반고객', '-', '도시락 및 음료'),
('s3', '유림푸드 중화식당', '2026-06-16 12:10:00+09', 9000, 'B2B Coupon', '박민수', '대우이엔씨 (주)', '자장면 세트'),
('s4', '삼계탕&염소탕', '2026-06-16 13:05:00+09', 16000, 'B2B Coupon', '정태호', '한신공영 (주)', '한방 삼계탕'),
('s5', '분식집', '2026-06-16 14:40:00+09', 7500, 'General', '일반고객', '-', '떡튀순 세트')
ON CONFLICT (id) DO NOTHING;

-- IoT 시설 초기값 시드
INSERT INTO iot_facilities (id, ac_status, temp_setting, ac_peak_control, power_usage, fire_alert_system, septic_tank_level, last_septic_clean_date, next_septic_clean_date, drainage_system, cold_chain_temp) VALUES
('main', 'auto', 23.50, TRUE, 145.20, '정상', 62.50, '2026-05-15', '2026-07-15', '정상', -18.50)
ON CONFLICT (id) DO NOTHING;

-- Buildings 시드
INSERT INTO buildings (id, name, store_name, office_name, expiry_date, monthly_rent, rent_paid, electricity, water, office_vacant) VALUES
('b1', '유림타운 1동', '유림푸드 중화식당', '한성 무역 (사무실)', '2027-04-10', 3500000, TRUE, 420, 85, FALSE),
('b2', '유림타운 2동', '양평신내서울해장국', '대원 물류 (사무실)', '2026-11-20', 4200000, TRUE, 510, 92, FALSE),
('b3', '유림타운 3동', '삼계탕&염소탕', '(공실)', '2026-08-15', 3000000, FALSE, 310, 60, TRUE),
('b4', '유림타운 4동', '장어&고기', '세움 디자인 (사무실)', '2027-01-30', 5000000, TRUE, 680, 115, FALSE),
('b5', '유림타운 5동', '분식집', '에스에이치 파트너스', '2026-12-05', 2800000, TRUE, 290, 45, FALSE),
('b6', '유림타운 6동', 'CU 편의점', '태양 기획 (사무실)', '2027-05-18', 3800000, TRUE, 480, 70, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Kitchen Orders 시드
INSERT INTO kitchen_orders (id, store_name, menu_name, quantity, worker_name, timestamp) VALUES
('ko1', '양평신내서울해장국', '양평해장국 특', 1, '김철수', '2026-06-17 14:30:00+09'),
('ko2', '유림푸드 중화식당', '자장면 세트', 1, '이영희', '2026-06-17 14:33:00+09')
ON CONFLICT (id) DO NOTHING;

-- System Settings 시드
INSERT INTO system_settings (key, value) VALUES
('total_savings', '0')
ON CONFLICT (key) DO NOTHING;
