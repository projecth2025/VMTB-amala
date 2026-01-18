import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases, Case, Opinion } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../Supabase/client';

type TabType = 'summary' | 'reports' | 'opinions' | 'result';

export function ViewCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCaseById, updateCase, addOpinion, updateOpinion, deleteCase } = useCases();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [newOpinion, setNewOpinion] = useState('');
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingOpinionId, setEditingOpinionId] = useState<string | null>(null);
  const [editingOpinionText, setEditingOpinionText] = useState('');
  const [editingTreatment, setEditingTreatment] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  
  // Refs for synchronized scrolling
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef<'editor' | 'preview' | null>(null);

  // Synchronized scroll handler
  const handleEditorScroll = useCallback(() => {
    if (isScrolling.current === 'preview') return;
    isScrolling.current = 'editor';
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    
    const editorScrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = editorScrollRatio * (preview.scrollHeight - preview.clientHeight);
    
    setTimeout(() => { isScrolling.current = null; }, 50);
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (isScrolling.current === 'editor') return;
    isScrolling.current = 'preview';
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    
    const previewScrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    editor.scrollTop = previewScrollRatio * (editor.scrollHeight - editor.clientHeight);
    
    setTimeout(() => { isScrolling.current = null; }, 50);
  }, []);

  const isOwner = caseData?.ownerId === user?.id;
  const viewMode = isOwner ? 'owner' : 'visitor';
  
  // Check if current user has already submitted an opinion
  const userOpinion = caseData?.opinions?.find(o => o.authorUserId === user?.id);
  const isProcessingSummary = caseData?.summary === null || caseData?.summary === undefined;

  useEffect(() => {
    const fetchCase = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCaseById(id);
        setCaseData(data);
        setSummaryDraft(data?.summary || '');
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

  const handleSaveSummary = async () => {
    if (!id || !isOwner) return;
    setSavingSummary(true);
    try {
      await updateCase(id, { summary: summaryDraft });
      const data = await getCaseById(id!);
      setCaseData(data);
      setSummaryDraft(data?.summary || '');
    } catch (err) {
      console.error('Failed to save summary:', err);
    } finally {
      setSavingSummary(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!id || !isOwner) return;
    setDeleting(true);
    try {
      await deleteCase(id);
      navigate('/my-cases');
    } catch (err) {
      console.error('Failed to delete case:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Check if viewing from MTB context (hide patient name)
  const fromMTB = searchParams.get('from') === 'mtb';

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
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{caseData.caseName}</h1>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm ${isOwner ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {isOwner ? 'You' : 'Visitor'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${isProcessingSummary ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              {isProcessingSummary ? 'Processing' : 'Summary Ready'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(['summary', 'opinions', 'result'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'summary' ? 'Case Summary' : 
                 tab === 'reports' ? 'Reports' :
                 tab === 'opinions' ? 'Opinions' : 'Result'}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* === CASE SUMMARY TAB === */}
          {activeTab === 'summary' && (
            <>
              {/* Patient Information - hide patient name if from MTB */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {!fromMTB && (
                    <div>
                      <span className="text-gray-600">Patient Name:</span>{' '}
                      <span className="font-medium">{caseData.patientName || 'Anonymous'}</span>
                    </div>
                  )}
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

          {/* {caseData.documents && caseData.documents.length > 0 && (
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
          )} */}

              {/* Case Summary Section */}
              <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Case Summary</h3>
              <div className="flex items-center space-x-2">
                {isProcessingSummary && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Processing</span>
                )}
                {!isProcessingSummary && isOwner && !editingSummary && (
                  <button
                    onClick={() => {
                      setSummaryDraft(caseData.summary || '');
                      setEditingSummary(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {isProcessingSummary ? (
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    ⏳ Summary is being generated
                  </p>
                  <p className="text-sm text-yellow-700">
                    This may take up to 5 minutes. Please refresh the page after some time to see the summary.
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh Page
                </button>
              </div>
            ) : editingSummary ? (
              <div className="space-y-4">
                {/* Editor and Preview side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Markdown Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edit (Markdown)</label>
                    <textarea
                      ref={editorRef}
                      value={summaryDraft}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      onScroll={handleEditorScroll}
                      className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter markdown content..."
                    />
                  </div>
                  {/* Live Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                    <div
                      ref={previewRef}
                      onScroll={handlePreviewScroll}
                      className="h-96 overflow-y-auto bg-gray-50 p-4 rounded-md border border-gray-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-3 mt-4 first:mt-0" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-2 mt-3 first:mt-0" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mb-2 mt-3 first:mt-0" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-base font-bold text-gray-900 mb-1 mt-2 first:mt-0" {...props} />,
                          p: ({node, ...props}) => <p className="text-gray-800 mb-3 leading-relaxed text-sm" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 text-gray-800 mb-3 space-y-1 text-sm" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 text-gray-800 mb-3 space-y-1 text-sm" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-800" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />,
                        }}
                      >
                        {summaryDraft || 'Start typing to see preview...'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      setSavingSummary(true);
                      try {
                        await updateCase(id!, { summary: summaryDraft });
                        const data = await getCaseById(id!);
                        setCaseData(data);
                        setEditingSummary(false);
                      } catch (err) {
                        console.error('Failed to save summary:', err);
                      } finally {
                        setSavingSummary(false);
                      }
                    }}
                    disabled={savingSummary}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSummary ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setSummaryDraft(caseData.summary || '');
                      setEditingSummary(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6 first:mt-0" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-5 first:mt-0" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4 first:mt-0" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-bold text-gray-900 mb-2 mt-3 first:mt-0" {...props} />,
                    p: ({node, ...props}) => <p className="text-gray-800 mb-4 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 text-gray-800 mb-4 space-y-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 text-gray-800 mb-4 space-y-2" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-800" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? 
                        <code className="bg-gray-300 px-2 py-1 rounded text-sm font-mono text-gray-900" {...props} /> :
                        <code className="block bg-gray-900 text-gray-100 p-4 rounded-md mb-4 overflow-x-auto font-mono text-sm" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-md mb-4 overflow-x-auto" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4 py-2" {...props} />,
                    table: ({node, ...props}) => <table className="border-collapse border border-gray-400 mb-4 w-full" {...props} />,
                    thead: ({node, ...props}) => <thead className="bg-gray-200" {...props} />,
                    tbody: ({node, ...props}) => <tbody {...props} />,
                    th: ({node, ...props}) => <th className="border border-gray-400 px-4 py-2 text-gray-900 font-bold text-left" {...props} />,
                    td: ({node, ...props}) => <td className="border border-gray-400 px-4 py-2 text-gray-800" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                  }}
                >
                  {caseData.summary || 'No summary yet...'}
                </ReactMarkdown>
              </div>
            )}
          </div>

              {/* Delete Case Button - Owner Only */}
              {isOwner && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete this case and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Case</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* === REPORTS TAB === */}
          {activeTab === 'reports' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Reports</h3>
                {caseData.documents && caseData.documents.length > 0 ? (
                  <div className="space-y-2">
                    {caseData.documents.filter(d => d.type === 'Clinical').map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No reports uploaded.</p>
                )}
              </div>

              {/* Doctor Written Notes - Show Full Content */}
              {caseData.documents && caseData.documents.filter(d => d.type === 'Text').length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Doctor Notes</h3>
                  <div className="space-y-4">
                    {caseData.documents.filter(d => d.type === 'Text').map((doc) => (
                      <div key={doc.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-2">{doc.name}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {/* Note: For text documents, the content would need to be stored/fetched separately */}
                          Document content available in case summary.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* === OPINIONS TAB === */}
          {activeTab === 'opinions' && (
            <>
              {/* Questions */}
              {caseData.questions && caseData.questions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Questions from Case Owner</h3>
                  <div className="space-y-2">
                    {caseData.questions.map((question, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-md">
                        <span className="text-blue-600 font-medium">{index + 1}.</span>
                        <p className="text-sm text-gray-700">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Opinions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Opinions</h3>
                {caseData.opinions && caseData.opinions.length > 0 ? (
                  <div className="space-y-4">
                    {caseData.opinions.map((opinion) => (
                      <div
                        key={opinion.id}
                        onClick={() => setSelectedOpinion(opinion)}
                        className="p-4 border border-gray-200 rounded-md hover:border-blue-500 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">{opinion.author}</span>
                          </div>
                          <p className="text-xs text-gray-500">{opinion.date}</p>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{opinion.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No opinions submitted yet</p>
                )}
              </div>

              {/* Submit Opinion - Visitors Only */}
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
            </>
          )}

          {/* === RESULT TAB === */}
          {activeTab === 'result' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Plan Adopted</h3>
                {isOwner ? (
                  editingTreatment || !caseData.treatmentPlan ? (
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
                  )
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {caseData.treatmentPlan || 'No treatment plan documented yet.'}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-Ups</h3>
                {isOwner ? (
                  editingFollowUp || !caseData.followUp ? (
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
                  )
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {caseData.followUp || 'No follow-up notes documented yet.'}
                  </p>
                )}
              </div>
            </>
          )}

        </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Case"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            This case will be permanently deleted and cannot be recovered. All associated documents, opinions, and questions will also be removed.
          </p>
          <p className="text-sm font-medium text-gray-900">Do you want to continue?</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCase}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Case'}
            </button>
          </div>
        </div>
      </Modal>

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
