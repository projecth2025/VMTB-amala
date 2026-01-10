import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useCases } from '../context/CasesContext';
import { Document } from '../context/CasesContext';

export function ReviewCase() {
  const navigate = useNavigate();
  const { createCase } = useCases();
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const step1Data = sessionStorage.getItem('newCaseStep1');
    if (step1Data) {
      const data = JSON.parse(step1Data);
      const mockSummary = `A ${data.age}-year-old ${data.sex.toLowerCase()} patient diagnosed with ${data.cancerType}. Comprehensive NGS analysis has been performed to identify actionable molecular alterations. The patient has good performance status and is seeking expert recommendations for optimal treatment strategy.`;
      setSummary(mockSummary);
    }
  }, []);

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion]);
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateCase = async () => {
    setError(null);
    setLoading(true);
    try {
      const step1Data = JSON.parse(sessionStorage.getItem('newCaseStep1') || '{}');
      const documents: Document[] = JSON.parse(sessionStorage.getItem('newCaseDocuments') || '[]');

      await createCase(
        {
          caseName: step1Data.caseName,
          patientName: step1Data.patientName,
          age: parseInt(step1Data.age),
          sex: step1Data.sex,
          cancerType: step1Data.cancerType,
          summary,
          finalized: true,
        },
        documents,
        questions
      );
      sessionStorage.removeItem('newCaseStep1');
      sessionStorage.removeItem('newCaseDocuments');
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
          <h1 className="text-2xl font-bold text-gray-900">Review Case</h1>
          <p className="text-sm text-gray-600 mt-1">Review and finalize your case</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Case Summary</h3>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AI-generated summary will appear here..."
            />
            <p className="text-xs text-gray-500 mt-2">
              This summary is AI-generated based on uploaded documents. You can edit it as needed.
            </p>
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
