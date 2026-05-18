'use client';

const VENDORS = [
  {
    id: 1,
    name: '크린토피아 연수점',
    category: '세탁소',
    contact: '02-123-4567',
    manager: '김사장',
    status: 'active',
    taxInvoice: '가능',
    specialties: '무용복, 실크, 드라이클리닝',
    productionLinks: '-',
    notes: '대량 세탁 시 10% 할인. 세탁 완료 후 사진 확인 가능.',
  },
  {
    id: 2,
    name: '동대문 종합상가 동양직물',
    category: '원단/부자재',
    contact: '02-987-6543',
    manager: '이실장',
    status: 'active',
    taxInvoice: '가능',
    specialties: '국악 원단, 무용복 원단, 금박 부자재',
    productionLinks: '스와치 24-S-018 / 1벌 2.2마 / 50벌 115야드 주문',
    notes: '염색 탕 차이 주의. 같은 프로젝트 추가 제작 시 기존 스와치 번호 확인 필요.',
  },
  {
    id: 3,
    name: '스타일 메이크업 샵',
    category: '외부 분장',
    contact: '010-1234-5678',
    manager: '박원장',
    status: 'inactive',
    taxInvoice: '가능',
    specialties: '대형 행사 외부 분장팀',
    productionLinks: '-',
    notes: '총회 등 외부 인력 필요 시 협의. 현재는 휴면 거래처.',
  },
  {
    id: 4,
    name: '제일 소품',
    category: '소품 구매',
    contact: '02-555-7777',
    manager: '-',
    status: 'active',
    taxInvoice: '확인 필요',
    specialties: '기타 잡화, 특수 소품',
    productionLinks: '북 의상 장식 부자재 후보',
    notes: '온라인 주문 위주. 납기와 재고 변동이 잦아 주문 전 확인 필요.',
  },
];

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
