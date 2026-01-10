import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases } from '../context/CasesContext';

export function MTBDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, mtbs, addCaseToMTB } = useCases();
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  const mtb = mtbs.find((m) => m.id === id);
  const mtbCases = cases.filter((c) => mtb?.cases.includes(c.id));
  const availableCases = cases.filter((c) => !mtb?.cases.includes(c.id));

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleAddCases = () => {
    if (id) {
      selectedCaseIds.forEach((caseId) => {
        addCaseToMTB(id, caseId);
      });
      setSelectedCaseIds([]);
      setShowAddCaseModal(false);
    }
  };

  if (!mtb) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">MTB not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mtb.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{mtb.experts} experts participating</p>
          </div>
          <button
            onClick={() => setShowAddCaseModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Case</span>
          </button>
        </div>

        {mtbCases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No cases shared in this MTB yet</p>
            <button
              onClick={() => setShowAddCaseModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first case
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cancer Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mtbCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseItem.caseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {caseItem.patientName || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {caseItem.age}Y, {caseItem.sex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {caseItem.cancerType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {caseItem.createdDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/case/${caseItem.id}`)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddCaseModal}
        onClose={() => setShowAddCaseModal(false)}
        title="Add Cases to MTB"
      >
        <div className="space-y-4">
          {availableCases.length === 0 ? (
            <p className="text-sm text-gray-600">No cases available to add</p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableCases.map((caseItem) => (
                  <label
                    key={caseItem.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCaseIds.includes(caseItem.id)}
                      onChange={() => toggleCaseSelection(caseItem.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{caseItem.caseName}</p>
                      <p className="text-xs text-gray-500">
                        {caseItem.patientName || 'Anonymous'} - {caseItem.cancerType}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddCaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCases}
                  disabled={selectedCaseIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedCaseIds.length > 0 && `(${selectedCaseIds.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
