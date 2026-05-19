'use client';
import { useState, useEffect } from 'react';
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
  const { items, sets, CATEGORIES, rentals, addRental, currentUser } = useApp();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    department: '', division: '', requester: '', contact: '',
    purpose: '', pickupDate: '', eventDate: '', notes: '',
    laundryColdWater: false, laundrySeparate: false, laundryProfessional: false
  });
  const [sizeModalEntry, setSizeModalEntry] = useState(null);
  const [sizeFormData, setSizeFormData] = useState([{ size: 'FREE', quantity: 1 }]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [cartFlash, setCartFlash] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState({});

  // 💡 로그인 사용자 정보 바인딩 자동 채우기 및 부서/과 분할
  useEffect(() => {
    if (currentUser) {
      let dept = '';
      let div = '';
      if (currentUser.dept) {
        if (currentUser.dept.includes('/')) {
          const parts = currentUser.dept.split('/');
          dept = parts[0].trim();
          div = parts[1].trim();
        } else {
          dept = currentUser.dept;
        }
      }
      setFormData(prev => ({
        ...prev,
        department: dept,
        division: div,
        requester: currentUser.name || ''
      }));
    }
  }, [currentUser]);

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
          description: item.sizes && item.sizes.length > 0 
            ? `${item.laundryMethod || '세탁 방법 미입력'}`
            : `${item.sizeBreakdown || '사이즈 미입력'} · ${item.laundryMethod || '세탁 방법 미입력'}`,
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
        categoryCode: 'SET', categoryName: '행사/추천 세트',
        item: representativeItem, itemIds: setItems.map(item => item.id),
        availableQuantity, totalQuantity: availableQuantity, dueDate,
        unavailableReason: availableQuantity <= 0 ? '구성품 재고 부족' : '',
        setPhoto: set.photo, externalItems: set.externalItems || [],
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

  const handleAddToCartClick = (entry) => {
    if (entry.availableQuantity <= 0) return;
    const hasSizes = entry.item?.sizes && entry.item.sizes.length > 0;

    // 카탈로그에서 개별 규격/색상이 선택된 상태인지 확인
    const selectedPhoto = selectedPhotos[entry.refId];
    if (entry.type === 'item' && selectedPhoto && hasSizes) {
      const selectedSizeObj = entry.item.sizes.find(s => s.photo === selectedPhoto);
      if (selectedSizeObj) {
        const defaultSize = selectedSizeObj.size_label || selectedSizeObj.size;
        addToCart(entry, [{ size: defaultSize, quantity: 1 }]);
        return;
      }
    }

    const hasMultipleSizes = entry.item?.sizes && entry.item.sizes.length > 1;
    const isCostumeCategory = ['D', 'K', 'T', 'W'].includes(entry.item?.category);
    
    if (entry.type === 'item' && (hasMultipleSizes || isCostumeCategory)) {
      setSizeModalEntry(entry);
      const defaultSize = hasSizes ? (entry.item.sizes[0].size_label || entry.item.sizes[0].size) : 'FREE';
      setSizeFormData([{ size: defaultSize, quantity: 1 }]);
    } else {
      const defaultSize = hasSizes ? (entry.item.sizes[0].size_label || entry.item.sizes[0].size) : 'FREE';
      addToCart(entry, [{ size: defaultSize, quantity: 1 }]);
    }
  };

  const addToCart = (entry, selections) => {
    setCart(prev => {
      let next = [...prev];
      for (const sel of selections) {
        if (!sel.size || sel.quantity <= 0) continue;
        
        // 규격명에 해당하는 개별 이미지 조회
        const sizeObj = entry.item?.sizes?.find(s => (s.size_label || s.size) === sel.size);
        const itemPhoto = sizeObj?.photo || entry.item?.photo || entry.setPhoto || null;

        const existing = next.find(line => line.type === entry.type && line.refId === entry.refId && line.size === sel.size);
        if (existing) {
          next = next.map(line => {
            if (line !== existing) return line;
            return { ...line, quantity: Math.min(line.max, line.quantity + sel.quantity) };
          });
        } else {
          next.push({ 
            type: entry.type, 
            refId: entry.refId, 
            name: entry.name, 
            quantity: sel.quantity, 
            size: sel.size, 
            max: entry.availableQuantity, 
            itemIds: entry.itemIds,
            photo: itemPhoto // 📸 장바구니 품목 개별 규격 사진
          });
        }
      }
      return next;
    });
    setCartFlash(entry.refId);
    setTimeout(() => setCartFlash(null), 600);
    setSizeModalEntry(null);
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
    if (!formData.department || !formData.division || !formData.requester || !formData.contact || !formData.pickupDate || !formData.purpose) {
      return alert('신청 부서, 과, 신청자, 연락처, 사용 목적, 수령 예정일을 입력해주세요.');
    }
    setShowWarningModal(true);
  };

  const confirmSubmit = () => {
    if (!agreed) return alert('필독 사항에 동의해야 신청이 가능합니다.');
    const cartSummary = cart.map(line => `${line.name}${line.size ? `(${line.size})` : ''} ${line.quantity}개`).join(', ');
    
    // 💡 신청 부서와 과를 슬래시(/) 기준으로 결합하여 백엔드 데이터에 전송
    const combinedDept = formData.division ? `${formData.department} / ${formData.division}` : formData.department;

    addRental({
      department: combinedDept, requester: formData.requester,
      contact: formData.contact, purpose: formData.purpose,
      items: cartSummary,
      lines: cart.map(({ type, refId, name, quantity, size, photo, itemIds }) => ({ type, refId, name, quantity, size, photo, itemIds })),
      date: new Date().toISOString().slice(0, 10),
      pickupDate: formData.pickupDate, eventDate: formData.eventDate,
      returnDueDate, status: 'requested', notes: formData.notes, overdue: false,
      laundryCheck: { coldWater: formData.laundryColdWater, separate: formData.laundrySeparate, professional: formData.laundryProfessional },
    });
    setShowWarningModal(false);
    alert('대여 신청이 완료되었습니다.');
    
    // 장바구니 및 양식 상태 리셋
    setCart([]);
    setAgreed(false);
    
    if (currentUser?.role === 'user') {
      let dept = '';
      let div = '';
      if (currentUser.dept) {
        if (currentUser.dept.includes('/')) {
          const parts = currentUser.dept.split('/');
          dept = parts[0].trim();
          div = parts[1].trim();
        } else {
          dept = currentUser.dept;
        }
      }
      setFormData({
        department: dept, division: div, requester: currentUser.name || '', contact: '',
        purpose: '', pickupDate: '', eventDate: '', notes: '',
        laundryColdWater: false, laundrySeparate: false, laundryProfessional: false
      });
    } else {
      router.push('/rentals');
    }
  };

  const totalCartItems = cart.reduce((sum, line) => sum + line.quantity, 0);

  const groupedCart = cart.reduce((acc, line, idx) => {
    const key = `${line.type}-${line.refId}`;
    if (!acc[key]) acc[key] = { name: line.name, max: line.max, type: line.type, refId: line.refId, items: [] };
    acc[key].items.push({ ...line, idx });
    return acc;
  }, {});

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
              const selectedPhoto = selectedPhotos[entry.refId];
              const displayItem = (entry.type === 'item' && selectedPhoto)
                ? { ...entry.item, photo: selectedPhoto }
                : entry.item;

              return (
                <div key={`${entry.type}-${entry.refId}`} className={`catalog-card ${entry.availableQuantity <= 0 ? 'disabled' : ''} ${inCart ? 'in-cart' : ''}`}>
                  <AssetPhoto item={entry.type === 'set' && entry.setPhoto ? { photo: entry.setPhoto, photoTone: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)' } : displayItem} label={entry.name} size="card" />
                  <div className="catalog-card-content">
                    <div className="catalog-card-topline">
                      <span className={`badge ${entry.type === 'set' ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: 10, padding: '2px 6px' }}>{entry.categoryName}</span>
                      {entry.type === 'item' && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{entry.item?.assemblyCode || entry.item?.code}</span>}
                    </div>
                    <h3>{entry.name}</h3>
                    <p>{entry.description}</p>

                    {entry.item?.sizes && entry.item.sizes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0 10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>색상/사이즈별 재고</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {entry.item.sizes.map((s, i) => {
                            const label = s.size_label || s.size;
                            const avail = s.available_qty !== undefined ? s.available_qty : s.qty;
                            const total = s.total_qty !== undefined ? s.total_qty : s.qty;
                            const isSelected = selectedPhoto === s.photo && s.photo;
                            return (
                              <span 
                                key={i} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (s.photo) {
                                    setSelectedPhotos(prev => ({
                                      ...prev,
                                      [entry.refId]: prev[entry.refId] === s.photo ? null : s.photo
                                    }));
                                  }
                                }}
                                style={{ 
                                  fontSize: '10px', 
                                  background: isSelected ? 'var(--primary)' : (avail > 0 ? 'var(--primary-50)' : '#fef2f2'), 
                                  border: `1px solid ${isSelected ? 'var(--primary-dark)' : (avail > 0 ? 'var(--primary-200)' : '#fecaca')}`, 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  color: isSelected ? '#ffffff' : (avail > 0 ? 'var(--primary-dark)' : 'var(--danger)'),
                                  fontWeight: 600,
                                  cursor: s.photo ? 'pointer' : 'default',
                                  boxShadow: isSelected ? '0 0 6px rgba(67, 56, 202, 0.3)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                title={s.photo ? '클릭 시 대표 이미지 변경' : ''}
                              >
                                {label}: <strong style={{ color: isSelected ? '#ffffff' : (avail > 0 ? 'var(--success-dark)' : 'var(--danger)') }}>{avail}</strong>/{total}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="catalog-stock-row" style={{ margin: '6px 0 10px' }}>
                        <span style={{ color: entry.availableQuantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {entry.availableQuantity > 0 ? `대여 가능 ${entry.availableQuantity}` : '대여 불가'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>/ 총 {entry.totalQuantity}</span>
                      </div>
                    )}

                    {entry.dueDate && entry.availableQuantity <= 0 && (
                      <div className="return-hint">반납 예정 {entry.dueDate}</div>
                    )}
                    {entry.unavailableReason && <div className="return-hint danger">{entry.unavailableReason}</div>}
                    
                    {entry.externalItems && entry.externalItems.length > 0 && (
                      <div style={{ marginTop: 8, marginBottom: 8, padding: '6px 8px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: 10 }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>💡 비품 직접 준비 안내</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {entry.externalItems.map(ext => (
                            <div key={ext.name} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                              <span style={{ fontWeight: 600 }}>• {ext.name}</span>
                              <span>{ext.manager} ({ext.location})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button className={`btn ${inCart ? 'btn-secondary' : 'btn-primary'} btn-sm`} style={{ width: '100%', fontSize: 11, padding: '6px', marginTop: 'auto' }}
                      disabled={entry.availableQuantity <= 0} onClick={() => handleAddToCartClick(entry)}>
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
                {Object.values(groupedCart).map(group => {
                  const repPhoto = group.items[0]?.photo || null;
                  return (
                    <div key={`${group.type}-${group.refId}`} className={`cart-line ${cartFlash === group.refId ? 'cart-flash' : ''}`} style={{ padding: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)' }}>
                      {/* 📸 장바구니 미니 상품 이미지 */}
                      <div 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '4px', 
                          background: repPhoto ? `url(${repPhoto}) center/cover no-repeat` : 'var(--bg-dark)', 
                          border: '1px solid var(--border)', 
                          flexShrink: 0 
                        }} 
                      />
                      
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <div className="cart-line-name" style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{group.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>최대 {group.max}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {group.items.map(line => (
                          <div key={line.idx} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            {line.size && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-dark)', background: 'var(--primary-50)', padding: '2px 5px', borderRadius: 3, minWidth: 32, textAlign: 'center' }}>
                                {line.size}
                              </span>
                            )}
                            <div className="cart-qty" style={{ gap: 4 }}>
                              <button type="button" onClick={() => updateCartQty(line.idx, -1)} aria-label="감소"><Minus size={10} /></button>
                              <input type="number" className="cart-qty-input" value={line.quantity} min={1} max={line.max}
                                onChange={e => setCartQtyDirect(line.idx, e.target.value)} />
                              <button type="button" onClick={() => updateCartQty(line.idx, 1)} aria-label="증가"><Plus size={10} /></button>
                            </div>
                            <button type="button" className="cart-remove-btn" onClick={() => removeCartItem(line.idx)} aria-label="삭제"><Trash2 size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 신청자 정보 */}
          <section className="form-section" style={{ paddingBottom: 10, marginBottom: 10 }}>
            <div className="section-title-row" style={{ marginBottom: 6 }}><h3 style={{ fontSize: 12 }}>신청자 정보</h3></div>
            <div className="grid-2" style={{ gap: 8, marginBottom: 6 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>신청 부서 *</label>
                <input type="text" className="form-input" name="department" value={formData.department} onChange={handleFormChange} placeholder="문화부" style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 3 }}>과 *</label>
                <input type="text" className="form-input" name="division" value={formData.division} onChange={handleFormChange} placeholder="의분과" style={{ padding: '6px 10px', fontSize: 12 }} />
              </div>
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

          {/* 세탁 주의사항 */}
          <section className="form-section" style={{ paddingBottom: 10, marginBottom: 10 }}>
            <div className="section-title-row" style={{ marginBottom: 6 }}><h3 style={{ fontSize: 12 }}>세탁 관련 안내 (의상/천류)</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="checkbox-row" style={{ fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" name="laundryColdWater" checked={formData.laundryColdWater} onChange={e => setFormData(prev => ({...prev, laundryColdWater: e.target.checked}))} />
                <span>찬물 세탁 필수 동의</span>
              </label>
              <label className="checkbox-row" style={{ fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" name="laundrySeparate" checked={formData.laundrySeparate} onChange={e => setFormData(prev => ({...prev, laundrySeparate: e.target.checked}))} />
                <span>단독 세탁 필수 동의 (이염 주의)</span>
              </label>
              <label className="checkbox-row" style={{ fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" name="laundryProfessional" checked={formData.laundryProfessional} onChange={e => setFormData(prev => ({...prev, laundryProfessional: e.target.checked}))} />
                <span>전문 세탁소 의뢰 (드라이클리닝) 품목 확인</span>
              </label>
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

      {/* Size Selection Modal */}
      {sizeModalEntry && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">품목 상세 및 옵션 선택</h2>
              <button className="modal-close" onClick={() => setSizeModalEntry(null)}>x</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 16, color: 'var(--primary-dark)' }}>{sizeModalEntry.name}</div>
              
              {/* 💡 선택한 색상/규격에 맞춰 물품 사진 실시간 변경 프리뷰 */}
              {(() => {
                const selectedLabel = sizeFormData[0]?.size;
                const matchedSize = sizeModalEntry.item?.sizes?.find(s => (s.size_label || s.size) === selectedLabel);
                const displayPhoto = matchedSize?.photo || sizeModalEntry.photo || sizeModalEntry.item?.photo;
                if (!displayPhoto) return null;
                return (
                  <div 
                    style={{ 
                      position: 'relative', 
                      width: '100%', 
                      height: '180px', 
                      borderRadius: 8, 
                      backgroundImage: `url(${displayPhoto})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                      marginBottom: 16, 
                      border: '1px solid var(--border)',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
                      transition: 'background-image 0.3s ease-in-out'
                    }} 
                  />
                );
              })()}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {sizeModalEntry.item?.laundryMethod && (
                  <span style={{ fontSize: 11, padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    🧺 {sizeModalEntry.item.laundryMethod}
                  </span>
                )}
                {sizeModalEntry.item?.location && (
                  <span style={{ fontSize: 11, padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    📍 {sizeModalEntry.item.location}
                  </span>
                )}
                {sizeModalEntry.item?.condition && (
                  <span style={{ fontSize: 11, padding: '4px 8px', background: sizeModalEntry.item.condition === 'good' ? '#dcfce7' : '#fef08a', color: sizeModalEntry.item.condition === 'good' ? '#166534' : '#854d0e', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    ✨ 상태: {sizeModalEntry.item.condition === 'good' ? '양호' : '보통'}
                  </span>
                )}
              </div>
              {sizeModalEntry.item?.sizeBreakdown && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>💡 현재 사이즈별 재고 분포</div>
                  <div>{sizeModalEntry.item.sizeBreakdown}</div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sizeFormData.map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select className="form-select" value={row.size} onChange={e => {
                      const next = [...sizeFormData];
                      next[idx].size = e.target.value;
                      setSizeFormData(next);
                    }} style={{ flex: 1, padding: '8px' }}>
                      {(sizeModalEntry.item?.sizes && sizeModalEntry.item.sizes.length > 0) ? (
                        <>
                          <option value="FREE">옵션 선택 (필수)</option>
                          {sizeModalEntry.item.sizes.map((s, i) => {
                            const label = s.size_label || s.size;
                            const qty = s.available_qty !== undefined ? s.available_qty : s.qty;
                            return <option key={i} value={label}>{label} (잔여: {qty}개)</option>
                          })}
                        </>
                      ) : (
                        <>
                          <option value="FREE">FREE / 해당 없음</option>
                          <option value="S">S (90)</option>
                          <option value="M">M (95)</option>
                          <option value="L">L (100)</option>
                          <option value="XL">XL (105)</option>
                          <option value="XXL">XXL (110)</option>
                        </>
                      )}
                    </select>
                    <input type="number" className="form-input" value={row.quantity} min={1} max={sizeModalEntry.availableQuantity} onChange={e => {
                      const next = [...sizeFormData];
                      next[idx].quantity = parseInt(e.target.value) || 1;
                      setSizeFormData(next);
                    }} style={{ width: 80, padding: '8px' }} />
                    {sizeFormData.length > 1 && (
                      <button type="button" onClick={() => setSizeFormData(sizeFormData.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 8px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={() => setSizeFormData([...sizeFormData, { size: 'M', quantity: 1 }])} style={{ background: 'transparent', border: '1px dashed var(--border)', width: '100%', padding: '10px', fontSize: 12, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', borderRadius: 4, marginTop: 12 }}>
                + 다른 사이즈 추가
              </button>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setSizeModalEntry(null)}>취소</button>
              <button className="btn btn-primary" onClick={() => addToCart(sizeModalEntry, sizeFormData)}>담기 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
