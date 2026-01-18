import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCaseCreation, PendingFile } from '../context/CaseCreationContext';

export function NewCaseStep2() {
  const navigate = useNavigate();
  const { pendingFiles, addFiles, removeFile, step1Data } = useCaseCreation();
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect to step 1 if no step1 data
  if (!step1Data) {
    navigate('/cases/new/step-1');
    return null;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setError(null);
    const newPendingFiles: PendingFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let rawText: string | undefined;
      if (file.type === 'text/plain') {
        try {
          rawText = await file.text();
        } catch (_err) {
          // Ignore text extraction failure; continue upload
        }
      }
      
      const pendingFile: PendingFile = {
        id: `${Date.now()}_${i}`,
        file,
        type: 'Clinical',
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        mimeType: file.type,
        rawText,
      };

      newPendingFiles.push(pendingFile);
    }

    // Add files with duplicate check
    const result = addFiles(newPendingFiles);
    if (!result.success) {
      setError(`File(s) with the same name already uploaded: ${result.duplicates.join(', ')}`);
    }
    
    event.target.value = ''; // Reset input to allow same file again
  };

  const handleSaveText = () => {
    if (!textContent.trim()) return;
    
    const fileName = `${textTitle || 'text_document'}.txt`;
    
    // Check for duplicate
    const existingNames = new Set(pendingFiles.map(f => f.name.toLowerCase()));
    if (existingNames.has(fileName.toLowerCase())) {
      setError(`File with name "${fileName}" already exists. Please use a different title.`);
      return;
    }
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new File([blob], fileName, { type: 'text/plain' });
    
    const pendingFile: PendingFile = {
      id: Date.now().toString(),
      file,
      type: 'Text',
      name: textTitle || 'Text Document',
      size: `${(textContent.length / 1024).toFixed(2)} KB`,
      mimeType: 'text/plain',
      rawText: textContent,
    };
    
    addFiles([pendingFile]);
    setTextContent('');
    setTextTitle('');
    setShowTextModal(false);
    setError(null);
  };

  const handleNext = () => {
    navigate('/cases/review');
  };

  const handleBack = () => {
    // Mark that we're going back to step 1
    sessionStorage.setItem('fromStep2', 'true');
    navigate('/cases/new/step-1');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600 mt-2">Add clinical documents and relevant information</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <label className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="*" />
              <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Upload Clinical Data</h3>
              <p className="text-xs text-gray-500">Any file type</p>
            </label>

            <button
              onClick={() => setShowTextModal(true)}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Write Relevant Data</h3>
              <p className="text-xs text-gray-500">Add text-based information</p>
            </button>
          </div>

          {pendingFiles.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Files Ready to Upload ({pendingFiles.length})</h3>
              <div className="space-y-2">
                {pendingFiles.map((doc) => (
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
                          doc.type === 'Clinical'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {doc.type}
                      </span>
                      <button
                        onClick={() => removeFile(doc.id)}
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
              onClick={handleBack}
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
