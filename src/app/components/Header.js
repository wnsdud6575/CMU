'use client';
import { useApp } from '../context/AppContext';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const PAGE_TITLES = {
  '/work': '대시보드',
  '/assets': '자산 데이터베이스',
  '/assets/sets': '세트 구성 관리',
  '/assets/locations': '보관 위치 현황',
  '/rentals': '대여 현황 (칸반)',
  '/rentals/apply': '대여 신청',
  '/requests/costume': '분장 지원 요청',
  '/requests/education': '교육 지원 요청',
  '/stats': '실적 통계',
  '/archive': '아카이빙 / 자료실',
  '/vendors': '업체 관리',
  '/org': '조직도',
};

export default function Header() {
  const { currentUser } = useApp();
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
            placeholder="자산, 대여, 업무 검색..."
            className="header-search-input"
          />
        </div>
        <div className="header-user">
          <div className="header-user-avatar">
            {currentUser.name.charAt(0)}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{currentUser.name}</span>
            <span className="header-user-role">{currentUser.dept} · {currentUser.role === 'admin' ? '운영자' : '실무자'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
