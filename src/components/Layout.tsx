import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const greetingText = (() => {
    const emailPrefix = user?.email ? user.email.split('@')[0] : '';
    const rawName = (user?.name && user.name.trim()) || emailPrefix;
    if (!rawName) return '';
    const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return `Hello, ${formatted}`;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/my-cases')}>
                <Stethoscope className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-semibold text-gray-900">VMTB</span>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => navigate('/my-cases')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/my-cases')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  My Cases
                </button>
                <button
                  onClick={() => navigate('/mtbs')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/mtbs')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  MTBs
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">{greetingText}</div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
