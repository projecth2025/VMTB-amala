import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, MessageSquare, Edit2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases, Case, Opinion } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';

export function ViewCase() {
  const { id } = useParams();
  const { getCaseById, updateCase, addOpinion, updateOpinion } = useCases();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [newOpinion, setNewOpinion] = useState('');
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingOpinionId, setEditingOpinionId] = useState<string | null>(null);
  const [editingOpinionText, setEditingOpinionText] = useState('');
  const [editingTreatment, setEditingTreatment] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(false);

  const isOwner = caseData?.ownerId === user?.id;
  const viewMode = isOwner ? 'owner' : 'visitor';
  
  // Check if current user has already submitted an opinion
  const userOpinion = caseData?.opinions?.find(o => o.authorUserId === user?.id);

  useEffect(() => {
    const fetchCase = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCaseById(id);
        setCaseData(data);
        setTreatmentPlan(data?.treatmentPlan || '');
        setFollowUp(data?.followUp || '');
        // If user already has opinion, set it for potential editing
        const userOp = data?.opinions?.find(o => o.authorUserId === user?.id);
        if (userOp) {
          setNewOpinion(userOp.content);
        }
      } catch (err) {
        console.error('Failed to fetch case:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [id, user?.id, getCaseById]);

  const handleSaveTreatment = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateCase(id, { treatmentPlan });
      setEditingTreatment(false);
      // Refetch case
      const data = await getCaseById(id!);
      setCaseData(data);
    } catch (err) {
      console.error('Failed to save treatment plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateCase(id, { followUp });
      setEditingFollowUp(false);
      // Refetch case
      const data = await getCaseById(id!);
      setCaseData(data);
    } catch (err) {
      console.error('Failed to save follow-up:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOpinion = async () => {
    if (!newOpinion.trim() || !id) return;
    setSubmitting(true);
    try {
      if (userOpinion) {
        // Update existing opinion
        await updateOpinion(userOpinion.id, newOpinion);
      } else {
        // Add new opinion
        await addOpinion(id, newOpinion);
      }
      setNewOpinion('');
      // Refetch case to show updated opinion
      const data = await getCaseById(id!);
      setCaseData(data);
    } catch (err) {
      console.error('Failed to submit opinion:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading case...</p>
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Case not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full flex justify-center">
        <div className="w-[80vw]">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{caseData.caseName}</h1>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm ${isOwner ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {isOwner ? 'Owner' : 'Visitor'}
            </span>
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
              {userOpinion ? (
                <>
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 font-medium">You have already given your opinion</p>
                  </div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{userOpinion.content}</p>
                    <p className="text-xs text-gray-500 mt-2">Submitted on {userOpinion.date}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingOpinionId(userOpinion.id);
                      setEditingOpinionText(userOpinion.content);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Opinion</span>
                  </button>
                </>
              ) : (
                <>
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
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Opinion'}
                  </button>
                </>
              )}
            </div>
          )}

          {viewMode === 'owner' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Plan Adopted</h3>
                {editingTreatment || !caseData.treatmentPlan ? (
                  <>
                    <textarea
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      placeholder="Document the treatment plan you've decided to adopt..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveTreatment}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                      {caseData.treatmentPlan && (
                        <button
                          onClick={() => {
                            setTreatmentPlan(caseData.treatmentPlan || '');
                            setEditingTreatment(false);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{caseData.treatmentPlan}</p>
                    <button
                      onClick={() => setEditingTreatment(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-Up</h3>
                {editingFollowUp || !caseData.followUp ? (
                  <>
                    <textarea
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      placeholder="Add follow-up notes, patient progress, treatment response..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveFollowUp}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                      {caseData.followUp && (
                        <button
                          onClick={() => {
                            setFollowUp(caseData.followUp || '');
                            setEditingFollowUp(false);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{caseData.followUp}</p>
                    <button
                      onClick={() => setEditingFollowUp(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
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

      <Modal
        isOpen={!!editingOpinionId}
        onClose={() => {
          setEditingOpinionId(null);
          setEditingOpinionText('');
        }}
        title="Edit Your Opinion"
      >
        <div className="space-y-4">
          <textarea
            value={editingOpinionText}
            onChange={(e) => setEditingOpinionText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Update your opinion..."
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setEditingOpinionId(null);
                setEditingOpinionText('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!editingOpinionId || !editingOpinionText.trim()) return;
                setSubmitting(true);
                try {
                  await updateOpinion(editingOpinionId, editingOpinionText);
                  setEditingOpinionId(null);
                  setEditingOpinionText('');
                  // Refetch case
                  const data = await getCaseById(id!);
                  setCaseData(data);
                } catch (err) {
                  console.error('Failed to update opinion:', err);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
