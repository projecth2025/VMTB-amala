import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Plus, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Document } from '../context/CasesContext';

export function NewCaseStep2() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');

  const handleFileUpload = (type: 'NGS' | 'Clinical') => {
    const mockFile: Document = {
      id: Date.now().toString(),
      name: `${type}_Document_${Date.now()}.pdf`,
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      type,
    };
    setDocuments([...documents, mockFile]);
  };

  const handleSaveText = () => {
    const textDoc: Document = {
      id: Date.now().toString(),
      name: textTitle || 'Text Document',
      size: `${(textContent.length / 1024).toFixed(1)} KB`,
      type: 'Text',
    };
    setDocuments([...documents, textDoc]);
    setTextContent('');
    setTextTitle('');
    setShowTextModal(false);
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleNext = () => {
    sessionStorage.setItem('newCaseDocuments', JSON.stringify(documents));
    navigate('/cases/review');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Case</h1>
          <p className="text-sm text-gray-600 mt-1">Step 2 of 2: Documents</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleFileUpload('NGS')}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Upload NGS Data</h3>
              <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
            </button>

            <button
              onClick={() => handleFileUpload('Clinical')}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Upload Other Documents</h3>
              <p className="text-xs text-gray-500">Clinical reports, images, etc.</p>
            </button>

            <button
              onClick={() => setShowTextModal(true)}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Write Your Document</h3>
              <p className="text-xs text-gray-500">Add text-based information</p>
            </button>
          </div>

          {documents.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => navigate('/cases/new/step-1')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        title="Write Your Document"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="textTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Document Title
            </label>
            <input
              id="textTitle"
              type="text"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Clinical Notes"
            />
          </div>
          <div>
            <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="textContent"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your document content here..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowTextModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveText}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
