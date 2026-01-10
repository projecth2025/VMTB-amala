import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FileText } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases } from '../context/CasesContext';

export function MTBs() {
  const navigate = useNavigate();
  const { mtbs, addMTB } = useCases();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [mtbName, setMtbName] = useState('');
  const [mtbCode, setMtbCode] = useState('');

  const handleCreateMTB = () => {
    if (mtbName.trim()) {
      const newMTB = {
        id: Date.now().toString(),
        name: mtbName,
        experts: 1,
        cases: [],
      };
      addMTB(newMTB);
      setMtbName('');
      setShowCreateModal(false);
    }
  };

  const handleJoinMTB = () => {
    if (mtbCode.trim()) {
      const mockMTB = {
        id: Date.now().toString(),
        name: 'Joined MTB',
        experts: 15,
        cases: [],
      };
      addMTB(mockMTB);
      setMtbCode('');
      setShowJoinModal(false);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mtbs.map((mtb) => (
            <div
              key={mtb.id}
              onClick={() => navigate(`/mtb/${mtb.id}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{mtb.name}</h3>
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
          ))}
        </div>
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
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMTB}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create
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
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowJoinModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinMTB}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
