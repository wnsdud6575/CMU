'use client';
import { createContext, useContext, useState } from 'react';

const CATEGORIES = {
  A: { name: '무용복', code: 'A', subs: { adult: { top: '성인 상의', bottom: '성인 하의', onepiece: '성인 한벌' }, child: { top: '아동 상의', bottom: '아동 하의', onepiece: '아동 한벌' } } },
  B: { name: '국악', code: 'B', subs: { adult: { top: '성인 상의', bottom: '성인 하의', onepiece: '성인 한벌' }, child: { top: '아동 상의', bottom: '아동 하의', onepiece: '아동 한벌' } } },
  C: { name: '의전도열', code: 'C', subs: { adult: { top: '성인 상의', bottom: '성인 하의', onepiece: '성인 한벌' }, child: { top: '아동 상의', bottom: '아동 하의', onepiece: '아동 한벌' } } },
  D: { name: '단복', code: 'D', subs: { adult: { top: '성인 상의', bottom: '성인 하의', onepiece: '성인 한벌' }, child: { top: '아동 상의', bottom: '아동 하의', onepiece: '아동 한벌' } } },
  E: { name: '연극의상', code: 'E', subs: { adult: { top: '성인 상의', bottom: '성인 하의', onepiece: '성인 한벌' }, child: { top: '아동 상의', bottom: '아동 하의', onepiece: '아동 한벌' } } },
  G: { name: '특수의상', code: 'G', subs: { adult: { top: '성인 상의', bottom: '성인 하의', onepiece: '성인 한벌' }, child: { top: '아동 상의', bottom: '아동 하의', onepiece: '아동 한벌' } } },
  Z: { name: '소품', code: 'Z', subs: { belt: '벨트', headband: '머리띠', gaiters: '각반', textile: '테이블보/천', accessory: '기타 소품' } },
  H: { name: '기타', code: 'H', subs: { etc: '기타' } },
};

const STATUS_LABELS = {
  available: '사용가능',
  'in-use': '대여중',
  repair: '수리필요',
  discard: '폐기',
};

const CONDITION_LABELS = {
  excellent: '상',
  good: '중상',
  fair: '중',
  poor: '하',
};

const LAUNDRY_METHODS = [
  '드라이클리닝',
  '물세탁 가능',
  '찬물 단독 세탁',
  '부분 오염 제거',
  '전문 세탁소 의뢰',
  '세탁 금지',
];

const LOCATIONS = [
  '연수원 1층(홍보관)', '연수원 1층(유년회실)', '연수원 2층(복도 사물함)',
  '연수원 2층(세미나룸 내부 사물함)', '연수원 5층(스튜디오)', '연수원 6층(창고)',
  '연수원 6층(알파 창고)', '연수원 6층(로비 창고)', '연수원 7층(창고)', '광안 2층(창고)',
];

