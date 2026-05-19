'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './context/AppContext';

export default function Home() {
  const { currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        router.replace('/work');
      } else {
        router.replace('/rentals/apply');
      }
    }
  }, [currentUser, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>시스템 접속 중...</div>
    </div>
  );
}
