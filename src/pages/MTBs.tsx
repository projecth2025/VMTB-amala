import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FileText } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';

export function MTBs() {
  const navigate = useNavigate();
  const { mtbs, createMTB, joinMTB, loading } = useCases();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [mtbName, setMtbName] = useState('');
  const [mtbCode, setMtbCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sort MTBs: owner's MTBs first, then others
  const sortedMtbs = [...mtbs].sort((a, b) => {
    const aIsOwner = a.ownerId === user?.id;
    const bIsOwner = b.ownerId === user?.id;
    if (aIsOwner && !bIsOwner) return -1;
    if (!aIsOwner && bIsOwner) return 1;
    return 0;
  });

  const handleCreateMTB = async () => {
    if (!mtbName.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await createMTB(mtbName);
      setMtbName('');
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create MTB');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinMTB = async () => {
    if (!mtbCode.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await joinMTB(mtbCode);
      setMtbCode('');
      setShowJoinModal(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to join MTB');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Molecular Tumor Boards</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center space-x-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Join MTB</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create MTB</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading MTBs...</div>
        ) : mtbs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No MTBs yet. Create or join one!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMtbs.map((mtb) => {
              const isOwner = mtb.ownerId === user?.id;
              return (
                <div
                  key={mtb.id}
                  onClick={() => navigate(`/mtb/${mtb.id}`)}
                  className={`rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 ${
                    isOwner ? 'bg-gray-100 border-2 border-gray-300' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{mtb.name}</h3>
                    {isOwner && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Owner</span>
                    )}
                  </div>
                  <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{mtb.experts} Experts</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{mtb.cases.length} Cases</span>
                </div>
              </div>
            </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New MTB"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="mtbName" className="block text-sm font-medium text-gray-700 mb-1">
              MTB Name
            </label>
            <input
              id="mtbName"
              type="text"
              value={mtbName}
              onChange={(e) => setMtbName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Thoracic Oncology Board"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMTB}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join MTB"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="mtbCode" className="block text-sm font-medium text-gray-700 mb-1">
              MTB Code
            </label>
            <input
              id="mtbCode"
              type="text"
              value={mtbCode}
              onChange={(e) => setMtbCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter MTB invitation code"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowJoinModal(false)}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinMTB}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
