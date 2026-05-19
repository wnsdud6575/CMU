'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Shirt,
  Package,
  MapPin,
  ArrowLeftRight,
  ShoppingCart,
  ClipboardList,
  Sparkles,
  BookOpen,
  BarChart3,
  Archive,
  Building2,
  Users,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { section: '메인' },
  { href: '/work', icon: LayoutDashboard, label: '대시보드', color: '#38bdf8' },
  { section: '자산 관리' },
  { href: '/assets', icon: Shirt, label: '자산 데이터베이스', badge: null, color: '#a78bfa' },
  { href: '/assets/sets', icon: Package, label: '세트 구성 관리', color: '#f472b6' },
  { href: '/assets/locations', icon: MapPin, label: '보관 위치 현황', color: '#fbbf24' },
  { section: '대여 관리' },
  { href: '/rentals', icon: ArrowLeftRight, label: '대여 현황 (칸반)', badge: '3', color: '#34d399' },
  { href: '/rentals/apply', icon: ShoppingCart, label: '대여 신청', color: '#60a5fa' },
  { href: '/rentals/my', icon: ClipboardList, label: '대여 신청 현황', color: '#818cf8' },
  { section: '요청 관리' },
  { href: '/requests/costume', icon: Sparkles, label: '분장 지원 요청', color: '#facc15' },
  { href: '/requests/education', icon: BookOpen, label: '교육 지원 요청', color: '#f87171' },
  { section: '업무' },
  { href: '/stats', icon: BarChart3, label: '실적 통계', color: '#2dd4bf' },
  { section: '기타' },
  { href: '/archive', icon: Archive, label: '아카이빙 / 자료실', color: '#9ca3af' },
  { href: '/vendors', icon: Building2, label: '업체 관리', color: '#fb923c' },
  { href: '/org', icon: Users, label: '조직도', color: '#818cf8' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 일반 사용자(실무자)의 경우 비인가 메뉴 접근 통제
  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      const allowedPaths = ['/rentals/apply', '/rentals/my', '/requests/costume', '/requests/education'];
      if (!allowedPaths.includes(pathname)) {
        router.replace('/rentals/apply');
      }
    }
  }, [currentUser, pathname, router]);

  // 권한별 메뉴 필터링
  const filteredNavItems = NAV_ITEMS.filter((item, idx) => {
    if (currentUser?.role === 'user') {
      if (item.section) {
        // 일반 사용자는 '대여 관리'와 '요청 관리' 섹션 타이틀만 노출
        return ['대여 관리', '요청 관리'].includes(item.section);
      }
      // 일반 사용자가 사용할 수 있는 개별 라우트 목록
      return ['/rentals/apply', '/rentals/my', '/requests/costume', '/requests/education'].includes(item.href);
    }
    return true;
  });

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="메뉴 열기"
      >
        <span /><span /><span />
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ overflow: 'hidden', padding: 0 }}>
            <img 
              src="/logo.jpg" 
              alt="의상분장과 로고" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <h1>CRMS<span>의상분장과 관리시스템</span></h1>
        </div>
        <nav className="sidebar-nav">
          {filteredNavItems.map((item, idx) => {
            if (item.section) {
              return <div key={idx} className="sidebar-section-title">{item.section}</div>;
            }
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="sidebar-link-icon">
                  <Icon size={18} color={item.color} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                {item.label}
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>v1.0</span>
          <button 
            onClick={logout} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '11px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248, 113, 113, 0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={12} />
            로그아웃
          </button>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
