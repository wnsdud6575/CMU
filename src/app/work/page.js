'use client';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import {
  CalendarCheck, ListTodo, TrendingUp, AlertTriangle,
  Plus, Clock, ArrowLeftRight, Sparkles, Shirt, Users,
  Target, FolderKanban, Columns3, RefreshCw,
} from 'lucide-react';

const TEAMS = ['전체', '운영팀', '분장팀', '디자인팀'];

const INITIAL_TASKS = [
  { id: 't1', type: 'costume', title: '의전팀 분장 지원 - 임원 프로필', department: '의전팀 / 행사운영', team: '분장팀', requester: '김철수', date: '2026-04-29', status: 'meeting', project: '임원 프로필 촬영', priority: 'high', tags: ['실내', '정장', '3명'], content: '임원 3명 프로필 촬영을 위한 정장 및 기본 메이크업 지원 요청입니다.' },
  { id: 't2', type: 'education', title: '유년부 율동팀 무용복 코칭', department: '유년부 / 교육', team: '운영팀', requester: '이영희', date: '2026-04-30', status: 'prework', project: '상반기 교육 지원', priority: 'normal', tags: ['부서교육', '15명', '사전과제'], content: '유년부 율동팀 15명 대상 무용복 착용법 및 관리법 사전 교육입니다.', educationSteps: ['요청 접수', '사전 회의', '사전 과제 제출'] },
  { id: 't3', type: 'internal', title: '봄 시즌 무용복 재고 실사', department: '의상분장과', team: '운영팀', requester: '관리자', date: '2026-04-29', status: 'in-progress', project: '정기 재고 관리', priority: 'high', tags: ['재고관리', '세탁확인'], content: '연수원 5층, 6층 창고 내 봄 시즌용 무용복 전체 수량 파악 및 오염 검수 작업입니다.' },
  { id: 't4', type: 'project', title: '승리컵 축구복 구성 정리', department: '의상분장과', team: '디자인팀', requester: '관리자', date: '2026-05-02', status: 'received', project: '승리컵 축구복', priority: 'normal', tags: ['프로젝트', '사이즈', '세트구성'], content: '승리컵 행사 전 축구복 사이즈별 수량, 세트 구성, 대여 가능 상태를 정리합니다.' },
  { id: 't5', type: 'costume', title: '청년부 뮤지컬 분장 지원', department: '청년부 / 문화', team: '분장팀', requester: '박민수', date: '2026-04-26', status: 'completed', project: '청년부 뮤지컬', priority: 'normal', tags: ['무대분장', '20명'], content: '청년부 주관 창작 뮤지컬 무대 분장 및 의상 대여 지원 완료 건입니다.' },
];

const WORK_STAGES = [
  { id: 'received', title: '접수', color: 'var(--text-muted)' },
  { id: 'meeting', title: '회의', color: 'var(--warning)' },
  { id: 'prework', title: '과제', color: 'var(--info)' },
  { id: 'in-progress', title: '진행', color: 'var(--primary)' },
  { id: 'completed', title: '완료', color: 'var(--success)' },
];

const PROJECTS = [
  { name: '승리컵 축구복', status: '구성 정리', progress: 35, due: '05-02' },
  { name: '북 의상 정리', status: '사진 촬영 필요', progress: 20, due: '05-08' },
  { name: '상반기 교육 지원', status: '사전 과제 수집', progress: 60, due: '04-30' },
];

const TYPE_LABELS = { costume: '분장', education: '교육', internal: '내부', project: '프로젝트' };
const PRIORITY_LABELS = { high: '중요', normal: '일반', low: '낮음' };
function getTaskTypeBadge(type) { return type === 'costume' ? 'info' : type === 'education' ? 'warning' : type === 'project' ? 'primary' : 'gray'; }