const SAMPLE_ITEMS = [
  {
    id: 1,
    name: '여름 의전용 원피스',
    code: 'C-A-ONE-001',
    assemblyCode: 'SCJ-C-001',
    localCode: 'JIPA-C-001',
    category: 'C',
    costumeLine: '의전도열',
    ageGroup: 'adult',
    subType: 'onepiece',
    quantity: 12,
    sizeBreakdown: '55 4벌 / 66 6벌 / 77 2벌',
    productionYear: '2023',
    condition: 'good',
    location: '연수원 6층(창고)',
    status: 'available',
    laundryMethod: '드라이클리닝',
    repairRequired: false,
    repairNote: '',
    keywords: ['여름', '화이트', '의전'],
    hidden: false,
    qrCode: 'QR-C-A-ONE-001',
    photo: null,
    photoTone: 'linear-gradient(135deg, #e0f2fe, #dbeafe)',
  },
  {
    id: 2,
    name: '고급 실크 테이블보',
    code: 'Z-TEXTILE-002',
    assemblyCode: 'SCJ-Z-022',
    localCode: 'JIPA-Z-002',
    category: 'Z',
    costumeLine: '행사 소품',
    ageGroup: null,
    subType: 'textile',
    quantity: 45,
    sizeBreakdown: '180x120cm 45장',
    productionYear: '2024',
    condition: 'excellent',
    location: '연수원 2층(세미나룸 내부 사물함)',
    status: 'available',
    laundryMethod: '찬물 단독 세탁',
    repairRequired: false,
    repairNote: '',
    keywords: ['화이트', '실크', '테이블보'],
    hidden: false,
    qrCode: 'QR-Z-TEXTILE-002',
    photo: null,
    photoTone: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
  },
  {
    id: 3,
    name: '남성 정장 자켓 네이비',
    code: 'D-A-TOP-003',
    assemblyCode: 'SCJ-D-017',
    localCode: 'JIPA-D-003',
    category: 'D',
    costumeLine: '단복',
    ageGroup: 'adult',
    subType: 'top',
    quantity: 8,
    sizeBreakdown: '95 2벌 / 100 4벌 / 105 2벌',
    productionYear: '2022',
    condition: 'fair',
    location: '연수원 6층(알파 창고)',
    status: 'available',
    laundryMethod: '전문 세탁소 의뢰',
    repairRequired: false,
    repairNote: '',
    keywords: ['정장', '네이비', '자켓'],
    hidden: false,
    qrCode: 'QR-D-A-TOP-003',
    photo: null,
    photoTone: 'linear-gradient(135deg, #cbd5e1, #64748b)',
  },
  {
    id: 4,
    name: '장식용 깃발 세트',
    code: 'Z-ACC-004',
    assemblyCode: 'SCJ-Z-031',
    localCode: 'JIPA-Z-004',
    category: 'Z',
    costumeLine: '행사 소품',
    ageGroup: null,
    subType: 'accessory',
    quantity: 5,
    sizeBreakdown: '대형 5세트',
    productionYear: '2021',
    condition: 'good',
    location: '광안 2층(창고)',
    status: 'available',
    laundryMethod: '부분 오염 제거',
    repairRequired: false,
    repairNote: '',
    keywords: ['깃발', '골드', '행사'],
    hidden: false,
    qrCode: 'QR-Z-ACC-004',
    photo: null,
    photoTone: 'linear-gradient(135deg, #fef3c7, #fde68a)',
  },
  {
    id: 5,
    name: '시즌용 벨벳 코트',
    code: 'E-A-TOP-005',
    assemblyCode: 'SCJ-E-009',
    localCode: 'JIPA-E-005',
    category: 'E',
    costumeLine: '연극의상',
    ageGroup: 'adult',
    subType: 'top',
    quantity: 6,
    sizeBreakdown: 'Free 6벌',
    productionYear: '2020',
    condition: 'fair',
    location: '연수원 7층(창고)',
    status: 'in-use',
    laundryMethod: '드라이클리닝',
    repairRequired: true,
    repairNote: '소매 단추 1개 보강 필요',
    keywords: ['겨울', '블랙', '벨벳'],
    hidden: false,
    qrCode: 'QR-E-A-TOP-005',
    photo: null,
    photoTone: 'linear-gradient(135deg, #312e81, #111827)',
  },
  {
    id: 6,
    name: '국악 아동 저고리',
    code: 'B-C-TOP-006',
    assemblyCode: 'SCJ-B-041',
    localCode: 'JIPA-B-006',
    category: 'B',
    costumeLine: '국악',
    ageGroup: 'child',
    subType: 'top',
    quantity: 20,
    sizeBreakdown: '7호 8벌 / 9호 8벌 / 11호 4벌',
    productionYear: '2024',
    condition: 'excellent',
    location: '연수원 1층(홍보관)',
    status: 'available',
    laundryMethod: '물세탁 가능',
    repairRequired: false,
    repairNote: '',
    keywords: ['한복', '아동', '저고리'],
    hidden: false,
    qrCode: 'QR-B-C-TOP-006',
    photo: null,
    photoTone: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
  },
  {
    id: 7,
    name: '무용 레오타드 블랙',
    code: 'A-A-ONE-007',
    assemblyCode: 'SCJ-A-026',
    localCode: 'JIPA-A-007',
    category: 'A',
    costumeLine: '무용복',
    ageGroup: 'adult',
    subType: 'onepiece',
    quantity: 15,
    sizeBreakdown: 'S 5벌 / M 7벌 / L 3벌',
    productionYear: '2022',
    condition: 'good',
    location: '연수원 5층(스튜디오)',
    status: 'available',
    laundryMethod: '찬물 단독 세탁',
    repairRequired: false,
    repairNote: '',
    keywords: ['무용', '블랙', '레오타드'],
    hidden: false,
    qrCode: 'QR-A-A-ONE-007',
    photo: null,
    photoTone: 'linear-gradient(135deg, #27272a, #0f172a)',
  },
  {
    id: 8,
    name: '의전 아동 조끼',
    code: 'C-C-TOP-008',
    assemblyCode: 'SCJ-C-048',
    localCode: 'JIPA-C-008',
    category: 'C',
    costumeLine: '의전도열',
    ageGroup: 'child',
    subType: 'top',
    quantity: 10,
    sizeBreakdown: '9호 5벌 / 11호 5벌',
    productionYear: '2021',
    condition: 'poor',
    location: '연수원 1층(유년회실)',
    status: 'repair',
    laundryMethod: '전문 세탁소 의뢰',
    repairRequired: true,
    repairNote: '앞단추 교체 후 대여 가능',
    keywords: ['조끼', '아동', '의전'],
    hidden: false,
    qrCode: 'QR-C-C-TOP-008',
    photo: null,
    photoTone: 'linear-gradient(135deg, #fee2e2, #fecaca)',
  },
];

