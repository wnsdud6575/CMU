'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import AssetPhoto from '../../components/AssetPhoto';
import { Search, ShoppingCart, Trash2, Plus, Minus, CalendarCheck, Info, AlertTriangle, ChevronDown } from 'lucide-react';

const ACTIVE_RENTAL_STATUSES = ['approved', 'renting', 'return-req'];

function addDays(dateValue, days) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function RentalApplyPage() {
  const { items, sets, CATEGORIES, rentals, addRental } = useApp();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    department: '', requester: '', contact: '',
    purpose: '', pickupDate: '', eventDate: '', notes: '',
  });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [cartFlash, setCartFlash] = useState(null);

  const returnDueDate = addDays(formData.eventDate || formData.pickupDate, formData.eventDate ? 7 : 14);
  const activeRentals = rentals.filter(r => ACTIVE_RENTAL_STATUSES.includes(r.status));

  const getRentedQuantity = (itemId) =>
    activeRentals.reduce((sum, rental) =>
      sum + (rental.lines || []).reduce((lineSum, line) => {
        if (line.type === 'item' && line.refId === itemId) return lineSum + line.quantity;
        if (line.type === 'set' && line.itemIds?.includes(itemId)) return lineSum + line.quantity;
        return lineSum;
      }, 0), 0);

  const getCartQuantityForItem = (itemId) =>
    cart.reduce((sum, line) => {
      if (line.type === 'item' && line.refId === itemId) return sum + line.quantity;
      if (line.type === 'set' && line.itemIds?.includes(itemId)) return sum + line.quantity;
      return sum;
    }, 0);

  const getRemainingQuantity = (item) =>
    Math.max(0, item.quantity - getRentedQuantity(item.id) - getCartQuantityForItem(item.id));

  const getClosestReturnDueDate = (itemIds) => {
    const dueDates = activeRentals
      .filter(rental => (rental.lines || []).some(line => {
        if (line.type === 'item') return itemIds.includes(line.refId);
        return line.itemIds?.some(id => itemIds.includes(id));
      }))
      .map(rental => rental.returnDueDate).filter(Boolean).sort();
    return dueDates[0] || '';
  };

  const catalog = (() => {
    const itemEntries = items
      .filter(item => !item.hidden && item.status !== 'discard')
      .map(item => {
        const remaining = Math.max(0, item.quantity - getRentedQuantity(item.id) - getCartQuantityForItem(item.id));
        const dueDate = getClosestReturnDueDate([item.id]);
        const unavailableReason = item.status === 'repair' ? '수선 후 대여 가능'
          : remaining <= 0 ? '현재 전체 대여 중' : '';
        return {
          type: 'item', refId: item.id, name: item.name,
          description: `${item.sizeBreakdown || '사이즈 미입력'} · ${item.laundryMethod || '세탁 방법 미입력'}`,
          categoryCode: item.category, categoryName: CATEGORIES[item.category]?.name || item.category,
          item, itemIds: [item.id],
          availableQuantity: unavailableReason ? 0 : remaining,
          totalQuantity: item.quantity, dueDate, unavailableReason,
        };
      });

    const setEntries = sets.map(set => {
      const setItems = set.items.map(id => items.find(item => item.id === id)).filter(Boolean);
      const availableQuantities = setItems.map(item => item.status === 'repair' || item.status === 'discard' ? 0 : getRemainingQuantity(item));
      const availableQuantity = availableQuantities.length > 0 ? Math.min(...availableQuantities) : 0;
      const dueDate = getClosestReturnDueDate(setItems.map(item => item.id));
      const representativeItem = setItems[0] || null;
      return {
        type: 'set', refId: set.id, name: set.name, description: set.description,
        categoryCode: 'SET', categoryName: '추천 세트',
        item: representativeItem, itemIds: setItems.map(item => item.id),
        availableQuantity, totalQuantity: availableQuantity, dueDate,
        unavailableReason: availableQuantity <= 0 ? '구성품 재고 부족' : '',
      };
    });
    return [...itemEntries, ...setEntries];
  })();

  const filteredCatalog = catalog.filter(entry => {
    const haystack = [entry.name, entry.description, entry.categoryName, entry.item?.code,
      entry.item?.assemblyCode, ...(entry.item?.keywords || [])].filter(Boolean).join(' ').toLowerCase();
    const matchSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchCategory = category === 'ALL' || entry.categoryCode === category;
    return matchSearch && matchCategory;
  });

  const addToCart = (entry) => {
    if (entry.availableQuantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(line => line.type === entry.type && line.refId === entry.refId);
      if (existing) {
        return prev.map(line => {
          if (line !== existing || line.quantity >= line.max) return line;
          return { ...line, quantity: line.quantity + 1 };
        });
      }
      return [...prev, { type: entry.type, refId: entry.refId, name: entry.name, quantity: 1, max: entry.availableQuantity, itemIds: entry.itemIds }];
    });
    setCartFlash(entry.refId);
    setTimeout(() => setCartFlash(null), 600);
  };

  const updateCartQty = (idx, delta) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) next.splice(idx, 1);
      else if (newQty <= next[idx].max) next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  };

  const setCartQtyDirect = (idx, val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    setCart(prev => {
      const next = [...prev];
      if (num <= 0) { next.splice(idx, 1); return next; }
      next[idx] = { ...next[idx], quantity: Math.min(num, next[idx].max) };
      return next;
    });
  };

  const removeCartItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));
  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmitRequest = () => {
    if (cart.length === 0) return alert('장바구니가 비어있습니다.');
    if (!formData.department || !formData.requester || !formData.contact || !formData.pickupDate || !formData.purpose) {
      return alert('신청 부서, 신청자, 연락처, 사용 목적, 수령 예정일을 입력해주세요.');
    }
    setShowWarningModal(true);
  };

  const confirmSubmit = () => {
    if (!agreed) return alert('필독 사항에 동의해야 신청이 가능합니다.');
    const cartSummary = cart.map(line => `${line.name} ${line.quantity}개`).join(', ');
    addRental({
      department: formData.department, requester: formData.requester,
      contact: formData.contact, purpose: formData.purpose,
      items: cartSummary,
      lines: cart.map(({ type, refId, name, quantity, itemIds }) => ({ type, refId, name, quantity, itemIds })),
      date: new Date().toISOString().slice(0, 10),
      pickupDate: formData.pickupDate, eventDate: formData.eventDate,
      returnDueDate, status: 'requested', notes: formData.notes, overdue: false,
    });
    setShowWarningModal(false);
    alert('대여 신청이 완료되었습니다.');
    router.push('/rentals');
  };

  const totalCartItems = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="rental-apply-layout">
      {/* Left: Catalog */}
      <div className="card rental-catalog-panel">
        <div className="rental-catalog-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 className="card-title" style={{ fontSize: 18, marginBottom: 4 }}>의상/자산 카탈로그</h2>
              <div className="card-subtitle">대여 가능한 품목을 검색하고 장바구니에 담아주세요.</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
              총 {filteredCatalog.length}개 품목
            </div>
          </div>
          <div className="filter-bar" style={{ gap: 8 }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <span className="search-icon"><Search size={15} /></span>
              <input type="text" className="search-input" placeholder="품목명, 코드, 키워드로 검색..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 140, fontSize: 12 }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="ALL">전체 카테고리</option>
              {Object.values(CATEGORIES).map(cat => <option key={cat.code} value={cat.code}>{cat.name}</option>)}
              <option value="SET">추천 세트</option>
            </select>
          </div>
        </div>

        <div className="rental-catalog-body">
          <div className="catalog-grid">
            {filteredCatalog.map(entry => {
              const inCart = cart.some(line => line.type === entry.type && line.refId === entry.refId);
              return (
                <div key={`${entry.type}-${entry.refId}`} className={`catalog-card ${entry.availableQuantity <= 0 ? 'disabled' : ''} ${inCart ? 'in-cart' : ''}`}>
                  <AssetPhoto item={entry.item} label={entry.name} size="card" />
                  <div className="catalog-card-content">
                    <div className="catalog-card-topline">
                      <span className={`badge ${entry.type === 'set' ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: 10, padding: '2px 6px' }}>{entry.categoryName}</span>
                      {entry.type === 'item' && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{entry.item?.assemblyCode || entry.item?.code}</span>}
                    </div>
                    <h3>{entry.name}</h3>
                    <p>{entry.description}</p>

                    <div className="catalog-stock-row">
                      <span style={{ color: entry.availableQuantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {entry.availableQuantity > 0 ? `대여 가능 ${entry.availableQuantity}` : '대여 불가'}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>/ 총 {entry.totalQuantity}</span>
                    </div>

                    {entry.dueDate && entry.availableQuantity <= 0 && (
                      <div className="return-hint">반납 예정 {entry.dueDate}</div>
                    )}
                    {entry.unavailableReason && <div className="return-hint danger">{entry.unavailableReason}</div>}

                    <button className={`btn ${inCart ? 'btn-secondary' : 'btn-primary'} btn-sm`} style={{ width: '100%', fontSize: 11, padding: '6px' }}
                      disabled={entry.availableQuantity <= 0} onClick={() => addToCart(entry)}>
                      {inCart ? '추가 담기 +1' : '장바구니 담기'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredCatalog.length === 0 && <div className="empty-state">검색 결과가 없습니다.</div>}
        </div>
      </div>

      {/* Right: Cart + Form */}
      <div className="card rental-form-panel">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ShoppingCart size={15} style={{ color: 'var(--primary)' }} />
          <h2 className="card-title" style={{ fontSize: 13, flex: 1 }}>대여 신청서</h2>
          {totalCartItems > 0 && <span className="dash-count">{totalCartItems}개</span>}
        </div>

        <div className="rental-form-body" style={{ display: 'flex', flexDirection: 'column', padding: '10px 16px 10px', gap: 0, overflowY: 'auto' }}>
          {/* 장바구니 - 내부 스크롤 가능 */}
          <section className="form-section" style={{ paddingBottom: 10, marginBottom: 10, flexShrink: 0 }}>
            <div className="section-title-row" style={{ marginBottom: 6, flexShrink: 0 }}>
              <h3 style={{ fontSize: 12 }}>담긴 항목</h3>
              <span className="badge badge-primary" style={{ fontSize: 9 }}>{cart.length}</span>
            </div>
            {cart.length === 0 ? (
              <div className="empty-state compact" style={{ fontSize: 10, padding: 10 }}>
                좌측 카탈로그에서 품목을 담아주세요.
              </div>
            ) : (
              <div className="cart-list" style={{ gap: 4 }}>
                {cart.map((line, idx) => (
                  <div key={`${line.type}-${line.refId}`} className={`cart-line ${cartFlash === line.refId ? 'cart-flash' : ''}`} style={{ padding: '6px 8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cart-line-name" style={{ fontSize: 12 }}>{line.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>최대 {line.max}</div>
                    </div>
                    <div className="cart-qty" style={{ gap: 4 }}>
                      <button type="button" onClick={() => updateCartQty(idx, -1)} aria-label="감소"><Minus size={10} /></button>
                      <input type="number" className="cart-qty-input" value={line.quantity} min={1} max={line.max}
                        onChange={e => setCartQtyDirect(idx, e.target.value)} />
                      <button type="button" onClick={() => updateCartQty(idx, 1)} aria-label="증가"><Plus size={10} /></button>
                    </div>
                    <button type="button" className="cart-remove-btn" onClick={() => removeCartItem(idx)} aria-label="삭제"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 신청자 정보 */}
          <section className="form-section" style={{ paddingBottom: 10, marginBottom: 10 }}>
            <div className="section-title-row" style={{ marginBottom: 6 }}><h3 style={{ fontSize: 12 }}>신청자 정보</h3></div>
            <div className="form-group" style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>신청 부서 *</label>
              <input type="text" className="form-input" name="department" value={formData.department} onChange={handleFormChange} placeholder="홍보팀 / 영상제작" style={{ padding: '6px 10px', fontSize: 12 }} />
            </div>
            <div className="grid-2" style={{ gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 6 }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>신청자명 *</label>
                <input type="text" className="form-input" name="requester" value={formData.requester} onChange={handleFormChange} style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 6 }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>연락처 *</label>
                <input type="text" className="form-input" name="contact" value={formData.contact} onChange={handleFormChange} placeholder="010-0000-0000" style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>사용 목적 *</label>
              <input type="text" className="form-input" name="purpose" value={formData.purpose} onChange={handleFormChange} placeholder="상반기 성도 교육 영상 촬영" style={{ padding: '6px 10px', fontSize: 12 }} />
            </div>
          </section>

          {/* 일정 */}
          <section className="form-section" style={{ paddingBottom: 10, marginBottom: 10 }}>
            <div className="section-title-row" style={{ marginBottom: 6 }}><h3 style={{ fontSize: 12 }}>일정 정보</h3></div>
            <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>수령 예정일 *</label>
                <input type="date" className="form-input" name="pickupDate" value={formData.pickupDate} onChange={handleFormChange} style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>행사일 (선택)</label>
                <input type="date" className="form-input" name="eventDate" value={formData.eventDate} onChange={handleFormChange} style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
            </div>
            <div className="auto-due-box" style={{ padding: '8px 10px', gap: 1 }}>
              <span style={{ fontSize: 10 }}><CalendarCheck size={10} style={{ marginRight: 3, verticalAlign: -1 }} />자동 반납 기한</span>
              <strong style={{ fontSize: 14 }}>{returnDueDate || '날짜 입력 필요'}</strong>
              <small style={{ fontSize: 9 }}>{formData.eventDate ? '행사일 +7일' : formData.pickupDate ? '수령일 +14일' : '날짜를 입력하면 자동 계산'}</small>
            </div>
          </section>

          {/* 비고 */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>비고</label>
            <textarea className="form-textarea" name="notes" value={formData.notes} onChange={handleFormChange} placeholder="수령 방식, 특이사항 등" style={{ minHeight: 44, height: 44, fontSize: 12, padding: '6px 10px' }}></textarea>
          </div>
        </div>

        <div className="rental-submit-bar" style={{ padding: '10px 16px' }}>
          <button className="btn btn-primary" onClick={handleSubmitRequest} disabled={cart.length === 0} style={{ padding: '10px', fontSize: 13 }}>
            <ShoppingCart size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
            대여 신청하기 ({totalCartItems}개)
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> 대여 전 필독 사항
              </h2>
              <button className="modal-close" onClick={() => setShowWarningModal(false)}>x</button>
            </div>
            <div className="modal-body" style={{ lineHeight: '1.8' }}>
              <div className="notice-box danger">
                <ul>
                  <li>개인적인 용도로 사용은 엄격히 금지됩니다.</li>
                  <li>공적인 용도로만 사용 가능하며, 사용 목적 외 유출 시 해당 부서에서 책임집니다.</li>
                  <li>반납 시 세탁 여부, 미세탁 사유, 수선 필요 여부를 반드시 작성해야 합니다.</li>
                </ul>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px 0' }}>의상 대여 및 반납 가이드</h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-secondary)' }}>
                <li>의상 수령 시 파손/오염 상태를 사전에 확인해 주세요.</li>
                <li>품목별 세탁 방법을 확인하고, 지정 세탁 방법에 맞춰 반납해 주세요.</li>
                <li>승인된 반납 기한을 초과할 경우 담당자에게 알림이 표시됩니다.</li>
              </ul>

              <label className="checkbox-row confirmation">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>위 주의사항을 모두 읽었으며, 이를 숙지하고 동의합니다.</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowWarningModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={confirmSubmit} disabled={!agreed}>동의하고 신청 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
