'use client';

const ORG_MEMBERS = [
  { id: 1, name: '이팀장', role: '의상분장과 파트장', team: '총괄', responsibilities: '총괄 관리, 예산 및 기획, 프로젝트 승인', phone: '010-0000-0001', email: 'team_leader@example.com', joinedAt: '2020-02-01', level: 1 },
  { id: 2, name: '김실무', role: '의상 관리 담당', team: '자산/대여', responsibilities: '재고 실사, 대여 승낙, 세탁 업체 컨택', phone: '010-0000-0002', email: 'costume_mgr@example.com', joinedAt: '2022-03-15', level: 2 },
  { id: 3, name: '박메컵', role: '분장/교육 담당', team: '분장/교육', responsibilities: '행사 분장 지원, 타 부서 메이크업 교육', phone: '010-0000-0003', email: 'makeup_edu@example.com', joinedAt: '2021-07-10', level: 2 },
  { id: 4, name: '최아카이빙', role: '자료 관리 담당', team: '아카이브', responsibilities: '행사 사진 촬영, 아카이빙, 자료실 관리', phone: '010-0000-0004', email: 'archive_mgr@example.com', joinedAt: '2023-09-01', level: 2 },
];

function getTenureDays(joinedAt) {
  const current = new Date('2026-04-29T00:00:00');
  const joined = new Date(`${joinedAt}T00:00:00`);
  return Math.floor((current - joined) / (1000 * 60 * 60 * 24));
}

export default function OrgPage() {
  const leader = ORG_MEMBERS.find(member => member.level === 1);
  const members = ORG_MEMBERS.filter(member => member.level !== 1);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">조직도 및 연락망</h2>
          <div className="card-subtitle">프로필 사진 자리, 역할, 담당 업무, 사명/근속 데이터를 함께 봅니다.</div>
        </div>
        <button className="btn btn-secondary">내 정보 수정</button>
      </div>

      <div className="card-body">
        <div className="org-chart">
          {leader && (
            <div className="org-leader-card">
              <div className="profile-photo">{leader.name.charAt(0)}</div>
              <div>
                <h3>{leader.name}</h3>
                <span className="badge badge-primary">{leader.role}</span>
                <p>{leader.responsibilities}</p>
                <div className="org-meta-row">
                  <span>{leader.team}</span>
                  <span>{getTenureDays(leader.joinedAt).toLocaleString()}일</span>
                </div>
              </div>
            </div>
          )}

          <div className="org-connector" />

          <div className="org-member-grid">
            {members.map(member => (
              <div key={member.id} className="org-member-card">
                <div className="profile-photo small">{member.name.charAt(0)}</div>
                <div className="org-member-body">
                  <div className="org-member-heading">
                    <h3>{member.name}</h3>
                    <span className="badge badge-gray">{member.team}</span>
                  </div>
                  <strong>{member.role}</strong>
                  <p>{member.responsibilities}</p>
                  <div className="org-contact">
                    <span>{member.phone}</span>
                    <span>{member.email}</span>
                  </div>
                  <div className="org-meta-row">
                    <span>등록일 {member.joinedAt}</span>
                    <span>{getTenureDays(member.joinedAt).toLocaleString()}일</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
