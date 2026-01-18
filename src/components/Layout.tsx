import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Stethoscope, User, MessageSquare, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { supabase } from '../Supabase/client';

interface LayoutProps {
  children: ReactNode;
  wide?: boolean;
}

export function Layout({ children, wide = false }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileHospital, setProfileHospital] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load profile data when modal opens
  useEffect(() => {
    const loadProfile = async () => {
      if (showProfileModal && user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, specialty, hospital')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfileName(data.full_name || '');
          setProfileSpecialty(data.specialty || '');
          setProfileHospital(data.hospital || '');
        }
      }
    };
    loadProfile();
  }, [showProfileModal, user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: profileName.trim(),
          specialty: profileSpecialty.trim(),
          hospital: profileHospital.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      setProfileSaved(true);
      setTimeout(() => {
        setProfileSaved(false);
        setShowProfileModal(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!user?.id || !feedbackText.trim()) return;
    setFeedbackLoading(true);
    try {
      await supabase.from('feedback').insert({
        user_id: user.id,
        content: feedbackText.trim(),
      });
      setFeedbackSent(true);
      setFeedbackText('');
      setTimeout(() => {
        setFeedbackSent(false);
        setShowFeedbackModal(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to send feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
        <div className="w-full px-6 lg:px-10">
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowProfileModal(true);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowFeedbackModal(true);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Feedback</span>
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className={`${wide ? 'max-w-[90%]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {children}
      </main>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <input
              type="text"
              value={profileSpecialty}
              onChange={(e) => setProfileSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Oncology, Radiology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital/Institution</label>
            <input
              type="text"
              value={profileHospital}
              onChange={(e) => setProfileHospital(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Where you practice"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={profileLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : profileSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Send Feedback"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We'd love to hear your thoughts! Share your feedback, suggestions, or report any issues.
          </p>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your feedback..."
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendFeedback}
              disabled={feedbackLoading || !feedbackText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {feedbackLoading ? 'Sending...' : feedbackSent ? 'Sent!' : 'Send Feedback'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
