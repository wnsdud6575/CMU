'use client';
import { useState } from 'react';
import { useApp, CATEGORIES, LOCATIONS, LAUNDRY_METHODS } from '../../context/AppContext';
import AssetPhoto from '../../components/AssetPhoto';
import { uploadItemPhoto } from '@/lib/supabaseClient';

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

  const [activePasteIndex, setActivePasteIndex] = useState(null);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // Keep edit forms safe when optional DB fields are absent.
  const [formData, setFormData] = useState(() => ({
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
    sizes: [], // Structured sizes
    ...(editItem || {}),
    name: editItem?.name || '',
    photo: typeof editItem?.photo === 'string' ? editItem.photo : null,
    keywords: Array.isArray(editItem?.keywords) || typeof editItem?.keywords === 'string'
      ? editItem.keywords
      : '',
    sizes: Array.isArray(editItem?.sizes) ? editItem.sizes : [],
  }));

  const updateSizeData = (newSizes, category) => {
    const totalQty = newSizes.reduce((sum, s) => sum + (parseInt(s.qty, 10) || 0), 0);
    const unit = (category === 'Z' || category === 'H') ? '개' : '벌';
    const breakdownStr = newSizes
      .filter(s => s.size)
      .map(s => `${s.size} ${s.qty}${unit}`)
      .join(' / ');
    return {
      sizes: newSizes,
      quantity: totalQty,
      sizeBreakdown: breakdownStr
    };
  };

  const handleCatSelect = (cat) => {
    const defaults = CATEGORY_DEFAULTS[cat] || { ageGroup: 'adult', subType: 'top' };
    setFormData(prev => {
      const updated = {
        ...prev,
        category: cat,
        costumeLine: CATEGORIES[cat]?.name || prev.costumeLine,
        ...defaults,
      };
      return {
        ...updated,
        ...updateSizeData(prev.sizes || [], cat)
      };
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...(prev.sizes || []), { size: '', qty: 0, photo: null }]
    }));
  };

  const handleRemoveSize = (index) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes.splice(index, 1);
      return { 
        ...prev, 
        ...updateSizeData(newSizes, prev.category)
      };
    });
  };

  const handleSizeChange = (index, field, value) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes[index] = { ...newSizes[index], [field]: value };
      return { 
        ...prev, 
        ...updateSizeData(newSizes, prev.category)
      };
    });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    // 1. 로컬 미리보기 (즉각적인 피드백)
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);

    // 2. Supabase Storage 실제 업로드
    try {
      setIsUploading(true);
      const publicUrl = await uploadItemPhoto(file);
      if (publicUrl) {
        setFormData(prev => ({ ...prev, photo: publicUrl }));
      }
    } catch (err) {
      alert('사진 업로드에 실패했습니다. Storage 버킷 설정(Public)을 확인해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoChange = (e) => {
    handleFileUpload(e.target.files?.[0]);
  };

  const handlePaste = async (e) => {
    if (!e.clipboardData || !e.clipboardData.items) return;

    // 텍스트 입력창에서 텍스트를 정상 붙여넣기하는 경우 차단 방지 (단, 규격 사진 붙여넣기 모드가 활성화된 경우는 허용)
    if (activePasteIndex === null) {
      if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'file') return;
      if (e.target && e.target.tagName === 'TEXTAREA') return;
    }

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;
        
        const newFile = new File([file], `paste_${Date.now()}.png`, { type: file.type });
        e.preventDefault();
        
        if (activePasteIndex !== null) {
          const idx = activePasteIndex;
          try {
            setUploadingIdx(idx);
            const url = await uploadItemPhoto(newFile);
            if (url) {
              handleSizeChange(idx, 'photo', url);
            }
          } catch (err) {
            alert('개별 사진 붙여넣기 업로드 실패: ' + err.message);
          } finally {
            setUploadingIdx(null);
            setActivePasteIndex(null); // 붙여넣기 후 해제
          }
        } else {
          handleFileUpload(newFile);
        }
        break;
      }
    }
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
    <div className="modal-overlay" onPaste={handlePaste}>
      <div className="modal" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{editItem ? '자산 정보 수정' : '신규 자산 등록'}</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <h3 className="form-label" style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--primary-dark)' }}>분류 체계</h3>
            <div className="category-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px' }}>
              {Object.values(CATEGORIES).map(cat => (
                <div
                  key={cat.code}
                  className={`category-card ${formData.category === cat.code ? 'selected' : ''}`}
                  onClick={() => handleCatSelect(cat.code)}
                  style={{ padding: '8px', fontSize: '11px', minHeight: '50px' }}
                >
                  <div className="category-card-code" style={{ marginBottom: '2px', fontSize: '10px' }}>{cat.code}</div>
                  <div>{cat.name}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="form-label">연령 및 품목 구분</label>

              {formData.category !== 'Z' && formData.category !== 'H' && (
                <div className="grid-2">
                  <div className="tabs compact-tabs">
                    <button type="button" className={`tab ${formData.ageGroup === 'adult' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, ageGroup: 'adult', subType: 'top' }))}>성인</button>
                    <button type="button" className={`tab ${formData.ageGroup === 'child' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, ageGroup: 'child', subType: 'top' }))}>아동</button>
                  </div>
                  <div className="tabs compact-tabs">
                    {Object.entries(ageSubOptions).map(([value, label]) => (
                      <button type="button" key={value} className={`tab ${formData.subType === value ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subType: value }))}>{label.replace(/^성인 |^아동 /, '')}</button>
                    ))}
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
              <div className="asset-modal-photo-row">
                <AssetPhoto item={formData} size="lg" />
                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label">대표 사진 {isUploading && <span style={{color: 'var(--primary)', fontSize: 11}}>(업로드 중...)</span>}</label>
                    <input type="file" className="form-input" accept="image/*" onChange={handlePhotoChange} disabled={isUploading} />
                    <div className="muted-line">💡 <b>꿀팁:</b> 아무 곳에서나 화면 캡처 후 창 안에서 <b>Ctrl+V (붙여넣기)</b> 하셔도 바로 업로드됩니다!</div>
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
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                  💡 <b>개별 사진 등록 팁:</b> 📎 <b>사진 첨부</b> 버튼을 누르면 파일 탐색기가 즉시 열립니다. 복사한 이미지는 버튼을 <b>1번 클릭</b>한 상태에서 <b>Ctrl+V</b>로 바로 붙여넣어 등록할 수도 있습니다.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                  {(!formData.sizes || formData.sizes.length === 0) ? (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '10px' }}>
                      사이즈별 수량을 등록하면 총 수량이 자동 계산됩니다.
                    </div>
                  ) : (
                    formData.sizes.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-main)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {/* 💡 규격별 개별 파일 첨부 및 복사 붙여넣기 듀얼 입력 버튼 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: activePasteIndex === idx ? '1px solid var(--primary)' : '1px solid var(--border)',
                              boxShadow: activePasteIndex === idx ? '0 0 0 2px rgba(67, 56, 202, 0.2)' : 'none',
                              color: activePasteIndex === idx ? 'var(--primary-dark)' : 'var(--text-main)',
                              fontWeight: activePasteIndex === idx ? '600' : 'normal',
                              background: activePasteIndex === idx ? 'var(--bg-main)' : 'var(--bg-dark)',
                              transition: 'all 0.15s ease'
                            }}
                            title="클릭: 파일 첨부 창 열기 및 Ctrl+V 붙여넣기 활성화"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePasteIndex(prev => prev === idx ? null : idx);
                              document.getElementById(`size-file-${idx}`).click();
                            }}
                          >
                            <span>📎</span>
                            <span>
                              {uploadingIdx === idx ? '업로드 중...' : s.photo ? (activePasteIndex === idx ? 'Ctrl+V 대기...' : '변경') : (activePasteIndex === idx ? 'Ctrl+V 대기...' : '사진 첨부')}
                            </span>
                          </button>

                          {s.photo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <a 
                                href={s.photo} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ 
                                  display: 'flex',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  border: '1px solid var(--border)',
                                  background: `url(${s.photo}) center/cover no-repeat`
                                }}
                                title="등록된 사진 크게 보기"
                              />
                              <button
                                type="button"
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--danger)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: '2px',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={() => handleSizeChange(idx, 'photo', null)}
                                title="개별 사진 제거"
                              >
                                삭제
                              </button>
                            </div>
                          )}

                          <input 
                            type="file" 
                            id={`size-file-${idx}`} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              try {
                                setUploadingIdx(idx);
                                const url = await uploadItemPhoto(file);
                                handleSizeChange(idx, 'photo', url);
                              } catch (err) {
                                alert('개별 사진 업로드 실패: ' + err.message);
                              } finally {
                                setUploadingIdx(null);
                                setActivePasteIndex(null);
                              }
                            }}
                          />
                        </div>

                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ flex: 2, padding: '4px 8px', fontSize: '13px' }} 
                          placeholder="규격/색상 (예: 화이트, 95)" 
                          value={s.size}
                          onChange={e => handleSizeChange(idx, 'size', e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: '80px', padding: '4px 8px', fontSize: '13px' }} 
                          placeholder="수량" 
                          value={s.qty}
                          onChange={e => handleSizeChange(idx, 'qty', e.target.value)}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemoveSize(idx)} style={{ color: 'var(--danger)', border: 'none', padding: '2px 6px' }}>×</button>
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

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editItem ? '수정 완료' : '등록 완료'}</button>
        </div>
      </div>
    </div>
  );
}
