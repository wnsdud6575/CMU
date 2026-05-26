'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

const SAMPLE_ITEMS = [];
const MOCK_ITEMS_DEPRECATED = [
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
    photo: '/tablecloth.png',
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
  { id: 101, type: 'event', name: '총회 중진 세팅', items: [2, 4], description: '총회 중진 방문 시 기본 세팅. 테이블보 및 기본 장식 포함.', photo: '/vip_meeting_set.png', externalItems: [{ name: '케이터링 테이블', manager: '부녀회 총무', location: '연수원 5층 창고' }, { name: 'VIP 다과 세트', manager: '행사팀', location: '1층 주방' }] },
  { id: 102, type: 'event', name: '지도방문 기본 세팅', items: [2], description: '지도방문 시 상담실 기본 세팅', photo: '/visit_set.png', externalItems: [{ name: '꽃장식', manager: '디자인팀', location: '각 부서 자체 준비' }] },
  { id: 103, type: 'event', name: '승리컵 (체육대회) 세트', items: [4], description: '체육대회 진행용 기본 비품 세트', photo: null, externalItems: [{ name: '천막 및 아이스박스', manager: '시설관리팀', location: '야외 창고' }] },
  { id: 1, type: 'costume', name: '국악 아동 기본 세트', items: [6, 4], description: '국악 아동 저고리와 행사 소품을 함께 구성한 추천 세트', photo: null, externalItems: [] },
  { id: 2, type: 'costume', name: '의전 원피스 풀세트', items: [1, 3], description: '의전 촬영용 원피스와 정장 자켓을 함께 제안하는 세트', photo: null, externalItems: [] },
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
  const [currentUser, setCurrentUser] = useState(null);

  // 💡 마운트 시 localStorage로부터 기존 세션 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('crms_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (err) {
          console.error('로컬 세션 복원 실패:', err);
        }
      }
    }
  }, []);

  const login = (role, name, dept) => {
    const user = {
      name: name || (role === 'admin' ? '관리자' : '일반 사용자'),
      role,
      dept: dept || (role === 'admin' ? '의상분장과' : '일반 부서'),
    };
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crms_user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crms_user');
    }
  };
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const { data: dbItems, error: itemsError } = await supabase.from('items').select('*');
        if (itemsError) throw itemsError;

        const { data: dbSizes, error: sizesError } = await supabase.from('item_sizes').select('*');
        if (sizesError) throw sizesError;

        const { data: dbDeps, error: depsError } = await supabase.from('external_deps').select('*');
        if (depsError) throw depsError;

        if (dbItems && dbItems.length > 0) {
          const formattedItems = dbItems.map(item => {
            const sizes = dbSizes?.filter(s => s.item_id === item.id) || [];
            const deps = dbDeps?.filter(d => d.item_id === item.id) || [];
            
            // 💡 지능형 규격 코드 실시간 자동 생성
            const cat = item.category_code || 'H';
            const age = (cat === 'Z' || cat === 'H') ? 'N' : 'A'; // 소품/기타는 Neutral(N), 의류는 기본 Adult(A)
            const type = (item.sub_type || 'ETC').toUpperCase().slice(0, 6);
            const serial = item.id.substring(0, 6); // UUID 앞 6자리로 고유번호 생성
            const generatedCode = `${cat}-${age}-${type}-${serial}`;
            const parsedSizes = sizes.map(s => {
              const parts = (s.size_label || '').split('||');
              return {
                ...s,
                size: parts[0],
                size_label: parts[0],
                photo: parts[1] || null,
                qty: s.total_qty
              };
            });
            const unit = (cat === 'Z' || cat === 'H') ? '개' : '벌';

            return {
              id: item.id,
              name: item.name,
              code: generatedCode,
              localCode: generatedCode,
              category: cat,
              subType: item.sub_type,
              laundryMethod: item.laundry_method,
              location: item.location,
              photo: item.photo_url,
              quantity: parsedSizes.reduce((sum, s) => sum + s.qty, 0),
              sizeBreakdown: parsedSizes.map(s => `${s.size} ${s.qty}${unit}`).join(' / '),
              sizes: parsedSizes,
              relatedExternal: deps.length > 0 ? {
                name: deps[0].ext_name,
                manager: deps[0].ext_manager,
                location: deps[0].ext_location
              } : null,
              status: 'available',
              condition: 'good',
            };
          });
          
          setItems(prev => {
            const newItems = [...prev];
            formattedItems.forEach(fi => {
              if (!newItems.find(i => i.id === fi.id)) {
                newItems.push(fi);
              }
            });
            return newItems;
          });
        }

        // 💡 대여 정보(rentals) Supabase DB로부터 실시간 로드 추가
        try {
          const { data: dbRentals, error: rentalsErr } = await supabase.from('rentals').select('*');
          if (!rentalsErr && dbRentals && dbRentals.length > 0) {
            const todayStr = new Date().toLocaleDateString('sv-SE');

            const formattedRentals = dbRentals.map(r => {
              let status = r.status;

              // 💡 자동 대여중 전환 로직 (수령 예정일 도래 시 approved -> renting 자동 전환 + 수령 장소 기입 필수)
              if (status === 'approved' && r.pickup_date && r.pickup_date <= todayStr && r.pickup_location) {
                status = 'renting';
                supabase.from('rentals').update({ status: 'renting' }).eq('id', r.id).then(({ error }) => {
                  if (error) console.error(`[자동 대여 전환 실패] ID: ${r.id}, error:`, error);
                  else console.log(`[자동 대여 전환 성공] ID: ${r.id} 가 'renting' 상태로 자동 업데이트되었습니다.`);
                });
              }

              return {
                id: r.id,
                department: r.department,
                requester: r.requester,
                contact: r.contact,
                purpose: r.purpose,
                items: r.items_summary,
                lines: r.lines || [],
                pickupDate: r.pickup_date,
                eventDate: r.event_date,
                returnDueDate: r.return_due_date,
                status: status,
                notes: r.notes || '',
                pickupLocation: r.pickup_location || '',
                returnSubmission: r.return_submission || null,
                returnChecks: r.return_checks || null,
                overdue: new Date(r.return_due_date) < new Date() && !['returned', 'rejected'].includes(status)
              };
            });
            setRentals(formattedRentals);
          }
        } catch (rErr) {
          console.warn('Supabase 대여 목록 조회 실패 (과도기적 로컬 fallback):', rErr);
        }
      } catch (err) {
        console.error('Supabase 연동 에러:', err);
      } finally {
        setIsLoadingDb(false);
      }
    };

    fetchSupabaseData();
  }, []);

  const addItem = async (item) => {
    try {
      const dbInsert = {
        name: item.name,
        category_code: item.category,
        sub_type: item.subType,
        laundry_method: item.laundryMethod,
        location: item.location,
        photo_url: item.photo,
      };
      
      const { data, error } = await supabase.from('items').insert([dbInsert]).select();
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newItemId = data[0].id;
        
        // 사이즈/색상 매핑 데이터 인서트
        if (item.sizes && item.sizes.length > 0) {
          const sizeInserts = item.sizes.map(s => ({
            item_id: newItemId,
            size_label: s.photo ? `${s.size}||${s.photo}` : s.size,
            total_qty: parseInt(s.qty, 10) || 0,
            available_qty: parseInt(s.qty, 10) || 0
          }));
          await supabase.from('item_sizes').insert(sizeInserts);
        }
        
        // 지능형 바코드 자동 조합
        const cat = data[0].category_code || 'H';
        const age = (cat === 'Z' || cat === 'H') ? 'N' : 'A';
        const type = (data[0].sub_type || 'ETC').toUpperCase().slice(0, 6);
        const serial = newItemId.substring(0, 6);
        const generatedCode = `${cat}-${age}-${type}-${serial}`;
        
        const formattedItem = {
          id: newItemId,
          name: data[0].name,
          code: generatedCode,
          localCode: generatedCode,
          category: cat,
          subType: data[0].sub_type,
          laundryMethod: data[0].laundry_method,
          location: data[0].location,
          photo: data[0].photo_url,
          quantity: item.sizes ? item.sizes.reduce((sum, s) => sum + (parseInt(s.qty, 10) || 0), 0) : item.quantity,
          sizeBreakdown: item.sizes ? item.sizes.map(s => `${s.size} ${s.qty}개`).join(' / ') : `${item.quantity}개`,
          sizes: item.sizes ? item.sizes.map(s => ({ size: s.size, size_label: s.size, qty: s.qty, photo: s.photo || null })) : [],
          status: 'available',
          condition: 'good',
        };
        
        setItems(prev => [...prev, formattedItem]);
      }
    } catch (err) {
      console.error('Supabase 신규 자산 추가 에러:', err);
    }
  };

  const updateItem = async (id, updates) => {
    // 1. 상태 즉시 업데이트 (Optimistic UI)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

    // 2. Supabase DB에 반영 (DB에서 가져온 항목인 경우)
    if (typeof id === 'string' && id.includes('-')) {
      try {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.photo !== undefined) dbUpdates.photo_url = updates.photo;
        if (updates.laundryMethod !== undefined) dbUpdates.laundry_method = updates.laundryMethod;
        if (updates.location !== undefined) dbUpdates.location = updates.location;
        if (updates.category !== undefined) dbUpdates.category_code = updates.category;
        if (updates.subType !== undefined) dbUpdates.sub_type = updates.subType;
        
        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase.from('items').update(dbUpdates).eq('id', id);
          if (error) throw error;
        }

        // 3. 사이즈/색상 (item_sizes) 정보가 변경된 경우 DB 동기화
        if (updates.sizes) {
          // 기존 사이즈 정보 전부 삭제 후 새로 삽입
          await supabase.from('item_sizes').delete().eq('item_id', id);
          
          const sizeInserts = updates.sizes.map(s => ({
            item_id: id,
            size_label: s.photo ? `${s.size}||${s.photo}` : s.size,
            total_qty: parseInt(s.qty, 10) || 0,
            available_qty: parseInt(s.qty, 10) || 0
          }));
          
          if (sizeInserts.length > 0) {
            await supabase.from('item_sizes').insert(sizeInserts);
          }
        }
      } catch (err) {
        console.error('Supabase 물품 업데이트 에러:', err);
      }
    }
  };

  const addSet = (set) => {
    setSets(prev => [...prev, { ...set, id: Date.now() }]);
  };

  const updateRentalStatus = async (id, newStatus) => {
    setRentals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    
    // UUID ID 형식을 가진 경우 (DB 데이터) DB 동기화
    if (typeof id === 'string' && id.includes('-')) {
      try {
        const { error } = await supabase.from('rentals').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase 대여 상태 업데이트 에러:', err);
      }
    }
  };

  const updateRental = async (id, updates) => {
    setRentals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    
    if (typeof id === 'string' && id.includes('-')) {
      try {
        const dbUpdates = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.pickupDate !== undefined) dbUpdates.pickup_date = updates.pickupDate;
        if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;
        if (updates.returnDueDate !== undefined) dbUpdates.return_due_date = updates.returnDueDate;
        if (updates.returnSubmission !== undefined) dbUpdates.return_submission = updates.returnSubmission;
        if (updates.returnChecks !== undefined) dbUpdates.return_checks = updates.returnChecks;
        if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
        
        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase.from('rentals').update(dbUpdates).eq('id', id);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase 대여 상세 정보 업데이트 에러:', err);
      }
    }
  };

  const addRental = async (rental) => {
    try {
      const dbInsert = {
        department: rental.department,
        requester: rental.requester,
        contact: rental.contact,
        purpose: rental.purpose,
        items_summary: rental.items,
        lines: rental.lines,
        pickup_date: rental.pickupDate,
        event_date: rental.eventDate,
        return_due_date: rental.returnDueDate,
        status: rental.status || 'requested',
        notes: rental.notes || '',
        pickup_location: rental.pickupLocation || ''
      };
      
      const { data, error } = await supabase.from('rentals').insert([dbInsert]).select();
      if (error) throw error;
      
      if (data && data.length > 0) {
        const dbItem = {
          id: data[0].id,
          department: data[0].department,
          requester: data[0].requester,
          contact: data[0].contact,
          purpose: data[0].purpose,
          items: data[0].items_summary,
          lines: data[0].lines,
          pickupDate: data[0].pickup_date,
          eventDate: data[0].event_date,
          returnDueDate: data[0].return_due_date,
          status: data[0].status,
          notes: data[0].notes,
          returnSubmission: data[0].return_submission || null,
          returnChecks: data[0].return_checks || null,
          pickupLocation: data[0].pickup_location || '',
          overdue: false
        };
        setRentals(prev => [dbItem, ...prev]);
        return;
      }
    } catch (err) {
      console.warn('Supabase rentals 테이블에 저장할 수 없습니다 (SQL 미설치 등). 로컬 메모리에 저장합니다:', err.message);
    }
    
    // Fallback: 로컬 메모리에 저장
    setRentals(prev => [{ ...rental, id: Date.now(), overdue: false }, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      items, setItems, addItem, updateItem,
      sets, setSets, addSet,
      rentals, setRentals, updateRentalStatus, updateRental, addRental,
      currentUser, login, logout,
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
