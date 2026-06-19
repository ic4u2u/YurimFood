// ============================================================
// scripts/createUsers.js — Firebase 초기 사용자 계정 생성 스크립트
// ============================================================
// 이 스크립트는 한 번만 실행하면 됩니다.
// Firebase Authentication에 계정을 만들고,
// Firestore에 역할(role) 정보도 함께 저장합니다.
//
// 실행 방법: node scripts/createUsers.js
// ============================================================

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK 초기화
// applicationDefault() = gcloud auth로 로그인된 계정 정보를 자동 사용
// 별도 키 파일 불필요!
initializeApp({
  credential: applicationDefault(),
  projectId: 'test-57a7c',
});

const adminAuth = getAuth();
const adminDb = getFirestore();

// ============================================================
// 생성할 사용자 목록
// ============================================================
// role 종류:
//   super_admin   → 전체 대시보드 (대표)
//   b2b_client    → B2B Portal만 (건설사 담당자)
//   store_pos     → Store POS만 (식당 계산대)
//   kitchen_kds   → Kitchen KDS만 (주방 모니터)
// ============================================================
const users = [
  {
    email: 'admin@yurimfood.com',
    password: 'yurim2024!',
    name: '이용주 대표',
    role: 'super_admin',
    companyId: null,
  },
  {
    email: 'b2b@sungwoo.com',
    password: 'yurim2024!',
    name: '성우건설 담당자',
    role: 'b2b_client',
    companyId: 'c1',  // 성우건설 (주) ID
  },
  {
    email: 'pos@yurimtown.com',
    password: 'yurim2024!',
    name: '양평해장국 POS',
    role: 'store_pos',
    companyId: null,
  },
  {
    email: 'kitchen@yurimtown.com',
    password: 'yurim2024!',
    name: '주방 모니터',
    role: 'kitchen_kds',
    companyId: null,
  },
];

// ============================================================
// 사용자 생성 함수
// ============================================================
async function createUser(userData) {
  try {
    // 1. Firebase Auth에 이메일/비밀번호 계정 생성
    const userRecord = await adminAuth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
    });

    console.log(`✅ Auth 계정 생성: ${userData.email} (uid: ${userRecord.uid})`);

    // 2. Firestore의 users/{uid} 문서에 역할 정보 저장
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: userData.email,
      name: userData.name,
      role: userData.role,
      companyId: userData.companyId,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Firestore 역할 저장: ${userData.name} → ${userData.role}`);
    return userRecord.uid;

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  이미 존재하는 계정: ${userData.email} (건너뜀)`);
    } else {
      console.error(`❌ 오류 (${userData.email}):`, error.message);
    }
  }
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  console.log('🚀 유림푸드 ERP 초기 사용자 계정 생성 시작...\n');
  
  for (const user of users) {
    await createUser(user);
  }

  console.log('\n🎉 완료! 아래 계정으로 로그인하세요:');
  console.log('─────────────────────────────────────────');
  users.forEach(u => {
    console.log(`  ${u.role.padEnd(15)} │ ${u.email} │ 비밀번호: ${u.password}`);
  });
  console.log('─────────────────────────────────────────');
  
  process.exit(0);
}

main().catch(err => {
  console.error('스크립트 실행 오류:', err);
  process.exit(1);
});