export default function DashboardPage() {
  const { items, rentals } = useApp();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState('전체');
  const [newTaskData, setNewTaskData] = useState({ title: '', type: 'internal', department: '의상분장과', team: '운영팀', requester: '관리자', date: '', project: '', priority: 'normal', content: '', tags: '' });

  const today = '2026-04-29';
  const filteredTasks = teamFilter === '전체' ? tasks : tasks.filter(t => t.team === teamFilter);
  const todayTasks = filteredTasks.filter(t => t.date === today && t.status !== 'completed');
  const activeTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const completionRate = filteredTasks.length > 0 ? Math.round((completedTasks.length / filteredTasks.length) * 100) : 0;
  const urgentTasks = filteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed');
  const totalItems = items.reduce((a, i) => a + i.quantity, 0);
  const activeRentals = rentals.filter(r => ['requested', 'approved', 'renting', 'return-req'].includes(r.status)).length;
  const overdueRentals = rentals.filter(r => r.overdue).length;

  const processedRentals = rentals.map(r => {
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

  const handleDragStart = (e, id) => { setDraggedTask(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, status) => { e.preventDefault(); if (draggedTask) { setTasks(p => p.map(t => t.id === draggedTask ? { ...t, status } : t)); setDraggedTask(null); } };

  const handleCreateTask = (e) => {
    e.preventDefault();
    setTasks(p => [...p, { id: `t${Date.now()}`, ...newTaskData, date: newTaskData.date || new Date().toISOString().split('T')[0], status: 'received', project: newTaskData.project || '일반 업무', tags: newTaskData.tags ? newTaskData.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }]);
    setIsNewModalOpen(false);
    setNewTaskData({ title: '', type: 'internal', department: '의상분장과', team: '운영팀', requester: '관리자', date: '', project: '', priority: 'normal', content: '', tags: '' });
  };

  return (
    <div className="dashboard-unified">
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
            <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{activeTasks.length}</div>
            <div className="stat-label" style={{ fontWeight: 600 }}>진행 중</div>
          </div>
        </div>

        <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="stat-icon" style={{ width: 38, height: 38, background: 'var(--primary-50)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-sm)' }}>
            <TrendingUp size={19} strokeWidth={2.2} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{completionRate}%</div>
            <div className="stat-label" style={{ fontWeight: 600 }}>달성률</div>
          </div>
        </div>

        <div className="stat-card compact" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="stat-icon" style={{ width: 38, height: 38, background: '#fee2e2', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
            <AlertTriangle size={19} strokeWidth={2.2} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: 21, color: 'var(--danger)' }}>{overdueRentals > 0 ? overdueRentals : urgentTasks.length}</div>
            <div className="stat-label" style={{ fontWeight: 600 }}>{overdueRentals > 0 ? '반납 지연' : '긴급'}</div>
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
                      <span className={`badge badge-${getTaskTypeBadge(task.type)}`} style={{ fontSize: 9, padding: '2px 5px' }}>{TYPE_LABELS[task.type]}</span>
                      {task.priority === 'high' && <span className="badge badge-danger" style={{ fontSize: 9, padding: '2px 5px' }}>긴급</span>}
                    </div>
                    <strong style={{ fontSize: 13, display: 'block', marginTop: 4, marginBottom: 2 }}>{task.title}</strong>
                    <small style={{ fontSize: 11, display: 'block' }}>{task.department}</small>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center' }}>
                  <Columns3 size={15} color="var(--primary-dark)" style={{ marginRight: 6 }} /> 업무 진행 보드
                </h3>
                <div className="team-filter-group">
                  {TEAMS.map(t => (
                    <button key={t} type="button" className={`team-filter-btn ${teamFilter === t ? 'active' : ''}`} onClick={() => setTeamFilter(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setIsNewModalOpen(true)} style={{ padding: '5px 10px', fontSize: 11 }}>
                <Plus size={12} style={{ marginRight: 3 }} />등록
              </button>
            </div>
            <div className="dash-card-body" style={{ padding: 0 }}>
              <div className="kanban-board" style={{ height: '100%', minHeight: 0, gap: 0 }}>
                {WORK_STAGES.map(stage => {
                  const col = filteredTasks.filter(t => t.status === stage.id);
                  return (
                    <div key={stage.id} className="kanban-column" onDragOver={handleDragOver} onDrop={e => handleDrop(e, stage.id)}
                      style={{ flex: '1 1 0', minWidth: 0, borderRadius: 0, borderRight: '1px solid var(--border-light)', background: 'transparent' }}>
                      <div className="kanban-column-header" style={{ padding: '10px 12px', borderBottomColor: stage.color }}>
                        <div className="kanban-column-title" style={{ color: stage.color, fontSize: 10 }}>{stage.title}</div>
                        <div className="kanban-column-count" style={{ fontSize: 10, padding: '1px 6px' }}>{col.length}</div>
                      </div>
                      <div className="kanban-cards" style={{ padding: '6px 8px', gap: 6 }}>
                        {col.map(task => (
                          <div key={task.id} className={`kanban-card ${task.priority === 'high' ? 'priority-high' : ''}`}
                            draggable onDragStart={e => handleDragStart(e, task.id)} onClick={() => setSelectedTask(task)}
                            style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span className={`badge badge-${getTaskTypeBadge(task.type)}`} style={{ fontSize: 8, padding: '1px 4px' }}>{TYPE_LABELS[task.type]}</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{task.title}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="team-tag">{task.team}</span>{task.department}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
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
              {processedRentals.slice(0, 5).map(r => (
                <div key={r.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: r.diff <= 1 ? '10px 12px' : '10px 4px',
                  background: r.diff === 0 ? '#fff5f5' : r.diff === 1 ? '#fffbeb' : 'transparent',
                  borderRadius: r.diff <= 1 ? 'var(--radius-sm)' : 0,
                  borderBottom: r.diff <= 1 ? 'none' : '1px solid var(--border-light)',
                  marginBottom: r.diff <= 1 ? 6 : 0,
                  fontSize: 12
                }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {r.dTag && (
                        <span className={`badge ${r.diff === 0 ? 'badge-danger' : r.diff === 1 ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 9, padding: '2px 5px' }}>
                          {r.diff === 0 ? '🚨 ' : r.diff === 1 ? '⚡ ' : ''}{r.dTag}
                        </span>
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.department.split('/')[0].trim()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.items}</div>
                  </div>
                  <span className={`badge badge-${r.status === 'requested' ? 'warning' : r.status === 'renting' ? 'primary' : r.status === 'return-req' ? 'gray' : r.status === 'approved' ? 'info' : 'success'}`} style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>
                    {r.status === 'requested' ? '신청' : r.status === 'approved' ? '승인' : r.status === 'renting' ? '대여중' : r.status === 'return-req' ? '반납' : '완료'}
                    {r.overdue && ' ⚠'}
                  </span>
                </div>
              ))}
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

      {/* Modals */}
      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal work-detail-modal">
            <div className="modal-header"><h2 className="modal-title">{TYPE_LABELS[selectedTask.type]} 상세</h2><button className="modal-close" onClick={() => setSelectedTask(null)}>x</button></div>
            <div className="modal-body">
              <div className="work-detail-heading"><div><h3>{selectedTask.title}</h3><div className="task-tag-list">{selectedTask.tags.map((t, i) => <span key={i}>#{t}</span>)}</div></div>
                <span className={`badge badge-${selectedTask.priority === 'high' ? 'danger' : 'gray'}`}>{PRIORITY_LABELS[selectedTask.priority]}</span></div>
              <div className="detail-grid">
                <div>담당 팀</div><span><span className="team-tag">{selectedTask.team}</span></span>
                <div>담당 부서</div><span>{selectedTask.department}</span>
                <div>요청자</div><span>{selectedTask.requester}</span>
                <div>프로젝트</div><span>{selectedTask.project}</span>
                <div>기한</div><strong>{selectedTask.date}</strong>
                <div>상태</div><strong style={{ color: WORK_STAGES.find(s => s.id === selectedTask.status)?.color }}>{WORK_STAGES.find(s => s.id === selectedTask.status)?.title}</strong>
              </div>
              {selectedTask.type === 'education' && (
                <div className="process-panel"><div className="detail-section-title">교육 프로세스</div>
                  {['요청 접수', '사전 회의', '사전 과제 제출', '실교육', '완료'].map(step => (
                    <div key={step} className={`process-step ${selectedTask.educationSteps?.includes(step) ? 'done' : ''}`}><span>{selectedTask.educationSteps?.includes(step) ? '완료' : '대기'}</span><strong>{step}</strong></div>
                  ))}</div>
              )}
              <div className="detail-section"><div className="detail-section-title">상세 내용</div><div className="memo-box">{selectedTask.content || '없음'}</div></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>닫기</button>
              {selectedTask.status !== 'completed' && <button className="btn btn-primary" onClick={() => { setTasks(p => p.map(t => t.id === selectedTask.id ? { ...t, status: 'completed' } : t)); setSelectedTask(null); }}>완료 처리</button>}
            </div>
          </div>
        </div>
      )}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header"><h2 className="modal-title">새 업무 등록</h2><button className="modal-close" onClick={() => setIsNewModalOpen(false)}>x</button></div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">유형</label><select className="form-select" value={newTaskData.type} onChange={e => setNewTaskData({ ...newTaskData, type: e.target.value })}><option value="internal">내부</option><option value="costume">분장</option><option value="education">교육</option><option value="project">프로젝트</option></select></div>
                  <div className="form-group"><label className="form-label">중요도</label><select className="form-select" value={newTaskData.priority} onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value })}><option value="high">중요</option><option value="normal">일반</option><option value="low">낮음</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">업무명 *</label><input type="text" className="form-input" required value={newTaskData.title} onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })} placeholder="예: 북 의상 사진 촬영" /></div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">담당 팀 *</label>
                    <select className="form-select" value={newTaskData.team} onChange={e => setNewTaskData({ ...newTaskData, team: e.target.value })}>
                      <option value="운영팀">운영팀</option><option value="분장팀">분장팀</option><option value="디자인팀">디자인팀</option>
                    </select></div>
                  <div className="form-group"><label className="form-label">요청 부서</label><input type="text" className="form-input" value={newTaskData.department} onChange={e => setNewTaskData({ ...newTaskData, department: e.target.value })} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">담당자 *</label><input type="text" className="form-input" required value={newTaskData.requester} onChange={e => setNewTaskData({ ...newTaskData, requester: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">프로젝트</label><input type="text" className="form-input" value={newTaskData.project} onChange={e => setNewTaskData({ ...newTaskData, project: e.target.value })} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">기한 *</label><input type="date" className="form-input" required value={newTaskData.date} onChange={e => setNewTaskData({ ...newTaskData, date: e.target.value })} /></div>
                  <div></div>
                </div>
                <div className="form-group"><label className="form-label">태그</label><input type="text" className="form-input" value={newTaskData.tags} onChange={e => setNewTaskData({ ...newTaskData, tags: e.target.value })} placeholder="쉼표 구분" /></div>
                <div className="form-group"><label className="form-label">상세 내용</label><textarea className="form-textarea" value={newTaskData.content} onChange={e => setNewTaskData({ ...newTaskData, content: e.target.value })}></textarea></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>취소</button><button type="submit" className="btn btn-primary">등록</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
