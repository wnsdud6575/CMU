'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  CalendarCheck, ListTodo, TrendingUp, AlertTriangle,
  Plus, Clock, ArrowLeftRight, Sparkles, Shirt, Users,
  Target, FolderKanban, Columns3, RefreshCw,
} from 'lucide-react';

const CATEGORY_LABELS = { meeting: '회의', support: '지원', education: '교육', production: '제작', event: '행사' };

const INITIAL_LOGS = [
  { id: 't1', category: 'meeting', title: '임원 프로필 촬영 관련 회의', team: '분장팀', requester: '김철수', date: '2026-04-29', location: '1층 회의실', attendees: 5, content: '임원 프로필 촬영 일정 및 지원 사항 논의' },
  { id: 't2', category: 'education', title: '유년부 율동팀 무용복 코칭', team: '운영팀', requester: '이영희', date: '2026-04-30', location: '본당', attendees: 15, content: '유년부 율동팀 무용복 착용법 및 관리법 사전 교육' },
  { id: 't3', category: 'support', title: '봄 시즌 무용복 재고 실사', team: '운영팀', requester: '관리자', date: '2026-04-29', location: '연수원 5층', attendees: 2, content: '무용복 수량 파악 및 검수 작업' },
  { id: 't4', category: 'production', title: '승리컵 축구복 세트 구성', team: '디자인팀', requester: '관리자', date: '2026-05-02', location: '사무실', attendees: 1, content: '행사 전 축구복 사이즈별 수량, 세트 구성 정리' },
  { id: 't5', category: 'event', title: '청년부 뮤지컬 무대 분장 지원', team: '분장팀', requester: '박민수', date: '2026-04-26', location: '대강당', attendees: 20, content: '청년부 주관 창작 뮤지컬 무대 분장 지원' },
];

// 💡 월간 달력 내부 일정 블록의 가독성을 높이기 위한 카테고리별 전용 파스텔 테마 스타일 정의
function getCategoryCalendarStyle(category) {
  switch (category) {
    case 'meeting':
      return { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }; // 블루
    case 'support':
      return { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }; // 그린
    case 'education':
      return { background: '#faf5ff', border: '1px solid #e9d5ff', color: '#7e22ce' }; // 퍼플
    case 'production':
      return { background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }; // 오렌지
    case 'event':
      return { background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }; // 레드
    default:
      return { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' };
  }
}

const PROJECTS = [
  { name: '승리컵 축구복', status: '구성 정리', progress: 35, due: '05-02' },
  { name: '북 의상 정리', status: '사진 촬영 필요', progress: 20, due: '05-08' },
  { name: '상반기 교육 지원', status: '사전 과제 수집', progress: 60, due: '04-30' },
];

function getCategoryBadge(cat) { 
  return cat === 'meeting' ? 'warning' : cat === 'support' ? 'info' : cat === 'education' ? 'primary' : cat === 'production' ? 'success' : 'danger'; 
}

// 💡 출고 D-day별 맞춤 테마 스타일 헬퍼 함수 (D-0, D-1, D-2, D-3 색상 차별화)
function getDdayStyles(diff) {
  if (diff === 0) {
    return {
      background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
      border: '1px solid #fca5a5',
      badgeColor: '#dc2626',
      badgeText: '🚨 오늘출고',
      textColor: '#991b1b',
      mutedTextColor: '#b91c1c'
    };
  } else if (diff === 1) {
    return {
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '1px solid #fde68a',
      badgeColor: '#d97706',
      badgeText: '⚡ 내일출고',
      textColor: '#92400e',
      mutedTextColor: '#b45309'
    };
  } else if (diff === 2) {
    return {
      background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
      border: '1px solid #fef08a',
      badgeColor: '#ca8a04',
      badgeText: '📅 D-2 출고',
      textColor: '#854d0e',
      mutedTextColor: '#a16207'
    };
  } else if (diff === 3) {
    return {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      border: '1px solid #bbf7d0',
      badgeColor: '#16a34a',
      badgeText: '📅 D-3 출고',
      textColor: '#166534',
      mutedTextColor: '#15803d'
    };
  }
  return {
    background: 'transparent',
    border: 'none',
    badgeColor: 'var(--primary)',
    badgeText: '일반',
    textColor: 'var(--text-primary)',
    mutedTextColor: 'var(--text-muted)'
  };
}

// 💡 실제 시스템 오늘 날짜 기준으로 한 주(월~일)의 날짜 리스트를 동적으로 연산하는 헬퍼 함수
function getWeeklyDays(todayStr) {
  const current = new Date(todayStr);
  const dayOfWeek = current.getDay(); // 0(일) ~ 6(토)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(current);
    d.setDate(d.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      date: dateStr,
      label: weekdays[d.getDay()],
      day: d.getDate().toString().padStart(2, '0'),
      isToday: dateStr === todayStr
    };
  });
}

