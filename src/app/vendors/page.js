'use client';

const VENDORS = [];

export default function VendorsPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">협력 업체 관리</h2>
          <div className="card-subtitle">연락처뿐 아니라 제작 히스토리, 원단/스와치, 세금계산서 여부까지 함께 관리합니다.</div>
        </div>
        <button className="btn btn-primary">+ 신규 업체 등록</button>
      </div>

      <div className="card-body">
        <div className="vendor-summary-grid">
          <div><strong>{VENDORS.length}</strong><span>등록 업체</span></div>
          <div><strong>{VENDORS.filter(vendor => vendor.taxInvoice === '가능').length}</strong><span>세금계산서 가능</span></div>
          <div><strong>{VENDORS.filter(vendor => vendor.category.includes('원단')).length}</strong><span>원단/부자재</span></div>
        </div>

        <div className="table-wrapper">
          <table className="table vendor-table">
            <thead>
              <tr>
                <th>분류</th>
                <th>업체명</th>
                <th>연락처/담당</th>
                <th>전문 분야</th>
                <th>제작/구매 히스토리</th>
                <th>세금계산서</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {VENDORS.map(vendor => (
                <tr key={vendor.id}>
                  <td><span className="badge badge-gray">{vendor.category}</span></td>
                  <td>
                    <strong>{vendor.name}</strong>
                    <div className="muted-line">{vendor.notes}</div>
                  </td>
                  <td>
                    <div>{vendor.contact}</div>
                    <div className="muted-line">{vendor.manager}</div>
                  </td>
                  <td>{vendor.specialties}</td>
                  <td className="vendor-history">{vendor.productionLinks}</td>
                  <td>
                    <span className={`badge badge-${vendor.taxInvoice === '가능' ? 'success' : 'warning'}`}>
                      {vendor.taxInvoice}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${vendor.status === 'active' ? 'success' : 'warning'}`}>
                      {vendor.status === 'active' ? '거래중' : '휴면'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm">수정</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
