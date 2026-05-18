'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EMPTY_TARGET = {
  name: '',
  department: '',
  position: '',
  role: '',
  gender: '무관',
  style: '',
  notes: '',
};

export default function CostumeRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    department: '',
    requester: '',
    contact: '',
    eventName: '',
    eventDate: '',
    story: '',
    location: '',
    environment: '실내 스튜디오',
    lighting: '조명 있음',
    targets: [{ ...EMPTY_TARGET }],
    referenceNote: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateTarget = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.map((target, targetIndex) => (
        targetIndex === index ? { ...target, [field]: value } : target
      )),
    }));
  };

  const addTarget = () => {
    setFormData(prev => ({ ...prev, targets: [...prev.targets, { ...EMPTY_TARGET }] }));
  };

  const removeTarget = (index) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.length === 1 ? prev.targets : prev.targets.filter((_, targetIndex) => targetIndex !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('분장 지원 요청이 접수되었습니다. 업무 대시보드에서 사전 회의 단계로 확인하세요.');
    router.push('/work');
  };

  return (
    <div className="request-page">
      <div className="card request-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">의상 및 분장 지원 요청</h2>
            <div className="card-subtitle">촬영 목적, 진행 환경, 대상자별 역할과 스타일을 함께 접수합니다.</div>
          </div>
        </div>

        <div className="card-body">
          <div className="step-bars">
            <div className={step >= 1 ? 'active' : ''} />
            <div className={step >= 2 ? 'active' : ''} />
            <div className={step >= 3 ? 'active' : ''} />
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
            {step === 1 && (
              <div className="animation-fade-in">
                <h3 className="request-section-title">신청 및 행사 정보</h3>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">신청 부서 / 과(팀) *</label>
                    <input type="text" className="form-input" name="department" required value={formData.department} onChange={handleChange} placeholder="예: 미디어팀 / 촬영파트" />
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

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">행사/프로젝트명 *</label>
                    <input type="text" className="form-input" name="eventName" required value={formData.eventName} onChange={handleChange} placeholder="예: 상반기 기획 영상 촬영" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">일시 *</label>
                    <input type="date" className="form-input" name="eventDate" required value={formData.eventDate} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">촬영/행사 스토리</label>
                  <textarea className="form-textarea" name="story" value={formData.story} onChange={handleChange} placeholder="어떤 장면, 어떤 역할, 어떤 인상으로 보이면 좋은지 적어주세요."></textarea>
                </div>

                <div className="request-actions">
                  <button type="submit" className="btn btn-primary">다음 단계</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animation-fade-in">
                <h3 className="request-section-title">촬영/진행 환경</h3>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">장소 *</label>
                    <input type="text" className="form-input" name="location" required value={formData.location} onChange={handleChange} placeholder="예: 본당 3층 스튜디오" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">진행 환경</label>
                    <select className="form-select" name="environment" value={formData.environment} onChange={handleChange}>
                      <option value="실내 스튜디오">실내 스튜디오</option>
                      <option value="실내 행사장">실내 행사장</option>
                      <option value="야외">야외</option>
                      <option value="대형 무대">대형 무대</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">조명/노출 조건</label>
                    <select className="form-select" name="lighting" value={formData.lighting} onChange={handleChange}>
                      <option value="조명 있음">조명 있음</option>
                      <option value="자연광 위주">자연광 위주</option>
                      <option value="강한 무대 조명">강한 무대 조명</option>
                      <option value="미정">미정</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">참고 사진/레퍼런스 설명</label>
                  <div className="upload-zone">
                    <strong>사진 업로드 자리</strong>
                    <span>실제 저장소 연결 전까지는 참고 사진 설명을 아래에 남깁니다.</span>
                  </div>
                  <textarea className="form-textarea" name="referenceNote" value={formData.referenceNote} onChange={handleChange} placeholder="예: 정면/좌측/우측 사진 3장 전달 예정, 원하는 스타일 레퍼런스 링크 등"></textarea>
                </div>

                <div className="request-actions split">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>이전</button>
                  <button type="submit" className="btn btn-primary">다음 단계</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animation-fade-in">
                <div className="request-title-row">
                  <h3 className="request-section-title">대상자별 요청 정보</h3>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addTarget}>+ 대상자 추가</button>
                </div>

                <div className="target-list">
                  {formData.targets.map((target, index) => (
                    <div className="target-card" key={index}>
                      <div className="target-card-header">
                        <strong>대상자 {index + 1}</strong>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeTarget(index)}>삭제</button>
                      </div>

                      <div className="grid-3">
                        <div className="form-group">
                          <label className="form-label">이름</label>
                          <input type="text" className="form-input" value={target.name} onChange={e => updateTarget(index, 'name', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">부서</label>
                          <input type="text" className="form-input" value={target.department} onChange={e => updateTarget(index, 'department', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">직책/직분</label>
                          <input type="text" className="form-input" value={target.position} onChange={e => updateTarget(index, 'position', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid-3">
                        <div className="form-group">
                          <label className="form-label">촬영 역할</label>
                          <input type="text" className="form-input" value={target.role} onChange={e => updateTarget(index, 'role', e.target.value)} placeholder="예: 사회자, 인터뷰 대상자" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">성별/표현 기준</label>
                          <select className="form-select" value={target.gender} onChange={e => updateTarget(index, 'gender', e.target.value)}>
                            <option value="무관">무관</option>
                            <option value="남성">남성</option>
                            <option value="여성">여성</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">희망 스타일</label>
                          <input type="text" className="form-input" value={target.style} onChange={e => updateTarget(index, 'style', e.target.value)} placeholder="예: 단정한 정장, 자연스러운 메이크업" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">개별 특이사항</label>
                        <textarea className="form-textarea" value={target.notes} onChange={e => updateTarget(index, 'notes', e.target.value)} placeholder="헤어 길이, 피부톤, 피해야 할 스타일 등"></textarea>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">기타 세부 요청사항</label>
                  <textarea className="form-textarea" name="notes" value={formData.notes} onChange={handleChange} placeholder="담당자가 사전 회의 전 알아야 할 내용을 적어주세요."></textarea>
                </div>

                <div className="request-actions split">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>이전</button>
                  <button type="submit" className="btn btn-primary">지원 요청 완료</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      <style>{`
        .animation-fade-in { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  );
}
