'use client';

const ORG_MEMBERS = [];

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
