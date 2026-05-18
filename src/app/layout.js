import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './globals.css';

export const metadata = {
  title: 'CRMS | 의상분장과 관리시스템',
  description: '의상분장과 통합 자산 관리 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AppProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Header />
              <div className="page-content">
                {children}
              </div>
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
