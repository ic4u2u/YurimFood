import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  Users,
  ShoppingBag,
  QrCode,
  Flame,
  CheckCircle,
  Database,
  Smartphone,
  Monitor,
  Layout,
  FileText,
  TrendingUp,
  RefreshCw,
  Server,
  Zap,
  Info,
  Clock,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function UserGuidePage({ theme }) {
  const [activeTab, setActiveTab] = useState('overview');

  const menuGuides = {
    overview: {
      title: '유림푸드 스마트 ERP 개요',
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      desc: '유림푸드 F&B 타운 통합 ERP는 최고 관리자(건물주), 협력사(건설사), 입점 매장, 현장 노동자, 주방 조리실이 실시간으로 상호작용하는 국내 유일의 프롭테크 및 푸드테크 융합형 솔루션입니다.',
      points: [
        {
          title: '5대 사용자 역할(Role) 통합 연동',
          text: '최고 관리자(건물 총괄)부터 현장의 일반 근로자까지 각자의 단말기(PC, POS 태블릿, 스마트폰 웹앱, 주방 모니터)를 통해 한 시스템 안에서 유기적으로 데이터를 공유합니다. 수작업 정산 시 발생하는 대조 오류가 0%로 수렴합니다.'
        },
        {
          title: '보안 OTP QR 모바일 식권의 핵심 기술',
          text: '매 30초마다 보안 서버와 난수 암호화 검증을 거치는 갱신형 OTP QR 식권을 발행합니다. 화면 캡처나 촬영본 공유를 통한 불법 이중 식사(식권 부정수급)를 원천 차단하여 협력사의 식대 낭비를 방지합니다.'
        },
        {
          title: '실시간 주방 KDS 및 피크 타임 경고 시스템',
          text: '매장 POS 단말기에서 결제 승인이 떨어지자마자 주방 조리실 모니터에 알림음과 함께 대기 카드가 접수됩니다. 조리 개시 후 3분이 경과하도록 완료되지 않으면 카드가 붉은색으로 깜빡이며 빠른 조리를 독촉합니다.'
        },
        {
          title: '식봄 SCM 연동 공동구매 통합 네고 엔진',
          text: '개별 입점 매장들이 각각 대파, 마늘, 고춧가루 등의 식자재를 소량 발주하더라도, 최고 관리자가 발주를 취합하여 도매 파트너(식봄)와 대량 물량 네고를 진행합니다. 이를 통해 입점 매장들은 최대 20%의 식자재 절감 효과를 누립니다.'
        }
      ]
    },
    super_admin: {
      title: '👑 최고 관리자 (Super Admin) 메뉴 가이드',
      icon: <Building2 className="w-5 h-5 text-indigo-500" />,
      desc: 'F&B 타운 전체의 자금 흐름을 조율하고 건물(6개동)의 프롭테크 임대 현황 및 식자재 공동구매 단가 조율 등을 관리하는 최상위 관제 메뉴입니다.',
      points: [
        {
          title: '왜 이 메뉴가 필요한가요? (도입 배경)',
          text: 'F&B 타운에 입점한 여러 매장들의 일일 식수, 매출 장부, 그리고 각 건물의 임대료 수납 상태를 수작업(엑셀)으로 취합할 경우 정산일 지연과 데이터 유실이 발생합니다. 본 메뉴는 F&B 타운의 자산과 자금을 중앙에서 실시간으로 통제하기 위해 구축되었습니다.'
        },
        {
          title: '1. 실시간 매출 및 피크 타임 식수 모니터링',
          text: '• ECharts 분석 도구로 오늘 전체 매장의 총 매출액과 기여도 점유율을 확인합니다.\n• 점심 피크 시간대(11:30 ~ 13:30)에 각 매장별로 식수가 얼마나 몰렸는지 실시간으로 모니터링하여 병목 현상 및 혼잡도를 진단합니다.'
        },
        {
          title: '2. 프롭테크 기반 임대 수납 및 연체 독촉 (Dunning)',
          text: '• 유림 F&B 타운 6개동 매장들의 상세 임대차 계약정보, 월세 입금 여부를 실시간 조회합니다.\n• 납부 기한이 3일 이상 연체된 매장에 대해서는 시스템이 자동으로 경고 상태를 감지하며, [독촉장 즉시 발송] 버튼을 클릭해 공식 연체 공문 및 알림 통보를 가상 시뮬레이션으로 내보낼 수 있습니다.'
        },
        {
          title: '3. 공동구매 발주 중재 및 볼륨 디스카운트 승인',
          text: '• 입점 매장들이 POS를 통해 개별 신청한 식자재 발주서 목록을 한눈에 모아봅니다.\n• [공동구매 단가 네고 및 승인] 버튼을 누르면 발주 총량이 취합되어 대량 구매 할인(5%~20%)이 적용된 도매 단가로 최종 주문이 성사되며 매장별 원가 절감을 지원합니다.'
        }
      ]
    },
    b2b_client: {
      title: '🤝 협력사 식권관리 (B2B Portal) 가이드',
      icon: <Users className="w-5 h-5 text-emerald-500" />,
      desc: '대형 건설사(현대건설, 삼성물산 등)의 인사/총무 담당자가 현장 근로자용 장부(달장부) 식권을 배포, 정산 및 한도를 제어하는 포털입니다.',
      points: [
        {
          title: '왜 이 메뉴가 필요한가요? (도입 배경)',
          text: '기존의 건설 현장 식대 관리는 종이 식권을 일일이 나누어 주거나 장부에 손으로 적게 하여 분실, 허위 식수 청구, 대리 서명 등의 부정이 잦았습니다. 본 포털은 모바일 식권의 발급부터 예치금 충전까지 디지털로 투명하게 제어하여 기업의 정산 수고와 불필요한 식대 낭비를 100% 제거합니다.'
        },
        {
          title: '1. 가상계좌 예치금 충전 시뮬레이션',
          text: '• 근로자에게 식권을 배포하기 위한 선불 예치금 지갑입니다.\n• [가상계좌 입금 시뮬레이션] 창에서 가상 계좌번호로 입금하고자 하는 금액을 입력하면 즉각 기업 잔액에 금액이 적립되며, 실시간으로 반영됩니다.'
        },
        {
          title: '2. 현장 근로자 등록 및 식권(토큰) 일괄 발급',
          text: '• 신규 현장 근로자의 이름과 전화번호를 입력하여 시스템에 등록하면 당일 사용 가능한 25,000P 한도의 식권이 즉시 발급됩니다.\n• 퇴사자나 미출근 근로자는 즉시 리스트에서 삭제하여 불필요한 식권 남용을 미연에 방지합니다.'
        },
        {
          title: '3. 실시간 식사 이력 확인 및 회계 증빙 내보내기',
          text: '• 소속 근로자가 오늘 몇 시 몇 분에 어느 식당(한식, 중식 등)에서 무슨 메뉴를 얼마에 먹었는지 상세 장부 이력이 실시간 업데이트됩니다.\n• 이 모든 장부 내역은 월말 정산을 위해 엑셀(CSV) 형식 보고서로 즉시 다운로드하여 지출 결의서 및 회계 자료로 바로 제출할 수 있습니다.'
        }
      ]
    },
    store_pos: {
      title: '🖥️ 매장 결제관리 (Store POS) 가이드',
      icon: <ShoppingBag className="w-5 h-5 text-amber-500" />,
      desc: 'F&B 타운 입점 점포 카운터에 비치된 태블릿 POS 화면입니다. 고객이 제시한 모바일 식권을 스캔하고, 도매 식자재 공동구매를 신청합니다.',
      points: [
        {
          title: '왜 이 메뉴가 필요한가요? (도입 배경)',
          text: '바쁜 점심 시간대(11:30~13:30)에 수백 명의 건설 근로자가 종이 장부 서명을 하거나 식권을 내고 가면, 대기 시간이 길어지고 월말에 종이를 다 모아 확인하는 정산 피로가 심각했습니다. 스마트 POS를 통해 근로자는 화면 스캔만으로 1초 만에 승인 완료되며, 데이터가 즉각 클라우드에 쌓입니다.'
        },
        {
          title: '1. 매장 로그인 설정 및 결제 메뉴 선택',
          text: '• POS 화면 상단의 매장 설정 바에서 해당 식당(예: 양평신내서울해장국)을 선택합니다.\n• 손님이 오면 주문할 메뉴를 터치합니다. 결제 금액이 정산 대기 상태로 고정되며 QR 스캐너가 대기 모드로 전환됩니다.'
        },
        {
          title: '2. 근로자 QR 코드 스캔 및 30초 중복 방지 검증',
          text: '• 근로자가 스마트폰으로 제시하는 갱신형 OTP QR 코드를 태블릿 카메라에 비추거나, 아래 표시된 6자리 번호를 수동 입력합니다.\n• **[보안 차단 핵심]**: 동일한 QR코드가 30초 내에 이중으로 찍히면 "중복 사용 감지" 경고를 뿜어내며 결제를 차단합니다. 캡처나 이미지 복사로 한 식권을 두 명이 돌려 쓰는 행위를 원천적으로 방어합니다.'
        },
        {
          title: '3. 식봄 도매 공동구매 원자재 발주',
          text: '• 식당 운영에 필수적인 식자재(대파, 쌀, 마늘 등)를 도매 카탈로그에서 필요한 만큼 담아 [발주 신청]을 누릅니다.\n• 개별 발주된 이 내역은 자동으로 최고 관리자의 공동구매 취합 시스템으로 넘어가며, 단가 인하 및 물량 할인(볼륨 디스카운트) 혜택을 연계 적용받게 됩니다.'
        }
      ]
    },
    worker_mobile: {
      title: '📱 근로자 식권관리 (Worker Mobile) 가이드',
      icon: <QrCode className="w-5 h-5 text-purple-500" />,
      desc: '현장 근로자가 개인 스마트폰으로 간편하게 밥을 먹고 당일 잔여 식대 및 개인 식사 기록을 투명하게 조회하는 모바일 전용 디지털 식권입니다.',
      points: [
        {
          title: '★ 왜 모바일 디지털 식권이 꼭 필요한가요?',
          text: '1. **분실 위험 해소**: 지갑을 잃어버리거나 종이 식권을 깜빡 잊고 안 가져와서 식사를 굶거나 재발급을 요청해야 하는 소모적인 절차가 없습니다. 스마트폰 하나로 현장 어디서든 바로 밥을 먹을 수 있습니다.\n2. **메뉴 선택의 자유**: 예전처럼 지정된 단 한 곳의 함바집에서만 밥을 먹어야 하는 답답함이 없습니다. 유림 F&B 타운 내 5개 식당(한식, 중식, 양식, 분식 등)의 모든 메뉴 중 자신이 원하는 매장을 골라 예산(일일 25,000P 한도) 내에서 자유롭게 결제할 수 있습니다.\n3. **캡처/복사본 부정수급 차단 (30초 OTP)**: 기존의 일반 QR코드나 바코드는 이미지로 캡처하여 동료에게 공유하거나 인터넷으로 복사하여 여러 사람이 중복 결제하는 식대 누수 행위가 빈번했습니다. 유림푸드 식권은 30초마다 무작위 암호 난수가 바뀌는 OTP(One Time Password) QR을 적용하여, 캡처해서 카카오톡 등으로 동료에게 전달하는 사이 이미 만료 코드가 되므로 불법 중복 사용이 원천적으로 불가능합니다.'
        },
        {
          title: '1단계: 휴대폰 번호 입력 및 보안 간편 로그인',
          text: '• 별도의 무거운 앱을 설치하거나 ID/비밀번호를 기억할 필요가 없습니다.\n• 모바일 웹 페이지 접속 후 협력사 관리 포털에 사전 등록된 본인의 휴대폰 연락처(예: 010-1234-5678)만 입력하면 별도 비밀번호 없이 신속하게 본인 전용 식권 화면에 안전하게 진입합니다.'
        },
        {
          title: '2단계: 실시간 30초 타이머 OTP QR 생성 확인',
          text: '• 로그인에 성공하면 화면 중앙에 실시간으로 깜빡이는 바코드와 일회용 OTP QR 코드가 나타납니다.\n• QR 코드 테두리 부분에는 30초 카운트다운 타이머가 표시됩니다. 30초가 지나 시간 제한이 끝나면 기존 코드는 소멸되고 완전히 새로운 보안 난수가 적용된 새 QR 코드가 다시 그려집니다.'
        },
        {
          title: '3단계: 식당 카운터 스캔 또는 OTP 번호 입력',
          text: '• F&B 타운 매장에 진입하여 음식을 주문할 때, 내 스마트폰에 활성화된 30초짜리 QR 코드를 카운터 태블릿의 QR 스캐너 영역에 비추어 줍니다.\n• 카메라 렌즈 인식이나 기기 인식이 어려운 경우, QR 코드 하단에 실시간으로 생성된 6자리 번호를 카운터 이모님이나 직원분에게 직접 불러주어 즉각 결제를 승인 처리할 수도 있습니다.'
        },
        {
          title: '4단계: 잔여 포인트 및 내 식사 내역 조회',
          text: '• 결제 스캔음과 함께 오늘의 잔여 한도(기본 25,000P)에서 결제한 메뉴 단가가 차감되어 남은 금액이 즉시 차감 표시됩니다.\n• 모바일 화면 아래에는 내가 오늘 어느 식당에서 몇 시 몇 분에 해장국을 먹었고 지출은 얼마를 했는지 달장부 내역이 투명하게 자동 누적되어, 이력 확인이 언제든지 가능합니다.'
        }
      ]
    },
    kitchen_kds: {
      title: '👨‍🍳 주방 주문관리 (Kitchen KDS) 가이드',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      desc: '식당 조리대 앞에 거치되어 영수증 빌지 종이 없이 실시간 주문 카드를 접수하고, 조리 완료 신호를 카운터 및 손님 스마트폰으로 호출하는 시스템입니다.',
      points: [
        {
          title: '왜 이 메뉴가 필요한가요? (도입 배경)',
          text: '주방 조리 중 종이 영수증 빌지가 젖거나 찢어져 주문이 누락되거나, 어떤 음식이 먼저 들어왔는지 순서가 뒤섞이는 혼선이 잦았습니다. KDS 모니터는 주문 시점부터 조리 경과 시간(초 단위)을 중앙 관제하여 조리 효율을 비약적으로 상승시키고 손님 대기 지연을 예방합니다.'
        },
        {
          title: '1. 실시간 연동 접수 및 주문 카드 자동 배치',
          text: '• 카운터 POS에서 모바일 식권 스캔 결제가 떨어지자마자, 주방 모니터 화면에 주문 번호, 상세 메뉴명, 수량, 결제 시각이 담긴 대기 카드가 영수증 인쇄음과 함께 실시간 접수됩니다.\n• 들어온 순서대로 좌측부터 차곡차곡 카드가 정렬되므로 조리 순서 꼬임이 없습니다.'
        },
        {
          title: '2. 실시간 조리 경과 카운트 및 3분 초과 경고 (Blinker)',
          text: '• 주문 카드가 들어온 순간부터 1초 단위로 경과 시간이 카운트업되어 나타납니다.\n• **[경고 신호]**: 주문 접수 후 3분(180초)이 지나도록 조리가 시작되지 않거나 완료되지 않으면 해당 주문 카드 전체가 시뻘겋게 깜빡(Blinking)거리며 주방 조리사에게 신속 조리를 촉구합니다.'
        },
        {
          title: '3. 조리 완료 원클릭 호출 연동',
          text: '• 음식이 완성되면 주방 모니터 화면 하단의 녹색 [조리 완료] 버튼을 터치합니다.\n• 완료 즉시 대기열 목록에서 해당 카드가 사라짐과 동시에, 카운터 태블릿 및 해당 음식을 기다리던 근로자의 스마트폰으로 "음식이 완성되었으니 받아 가세요!"라는 알림 호출 신호가 실시간 연동되어 조리 완료 회전율을 최대로 끌어올립니다.'
        }
      ]
    },
    upgrades: {
      title: '🚀 시스템 업그레이드 & 수정 요구사항 반영 현황',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      desc: '이용주 대표님의 소중한 피드백을 수렴하여 유림푸드 ERP 시스템이 스마트하게 개편 완료된 내역과 향후 계획을 상세히 보고드립니다.',
      points: [
        {
          title: 'PC/모바일 하이브리드 반응형 레이아웃 완료 (26년 6월)',
          text: '사무실의 넓은 PC 모니터 화면과 현장의 다양한 스마트폰 화면 크기 모두에 알맞게 자동 비율 조정(줌인/줌아웃) 및 가로 스크롤 레이아웃이 적용되었습니다. 모바일에서 상단 메뉴바가 잘리는 현상을 완벽하게 예방하였습니다.'
        },
        {
          title: 'Neon PostgreSQL 실서버 데이터베이스 전환 (26년 6월)',
          text: '임시 메모리 파일 기록 방식에서 탈피하여 AWS 클라우드 기반의 Neon PostgreSQL 실시간 DB 서버로 완벽하게 이전 완료했습니다. 상단 동기화 배지에 "서버 연결됨" 상태가 초록색으로 실시간 표시됩니다.'
        },
        {
          title: '네트워크 장애 대비 로컬 JSON 오프라인 안전장치 (26년 6월)',
          text: '현장 무선 인터넷 신호가 불안정하거나 서버 점검 중일 경우에도, 시스템이 다운되지 않고 로컬 캐시 파일(`server/data/*.json`)에서 데이터를 읽어 결제 및 QR 조회를 처리하는 "오프라인 세이프티 모드"를 탑재했습니다.'
        },
        {
          title: 'Firebase Hosting 및 발표용 슬라이드 보존 배포 (26년 6월)',
          text: '실서버 주소인 https://yulimfood.web.app 도메인 배포 체계를 세팅했습니다. 대표님이 외부 바이어 미팅 및 투자 유치 IR로 사용하시는 프레젠테이션(/presentation/index.html)이 빌드 단계에서 지워지지 않도록 빌드 공정을 견고하게 재조정했습니다.'
        }
      ]
    }
  };

  const currentGuide = menuGuides[activeTab];

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-fadeIn font-sans">
      {/* SIDEBAR NAVIGATION TAB */}
      <aside className="w-full lg:w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-2 shrink-0 shadow-sm">
        <div className="px-3 py-2.5 mb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-black tracking-wide text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" /> 가이드북 목차
          </h3>
        </div>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4" />
            <span>ERP 종합 개요 🗺️</span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'overview' ? 'translate-x-0.5' : ''} transition-transform`} />
        </button>

        <button
          onClick={() => setActiveTab('super_admin')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'super_admin'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4" />
            <span>최고 관리자 모드 👑</span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'super_admin' ? 'translate-x-0.5' : ''} transition-transform`} />
        </button>

        <button
          onClick={() => setActiveTab('b2b_client')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'b2b_client'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4" />
            <span>협력사 식권관리 🤝</span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'b2b_client' ? 'translate-x-0.5' : ''} transition-transform`} />
        </button>

        <button
          onClick={() => setActiveTab('store_pos')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'store_pos'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4" />
            <span>매장 결제 POS 🖥️</span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'store_pos' ? 'translate-x-0.5' : ''} transition-transform`} />
        </button>

        <button
          onClick={() => setActiveTab('worker_mobile')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'worker_mobile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <QrCode className="w-4 h-4" />
            <span>근로자 모바일 📱</span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'worker_mobile' ? 'translate-x-0.5' : ''} transition-transform`} />
        </button>

        <button
          onClick={() => setActiveTab('kitchen_kds')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'kitchen_kds'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4" />
            <span>주방 주문 KDS 👨‍🍳</span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'kitchen_kds' ? 'translate-x-0.5' : ''} transition-transform`} />
        </button>

        <div className="border-t border-zinc-100 dark:border-zinc-800 my-2 pt-2">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'upgrades'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4" />
              <span>업그레이드 현황 🚀</span>
            </div>
            <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'upgrades' ? 'translate-x-0.5' : ''} transition-transform`} />
          </button>
        </div>
      </aside>

      {/* DETAIL CONTENT AREA */}
      <main className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        {/* Title & Badge */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              {currentGuide.icon}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{currentGuide.title}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium leading-relaxed">
                {currentGuide.desc}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider hidden sm:inline-block">YULIM FOOD ERP</span>
        </div>

        {/* Bullet Points Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {currentGuide.points.map((point, i) => (
            <div
              key={i}
              className="group p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:bg-zinc-50/20 dark:hover:bg-zinc-950/40 rounded-xl flex flex-col gap-2 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0 transition-transform group-hover:scale-110" />
                <h4 className="text-xs md:text-sm font-extrabold text-zinc-800 dark:text-zinc-100 font-sans tracking-tight">
                  {point.title}
                </h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium pl-6 whitespace-pre-line">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        {/* Visual Tip Box */}
        <div className="bg-blue-50/50 dark:bg-zinc-950/50 border border-blue-100/40 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="font-extrabold text-blue-700 dark:text-blue-400">개발자의 실무 팁:</span> 이 설명서의 내용은 실제 기획 요구사항 및 현장 테스트 결과를 분석하여 작성되었습니다. 사용 과정에서 건의사항이나 수정이 필요한 점이 발생하시면 언제든지 개발부로 피드백을 전달해 주십시오. 즉각 반영하겠습니다!
          </div>
        </div>
      </main>
    </div>
  );
}
