'use client';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import LoginGate from './LoginGate';

export default function AppContent({ children }) {
  const { currentUser } = useApp();

  // 로그인하지 않은 경우 로그인창 노출
  if (!currentUser) {
    return <LoginGate />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
