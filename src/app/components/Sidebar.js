'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Shirt,
  Package,
  MapPin,
  ArrowLeftRight,
  ShoppingCart,
  Sparkles,
  BookOpen,
  BarChart3,
  Archive,
  Building2,
  Users,
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="sidebar-logo-icon">
            <Shirt size={20} strokeWidth={2.2} />
          </div>
          <h1>CRMS<span>의상분장과 관리시스템</span></h1>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, idx) => {
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
        <div className="sidebar-footer">
          <span>v1.0</span>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
