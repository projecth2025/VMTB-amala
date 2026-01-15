import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Document } from '../context/CasesContext';
import { supabase } from '../Supabase/client';

interface PendingFile {
  id: string;
  file: File;
  type: 'Clinical' | 'Text';
  name: string;
  size: string;
  mimeType?: string;
  rawText?: string;
}

export function NewCaseStep2() {
  const navigate = useNavigate();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT: Clear any old textFragments when entering Step 2
  // This ensures no stale data from previous case creation
  useEffect(() => {
    sessionStorage.removeItem('newCaseTextFragments');
    sessionStorage.removeItem('newCaseDocuments');
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Process all selected files
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

    // Add all new files to the list
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    event.target.value = ''; // Reset input to allow same file again
  };

  const handleSaveText = () => {
    if (!textContent.trim()) return;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new File([blob], `${textTitle || 'text_document'}.txt`, { type: 'text/plain' });
    
    const pendingFile: PendingFile = {
      id: Date.now().toString(),
      file,
      type: 'Text',
      name: textTitle || 'Text Document',
      size: `${(textContent.length / 1024).toFixed(2)} KB`,
      mimeType: 'text/plain',
      rawText: textContent,
    };
    setPendingFiles(prev => [...prev, pendingFile]);
    setTextContent('');
    setTextTitle('');
    setShowTextModal(false);
  };

  const removeDocument = (id: string) => {
    setPendingFiles(pendingFiles.filter(file => file.id !== id));
  };

  const handleNext = async () => {
    const textFragments = pendingFiles.map(f => f.rawText).filter(Boolean) as string[];

    if (pendingFiles.length === 0) {
      // No files uploaded - clear all data and start fresh
      sessionStorage.removeItem('newCaseDocuments');
      sessionStorage.removeItem('newCaseTextFragments');
      navigate('/cases/review');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      // Upload all files simultaneously using Promise.all
      const uploadPromises = pendingFiles.map(async (pending) => {
        const fileName = `${Date.now()}_${pending.file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(fileName, pending.file);
        
        if (uploadError) throw uploadError;
        
        return {
          id: pending.id,
          name: pending.name,
          size: pending.size,
          type: pending.type,
          storagePath: data.path,
          mimeType: pending.mimeType || pending.file.type,
        };
      });
      
      // Wait for all uploads to complete
      const uploadedDocuments = await Promise.all(uploadPromises);
      
      // Only set textFragments if there are actual fragments
      if (textFragments.length > 0) {
        sessionStorage.setItem('newCaseTextFragments', JSON.stringify(textFragments));
      } else {
        sessionStorage.removeItem('newCaseTextFragments');
      }
      sessionStorage.setItem('newCaseDocuments', JSON.stringify(uploadedDocuments));
      navigate('/cases/review');
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600 mt-2">Add clinical documents and relevant information</p>
        </div>

        <div className="space-y-6">
          {error && <div className="text-red-600 text-sm">{error}</div>}
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
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Next'}
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
