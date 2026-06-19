// ============================================================
// AuthContext.jsx — Firebase 인증 상태 전역 관리
// ============================================================
// "Context"란 리액트에서 여러 컴포넌트가 공동으로 쓰는 데이터 창고예요.
// 로그인 정보(누가 로그인했는지, 어떤 역할인지)를 여기서 관리하면
// App의 어떤 부분에서든 "현재 로그인한 사용자" 정보를 바로 꺼내 쓸 수 있습니다.
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Context 생성 (빈 창고 만들기)
export const AuthContext = createContext();

// AuthContext를 쉽게 꺼내 쓰는 편의 훅
export const useAuth = () => useContext(AuthContext);

// 역할(role)별 한글 이름 매핑
export const ROLE_LABELS = {
  super_admin:    '👑 Super Admin (대표)',
  b2b_client:     '🏢 B2B Portal (식권대장)',
  store_pos:      '🛒 Store POS & Scanner',
  kitchen_kds:    '👨‍🍳 주방 KDS 모니터',
  worker_mobile:  '📱 인부 모바일 식권',
};

// ============================================================
// AuthProvider — 앱 최상단에서 로그인 상태를 감시하고 공급
// ============================================================
export const AuthProvider = ({ children }) => {
  // currentUser: Firebase가 알려주는 현재 로그인한 사용자 객체
  //   - null이면 비로그인 상태
  //   - { uid, email, ... } 이면 로그인 상태
  const [currentUser, setCurrentUser] = useState(null);

  // userRole: Firestore에서 읽어온 역할 문자열
  //   예: 'super_admin', 'store_pos', 'worker_mobile' 등
  const [userRole, setUserRole] = useState(null);

  // userName: Firestore에 저장된 사용자 이름
  const [userName, setUserName] = useState('');

  // companyId: B2B 담당자의 경우 소속 회사 ID (예: 'c1')
  const [userCompanyId, setUserCompanyId] = useState(null);

  // loading: Firebase가 로그인 상태를 확인하는 중인지 여부
  //   처음 앱이 열릴 때 Firebase 서버에 "이전에 로그인했었나?"를 물어보는 시간 동안 true
  const [loading, setLoading] = useState(true);

  // authError: 로그인 실패 시 보여줄 오류 메시지
  const [authError, setAuthError] = useState('');

  // --------------------------------------------------------
  // Firebase Auth 상태 감시 (onAuthStateChanged)
  // --------------------------------------------------------
  // Firebase가 자동으로 로그인/로그아웃 상태 변화를 알려줍니다.
  // 브라우저를 새로고침해도 Firebase가 쿠키/토큰을 기억해서 자동 로그인 유지!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 로그인된 사용자 → Firestore에서 역할 정보 읽기
        setCurrentUser(user);
        await loadUserRole(user.uid);
      } else {
        // 로그아웃 상태
        setCurrentUser(null);
        setUserRole(null);
        setUserName('');
        setUserCompanyId(null);
      }
      setLoading(false);
    });

    // 컴포넌트가 사라질 때 감시 해제 (메모리 누수 방지)
    return unsubscribe;
  }, []);

  // --------------------------------------------------------
  // Firestore에서 역할 정보 불러오기
  // --------------------------------------------------------
  // Firestore 구조: users/{uid} → { role, name, companyId }
  const loadUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role || 'super_admin');
        setUserName(data.name || '');
        setUserCompanyId(data.companyId || null);
      } else {
        // Firestore에 역할 정보가 없으면 기본값으로 super_admin 설정
        setUserRole('super_admin');
        setUserName('관리자');
      }
    } catch (err) {
      console.error('역할 정보 로드 실패:', err);
      setUserRole('super_admin');
    }
  };

  // --------------------------------------------------------
  // 로그인 함수 (이메일 + 비밀번호)
  // --------------------------------------------------------
  const login = async (email, password) => {
    setAuthError('');
    try {
      // Firebase에 이메일/비밀번호를 보내서 검증 요청
      await signInWithEmailAndPassword(auth, email, password);
      // 성공하면 onAuthStateChanged가 자동으로 currentUser를 업데이트함
      return { success: true };
    } catch (err) {
      // Firebase 에러 코드를 한글 메시지로 변환
      const msg = getKoreanErrorMessage(err.code);
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  // --------------------------------------------------------
  // 로그아웃 함수
  // --------------------------------------------------------
  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged가 자동으로 상태를 null로 업데이트
  };

  // --------------------------------------------------------
  // Firebase 오류 코드 → 한글 메시지 변환
  // --------------------------------------------------------
  const getKoreanErrorMessage = (code) => {
    const messages = {
      'auth/user-not-found':    '등록되지 않은 이메일입니다.',
      'auth/wrong-password':    '비밀번호가 올바르지 않습니다.',
      'auth/invalid-email':     '이메일 형식이 올바르지 않습니다.',
      'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
      'auth/invalid-credential':'이메일 또는 비밀번호가 올바르지 않습니다.',
    };
    return messages[code] || `로그인 오류: ${code}`;
  };

  // --------------------------------------------------------
  // Provider가 공급하는 값들 (어떤 컴포넌트에서든 꺼내 쓸 수 있음)
  // --------------------------------------------------------
  const value = {
    currentUser,    // Firebase 사용자 객체 (null이면 비로그인)
    userRole,       // 역할 문자열 ('super_admin', 'store_pos' 등)
    userName,       // 사용자 이름 ('이용주', '홍길동' 등)
    userCompanyId,  // B2B 담당자 회사 ID (일반 사용자는 null)
    loading,        // 초기 로드 중 여부
    authError,      // 로그인 오류 메시지
    login,          // 로그인 함수
    logout,         // 로그아웃 함수
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
