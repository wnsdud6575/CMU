'use client';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AssetPhoto from '../components/AssetPhoto';
import AssetModal from './components/AssetModal';

export default function AssetsPage() {
  const { items, CATEGORIES, STATUS_LABELS, CONDITION_LABELS } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRepair, setFilterRepair] = useState(false);
  const [filterNoPhoto, setFilterNoPhoto] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter(item => {
    const searchable = [
      item.name,
      item.code,
      item.assemblyCode,
      item.localCode,
      item.costumeLine,
      item.sizeBreakdown,
      item.laundryMethod,
      ...(item.keywords || []),
    ].filter(Boolean).join(' ').toLowerCase();
    const matchSearch = !normalizedSearch || searchable.includes(normalizedSearch);
    const matchCat = filterCat === 'ALL' || item.category === filterCat;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchRepair = !filterRepair || item.repairRequired;
    const matchNoPhoto = !filterNoPhoto || !item.photo;
    return matchSearch && matchCat && matchStatus && matchRepair && matchNoPhoto;
  });

  const openEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">의상 자산 마스터 데이터</h2>
            <div className="card-subtitle">사진, 총회 스타일 넘버, 사이즈, 세탁/수선 기준까지 함께 관리합니다.</div>
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ 자산 신규 등록</button>
        </div>

        <div className="card-body">
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">검색</span>
              <input
                type="text"
                className="search-input"
                placeholder="아이템명, 코드, 카테고리, 세탁 방법 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: '170px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="ALL">전체 카테고리</option>
              {Object.values(CATEGORIES).map(cat => (
                <option key={cat.code} value={cat.code}>{cat.code} - {cat.name}</option>
              ))}
            </select>
            <select className="form-select" style={{ width: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">전체 상태</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="asset-table-meta">
            <span 
              onClick={() => { setSearch(''); setFilterCat('ALL'); setFilterStatus('ALL'); setFilterRepair(false); setFilterNoPhoto(false); }} 
              style={{ cursor: 'pointer' }}
              title="모든 필터 초기화"
            >
              총 {items.length}종
            </span>
            <span 
              onClick={() => setFilterNoPhoto(!filterNoPhoto)}
              style={{ 
                cursor: 'pointer', 
                padding: '2px 8px', 
                borderRadius: '4px',
                background: filterNoPhoto ? 'var(--warning)' : 'transparent',
                color: filterNoPhoto ? 'white' : 'inherit',
                fontWeight: filterNoPhoto ? 700 : 400,
                transition: 'all 0.2s'
              }}
            >
              사진 없는 품목 {items.filter(item => !item.photo).length}종
            </span>
            <span 
              onClick={() => setFilterRepair(!filterRepair)} 
              style={{ 
                cursor: 'pointer', 
                padding: '2px 8px', 
                borderRadius: '4px',
                background: filterRepair ? 'var(--danger)' : 'transparent',
                color: filterRepair ? 'white' : 'inherit',
                fontWeight: filterRepair ? 700 : 400,
                transition: 'all 0.2s'
              }}
            >
              수선 확인 필요 {items.filter(item => item.repairRequired).length}종
            </span>
          </div>

          <div className="table-wrapper">
            <table className="table asset-table">
              <thead>
                <tr>
                  <th>사진</th>
                  <th>품목</th>
                  <th>코드</th>
                  <th>분류</th>
                  <th>수량/사이즈</th>
                  <th>보관/상태</th>
                  <th>세탁/수선</th>
                  <th>QR</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const catInfo = CATEGORIES[item.category];
                  return (
                    <tr key={item.id}>
                      <td>
                        <AssetPhoto item={item} size="sm" />
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        {((item.productionYear) || (item.keywords && item.keywords.length > 0)) ? (
                          <div className="muted-line">
                            {item.productionYear ? `${item.productionYear} 제작` : ''}
                            {item.productionYear && item.keywords && item.keywords.length > 0 ? ' · ' : ''}
                            {Array.isArray(item.keywords) ? item.keywords.map(k => `#${k}`).join(' ') : (item.keywords || '')}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div className="code-stack">
                          <span>{item.assemblyCode || item.code}</span>
                          <small>내부 {item.localCode || item.code}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">{catInfo?.name || item.category}</span>
                        <div className="muted-line">{item.costumeLine || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.quantity}개</div>
                        <div className="muted-line">{item.sizeBreakdown || '사이즈 미입력'}</div>
                      </td>
                      <td>
                        <div className={`badge badge-${
                          item.status === 'available' ? 'success' :
                          item.status === 'in-use' ? 'primary' :
                          item.status === 'repair' ? 'warning' : 'danger'
                        }`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </div>
                        <div className="muted-line">{item.location}</div>
                        <div className="muted-line">상태 {CONDITION_LABELS[item.condition] || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.laundryMethod || '미입력'}</div>
                        <div className={item.repairRequired ? 'repair-line danger' : 'repair-line'}>
                          {item.repairRequired ? (item.repairNote || '수선 필요') : '수선 없음'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{item.qrCode ? '등록' : '예정'}</span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>수정</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && <AssetModal onClose={() => setIsModalOpen(false)} editItem={editingItem} />}
    </div>
  );
}
