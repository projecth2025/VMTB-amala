import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

const cancerTypes = [
  'Lung Adenocarcinoma',
  'Lung Squamous Cell Carcinoma',
  'Breast Cancer',
  'Colorectal Cancer',
  'Prostate Cancer',
  'Melanoma',
  'Pancreatic Cancer',
  'Gastric Cancer',
  'Ovarian Cancer',
  'Hepatocellular Carcinoma',
  'Renal Cell Carcinoma',
  'Glioblastoma',
  'Other',
];

export function NewCaseStep1() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    caseName: '',
    patientName: '',
    age: '',
    sex: '',
    cancerType: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('newCaseStep1', JSON.stringify(formData));
    navigate('/cases/new/step-2');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Case</h1>
          <p className="text-sm text-gray-600 mt-1">Step 1 of 2: Patient Information</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="caseName" className="block text-sm font-medium text-gray-700 mb-1">
                Case Name <span className="text-red-500">*</span>
              </label>
              <input
                id="caseName"
                type="text"
                value={formData.caseName}
                onChange={(e) => setFormData({ ...formData, caseName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Lung Cancer - EGFR Mutation"
                required
              />
            </div>

            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name (Optional)
              </label>
              <input
                id="patientName"
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for anonymous"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                  Sex <span className="text-red-500">*</span>
                </label>
                <select
                  id="sex"
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="cancerType" className="block text-sm font-medium text-gray-700 mb-1">
                Cancer Type <span className="text-red-500">*</span>
              </label>
              <select
                id="cancerType"
                value={formData.cancerType}
                onChange={(e) => setFormData({ ...formData, cancerType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select cancer type</option>
                {cancerTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/my-cases')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
