'use client';
import { useState } from 'react';
import { useApp, CATEGORIES, LOCATIONS, LAUNDRY_METHODS } from '../../context/AppContext';
import AssetPhoto from '../../components/AssetPhoto';

const CATEGORY_DEFAULTS = {
  Z: { ageGroup: null, subType: 'accessory' },
  H: { ageGroup: null, subType: 'etc' },
};

function buildLocalCode(data) {
  const age = data.ageGroup === 'child' ? 'C' : data.ageGroup === 'adult' ? 'A' : 'N';
  const type = (data.subType || 'ETC').toUpperCase().slice(0, 6);
  const serial = String(Date.now()).slice(-3);
  return `${data.category}-${age}-${type}-${serial}`;
}

export default function AssetModal({ onClose, editItem = null }) {
  const { addItem, updateItem } = useApp();

  const [formData, setFormData] = useState(editItem || {
    name: '',
    category: 'A',
    costumeLine: '무용복',
    ageGroup: 'adult',
    subType: 'top',
    quantity: 1,
    sizeBreakdown: '',
    productionYear: '',
    condition: 'good',
    location: LOCATIONS[0],
    status: 'available',
    laundryMethod: LAUNDRY_METHODS[0],
    repairRequired: false,
    repairNote: '',
    keywords: '',
    hidden: false,
    assemblyCode: '',
    localCode: '',
    qrCode: '',
    photo: null,
    photoTone: 'linear-gradient(135deg, #e0f2fe, #ccfbf1)',
    sizes: editItem?.sizes || [], // Structured sizes
  });

  const [step, setStep] = useState(1);

  const handleCatSelect = (cat) => {
    const defaults = CATEGORY_DEFAULTS[cat] || { ageGroup: 'adult', subType: 'top' };
    setFormData(prev => ({
      ...prev,
      category: cat,
      costumeLine: CATEGORIES[cat]?.name || prev.costumeLine,
      ...defaults,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...(prev.sizes || []), { size: '', qty: 0 }]
    }));
  };

  const handleRemoveSize = (index) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes.splice(index, 1);
      return { ...prev, sizes: newSizes };
    });
  };

  const handleSizeChange = (index, field, value) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes[index] = { ...newSizes[index], [field]: value };
      
      // Auto-update total quantity and sizeBreakdown string
      const totalQty = newSizes.reduce((sum, s) => sum + (parseInt(s.qty, 10) || 0), 0);
      const breakdownStr = newSizes
        .filter(s => s.size)
        .map(s => `${s.size} ${s.qty}벌`)
        .join(' / ');

      return { 
        ...prev, 
        sizes: newSizes, 
        quantity: totalQty,
        sizeBreakdown: breakdownStr
      };
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const localCode = formData.localCode || buildLocalCode(formData);
    const itemData = {
      ...formData,
      keywords: typeof formData.keywords === 'string'
        ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : formData.keywords,
      quantity: parseInt(formData.quantity, 10) || 0,
      code: formData.assemblyCode || editItem?.code || localCode,
      localCode,
      qrCode: formData.qrCode || `QR-${localCode}`,
    };

    if (editItem) {
      updateItem(editItem.id, itemData);
    } else {
      addItem(itemData);
    }
    onClose();
  };

  const subOptions = CATEGORIES[formData.category]?.subs || {};
  const ageSubOptions = formData.ageGroup ? subOptions[formData.ageGroup] || {} : subOptions;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{editItem ? '자산 정보 수정' : '신규 자산 등록'}</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div>
              <h3 className="form-label" style={{ fontSize: '15px', marginBottom: '16px' }}>1. 대분류 선택</h3>
              <div className="category-grid">
                {Object.values(CATEGORIES).map(cat => (
                  <div
                    key={cat.code}
                    className={`category-card ${formData.category === cat.code ? 'selected' : ''}`}
                    onClick={() => handleCatSelect(cat.code)}
                  >
                    <div className="category-card-code">{cat.code}</div>
                    <div>{cat.name}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 className="form-label" style={{ fontSize: '15px', marginBottom: '16px' }}>2. 연령 및 품목 구분</h3>

                {formData.category !== 'Z' && formData.category !== 'H' && (
                  <div className="grid-2">
                    <div>
                      <div className="form-label">연령대</div>
                      <div className="tabs compact-tabs">
                        <button type="button" className={`tab ${formData.ageGroup === 'adult' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, ageGroup: 'adult', subType: 'top' }))}>성인</button>
                        <button type="button" className={`tab ${formData.ageGroup === 'child' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, ageGroup: 'child', subType: 'top' }))}>아동</button>
                      </div>
                    </div>
                    <div>
                      <div className="form-label">구분</div>
                      <div className="tabs compact-tabs">
                        {Object.entries(ageSubOptions).map(([value, label]) => (
                          <button type="button" key={value} className={`tab ${formData.subType === value ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subType: value }))}>{label.replace(/^성인 |^아동 /, '')}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(formData.category === 'Z' || formData.category === 'H') && (
                  <div className="tabs compact-tabs">
                    {Object.entries(ageSubOptions).map(([value, label]) => (
                      <button type="button" key={value} className={`tab ${formData.subType === value ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subType: value }))}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="asset-modal-photo-row">
                <AssetPhoto item={formData} size="lg" />
                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label">대표 사진</label>
                    <input type="file" className="form-input" accept="image/*" onChange={handlePhotoChange} />
                    <div className="muted-line">브라우저 시연용으로 바로 미리보기됩니다. 실제 영구 저장은 DB/파일 저장소 연결 시 붙이면 됩니다.</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">사진 미등록 시 표시 색상</label>
                    <select className="form-select" name="photoTone" value={formData.photoTone} onChange={handleChange}>
                      <option value="linear-gradient(135deg, #e0f2fe, #ccfbf1)">청록</option>
                      <option value="linear-gradient(135deg, #fef3c7, #fde68a)">금색</option>
                      <option value="linear-gradient(135deg, #fee2e2, #fecaca)">분홍</option>
                      <option value="linear-gradient(135deg, #cbd5e1, #64748b)">회색</option>
                      <option value="linear-gradient(135deg, #27272a, #0f172a)">검정</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">아이템명 *</label>
                  <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} placeholder="예: 여름 의전용 원피스" />
                </div>
                <div className="form-group">
                  <label className="form-label">의상 카테고리/프로젝트명</label>
                  <input type="text" className="form-input" name="costumeLine" value={formData.costumeLine || ''} onChange={handleChange} placeholder="예: 예술단, 국악, 의전도열" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">총회 스타일 넘버</label>
                  <input type="text" className="form-input" name="assemblyCode" value={formData.assemblyCode || ''} onChange={handleChange} placeholder="예: SCJ-C-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">내부/지파 코드</label>
                  <input type="text" className="form-input" name="localCode" value={formData.localCode || ''} onChange={handleChange} placeholder="비워두면 자동 생성" />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">총 수량</label>
                  <input type="number" className="form-input" name="quantity" value={formData.quantity} onChange={handleChange} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">제작 연도</label>
                  <input type="text" className="form-input" name="productionYear" value={formData.productionYear || ''} onChange={handleChange} placeholder="예: 2024" />
                </div>
                <div className="form-group">
                  <label className="form-label">현재 보관 상태</label>
                  <select className="form-select" name="condition" value={formData.condition || 'good'} onChange={handleChange}>
                    <option value="excellent">상</option>
                    <option value="good">중상</option>
                    <option value="fair">중</option>
                    <option value="poor">하</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>사이즈별 세부 수량</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSize} style={{ padding: '2px 8px', fontSize: '11px' }}>+ 사이즈 추가</button>
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                  {(!formData.sizes || formData.sizes.length === 0) ? (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '10px' }}>
                      사이즈별 수량을 등록하면 총 수량이 자동 계산됩니다.
                    </div>
                  ) : (
                    formData.sizes.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ flex: 2, padding: '6px 10px', fontSize: '13px' }} 
                          placeholder="사이즈 (예: S, 95, Free)" 
                          value={s.size}
                          onChange={e => handleSizeChange(idx, 'size', e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }} 
                          placeholder="수량" 
                          value={s.qty}
                          onChange={e => handleSizeChange(idx, 'qty', e.target.value)}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemoveSize(idx)} style={{ color: 'var(--danger)', border: 'none' }}>×</button>
                      </div>
                    ))
                  )}
                </div>

                <div className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  미리보기: {formData.sizeBreakdown || '사이즈 미입력'}
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">보관 위치</label>
                  <select className="form-select" name="location" value={formData.location} onChange={handleChange}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">대여 상태</label>
                  <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                    <option value="available">사용 가능</option>
                    <option value="in-use">대여 중</option>
                    <option value="repair">수리 필요</option>
                    <option value="discard">폐기</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">세탁 방법</label>
                  <select className="form-select" name="laundryMethod" value={formData.laundryMethod || LAUNDRY_METHODS[0]} onChange={handleChange}>
                    {LAUNDRY_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">QR 코드 식별값</label>
                  <input type="text" className="form-input" name="qrCode" value={formData.qrCode || ''} onChange={handleChange} placeholder="비워두면 자동 생성" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">키워드 태그</label>
                <input type="text" className="form-input" name="keywords" value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords} onChange={handleChange} placeholder="예: 화이트, 실크, 여름" />
              </div>

              <div className="grid-2">
                <label className="checkbox-row">
                  <input type="checkbox" name="repairRequired" checked={!!formData.repairRequired} onChange={handleChange} />
                  <span>수선 확인 필요</span>
                </label>
                <label className="checkbox-row danger">
                  <input type="checkbox" name="hidden" checked={!!formData.hidden} onChange={handleChange} />
                  <span>대여 신청 목록에서 숨기기</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">수선/관리 메모</label>
                <textarea className="form-textarea" name="repairNote" value={formData.repairNote || ''} onChange={handleChange} placeholder="예: 단추 교체 필요, 이염 주의 등"></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>취소</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>다음 단계</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>이전</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editItem ? '수정 완료' : '등록 완료'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