export default function DashboardPage() {
  const { items, rentals, updateRentalStatus } = useApp();
  
  // 실제 오늘 날짜 획득 (YYYY-MM-DD)
  const today = new Date().toLocaleDateString('sv-SE');
  
  // 💡 달력 및 일보 탐색을 위한 기준 날짜 상태 선언
  const [currentDate, setCurrentDate] = useState(() => new Date(today));
  
  // weeklyDays는 currentDate 기준으로 동적 연산
  const weeklyDays = getWeeklyDays(currentDate.toLocaleDateString('sv-SE'));

  // INITIAL_LOGS의 기준일인 2026-04-29로부터 상대적인 날짜를 계산해 실제 오늘 날짜 주변으로 재매핑
  const [tasks, setTasks] = useState(() => {
    const baseDate = '2026-04-29';
    return INITIAL_LOGS.map(log => {
      const diffTime = new Date(log.date) - new Date(baseDate);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const target = new Date(today);
      target.setDate(target.getDate() + diffDays);
      return { ...log, date: target.toISOString().slice(0, 10) };
    });
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDateForNew, setSelectedDateForNew] = useState('');
  const [calendarView, setCalendarView] = useState('weekly');
  const [listFilter, setListFilter] = useState('all');
  const [filterMonth, setFilterMonth] = useState(today.slice(0, 7));
  const [filterStartDate, setFilterStartDate] = useState(weeklyDays[0].date);
  const [filterEndDate, setFilterEndDate] = useState(weeklyDays[6].date);
  const [newTaskData, setNewTaskData] = useState({ title: '', category: 'support', team: '운영팀', requester: '관리자', date: '', location: '', attendees: 1, content: '' });

  // 💡 달력 날짜 이동 핸들러들
  const handlePrevPeriod = () => {
    const nextDate = new Date(currentDate);
    if (calendarView === 'daily') {
      nextDate.setDate(nextDate.getDate() - 1);
    } else if (calendarView === 'weekly') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else if (calendarView === 'monthly' || calendarView === 'list') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNextPeriod = () => {
    const nextDate = new Date(currentDate);
    if (calendarView === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (calendarView === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (calendarView === 'monthly' || calendarView === 'list') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleGoToday = () => {
    setCurrentDate(new Date(today));
  };

  const getPeriodText = () => {
    const m = currentDate.getMonth() + 1;
    if (calendarView === 'daily') {
      const d = currentDate.getDate();
      const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()];
      return `${m}.${d}(${dayLabel})`;
    } else if (calendarView === 'weekly') {
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
      const dateNum = currentDate.getDate();
      const w = Math.ceil((dateNum + firstDayOfWeek) / 7);
      return `${m}월 ${w}주`;
    } else if (calendarView === 'monthly' || calendarView === 'list') {
      return `${m}월`;
    }
    return '';
  };

  // 💡 currentDate 변경 시 엑셀 내보내기 및 목록 보기 필터의 검색 범위도 자동 갱신
  useEffect(() => {
    const dateStr = currentDate.toLocaleDateString('sv-SE');
    const days = getWeeklyDays(dateStr);
    setFilterMonth(dateStr.slice(0, 7));
    setFilterStartDate(days[0].date);
    setFilterEndDate(days[6].date);
  }, [currentDate]);

  const todayTasks = tasks.filter(t => t.date === today);
  const totalItems = items.reduce((a, i) => a + i.quantity, 0);
  const activeRentals = rentals.filter(r => ['requested', 'approved', 'renting', 'return-req'].includes(r.status)).length;
  const overdueRentals = rentals.filter(r => r.overdue).length;

  const processedRentals = rentals.map(r => {
    if (!r.pickupDate) return { ...r, diff: 999, dTag: null, priorityScore: 5 };
    const rDate = new Date(r.pickupDate);
    const tDate = new Date(today);
    rDate.setHours(0, 0, 0, 0);
    tDate.setHours(0, 0, 0, 0);
    const diff = Math.round((rDate - tDate) / (1000 * 60 * 60 * 24));
    let dTag = null;
    let priorityScore = 4;
    if (diff === 0) { dTag = '오늘 출고'; priorityScore = 1; }
    else if (diff === 1) { dTag = '내일 출고'; priorityScore = 2; }
    else if (diff > 1 && diff <= 3) { dTag = `D-${diff} 출고`; priorityScore = 3; }
    return { ...r, diff, dTag, priorityScore };
  }).filter(r => r.dTag || ['requested', 'approved', 'renting', 'return-req'].includes(r.status))
    .sort((a, b) => a.priorityScore - b.priorityScore || new Date(a.pickupDate) - new Date(b.pickupDate));

  // 💡 오늘~3일 내에 출고해야 하는데 아직 승낙되지 않은('requested') 대여 신청 필터링
  const urgentRequestedRentals = processedRentals.filter(r => r.status === 'requested' && r.diff <= 3);

  const handleCreateTask = (e) => {
    e.preventDefault();
    setTasks(p => [...p, { id: `t${Date.now()}`, ...newTaskData, date: newTaskData.date || new Date().toISOString().split('T')[0] }]);
    setIsNewModalOpen(false);
    setNewTaskData({ title: '', category: 'support', team: '운영팀', requester: '관리자', date: '', location: '', attendees: 1, content: '' });
  };

  const openNewLogModal = (dateStr) => {
    setNewTaskData(prev => ({ ...prev, date: dateStr || today }));
    setIsNewModalOpen(true);
  };

  const getFilteredListTasks = () => {
    let filtered = [...tasks];
    if (listFilter === 'range') {
      filtered = filtered.filter(t => t.date >= filterStartDate && t.date <= filterEndDate);
    } else if (listFilter === 'monthly') {
      filtered = filtered.filter(t => t.date.startsWith(filterMonth));
    }
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  };

  const exportToExcel = () => {
    const dataToExport = calendarView === 'list' ? getFilteredListTasks() : tasks;
    const headers = ['일자', '카테고리', '소속팀', '담당자', '업무(행사)명', '장소', '참석인원', '보고내용'];
    const rows = dataToExport.map(t => [
      t.date,
      CATEGORY_LABELS[t.category],
      t.team,
      t.requester,
      t.title || '',
      t.location || '',
      t.attendees,
      t.content || ''
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "일일보고");
    XLSX.writeFile(workbook, `일일보고_아카이빙_${today}.xlsx`);
  };

  return (
    <div className="dashboard-unified">
      {/* 💡 상단 헤더 영역 컨테이너 (Grid 'auto' 행으로 묶어 높이가 비정상적으로 늘어나는 현상 방지) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
        {/* Row 1: 6 stat cards */}
        <div className="dash-stats">
          <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon" style={{ width: 38, height: 38, background: 'var(--primary-50)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
              <CalendarCheck size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{todayTasks.length}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>오늘 업무</div>
            </div>
          </div>

          <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon" style={{ width: 38, height: 38, background: 'var(--primary-50)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
              <ListTodo size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{tasks.length}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>전체 로그</div>
            </div>
          </div>

          <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon" style={{ width: 38, height: 38, background: 'var(--primary-50)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
              <TrendingUp size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{PROJECTS.length}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>진행 프로젝트</div>
            </div>
          </div>

          <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon" style={{ width: 38, height: 38, background: '#fee2e2', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 21, color: 'var(--danger)' }}>{overdueRentals}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>반납 지연</div>
            </div>
          </div>

          <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon" style={{ width: 38, height: 38, background: 'var(--primary-50)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
              <RefreshCw size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{activeRentals}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>대여 진행</div>
            </div>
          </div>

          <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon" style={{ width: 38, height: 38, background: 'var(--primary-50)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
              <Shirt size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{totalItems}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>보유 자산</div>
            </div>
          </div>
        </div>

        {/* Row 1.5: ⚡ 긴급 대여 승낙 필요 알림 배너 */}
        {urgentRequestedRentals.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(239, 68, 68, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                <strong style={{ fontSize: '12px', color: '#991b1b', whiteSpace: 'nowrap' }}>
                  긴급 대여 승낙 필요 ({urgentRequestedRentals.length}건)
                </strong>
                <span style={{ fontSize: '11px', color: '#b91c1c', borderLeft: '1px solid #fca5a5', paddingLeft: '8px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  출고 예정일이 3일 이내인 미승낙 건이 있습니다. 우측 대여 현황 또는 칸반 페이지에서 즉시 처리해주세요.
                </span>
              </div>
            </div>
            <Link href="/rentals" style={{
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '4px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(239, 68, 68, 0.15)'
            }}>
              승낙하러 가기 →
            </Link>
          </div>
        )}
      </div>

      {/* Row 2: 3-column main area */}
      <div className="dash-main">
        {/* Col 1: 오늘 업무 */}
        <div className="dash-col">
          <div className="card dash-card">
            <div className="dash-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                <Target size={15} color="var(--primary-dark)" style={{ marginRight: 6 }} /> 오늘 확인할 업무
              </h3>
              <span className="dash-count">{todayTasks.length}</span>
            </div>
            <div className="dash-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayTasks.length > 0 ? todayTasks.map(task => (
                  <button key={task.id} type="button" className="focus-task" onClick={() => setSelectedTask(task)} style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span className={`badge badge-${getCategoryBadge(task.category)}`} style={{ fontSize: 9, padding: '2px 5px' }}>{CATEGORY_LABELS[task.category]}</span>
                    </div>
                    <strong style={{ fontSize: 13, display: 'block', marginTop: 4, marginBottom: 2 }}>{task.title}</strong>
                    <small style={{ fontSize: 11, display: 'block' }}>{task.location} · {task.attendees}명 참석</small>
                  </button>
                )) : <div className="empty-state compact" style={{ padding: 12, fontSize: 12 }}>오늘 기한 업무가 없습니다 🎉</div>}
              </div>

              {/* 프로젝트 */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  <FolderKanban size={13} color="var(--text-secondary)" style={{ marginRight: 5 }} /> 프로젝트
                </div>
                {PROJECTS.map(p => (
                  <div key={p.name} style={{ padding: '8px 10px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      <span>{p.name}</span><span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{p.due}</span>
                    </div>
                    <div className="progress-track" style={{ margin: '0 0 3px', height: 5 }}><div style={{ width: `${p.progress}%` }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                      <span>{p.status}</span><span style={{ fontWeight: 700 }}>{p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: 칸반 보드 (가장 넓음) */}
        <div className="dash-col dash-col-wide">
          <div className="card dash-card">
            <div className="dash-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ display: 'flex', alignItems: 'center' }}>
                  <Columns3 size={15} color="var(--primary-dark)" style={{ marginRight: 6 }} /> 일일 보고
                </h3>
                <div style={{ display: 'flex', background: 'var(--bg-main)', padding: 2, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <button type="button" className={calendarView === 'daily' ? 'btn btn-primary btn-sm' : 'btn btn-sm'} onClick={() => setCalendarView('daily')} style={{ padding: '2px 8px', fontSize: 10, background: calendarView === 'daily' ? 'var(--primary)' : 'transparent', color: calendarView === 'daily' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}>일간</button>
                  <button type="button" className={calendarView === 'weekly' ? 'btn btn-primary btn-sm' : 'btn btn-sm'} onClick={() => setCalendarView('weekly')} style={{ padding: '2px 8px', fontSize: 10, background: calendarView === 'weekly' ? 'var(--primary)' : 'transparent', color: calendarView === 'weekly' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}>주간</button>
                  <button type="button" className={calendarView === 'monthly' ? 'btn btn-primary btn-sm' : 'btn btn-sm'} onClick={() => setCalendarView('monthly')} style={{ padding: '2px 8px', fontSize: 10, background: calendarView === 'monthly' ? 'var(--primary)' : 'transparent', color: calendarView === 'monthly' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}>월간</button>
                  <button type="button" className={calendarView === 'list' ? 'btn btn-primary btn-sm' : 'btn btn-sm'} onClick={() => setCalendarView('list')} style={{ padding: '2px 8px', fontSize: 10, background: calendarView === 'list' ? 'var(--primary)' : 'transparent', color: calendarView === 'list' ? '#fff' : 'var(--text-secondary)', border: 'none', boxShadow: 'none' }}>목록</button>
                </div>

                {/* 💡 날짜 및 달 탐색 컨트롤러 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                  <button type="button" onClick={handlePrevPeriod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', fontSize: '10px', background: '#fff', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }}>◀</button>
                  <button type="button" onClick={handleGoToday} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', fontSize: '10px', background: '#fff', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }}>오늘</button>
                  <button type="button" onClick={handleNextPeriod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', fontSize: '10px', background: '#fff', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }}>▶</button>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-dark)', marginLeft: '4px', background: 'var(--primary-50)', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {getPeriodText()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={exportToExcel} style={{ padding: '5px 10px', fontSize: 11, background: '#107c41', color: 'white', border: 'none' }}>
                  엑셀 다운로드
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => openNewLogModal(today)} style={{ padding: '5px 10px', fontSize: 11 }}>
                  <Plus size={12} style={{ marginRight: 3 }} />일보 작성
                </button>
              </div>
            </div>
            <div className="dash-card-body" style={{ padding: 0 }}>
              {calendarView === 'daily' && (
                <div style={{ padding: 16 }}>
                  <h4 style={{ marginBottom: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarCheck size={16} color="var(--primary)" /> 
                    {currentDate.toLocaleDateString('sv-SE')} ({['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()]})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.filter(t => t.date === currentDate.toLocaleDateString('sv-SE')).map(task => (
                      <div key={task.id} className="kanban-card" onClick={() => setSelectedTask(task)} style={{ padding: '12px 14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <span className={`badge badge-${getCategoryBadge(task.category)}`} style={{ fontSize: 9, padding: '2px 5px', marginRight: 6 }}>{CATEGORY_LABELS[task.category]}</span>
                          </div>
                          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{task.title}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>{task.team} · {task.requester}</div>
                          <div>{task.location}</div>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.date === currentDate.toLocaleDateString('sv-SE')).length === 0 && <div className="empty-state">등록된 일일 보고가 없습니다.</div>}
                  </div>
                </div>
              )}
              {calendarView === 'weekly' && (
                <div className="weekly-calendar" style={{ display: 'flex', height: '100%', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {weeklyDays.map(day => {
                    const dayTasks = tasks.filter(t => t.date === day.date);
                    return (
                      <div key={day.date} style={{ flex: '1 1 0', minWidth: 0, borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', background: day.isToday ? 'rgba(100, 181, 182, 0.05)' : 'transparent' }}>
                        <div style={{ padding: '10px 0', textAlign: 'center', borderBottom: '1px solid var(--border)', background: day.isToday ? 'var(--primary-50)' : 'var(--bg-main)', cursor: 'pointer' }} onClick={() => openNewLogModal(day.date)}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: day.isToday ? 'var(--primary-dark)' : 'var(--text-secondary)' }}>{day.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: day.isToday ? 'var(--primary)' : 'var(--text-primary)' }}>{day.day} <Plus size={10} style={{ opacity: 0.5 }}/></div>
                        </div>
                        <div style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {dayTasks.map(task => (
                            <div key={task.id} className="kanban-card"
                              onClick={() => setSelectedTask(task)}
                              style={{ padding: '8px 10px', boxShadow: 'none', border: '1px solid var(--border-light)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span className={`badge badge-${getCategoryBadge(task.category)}`} style={{ fontSize: 8, padding: '1px 4px' }}>{CATEGORY_LABELS[task.category]}</span>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{task.title}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{task.location}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {calendarView === 'monthly' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                    {['월', '화', '수', '목', '금', '토', '일'].map(d => <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflowY: 'auto' }}>
                    {(() => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth(); // 0-indexed
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
                      const emptyCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
                      
                      const list = [];
                      for (let i = 0; i < emptyCount; i++) list.push(null);
                      for (let i = 1; i <= lastDay.getDate(); i++) list.push(i);
                      while (list.length % 7 !== 0) list.push(null);
                      
                      return list.map((dayNum, i) => {
                        if (!dayNum) return <div key={i} style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-main)', opacity: 0.3, minHeight: 70 }}></div>;
                        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                        const dayTasks = tasks.filter(t => t.date === dateStr);
                        const isToday = dateStr === today;
                        return (
                          <div key={i} onClick={() => openNewLogModal(dateStr)} style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '6px 4px', minHeight: 70, background: isToday ? 'rgba(100, 181, 182, 0.05)' : '#fff', cursor: 'pointer' }}>
                            <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--primary)' : 'var(--text-primary)', marginBottom: 4, textAlign: 'center' }}>{dayNum}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {dayTasks.map(task => {
                                const cStyle = getCategoryCalendarStyle(task.category);
                                return (
                                  <div 
                                    key={task.id} 
                                    onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }} 
                                    style={{ 
                                      fontSize: '10px', 
                                      fontWeight: '800', 
                                      whiteSpace: 'nowrap', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      background: cStyle.background, 
                                      padding: '3px 6px', 
                                      border: cStyle.border, 
                                      borderRadius: '4px', 
                                      color: cStyle.color, 
                                      cursor: 'pointer',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                      transition: 'transform 0.1s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                    <span style={{ marginRight: '3px', fontWeight: '900' }}>•</span>{task.title}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
              {calendarView === 'list' && (
                <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '8px 12px', display: 'flex', gap: 8, background: '#f8fafc', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>조회 기간</span>
                    <select className="form-select" style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: '#fff' }} value={listFilter} onChange={e => setListFilter(e.target.value)}>
                      <option value="all">전체 보고 내역</option>
                      <option value="monthly">월별 조회</option>
                      <option value="range">직접 지정</option>
                    </select>
                    
                    {listFilter === 'monthly' && (
                      <input type="month" className="form-input" style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: '#fff' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
                    )}
                    {listFilter === 'range' && (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input type="date" className="form-input" style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: '#fff' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>~</span>
                        <input type="date" className="form-input" style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: '#fff' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="table" style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-main)', borderBottom: '1px solid var(--border)', zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>일자</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>분류</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>업무명</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>부서/담당</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>장소/인원</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredListTasks().map(task => (
                          <tr key={task.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.1s' }} onClick={() => setSelectedTask(task)} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{task.date}</td>
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <span className={`badge badge-${getCategoryBadge(task.category)}`} style={{ fontSize: 9, padding: '2px 5px' }}>{CATEGORY_LABELS[task.category]}</span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{task.team} / {task.requester}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{task.location} ({task.attendees}명)</td>
                          </tr>
                        ))}
                        {getFilteredListTasks().length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>조건에 맞는 보고 내역이 없습니다.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 3: 대여 + 요청 */}
        <div className="dash-col">
          <div className="card dash-card">
            <div className="dash-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                <RefreshCw size={14} color="var(--primary-dark)" style={{ marginRight: 6 }} /> 대여 현황
              </h3>
              <Link href="/rentals" style={{ fontSize: 11, color: 'var(--primary-dark)', fontWeight: 700, textDecoration: 'none' }}>전체 →</Link>
            </div>
            <div className="dash-card-body" style={{ padding: '8px 12px' }}>
              {processedRentals.slice(0, 5).map(r => {
                const isUrgentRequest = r.status === 'requested' && r.diff <= 3;
                const dStyles = isUrgentRequest ? getDdayStyles(r.diff) : null;
                
                return (
                  <Link href="/rentals" key={r.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isUrgentRequest ? '10px 12px' : (r.diff <= 1 ? '10px 12px' : '10px 4px'),
                    background: isUrgentRequest 
                      ? dStyles.background 
                      : (r.diff === 0 ? '#fff5f5' : (r.diff === 1 ? '#fffbeb' : 'transparent')),
                    borderRadius: (isUrgentRequest || r.diff <= 1) ? 'var(--radius-sm)' : 0,
                    border: isUrgentRequest ? dStyles.border : 'none',
                    borderBottom: (isUrgentRequest || r.diff <= 1) ? 'none' : '1px solid var(--border-light)',
                    marginBottom: (isUrgentRequest || r.diff <= 1) ? 6 : 0,
                    fontSize: 12,
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="dash-rental-item-link"
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isUrgentRequest ? (
                          <span className="badge" style={{ fontSize: 9, padding: '2px 5px', background: dStyles.badgeColor, color: '#fff' }}>
                            {dStyles.badgeText}
                          </span>
                        ) : (
                          r.dTag && (
                            <span className={`badge ${r.diff === 0 ? 'badge-danger' : r.diff === 1 ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 9, padding: '2px 5px' }}>
                              {r.diff === 0 ? '🚨 ' : r.diff === 1 ? '⚡ ' : ''}{r.dTag}
                            </span>
                          )
                        )}
                        <span style={{ fontWeight: 700, color: isUrgentRequest ? dStyles.textColor : 'var(--text-primary)' }}>{r.department.split('/')[0].trim()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: isUrgentRequest ? dStyles.mutedTextColor : 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.requester} · {r.items}
                      </div>
                    </div>
                    {r.status === 'requested' ? (
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await updateRentalStatus(r.id, 'approved');
                          alert(`${r.department}의 대여 신청을 승낙 처리했습니다.`);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(245,158,11,0.2)',
                          flexShrink: 0
                        }}
                      >
                        간편 승낙
                      </button>
                    ) : (
                      <span className={`badge badge-${r.status === 'renting' ? 'primary' : r.status === 'return-req' ? 'gray' : r.status === 'approved' ? 'info' : 'success'}`} style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>
                        {r.status === 'approved' ? '승인' : r.status === 'renting' ? '대여중' : r.status === 'return-req' ? '반납' : '완료'}
                        {r.overdue && ' ⚠'}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="card dash-card">
            <div className="dash-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                <Sparkles size={14} color="var(--primary-dark)" style={{ marginRight: 6 }} /> 부서 요청
              </h3>
              <Link href="/requests/costume" style={{ fontSize: 11, color: 'var(--primary-dark)', fontWeight: 700, textDecoration: 'none' }}>전체 →</Link>
            </div>
            <div className="dash-card-body">
              <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>의전팀 분장 (임원)</span>
                  <span className="badge badge-warning" style={{ fontSize: 9, padding: '2px 5px' }}>회의</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>04.25 · 스튜디오 · 3명</div>
              </div>
              <div style={{ padding: '8px 0', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>유년부 무용복 코칭</span>
                  <span className="badge badge-primary" style={{ fontSize: 9, padding: '2px 5px' }}>진행</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>04.28 · 본당 · 15명</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal work-detail-modal">
            <form onSubmit={(e) => {
              e.preventDefault();
              setTasks(p => p.map(t => t.id === selectedTask.id ? selectedTask : t));
              setSelectedTask(null);
            }}>
              <div className="modal-header"><h2 className="modal-title">일일 보고 수정</h2><button type="button" className="modal-close" onClick={() => setSelectedTask(null)}>x</button></div>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">일자 *</label><input type="date" className="form-input" required value={selectedTask.date} onChange={e => setSelectedTask({ ...selectedTask, date: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">카테고리</label><select className="form-select" value={selectedTask.category} onChange={e => setSelectedTask({ ...selectedTask, category: e.target.value })}><option value="meeting">회의</option><option value="support">지원 업무</option><option value="education">교육</option><option value="production">제작</option><option value="event">행사</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">업무(행사)명 *</label><input type="text" className="form-input" required value={selectedTask.title} onChange={e => setSelectedTask({ ...selectedTask, title: e.target.value })} /></div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">소속 팀 (작성자) *</label><select className="form-select" value={selectedTask.team} onChange={e => setSelectedTask({ ...selectedTask, team: e.target.value })}><option value="운영팀">운영팀</option><option value="분장팀">분장팀</option><option value="디자인팀">디자인팀</option></select></div>
                  <div className="form-group"><label className="form-label">담당자 *</label><input type="text" className="form-input" required value={selectedTask.requester} onChange={e => setSelectedTask({ ...selectedTask, requester: e.target.value })} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">장소</label><input type="text" className="form-input" required value={selectedTask.location} onChange={e => setSelectedTask({ ...selectedTask, location: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">참석 인원</label><input type="number" className="form-input" min="1" value={selectedTask.attendees} onChange={e => setSelectedTask({ ...selectedTask, attendees: parseInt(e.target.value) || 1 })} /></div>
                </div>
                <div className="form-group"><label className="form-label">보고 내용</label><textarea className="form-textarea" value={selectedTask.content} onChange={e => setSelectedTask({ ...selectedTask, content: e.target.value })}></textarea></div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <button type="button" onClick={() => { setTasks(p => p.filter(t => t.id !== selectedTask.id)); setSelectedTask(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: '4px 8px', opacity: 0.85 }}>
                    보고 내역 삭제
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedTask(null)}>취소</button>
                  <button type="submit" className="btn btn-primary">변경 저장</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header"><h2 className="modal-title">일일 보고 작성</h2><button className="modal-close" onClick={() => setIsNewModalOpen(false)}>x</button></div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">일자 *</label><input type="date" className="form-input" required value={newTaskData.date} onChange={e => setNewTaskData({ ...newTaskData, date: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">카테고리</label><select className="form-select" value={newTaskData.category} onChange={e => setNewTaskData({ ...newTaskData, category: e.target.value })}><option value="meeting">회의</option><option value="support">지원 업무</option><option value="education">교육</option><option value="production">제작</option><option value="event">행사</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">업무(행사)명 *</label><input type="text" className="form-input" required value={newTaskData.title} onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })} placeholder="예: 유년부 무용복 착용 교육 지원" /></div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">소속 팀 (작성자) *</label>
                    <select className="form-select" value={newTaskData.team} onChange={e => setNewTaskData({ ...newTaskData, team: e.target.value })}>
                      <option value="운영팀">운영팀</option><option value="분장팀">분장팀</option><option value="디자인팀">디자인팀</option>
                    </select></div>
                  <div className="form-group"><label className="form-label">담당자 *</label><input type="text" className="form-input" required value={newTaskData.requester} onChange={e => setNewTaskData({ ...newTaskData, requester: e.target.value })} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">행사 종류 및 장소</label><input type="text" className="form-input" required value={newTaskData.location} onChange={e => setNewTaskData({ ...newTaskData, location: e.target.value })} placeholder="예: 연수원 1층" /></div>
                  <div className="form-group"><label className="form-label">참석 인원</label><input type="number" className="form-input" min="1" value={newTaskData.attendees} onChange={e => setNewTaskData({ ...newTaskData, attendees: parseInt(e.target.value) || 1 })} /></div>
                </div>
                <div className="form-group"><label className="form-label">보고 내용</label><textarea className="form-textarea" value={newTaskData.content} onChange={e => setNewTaskData({ ...newTaskData, content: e.target.value })} placeholder="진행된 업무 및 결과 요약"></textarea></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>취소</button><button type="submit" className="btn btn-primary">등록</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
