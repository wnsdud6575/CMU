'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeftRight, 
  RotateCcw, 
  Trash2, 
  User, 
  Phone, 
  Tag, 
  Info,
  CalendarDays
} from 'lucide-react';

export default function MyRentalsPage() {
  const { rentals, updateRentalStatus, currentUser } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState('ALL');

  // 일반 사용자 접근 통제
  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  // 💡 본인의 대여 신청만 필터링 (신청자명과 부서명이 일치하는 건)
  const myRentals = rentals.filter(r => {
    // 부서명 비교 시 앞부분 공백 제거나 포함 여부 등으로 유연하게 체크
    const rDept = (r.department || '').trim();
    const uDept = (currentUser.dept || '').trim();
    const rReq = (r.requester || '').trim();
    const uName = (currentUser.name || '').trim();
    
    return rReq === uName && (rDept === uDept || rDept.includes(uDept) || uDept.includes(rDept));
  });

  // 상태 카운트 계산
  const countSummary = {
    all: myRentals.length,
    pending: myRentals.filter(r => r.status === 'requested').length,
    renting: myRentals.filter(r => r.status === 'renting').length,
    overdue: myRentals.filter(r => r.overdue && !['returned', 'rejected'].includes(r.status)).length
  };

  // 필터 탭 기준 필터링
  const filteredRentals = myRentals.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return r.status === 'requested' || r.status === 'approved';
    if (filter === 'RENTING') return r.status === 'renting' || r.status === 'return-req';
    if (filter === 'RETURNED') return r.status === 'returned';
    if (filter === 'REJECTED') return r.status === 'rejected';
    return true;
  });

  // 상태 배지 헬퍼
  const getStatusBadge = (status, overdue) => {
    if (overdue && !['returned', 'rejected'].includes(status)) {
      return { label: '연체중', bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: AlertCircle };
    }
    switch (status) {
      case 'requested':
        return { label: '승인 대기', bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', icon: Clock };
      case 'approved':
        return { label: '승인 완료', bg: '#ecfdf5', border: '#a7f3d0', color: '#059669', icon: CheckCircle2 };
      case 'renting':
        return { label: '대여중', bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', icon: ArrowLeftRight };
      case 'return-req':
        return { label: '반납 요청중', bg: '#faf5ff', border: '#e9d5ff', color: '#7c3aed', icon: RotateCcw };
      case 'returned':
        return { label: '반납 완료', bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', icon: CheckCircle2 };
      case 'rejected':
        return { label: '반려됨', bg: '#fff1f2', border: '#fecdd3', color: '#e11d48', icon: XCircle };
      default:
        return { label: '확인필요', bg: '#f1f5f9', border: '#cbd5e1', color: '#475569', icon: Info };
    }
  };

  // 대여 신청 취소 핸들러
  const handleCancelRequest = async (id) => {
    if (!confirm('대여 신청을 취소하시겠습니까?')) return;
    try {
      await updateRentalStatus(id, 'rejected');
      alert('신청이 정상적으로 취소(반려) 처리되었습니다.');
    } catch (err) {
      alert('신청 취소 중 에러가 발생했습니다.');
    }
  };

  // 반납 요청 핸들러
  const handleReturnRequest = async (id) => {
    if (!confirm('반납을 신청하시겠습니까? 관리자 확인 후 반납 처리됩니다.')) return;
    try {
      await updateRentalStatus(id, 'return-req');
      alert('반납 요청이 정상적으로 전송되었습니다.');
    } catch (err) {
      alert('반납 요청 중 에러가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 타이틀 및 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ClipboardList size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>나의 대여 신청 현황</h1>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            {currentUser.dept} · <strong>{currentUser.name}</strong> 님이 신청하신 대여 내역을 실시간으로 확인하고 관리할 수 있습니다.
          </p>
        </div>
        <button 
          onClick={() => router.push('/rentals/apply')}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600 }}
        >
          새 대여 신청하기 +
        </button>
      </div>

      {/* 요약 카운팅 보드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>총 신청 건수</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{countSummary.all} 건</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={18} color="#2563eb" />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>승인 대기중</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>{countSummary.pending} 건</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color="#2563eb" />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>현재 대여중</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{countSummary.renting} 건</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftRight size={18} color="#16a34a" />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>반납 지연 (연체)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{countSummary.overdue} 건</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={18} color="#dc2626" />
          </div>
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        background: '#f1f5f9', 
        padding: '4px', 
        borderRadius: '10px', 
        border: '1px solid var(--border)', 
        marginBottom: '20px',
        width: 'max-content'
      }}>
        {[
          { key: 'ALL', label: '전체 내역' },
          { key: 'PENDING', label: '신청/출고대기' },
          { key: 'RENTING', label: '대여/반납요청' },
          { key: 'RETURNED', label: '반납 완료' },
          { key: 'REJECTED', label: '반려/취소' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: filter === tab.key ? '#fff' : 'transparent',
              color: filter === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: filter === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.1s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 리스트 목록 */}
      {filteredRentals.length === 0 ? (
        <div style={{ 
          background: '#fff', 
          border: '1px dashed var(--border)', 
          borderRadius: '12px', 
          padding: '48px', 
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          조건에 부합하는 대여 신청 목록이 존재하지 않습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRentals.map(rental => {
            const b = getStatusBadge(rental.status, rental.overdue);
            const BadgeIcon = b.icon;

            return (
              <div 
                key={rental.id}
                style={{
                  background: '#fff',
                  border: `1px solid ${rental.overdue ? '#fecaca' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* 상단 헤더 라인 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      background: b.bg, 
                      border: `1px solid ${b.border}`, 
                      color: b.color, 
                      padding: '3px 8px', 
                      borderRadius: '15px', 
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <BadgeIcon size={12} />
                      {b.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      신청일: {rental.date || '날짜 미지정'}
                    </span>
                  </div>
                  
                  {/* 제어 버튼 */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {rental.status === 'requested' && (
                      <button
                        onClick={() => handleCancelRequest(rental.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #fee2e2',
                          borderRadius: '6px',
                          color: '#e11d48',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <Trash2 size={12} />
                        신청 취소
                      </button>
                    )}
                    {rental.status === 'renting' && (
                      <button
                        onClick={() => handleReturnRequest(rental.id)}
                        style={{
                          background: 'var(--primary-50)',
                          border: '1px solid var(--primary-200)',
                          borderRadius: '6px',
                          color: 'var(--primary-dark)',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-100)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-50)' }}
                      >
                        <RotateCcw size={12} />
                        반납 요청하기
                      </button>
                    )}
                  </div>
                </div>

                {/* 본문 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  
                  {/* 왼쪽: 대여 물품 요약 */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <Tag size={12} /> 대여 품목 정보
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {rental.items}
                    </div>
                  </div>

                  {/* 오른쪽: 일정 및 신청 목적 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <Calendar size={12} /> 수령 예정일
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                          {rental.pickupDate || '날짜 미입력'}
                        </div>
                      </div>
                      
                      {rental.eventDate && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <CalendarDays size={12} /> 행사일
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                            {rental.eventDate}
                          </div>
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <Calendar size={12} /> 반납 기한
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: rental.overdue ? '#dc2626' : '#334155' }}>
                          {rental.returnDueDate || '날짜 미입력'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <User size={12} /> 신청자 / 연락처
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{rental.requester}</span>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Phone size={10} /> {rental.contact}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '2px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>신청 목적</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                        {rental.purpose}
                      </div>
                    </div>

                    {rental.notes && (
                      <div style={{ marginTop: '4px', padding: '6px 8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '11px', color: '#b45309' }}>
                        <strong>비고:</strong> {rental.notes}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
