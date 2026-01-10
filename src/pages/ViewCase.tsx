import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, MessageSquare } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases, Opinion } from '../context/CasesContext';

export function ViewCase() {
  const { id } = useParams();
  const { cases, updateCase, addOpinion } = useCases();
  const [viewMode, setViewMode] = useState<'owner' | 'visitor'>('owner');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [newOpinion, setNewOpinion] = useState('');
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);

  const caseData = cases.find((c) => c.id === id);

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Case not found</p>
        </div>
      </Layout>
    );
  }

  const handleSaveTreatment = () => {
    if (id) {
      updateCase(id, { treatmentPlan });
    }
  };

  const handleSaveFollowUp = () => {
    if (id) {
      updateCase(id, { followUp });
    }
  };

  const handleSubmitOpinion = () => {
    if (newOpinion.trim() && id) {
      const opinion: Opinion = {
        id: Date.now().toString(),
        author: 'Dr. Current User',
        content: newOpinion,
        date: new Date().toISOString().split('T')[0],
      };
      addOpinion(id, opinion);
      setNewOpinion('');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{caseData.caseName}</h1>
          <div className="flex space-x-2 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('owner')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'owner'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Owner View
            </button>
            <button
              onClick={() => setViewMode('visitor')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'visitor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Visitor View
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Patient Name:</span>{' '}
                <span className="font-medium">{caseData.patientName || 'Anonymous'}</span>
              </div>
              <div>
                <span className="text-gray-600">Age:</span>{' '}
                <span className="font-medium">{caseData.age} years</span>
              </div>
              <div>
                <span className="text-gray-600">Sex:</span>{' '}
                <span className="font-medium">{caseData.sex}</span>
              </div>
              <div>
                <span className="text-gray-600">Cancer Type:</span>{' '}
                <span className="font-medium">{caseData.cancerType}</span>
              </div>
            </div>
          </div>

          {caseData.documents && caseData.documents.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
              <div className="space-y-2">
                {caseData.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        doc.type === 'NGS'
                          ? 'bg-green-100 text-green-700'
                          : doc.type === 'Clinical'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {doc.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Case Summary</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.summary}</p>
          </div>

          {caseData.questions && caseData.questions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Questions</h3>
              <div className="space-y-2">
                {caseData.questions.map((question, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 font-medium">{index + 1}.</span>
                    <p className="text-sm text-gray-700">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Opinions</h3>
            {caseData.opinions && caseData.opinions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseData.opinions.map((opinion) => (
                  <div
                    key={opinion.id}
                    onClick={() => setSelectedOpinion(opinion)}
                    className="p-4 border border-gray-200 rounded-md hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{opinion.author}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{opinion.date}</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{opinion.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No opinions submitted yet</p>
            )}
          </div>

          {viewMode === 'visitor' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Your Opinion</h3>
              <textarea
                value={newOpinion}
                onChange={(e) => setNewOpinion(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Share your expert opinion on this case..."
              />
              <button
                onClick={handleSubmitOpinion}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Opinion
              </button>
            </div>
          )}

          {viewMode === 'owner' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Plan Adopted</h3>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  placeholder="Document the treatment plan you've decided to adopt..."
                />
                <button
                  onClick={handleSaveTreatment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-Up</h3>
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  placeholder="Add follow-up notes, patient progress, treatment response..."
                />
                <button
                  onClick={handleSaveFollowUp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedOpinion}
        onClose={() => setSelectedOpinion(null)}
        title="Opinion Details"
      >
        {selectedOpinion && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedOpinion.author}</p>
              <p className="text-xs text-gray-500">{selectedOpinion.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedOpinion.content}</p>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
