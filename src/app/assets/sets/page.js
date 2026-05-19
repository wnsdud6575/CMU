'use client';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SetsManagementPage() {
  const { sets, setSets, items, CATEGORIES } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetId, setEditingSetId] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [formData, setFormData] = useState({ name: '', description: '', selectedItemIds: [] });
  const [itemSearch, setItemSearch] = useState('');

  const filteredSets = sets.filter(s => (s.name && s.name.includes(search)) || (s.description && s.description.includes(search)));
  
  const availableItemsToPick = items.filter(item => 
    !item.hidden && 
    !formData.selectedItemIds.includes(item.id) &&
    (item.name.includes(itemSearch) || item.code.includes(itemSearch))
  );

  const openNewModal = () => {
    setFormData({ name: '', description: '', selectedItemIds: [] });
    setItemSearch('');
    setEditingSetId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (set) => {
    setFormData({ name: set.name || '', description: set.description || '', selectedItemIds: [...(set.items || [])] });
    setItemSearch('');
    setEditingSetId(set.id);
    setIsModalOpen(true);
  };

  const handleAddItem = (item) => {
    setFormData(prev => ({ ...prev, selectedItemIds: [...prev.selectedItemIds, item.id] }));
  };

  const handleRemoveItem = (id) => {
    setFormData(prev => ({ ...prev, selectedItemIds: prev.selectedItemIds.filter(i => i !== id) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.selectedItemIds.length === 0) {
      return alert('세트에 포함될 아이템을 최소 1개 이상 선택해주세요.');
    }
    
    if (editingSetId) {
      setSets(prev => prev.map(s => s.id === editingSetId ? { ...s, name: formData.name, description: formData.description, items: formData.selectedItemIds } : s));
    } else {
      const newSet = {
        id: Date.now(),
        type: 'event',
        name: formData.name,
        description: formData.description,
        items: formData.selectedItemIds,
        photo: null,
        externalItems: []
      };
      setSets(prev => [...prev, newSet]);
    }
    setIsModalOpen(false);
    setEditingSetId(null);
  };

  const handleDeleteSet = (id) => {
    if (confirm('정말로 이 세트를 삭제하시겠습니까? (장바구니나 기존 대여 내역에는 영향을 주지 않습니다)')) {
      setSets(prev => prev.filter(s => s.id !== id));
      setIsModalOpen(false);
      setEditingSetId(null);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">세트 구성 관리</h2>
            <div className="card-subtitle">개별 아이템들을 묶어 하나의 세트 상품으로 등록하고 관리합니다. 대여 신청자가 쉽게 선택할 수 있습니다.</div>
          </div>
          <button className="btn btn-primary" onClick={openNewModal}>+ 새 세트 만들기</button>
        </div>
        
        <div className="card-body">
          <div className="filter-bar">
            <div className="search-input-wrapper" style={{ flex: 'none', width: '300px' }}>
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                className="search-input" 
                placeholder="세트명 검색..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-4" style={{ marginTop: '20px' }}>
            {filteredSets.map(set => {
              // Resolve item details
              const setItems = set.items.map(id => items.find(i => i.id === id)).filter(Boolean);
              
              return (
                <div key={set.id} onClick={() => openEditModal(set)} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s', backgroundColor: '#fff' }} className="catalog-card-hover">
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--primary-dark)' }}>{set.name}</h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{set.description}</div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>포함된 구성품 ({setItems.length}개)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {setItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="badge badge-gray" style={{ fontSize: '10px', padding: '2px 6px' }}>{CATEGORIES[item.category]?.name || item.category}</span>
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                          </div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{item.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredSets.length === 0 && (
              <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                등록된 세트가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSetId ? '세트 구성 수정하기' : '새 세트 상품 구성하기'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">세트명 *</label>
                  <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="예: 국악 성인 풀세트" />
                </div>
                <div className="form-group">
                  <label className="form-label">간략 설명</label>
                  <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="예: 국악 공연용 성인 의상 묶음" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                {/* Left: Item Picker */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>1. 구성품 검색</h3>
                  <div className="search-input-wrapper" style={{ marginBottom: '12px', flex: 'none' }}>
                    <span className="search-icon">🔍</span>
                    <input type="text" className="search-input" placeholder="아이템명 또는 코드..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {availableItemsToPick.map(item => (
                      <div key={item.id} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.code} | 재고: {item.quantity}</div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleAddItem(item)}>+ 추가</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Selected Items */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--primary-dark)' }}>2. 선택된 구성품 ({formData.selectedItemIds.length}개)</h3>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    {formData.selectedItemIds.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '40px' }}>왼쪽에서 아이템을 추가해주세요.</div>
                    ) : (
                      formData.selectedItemIds.map(id => {
                        const item = items.find(i => i.id === id);
                        if(!item) return null;
                        return (
                          <div key={id} style={{ padding: '10px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', border: 'none', padding: '4px 8px' }} onClick={() => handleRemoveItem(id)}>X</button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {editingSetId && (
                  <button type="button" onClick={() => handleDeleteSet(editingSetId)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: '4px 8px', opacity: 0.85 }}>
                    세트 삭제
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
                <button className={`btn btn-primary ${(!formData.name || formData.selectedItemIds.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleSubmit} disabled={!formData.name || formData.selectedItemIds.length === 0}>
                  {editingSetId ? '수정 완료' : '세트 등록 완료'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
