'use client';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const KANBAN_STAGES = [
  { id: 'requested', title: '대여신청', color: 'var(--warning)' },
  { id: 'approved', title: '대여승낙', color: 'var(--info)' },
  { id: 'renting', title: '대여중', color: 'var(--primary)' },
  { id: 'return-req', title: '반납신청', color: 'var(--text-muted)' },
  { id: 'returned', title: '반납완료', color: 'var(--success)' },
];

function getTotalQuantity(rental) {
  return (rental.lines || []).reduce((sum, line) => sum + line.quantity, 0);
}

function createInitialReturnData(rental) {
  const existing = rental.returnChecks || {};
  const total = getTotalQuantity(rental);
  return {
    washedQuantity: existing.washedQuantity ?? total,
    unwashedQuantity: existing.unwashedQuantity ?? 0,
    laundryComment: existing.laundryComment || '',
    repairRequired: !!existing.repairRequired,
    repairComment: existing.repairComment || '',
  };
}

export default function RentalsKanban() {
  const { rentals, updateRentalStatus, updateRental } = useApp();
  const [selectedRental, setSelectedRental] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const today = '2026-04-29';
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
  }).sort((a, b) => a.priorityScore - b.priorityScore || new Date(a.pickupDate) - new Date(b.pickupDate));

  const handleDragStart = (e, rentalId) => {
    setDraggedItem(rentalId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedItem) {
      updateRentalStatus(draggedItem, targetStatus);
      setDraggedItem(null);
    }
  };

  const openRental = (rental) => {
    setSelectedRental(rental);
    setReturnData(createInitialReturnData(rental));
  };

  const handleReturnDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReturnData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const completeReturn = () => {
    if (!selectedRental || !returnData) return;
    updateRental(selectedRental.id, {
      status: 'returned',
      overdue: false,
      returnChecks: {
        ...returnData,
        washedQuantity: parseInt(returnData.washedQuantity, 10) || 0,
        unwashedQuantity: parseInt(returnData.unwashedQuantity, 10) || 0,
      },
    });
    setSelectedRental(null);
    setReturnData(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="kanban-page-heading">
        <div>
          <h2>대여 현황</h2>
          <p>승낙, 대여중, 반납신청, 반납완료 상태를 드래그 앤 드롭으로 관리합니다.</p>
        </div>
        <div className="kanban-summary">
          <span>진행 {rentals.filter(r => r.status !== 'returned').length}건</span>
          <span>지연 {rentals.filter(r => r.overdue).length}건</span>
        </div>
      </div>

      <div className="kanban-board">
        {KANBAN_STAGES.map(stage => {
          const columnRentals = processedRentals.filter(r => r.status === stage.id);

          return (
            <div
              key={stage.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="kanban-column-header" style={{ borderBottomColor: stage.color }}>
                <div className="kanban-column-title" style={{ color: stage.color }}>{stage.title}</div>
                <div className="kanban-column-count">{columnRentals.length}</div>
              </div>

              <div className="kanban-cards">
                {columnRentals.map(rental => (
                  <div
                    key={rental.id}
                    className={`kanban-card ${rental.overdue ? 'overdue' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, rental.id)}
                    onClick={() => openRental(rental)}
                    style={{
                      borderLeft: rental.diff === 0 ? '4px solid var(--danger)' : rental.diff === 1 ? '4px solid var(--warning)' : undefined,
                      background: rental.diff === 0 ? '#fff5f5' : rental.diff === 1 ? '#fffbeb' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div className="kanban-card-id">ID #{rental.id}</div>
                      {rental.dTag && (
                        <span className={`badge ${rental.diff === 0 ? 'badge-danger' : rental.diff === 1 ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 9, padding: '2px 5px' }}>
                          {rental.diff === 0 ? '🚨 ' : rental.diff === 1 ? '⚡ ' : ''}{rental.dTag}
                        </span>
                      )}
                    </div>
                    <div className="kanban-card-title">{rental.department}</div>
                    <div className="kanban-card-desc">{rental.requester} · {rental.items}</div>

                    <div className="kanban-card-footer" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                      <span>출고 {rental.pickupDate?.slice(5) || '-'}</span>
                      {rental.overdue ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>지연</span> : <span>반납 {rental.returnDueDate?.slice(5) || '-'}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedRental && (
        <div className="modal-overlay">
          <div className="modal rental-detail-modal">
            <div className="modal-header">
              <h2 className="modal-title">대여 상세 정보</h2>
              <button className="modal-close" onClick={() => setSelectedRental(null)}>x</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div>대여 ID</div>
                <strong>#{selectedRental.id}</strong>

                <div>신청 부서</div>
                <span>{selectedRental.department}</span>

                <div>신청자</div>
                <span>{selectedRental.requester}</span>

                <div>연락처</div>
                <span>{selectedRental.contact || '-'}</span>

                <div>사용 목적</div>
                <span>{selectedRental.purpose || '-'}</span>

                <div>수령/행사</div>
                <span>{selectedRental.pickupDate || '-'} / {selectedRental.eventDate || '-'}</span>

                <div>반납 기한</div>
                <strong className={selectedRental.overdue ? 'danger-text' : ''}>{selectedRental.returnDueDate || '-'}</strong>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">대여 항목</div>
                <div className="line-list">
                  {(selectedRental.lines || []).map((line, idx) => (
                    <div key={idx} className="line-item">
                      <span>{line.name}</span>
                      <strong>{line.quantity}개</strong>
                    </div>
                  ))}
                  {(!selectedRental.lines || selectedRental.lines.length === 0) && (
                    <div className="line-item">
                      <span>{selectedRental.items}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">비고/메모</div>
                <div className="memo-box">{selectedRental.notes || '메모 없음'}</div>
              </div>

              {selectedRental.status === 'return-req' && returnData && (
                <div className="return-check-panel">
                  <div className="detail-section-title">반납 확인</div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">세탁 완료 수량</label>
                      <input type="number" className="form-input" name="washedQuantity" min="0" value={returnData.washedQuantity} onChange={handleReturnDataChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">미세탁 수량</label>
                      <input type="number" className="form-input" name="unwashedQuantity" min="0" value={returnData.unwashedQuantity} onChange={handleReturnDataChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">세탁/미세탁 코멘트</label>
                    <textarea className="form-textarea" name="laundryComment" value={returnData.laundryComment} onChange={handleReturnDataChange} placeholder="예: 5개는 깨끗하여 미세탁, 나머지는 드라이 완료"></textarea>
                  </div>
                  <label className="checkbox-row">
                    <input type="checkbox" name="repairRequired" checked={returnData.repairRequired} onChange={handleReturnDataChange} />
                    <span>수선 필요한 품목 있음</span>
                  </label>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">수선 메모</label>
                    <textarea className="form-textarea" name="repairComment" value={returnData.repairComment} onChange={handleReturnDataChange} placeholder="예: 소매 올풀림, 단추 분실 등"></textarea>
                  </div>
                </div>
              )}

              {selectedRental.status === 'returned' && selectedRental.returnChecks && (
                <div className="return-check-panel readonly">
                  <div className="detail-section-title">반납 기록</div>
                  <div className="line-item"><span>세탁 완료</span><strong>{selectedRental.returnChecks.washedQuantity}개</strong></div>
                  <div className="line-item"><span>미세탁</span><strong>{selectedRental.returnChecks.unwashedQuantity}개</strong></div>
                  <div className="memo-box">{selectedRental.returnChecks.laundryComment || '세탁 코멘트 없음'}</div>
                  {selectedRental.returnChecks.repairRequired && (
                    <div className="memo-box danger">{selectedRental.returnChecks.repairComment || '수선 메모 없음'}</div>
                  )}
                </div>
              )}

              {selectedRental.status === 'renting' && selectedRental.overdue && (
                <div className="notice-box danger" style={{ marginTop: '20px' }}>
                  <strong>반납 지연 상태입니다.</strong>
                  <p>자동 문자 발송 전까지는 이 알림을 보고 담당자가 수동 연락할 수 있습니다.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRental(null)}>닫기</button>
              {selectedRental.status === 'requested' && (
                <button className="btn btn-primary" onClick={() => { updateRentalStatus(selectedRental.id, 'approved'); setSelectedRental(null); }}>승낙 처리</button>
              )}
              {selectedRental.status === 'approved' && (
                <button className="btn btn-primary" onClick={() => { updateRentalStatus(selectedRental.id, 'renting'); setSelectedRental(null); }}>대여 시작</button>
              )}
              {selectedRental.status === 'return-req' && (
                <button className="btn btn-primary" onClick={completeReturn}>반납 확인 및 완료</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
