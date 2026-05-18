'use client';

const STATS_DATA = {
  monthlyRentals: [
    { month: '1월', count: 45 },
    { month: '2월', count: 52 },
    { month: '3월', count: 86 },
    { month: '4월', count: 120 },
    { month: '5월', count: 0 },
    { month: '6월', count: 0 },
  ],
  popularItems: [
    { name: '무용 레오타드 (블랙)', count: 48 },
    { name: '국악 아동 저고리', count: 35 },
    { name: '여름 의전용 원피스', count: 28 },
    { name: '고급 실크 테이블보', count: 22 },
  ],
  deptRequests: [
    { name: '의전팀', percent: 35 },
    { name: '유년부', percent: 25 },
    { name: '청년부', percent: 20 },
    { name: '홍보팀', percent: 15 },
    { name: '기타', percent: 5 },
  ]
};

export default function StatsPage() {
  const maxRental = Math.max(...STATS_DATA.monthlyRentals.map(d => d.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">운영 실적 통계</h2>
            <div className="card-subtitle">의류 대여 및 분장/교육 지원에 대한 종합적인 통계 지표입니다.</div>
          </div>
          <button className="btn btn-secondary btn-sm">엑셀 다운로드</button>
        </div>
        
        <div className="card-body">
          <div className="grid-2">
            {/* Chart 1: Monthly Trend */}
            <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '24px', color: 'var(--primary-dark)' }}>월별 대여 건수 추이 (2024년)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                {STATS_DATA.monthlyRentals.map(data => {
                  const height = data.count === 0 ? 0 : (data.count / maxRental) * 100;
                  return (
                    <div key={data.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{data.count}건</div>
                      <div style={{ width: '100%', height: `${height}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', minHeight: data.count > 0 ? '4px' : '0', transition: 'height 0.5s ease' }}></div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                {STATS_DATA.monthlyRentals.map(data => (
                  <div key={data.month} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>{data.month}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Chart 2: Popular Items */}
              <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', flex: 1 }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--primary-dark)' }}>최다 대여 아이템 TOP 4</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {STATS_DATA.popularItems.map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>{idx + 1}. {item.name}</span>
                        <span style={{ fontWeight: 600 }}>{item.count}회</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(item.count / 50) * 100}%`, height: '100%', background: 'var(--info)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 3: Dept Requests */}
              <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', flex: 1 }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--primary-dark)' }}>부서별 요청 비율</h3>
                <div style={{ display: 'flex', width: '100%', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ width: '35%', background: 'var(--primary)' }} title="의전팀 35%"></div>
                  <div style={{ width: '25%', background: 'var(--info)' }} title="유년부 25%"></div>
                  <div style={{ width: '20%', background: 'var(--warning)' }} title="청년부 20%"></div>
                  <div style={{ width: '15%', background: '#94a3b8' }} title="홍보팀 15%"></div>
                  <div style={{ width: '5%', background: '#cbd5e1' }} title="기타 5%"></div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px' }}>
                  {STATS_DATA.deptRequests.map((dept, idx) => {
                    const colors = ['var(--primary)', 'var(--info)', 'var(--warning)', '#94a3b8', '#cbd5e1'];
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[idx] }}></div>
                        <span>{dept.name} ({dept.percent}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
