'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROCESS_STEPS = ['요청 접수', '사전 회의', '사전 과제 제출', '실교육', '완료'];

export default function EducationRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    department: '',
    requester: '',
    contact: '',
    audience: '',
    title: '',
    objective: '',
    date: '',
    location: '',
    participants: '',
    currentLevel: '',
    prework: '',
    content: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('교육 지원 요청이 접수되었습니다. 업무 대시보드에서 사전 회의 일정을 조율하세요.');
    router.push('/work');
  };

  return (
    <div className="request-page">
      <div className="card request-card wide">
        <div className="card-header">
          <div>
            <h2 className="card-title">교육 지원 요청</h2>
            <div className="card-subtitle">교육 대상, 목표, 필요 내용을 접수하고 내부에서는 단계별로 진행합니다.</div>
          </div>
        </div>

        <div className="card-body">
          <div className="education-layout">
            <form onSubmit={handleSubmit} className="education-form">
              <h3 className="request-section-title">신청 정보</h3>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">신청 부서 / 과(팀) *</label>
                  <input type="text" className="form-input" name="department" required value={formData.department} onChange={handleChange} placeholder="예: 유년부 / 교육팀" />
                </div>
                <div className="form-group">
                  <label className="form-label">신청자명 *</label>
                  <input type="text" className="form-input" name="requester" required value={formData.requester} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">연락처 *</label>
                  <input type="text" className="form-input" name="contact" required value={formData.contact} onChange={handleChange} placeholder="010-0000-0000" />
                </div>
              </div>

              <h3 className="request-section-title">교육 내용</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">교육 대상 *</label>
                  <input type="text" className="form-input" name="audience" required value={formData.audience} onChange={handleChange} placeholder="예: 부서 사명자, 신입 안내위원, 율동팀" />
                </div>
                <div className="form-group">
                  <label className="form-label">예상 참석 인원 *</label>
                  <input type="number" className="form-input" name="participants" required value={formData.participants} onChange={handleChange} min="1" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">교육 주제 / 제목 *</label>
                <input type="text" className="form-input" name="title" required value={formData.title} onChange={handleChange} placeholder="예: 안내위원 기본 메이크업 및 복장 교육" />
              </div>

              <div className="form-group">
                <label className="form-label">교육 목표 *</label>
                <input type="text" className="form-input" name="objective" required value={formData.objective} onChange={handleChange} placeholder="예: 단정하고 통일감 있는 인상 주기" />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">희망 일시 *</label>
                  <input type="date" className="form-input" name="date" required value={formData.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">장소 *</label>
                  <input type="text" className="form-input" name="location" required value={formData.location} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">현재 수준/상황</label>
                  <input type="text" className="form-input" name="currentLevel" value={formData.currentLevel} onChange={handleChange} placeholder="예: 처음 교육, 기존 교육 보완" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">사전 과제로 제출 가능한 자료</label>
                <input type="text" className="form-input" name="prework" value={formData.prework} onChange={handleChange} placeholder="예: 교육 대상 사진, 기존 복장 사진, 참고 영상" />
              </div>

              <div className="form-group">
                <label className="form-label">요청 교육 내용 요약 *</label>
                <textarea className="form-textarea" name="content" required value={formData.content} onChange={handleChange} placeholder="구체적으로 어떤 부분에 대한 코칭이나 교육이 필요한지 적어주세요." style={{ minHeight: '120px' }}></textarea>
              </div>

              <div className="request-actions">
                <button type="submit" className="btn btn-primary">교육 지원 신청</button>
              </div>
            </form>

            <aside className="education-process-panel">
              <h3>내부 진행 단계</h3>
              <p>신청자는 기본 정보만 입력하고, 담당자는 업무 대시보드에서 아래 단계를 체크합니다.</p>
              <div className="process-timeline">
                {PROCESS_STEPS.map((step, index) => (
                  <div key={step} className={`process-step ${index === 0 ? 'done' : ''}`}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
              <div className="notice-box">
                <strong>운영 기준</strong>
                <p>사전 회의에서 교육 범위와 준비물을 확정하고, 사전 과제 제출 후 실교육 일정을 확정합니다.</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
