import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Document } from '../context/CasesContext';
import { useCases } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';
import { useCaseCreation } from '../context/CaseCreationContext';

export function ReviewCase() {
  const navigate = useNavigate();
  const { createCase, mtbs } = useCases();
  const { user } = useAuth();
  const { step1Data, pendingFiles, clearAll } = useCaseCreation();
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMtbIds, setSelectedMtbIds] = useState<string[]>([]);

  // Redirect if no step1 data
  if (!step1Data) {
    navigate('/cases/new/step-1');
    return null;
  }

  // Get text fragments from pending files (Text type)
  const textFragments = pendingFiles
    .filter(f => f.type === 'Text' && f.rawText)
    .map(f => f.rawText as string);
  
  // Get clinical documents from pending files
  const clinicalFiles = pendingFiles.filter(f => f.type === 'Clinical');

  const additionalData = useMemo(() => textFragments.join('\n\n').trim(), [textFragments]);

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
    files: typeof clinicalFiles;
    additionalData: string;
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
      if (params.additionalData) {
        formData.append('additional_data', params.additionalData);
      }
      
      // Add clinical documents from captured files (not from context)
      // Files are sent directly from user's browser - no Supabase download needed
      for (const pendingFile of params.files) {
        formData.append('files', pendingFile.file, pendingFile.name);
      }
      
      console.log('Sending files directly to backend for processing...');
      
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
    clearAll();
  };

  const handleCreateCase = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!step1Data || !user) {
        throw new Error('Missing required data. Please restart case creation.');
      }

      // Capture files BEFORE clearing context - these will be used for backend upload
      const filesToUpload = [...clinicalFiles];
      const additionalDataToSend = additionalData;

      // Convert pending files to Document format for metadata storage (no actual file upload to Supabase)
      const documentsMetadata: Document[] = pendingFiles.map(pf => ({
        id: pf.id,
        name: pf.name,
        size: pf.size,
        type: pf.type,
        storagePath: '', // No storage path since we're not uploading to Supabase
        mimeType: pf.mimeType,
      }));

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
        documentsMetadata,
        questions,
        selectedMtbIds,
      );

      // Clear context AFTER capturing files, but BEFORE async processing
      clearCaseDraft();
      
      // Upload files to backend - uses captured files, not context
      void triggerAsyncProcessing({ 
        caseId, 
        createdAt, 
        ownerId: user.id,
        files: filesToUpload,
        additionalData: additionalDataToSend,
      });

      // Redirect to My Cases page immediately after case creation
      navigate('/my-cases');
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
            {pendingFiles.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {pendingFiles.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        doc.type === 'Clinical'
                          ? 'bg-blue-100 text-blue-700'
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
    </Layout>
  );
}
