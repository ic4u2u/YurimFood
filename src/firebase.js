// ============================================================
// firebase.js — Firebase 연결 초기화 파일
// ============================================================
// 이 파일은 우리 앱과 Firebase 서버를 연결하는 "콘센트" 역할을 합니다.
// 한 번만 설정해두면 다른 파일에서 auth, db를 import해서 사용합니다.
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 프로젝트 설정값 (test-57a7c 프로젝트)
// apiKey: Firebase 서버에 접근하기 위한 열쇠 (공개되어도 OK, 보안은 Rules로 설정)
// authDomain: 로그인 처리를 담당하는 Firebase 서버 주소
// projectId: 우리 Firebase 프로젝트 고유 이름
const firebaseConfig = {
  projectId: "test-57a7c",
  appId: "1:150418869273:web:7b40ceca725be8a82c2e88",
  storageBucket: "test-57a7c.firebasestorage.app",
  apiKey: "AIzaSyAXEfRuSwb7nMVCGpl_3yauQRiQjsqlBp8",
  authDomain: "test-57a7c.firebaseapp.com",
  messagingSenderId: "150418869273",
  measurementId: "G-1XS7TKPZ1R",
};

// Firebase 앱 초기화 (가장 먼저 실행해야 함)
const app = initializeApp(firebaseConfig);

// auth: 로그인/로그아웃/사용자 정보를 담당하는 객체
export const auth = getAuth(app);

// db: Firestore 데이터베이스 (역할 정보 저장소)
export const db = getFirestore(app);

export default app;
