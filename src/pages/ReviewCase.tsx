import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Document } from '../context/CasesContext';
import { useCases } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../Supabase/client';

export function ReviewCase() {
  const navigate = useNavigate();
  const { createCase, mtbs } = useCases();
  const { user } = useAuth();
  const [step1Data, setStep1Data] = useState<{ caseName: string; patientName?: string; age: string; sex: string; cancerType: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [textFragments, setTextFragments] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMtbIds, setSelectedMtbIds] = useState<string[]>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  useEffect(() => {
    const step1Raw = sessionStorage.getItem('newCaseStep1');
    const docsRaw = sessionStorage.getItem('newCaseDocuments');
    const textRaw = sessionStorage.getItem('newCaseTextFragments');

    if (step1Raw) {
      try {
        setStep1Data(JSON.parse(step1Raw));
      } catch (_err) {
        setError('Unable to read patient details. Please restart case creation.');
      }
    } else {
      setError('Patient details missing. Please restart case creation.');
    }

    if (docsRaw) {
      try {
        setDocuments(JSON.parse(docsRaw));
      } catch (_err) {
        setDocuments([]);
      }
    }

    if (textRaw) {
      try {
        const parsed = JSON.parse(textRaw);
        // STRICT CHECK: Only use if it's a valid non-empty array with actual content
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(item => item && String(item).trim())) {
          setTextFragments(parsed);
        } else {
          setTextFragments([]);
        }
      } catch (_err) {
        setTextFragments([]);
      }
    } else {
      // Ensure no stale data from previous case
      setTextFragments([]);
    }
  }, []);

  // User can optionally share with MTBs - no auto-selection required

  const additionalData = useMemo(() => textFragments.join('\n\n').trim(), [textFragments]);

  useEffect(() => {
    if (!step1Data) return;
    if (!step1Data.caseName) {
      setError('Case name is missing. Please restart case creation.');
    }
  }, [step1Data]);

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion]);
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const toggleMtbSelection = (id: string) => {
    setSelectedMtbIds(prev =>
      prev.includes(id) ? prev.filter(mtbId => mtbId !== id) : [...prev, id]
    );
  };

  const triggerAsyncProcessing = async (params: {
    caseId: string;
    createdAt: string;
    ownerId: string;
  }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    try {
      // Build FormData to send files to backend
      const formData = new FormData();
      
      // Add case_id and user_id as form fields
      formData.append('case_id', params.caseId);
      formData.append('user_id', params.ownerId);
      
      // Add additional_data (doctor-written text) separately - NOT as a file
      // This will be sent directly to AI API without conversion
      if (additionalData) {
        formData.append('additional_data', additionalData);
      }
      
      // Add only clinical documents (uploaded files) - NOT text data
      // Text data is sent separately via additional_data
      for (const doc of documents) {
        if (doc.storagePath && doc.type === 'Clinical') {
          // Only process Clinical documents, skip Text type
          // Download file from Supabase storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('case-documents')
            .download(doc.storagePath);
          
          if (downloadError) {
            console.error(`Failed to download ${doc.name}:`, downloadError);
            continue;
          }
          
          // Create File object from blob
          const file = new File([fileData], doc.name, { type: doc.mimeType || 'application/octet-stream' });
          formData.append('files', file);
        }
      }
      
      console.log('Sending files to backend for processing...');
      
      const response = await fetch(`${backendUrl}/process-case`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Backend responded with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Backend processing started:', result);
      
    } catch (err) {
      console.error('Failed to trigger backend processing:', err);
      // Don't throw - case is already created, processing can be retried later
    }
  };

  const clearCaseDraft = () => {
    sessionStorage.removeItem('newCaseStep1');
    sessionStorage.removeItem('newCaseDocuments');
    sessionStorage.removeItem('newCaseTextFragments');
  };

  const handleCreateCase = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!step1Data || !user) {
        throw new Error('Missing required data. Please restart case creation.');
      }

      const { caseId, createdAt } = await createCase(
        {
          caseName: step1Data.caseName,
          patientName: step1Data.patientName,
          age: parseInt(step1Data.age, 10),
          sex: step1Data.sex,
          cancerType: step1Data.cancerType,
          summary: null,
          finalized: false,
          processing: true,
        },
        documents,
        questions,
        selectedMtbIds,
      );

      setCreatedCaseId(caseId);
      setShowProcessingModal(true);
      clearCaseDraft();
      void triggerAsyncProcessing({ caseId, createdAt, ownerId: user.id });
    } catch (err: any) {
      setError(err?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Review & Create Case</h1>
          <p className="text-sm text-gray-600 mt-1">We will create the case now and process documents asynchronously.</p>
        </div>

        <div className="space-y-6">
          {step1Data && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Patient & Case Details</h3>
                  <p className="text-sm text-gray-600">Confirm the basic information before creating the case.</p>
                </div>
                <div className="flex items-center text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Summary will be generated after processing.
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Case Name</p>
                  <p className="font-medium text-gray-900">{step1Data.caseName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Patient Name</p>
                  <p className="font-medium text-gray-900">{step1Data.patientName || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Age / Sex</p>
                  <p className="font-medium text-gray-900">{step1Data.age} / {step1Data.sex}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cancer Type</p>
                  <p className="font-medium text-gray-900">{step1Data.cancerType}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              <button
                onClick={() => navigate('/cases/new/step-2')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Edit uploads
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        doc.type === 'Clinical'
                          ? 'bg-blue-100 text-blue-700'
                          : doc.type === 'NGS'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {doc.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notes & Text Content</h3>
              <p className="text-xs text-gray-500">These notes will be sent to backend as additional data.</p>
            </div>
            {textFragments.length === 0 ? (
              <p className="text-sm text-gray-500">No text notes captured.</p>
            ) : (
              <div className="space-y-3">
                {textFragments.map((text, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Note {idx + 1}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-4">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Questions</h3>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-md"
                >
                  <p className="text-sm text-gray-900 flex-1">{question}</p>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                  placeholder="Add a question for the board..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addQuestion}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Share with MTBs</h3>
              <p className="text-xs text-gray-500">(Optional - Leave empty to not share)</p>
            </div>
            {mtbs.length === 0 ? (
              <p className="text-sm text-gray-500">You are not part of any MTBs yet.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {mtbs.map(mtb => (
                    <label key={mtb.id} className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={selectedMtbIds.includes(mtb.id)}
                        onChange={() => toggleMtbSelection(mtb.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{mtb.name}</p>
                        <p className="text-xs text-gray-500">{mtb.experts} experts · {mtb.cases.length} cases</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedMtbIds.length === 0 && (
                  <p className="text-xs text-gray-500 mt-3">ℹ️ No MTBs selected - case will be private</p>
                )}
              </>
            )}
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => navigate('/cases/new/step-2')}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleCreateCase}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showProcessingModal}
        onClose={() => {
          setShowProcessingModal(false);
          navigate('/my-cases');
        }}
        title="Case Created Successfully"
      >
        <div className="space-y-4">
          <div className="flex items-center text-green-700">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <p className="font-medium">Your case has been created</p>
          </div>
          <p className="text-sm text-gray-700">
            Your case is being processed. This may take up to 5 minutes.
            Please refresh the page later to see the summary.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>Files are being sent to AI processing</li>
              <li>Summary will be generated automatically</li>
              <li>You can view your case in "My Cases" anytime</li>
              <li>Refresh the case page after 5 minutes to see results</li>
            </ul>
          </div>
          {createdCaseId && (
            <p className="text-xs text-gray-500">Case ID: {createdCaseId}</p>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowProcessingModal(false);
                navigate('/my-cases');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to My Cases
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
