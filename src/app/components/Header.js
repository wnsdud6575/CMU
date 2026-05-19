'use client';
import { useApp } from '../context/AppContext';
import { usePathname } from 'next/navigation';
import { Search, LogOut } from 'lucide-react';

const PAGE_TITLES = {
  '/work': '대시보드',
  '/assets': '자산 데이터베이스',
  '/assets/sets': '세트 구성 관리',
  '/assets/locations': '보관 위치 현황',
  '/rentals': '대여 현황 (칸반)',
  '/rentals/apply': '대여 신청',
  '/rentals/my': '대여 신청 현황',
  '/requests/costume': '분장 지원 요청',
  '/requests/education': '교육 지원 요청',
  '/stats': '실적 통계',
  '/archive': '아카이빙 / 자료실',
  '/vendors': '업체 관리',
  '/org': '조직도',
};

export default function Header() {
  const { currentUser, logout } = useApp();
  const pathname = usePathname();
  
  // Try to find the exact match, or fallback to the closest match
  const title = PAGE_TITLES[pathname] || 'CRMS';

  return (
    <header className="header">
      <div className="header-title">{title}</div>
      <div className="header-right">
        <div className="header-search">
          <span className="header-search-icon">
            <Search size={15} strokeWidth={2} />
          </span>
          <input
            type="text"
            placeholder={currentUser?.role === 'admin' ? "자산, 대여, 업무 검색..." : "대여 신청 품목 검색..."}
            className="header-search-input"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="header-user">
            <div className="header-user-avatar">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{currentUser?.name}</span>
              <span className="header-user-role">{currentUser?.dept} · {currentUser?.role === 'admin' ? '운영자' : '신청자'}</span>
            </div>
          </div>
          
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fef2f2' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={12} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  );
}
