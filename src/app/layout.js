import { AppProvider } from './context/AppContext';
import AppContent from './components/AppContent';
import './globals.css';

export const metadata = {
  title: 'CRMS | 의상분장과 관리시스템',
  description: '의상분장과 통합 자산 관리 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <AppProvider>
          <AppContent>
            {children}
          </AppContent>
        </AppProvider>
      </body>
    </html>
  );
}
