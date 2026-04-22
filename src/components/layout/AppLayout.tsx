import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import TopBar from '../TopBar';
import ErrorBoundary from '../ErrorBoundary';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}