const SAMPLE_SETS = [
  { id: 1, name: '국악 아동 기본 세트', items: [6, 4], description: '국악 아동 저고리와 행사 소품을 함께 구성한 추천 세트', photo: null },
  { id: 2, name: '의전 원피스 풀세트', items: [1, 3], description: '의전 촬영용 원피스와 정장 자켓을 함께 제안하는 세트', photo: null },
];

const SAMPLE_RENTALS = [
  {
    id: 101,
    department: '의전팀 / 행사운영',
    requester: '김철수',
    contact: '010-0000-0101',
    purpose: '임원 프로필 촬영',
    items: '여름 의전용 원피스 2개',
    lines: [{ type: 'item', refId: 1, name: '여름 의전용 원피스', quantity: 2 }],
    date: '2026-04-25',
    pickupDate: '2026-04-29',
    eventDate: '2026-04-29',
    returnDueDate: '2026-05-05',
    status: 'approved',
    notes: '오늘 출고 예정',
    overdue: false,
  },
  {
    id: 102,
    department: '홍보팀 / 영상제작',
    requester: '이영희',
    contact: '010-0000-0102',
    purpose: '기획 영상 소품 대여',
    items: '시즌용 벨벳 코트 6개',
    lines: [{ type: 'item', refId: 5, name: '시즌용 벨벳 코트', quantity: 6 }],
    date: '2026-04-26',
    pickupDate: '2026-04-30',
    eventDate: '2026-05-01',
    returnDueDate: '2026-05-08',
    status: 'approved',
    notes: '내일 출고 예정',
    overdue: false,
  },
  {
    id: 103,
    department: '비서실 / 의전',
    requester: '박민수',
    contact: '010-0000-0103',
    purpose: '행사 안내 복장',
    items: '남성 정장 자켓 네이비 2개',
    lines: [{ type: 'item', refId: 3, name: '남성 정장 자켓 네이비', quantity: 2 }],
    date: '2026-04-27',
    pickupDate: '2026-05-02',
    eventDate: '2026-05-03',
    returnDueDate: '2026-05-10',
    status: 'requested',
    notes: 'D-3 출고 예정',
    overdue: false,
  },
  {
    id: 104,
    department: '교육부 / 유년',
    requester: '최지현',
    contact: '010-0000-0104',
    purpose: '율동팀 발표',
    items: '국악 아동 저고리 10개',
    lines: [{ type: 'item', refId: 6, name: '국악 아동 저고리', quantity: 10 }],
    date: '2026-04-18',
    pickupDate: '2026-04-20',
    eventDate: '2026-04-22',
    returnDueDate: '2026-04-29',
    status: 'return-req',
    notes: '세탁 완료 후 반납 예정',
    overdue: false,
    returnChecks: {
      washedQuantity: 10,
      unwashedQuantity: 0,
      laundryComment: '물세탁 후 건조 완료',
      repairRequired: false,
      repairComment: '',
    },
  },
  {
    id: 105,
    department: '청년부 / 문화',
    requester: '정하윤',
    contact: '010-0000-0105',
    purpose: '무용팀 연습 촬영',
    items: '무용 레오타드 블랙 5개',
    lines: [{ type: 'item', refId: 7, name: '무용 레오타드 블랙', quantity: 5 }],
    date: '2026-04-14',
    pickupDate: '2026-04-15',
    eventDate: '2026-04-17',
    returnDueDate: '2026-04-24',
    status: 'returned',
    notes: '1벌 소매 올풀림 - 수선 필요',
    overdue: false,
    returnChecks: {
      washedQuantity: 4,
      unwashedQuantity: 1,
      laundryComment: '1벌은 오염이 없어 미세탁',
      repairRequired: true,
      repairComment: '소매 올풀림 수선 필요',
    },
  },
];

const AppContext = createContext();

export function AppProvider({ children }) {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [sets, setSets] = useState(SAMPLE_SETS);
  const [rentals, setRentals] = useState(SAMPLE_RENTALS);
  const [currentUser] = useState({ name: '관리자', role: 'admin', dept: '의상분장과' });

  const addItem = (item) => {
    setItems(prev => [...prev, { ...item, id: Date.now() }]);
  };

  const updateItem = (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addSet = (set) => {
    setSets(prev => [...prev, { ...set, id: Date.now() }]);
  };

  const updateRentalStatus = (id, newStatus) => {
    setRentals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const updateRental = (id, updates) => {
    setRentals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRental = (rental) => {
    setRentals(prev => [...prev, { ...rental, id: Date.now() }]);
  };

  return (
    <AppContext.Provider value={{
      items, setItems, addItem, updateItem,
      sets, setSets, addSet,
      rentals, setRentals, updateRentalStatus, updateRental, addRental,
      currentUser,
      CATEGORIES, LOCATIONS, STATUS_LABELS, CONDITION_LABELS, LAUNDRY_METHODS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export { CATEGORIES, LOCATIONS, STATUS_LABELS, CONDITION_LABELS, LAUNDRY_METHODS };
