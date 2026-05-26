'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import { uploadItemPhoto } from '@/lib/supabaseClient';
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
  const { rentals, updateRentalStatus, updateRental, currentUser } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState('ALL');

  // 반납 신청용 모달 상태
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [targetRental, setTargetRental] = useState(null);
  const [returnLocation, setReturnLocation] = useState('');
  const [returnMemo, setReturnMemo] = useState('');
  const [returnPhotoUrl, setReturnPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 반납 모달 오픈 핸들러
  const openReturnModal = (rental) => {
    setTargetRental(rental);
    setReturnLocation('');
    setReturnMemo('');
    setReturnPhotoUrl('');
    setIsReturnModalOpen(true);
  };

  // 사진 업로드 핸들러
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadItemPhoto(file);
      if (url) {
        setReturnPhotoUrl(url);
      }
    } catch (err) {
      alert('이미지 업로드에 실패했습니다: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 반납 신청 제출 핸들러
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!targetRental) return;
    if (!returnLocation.trim()) {
      alert('반납 장소를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const returnSubmission = {
        location: returnLocation.trim(),
        memo: returnMemo.trim(),
        photoUrl: returnPhotoUrl || null,
        submittedAt: new Date().toISOString()
      };

      await updateRental(targetRental.id, {
        status: 'return-req',
        returnSubmission
      });

      alert('반납 신청이 정상적으로 접수되었습니다. 관리자가 확인 후 최종 반납 완료 처리합니다.');
      setIsReturnModalOpen(false);
      setTargetRental(null);
    } catch (err) {
      alert('반납 신청 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
                        onClick={() => openReturnModal(rental)}
                        style={{
                          background: 'var(--primary-50)',
                          border: '1px solid var(--primary-200)',
                          borderRadius: '6px',
                          color: 'var(--primary-dark)',
                          padding: '4px 12px',
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
                        반납하기 (정보 등록) 🧺
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
                    {rental.pickupLocation && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12.5px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800 }}>📍 물건 수령 장소:</span>
                        <strong style={{ textDecoration: 'underline' }}>{rental.pickupLocation}</strong>
                      </div>
                    )}
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

                {/* 📝 제출한 반납 정보 (Grid 밖 최하단 배치로 가시성 극대화) */}
                {rental.returnSubmission && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '11.5px', color: '#475569' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📝 제출한 반납 정보</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        제출일: {new Date(rental.returnSubmission.submittedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>반납 위치:</span>
                      <strong>{rental.returnSubmission.location}</strong>
                    </div>
                    {rental.returnSubmission.memo && (
                      <div style={{ marginBottom: '4px', marginTop: '4px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>반납 메모:</div>
                        <div style={{ background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}>{rental.returnSubmission.memo}</div>
                      </div>
                    )}
                    {rental.returnSubmission.photoUrl && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, marginBottom: '4px' }}>📸 반납 사진 (클릭 시 확대)</div>
                        <img 
                          src={rental.returnSubmission.photoUrl} 
                          alt="반납 증빙 사진" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
                          onClick={() => window.open(rental.returnSubmission.photoUrl, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    {/* 반납 신청 모달 */}
    {isReturnModalOpen && targetRental && (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2 className="modal-title">반납 신청</h2>
            <button className="modal-close" onClick={() => setIsReturnModalOpen(false)}>x</button>
          </div>
          <form onSubmit={handleSubmitReturn}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>대여 품목 정보</div>
                <div>{targetRental.items}</div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                  반납 장소 <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 7층 로비 사물함 위, 지하 1층 의상창고"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                  실제 물품을 놓아둔 상세 위치를 입력해주세요.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                  반납 사진 첨부 (선택)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="return-photo-upload"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="return-photo-upload"
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-block',
                      opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    {isUploading ? '업로드 중...' : '사진 선택/촬영 📸'}
                  </label>
                  {returnPhotoUrl && (
                    <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                      ✓ 사진이 첨부되었습니다.
                    </span>
                  )}
                </div>
                {returnPhotoUrl && (
                  <div style={{ marginTop: '10px', position: 'relative', width: '120px', height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img
                      src={returnPhotoUrl}
                      alt="반납 사진 미리보기"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => setReturnPhotoUrl('')}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                    >
                      x
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                  반납 메모 / 특이사항 (선택)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="오염, 손상, 수량이 모자라는 등의 특이사항이 있다면 작성해주세요."
                  value={returnMemo}
                  onChange={(e) => setReturnMemo(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', resize: 'vertical' }}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsReturnModalOpen(false)}
                disabled={isSubmitting}
              >
                닫기
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUploading || isSubmitting}
              >
                {isSubmitting ? '신청 중...' : '반납 신청 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}
