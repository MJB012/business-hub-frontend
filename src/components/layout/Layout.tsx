import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Store, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col lg:flex-row">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-gray-200 sticky top-0 h-screen z-30">
        <Sidebar />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Off-canvas Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Mobile Top Navigation Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
              <Store className="text-white" size={18} />
            </div>
            <span className="text-base font-bold text-gray-900">Business Hub</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Dynamic Route Page Content */}
        <main className="flex-1 min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
