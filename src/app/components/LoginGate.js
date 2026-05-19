'use client';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, ArrowRight, Lock, Building, UserCheck } from 'lucide-react';

export default function LoginGate() {
  const { login } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dept, setDept] = useState('');
  const [divName, setDivName] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('성명을 입력해 주세요.');
      return;
    }
    if (!isAdmin && (!dept.trim() || !divName.trim())) {
      setError('부서와 과를 모두 입력해 주세요.');
      return;
    }

    const combinedDept = !isAdmin ? `${dept.trim()} / ${divName.trim()}` : (dept || '의상분장과');

    if (isAdmin) {
      if (password === 'admin' || password === '1234') {
        login('admin', userName, combinedDept);
      } else {
        setError('관리자 비밀번호가 올바르지 않습니다. (힌트: admin 또는 1234)');
      }
    } else {
      login('user', userName, combinedDept);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.03), 0 0 1px 0 rgba(0,0,0,0.1) inset',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* 로고 영역 */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          background: '#f8fafc',
          marginBottom: '16px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="/logo.jpg" alt="로고" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h1 style={{ fontSize: '21px', fontWeight: '800', textAlign: 'center', margin: '0 0 4px', color: '#0f172a', letterSpacing: '-0.025em' }}>
          CRMS 통합시스템
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '0 0 28px', fontWeight: 500 }}>
          의상분장과 자산 · 대여 신청 통합 관리
        </p>

        {/* 탭 버튼 */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          width: '100%',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={() => { setIsAdmin(false); setError(''); }}
            style={{
              flex: 1,
              background: !isAdmin ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: !isAdmin ? '#4f46e5' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: !isAdmin ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={13} />
            일반 사용자
          </button>
          <button
            type="button"
            onClick={() => { setIsAdmin(true); setError(''); }}
            style={{
              flex: 1,
              background: isAdmin ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: isAdmin ? '#4f46e5' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isAdmin ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={13} />
            의상분장과 관리자
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 부서/과 입력창 */}
          {!isAdmin && (
            <div>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    신청 부서 *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="예: 문화부"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px 12px 10px 34px',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />
                    <Building size={14} style={{ position: 'absolute', left: '12px', top: '12.5px', color: '#64748b' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    과 *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="예: 의분과"
                      value={divName}
                      onChange={(e) => setDivName(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px 12px 10px 34px',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />
                    <Building size={14} style={{ position: 'absolute', left: '12px', top: '12.5px', color: '#64748b' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 이름 입력창 */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              {isAdmin ? '관리자 성명 *' : '신청자 성명 *'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="실무자 이름을 입력해주세요"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 12px 10px 34px',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              />
              <UserCheck size={14} style={{ position: 'absolute', left: '12px', top: '12.5px', color: '#64748b' }} />
            </div>
          </div>

          {/* 관리자 비밀번호 입력창 */}
          {isAdmin && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                관리자 비밀번호 *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="비밀번호 입력 (admin 또는 1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 34px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '12.5px', color: '#64748b' }} />
              </div>
            </div>
          )}

          {error && (
            <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0', lineHeight: '1.4', fontWeight: 500 }}>
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '8px',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>시스템 로그인</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* 원클릭 테스트 계정 */}
        <div style={{
          marginTop: '28px',
          width: '100%',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '16px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 10px', fontWeight: 500 }}>빠른 테스트용 바로 로그인</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => login('user', '홍길동', '유년회')}
              style={{
                fontSize: '11px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              일반 사용자
            </button>
            <button
              onClick={() => login('admin', '김관리', '의상분장과')}
              style={{
                fontSize: '11px',
                background: '#e0e7ff',
                border: '1px solid #c7d2fe',
                color: '#4f46e5',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              관리자
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
