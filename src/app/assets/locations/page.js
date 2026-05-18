'use client';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function LocationsPage() {
  const { LOCATIONS, items, CATEGORIES } = useApp();
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Group items by location
  const itemsByLocation = items.reduce((acc, item) => {
    if (!acc[item.location]) acc[item.location] = [];
    acc[item.location].push(item);
    return acc;
  }, {});

  // Parse location strings into hierarchy
  const hierarchy = {};
  LOCATIONS.forEach(loc => {
    const match = loc.match(/^(.+?)\s+(.+?)\((.+?)\)$/);
    let building = '기타';
    let floor = '기타';
    let room = loc;

    if (match) {
      building = match[1];
      floor = match[2];
      room = match[3];
    } else if (loc.includes(' ')) {
      building = loc.split(' ')[0];
      floor = '기본';
    }

    if (!hierarchy[building]) hierarchy[building] = {};
    if (!hierarchy[building][floor]) hierarchy[building][floor] = [];
    
    hierarchy[building][floor].push({ fullLoc: loc, roomName: room });
  });

  const selectedItems = selectedLocation ? (itemsByLocation[selectedLocation] || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>보관 위치 현황</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>건물 및 층별로 세분화된 보관 장소의 재고 현황을 한눈에 파악합니다.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        {Object.keys(hierarchy).map(building => (
          <div key={building} className="card" style={{ flex: building === '연수원' ? 2 : 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ padding: '16px 20px', background: 'var(--bg-main)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏢</span> {building}
              </h3>
            </div>
            
            <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(hierarchy[building]).map(floor => (
                <div key={floor} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                    {floor}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1px', background: 'var(--border)' }}>
                    {hierarchy[building][floor].map(locData => {
                      const locItems = itemsByLocation[locData.fullLoc] || [];
                      const totalQuantity = locItems.reduce((sum, item) => sum + item.quantity, 0);
                      
                      return (
                        <div 
                          key={locData.fullLoc} 
                          style={{ 
                            padding: '12px', 
                            background: 'var(--bg-card)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          className="compact-loc-card"
                          onClick={() => setSelectedLocation(locData.fullLoc)}
                        >
                          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{locData.roomName}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span>품목: <strong>{locItems.length}</strong>종</span>
                            <span>수량: <strong>{totalQuantity}</strong>개</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedLocation && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">📍 {selectedLocation} 보관 품목</h2>
              <button className="modal-close" onClick={() => setSelectedLocation(null)}>×</button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              {selectedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  현재 이 위치에 보관 중인 품목이 없습니다.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>코드</th>
                        <th>분류</th>
                        <th>아이템명</th>
                        <th>수량</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{item.code}</td>
                          <td>
                            <span className="badge badge-gray">{CATEGORIES[item.category]?.name || item.category}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.quantity}개</td>
                          <td>
                            <span className={`badge badge-${
                              item.status === 'available' ? 'success' :
                              item.status === 'in-use' ? 'primary' :
                              item.status === 'repair' ? 'warning' : 'danger'
                            }`}>
                              {item.status === 'available' ? '보관중' :
                               item.status === 'in-use' ? '대여중' :
                               item.status === 'repair' ? '수리필요' : '폐기'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedLocation(null)}>확인</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .compact-loc-card:hover {
          background: var(--primary-50) !important;
        }
      `}</style>
    </div>
  );
}
