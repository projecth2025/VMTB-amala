import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useCases } from '../context/CasesContext';
import { supabase } from '../Supabase/client';

export function MyCases() {
  const navigate = useNavigate();
  const { cases, loading } = useCases();
  const [opinionCounts, setOpinionCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  // Fetch opinions count for listed cases
  useEffect(() => {
    const fetchOpinionCounts = async () => {
      if (!cases || cases.length === 0) {
        setOpinionCounts({});
        return;
      }
      try {
        setCountsLoading(true);
        const caseIds = cases.map(c => c.id);
        const { data } = await supabase
          .from('case_opinions')
          .select('case_id, user_id')
          .in('case_id', caseIds);
        const counts: Record<string, number> = {};
        const usersPerCase: Record<string, Set<string>> = {};
        (data || []).forEach((row: any) => {
          const cid = row.case_id as string;
          const uid = row.user_id as string;
          if (!usersPerCase[cid]) usersPerCase[cid] = new Set<string>();
          usersPerCase[cid].add(uid);
        });
        Object.keys(usersPerCase).forEach(cid => {
          counts[cid] = usersPerCase[cid].size;
        });
        setOpinionCounts(counts);
      } catch (err) {
        console.error('Failed to fetch opinion counts', err);
      } finally {
        setCountsLoading(false);
      }
    };
    fetchOpinionCounts();
  }, [cases]);

  return (
    <Layout wide>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
          <button
            onClick={() => navigate('/cases/new/step-1')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Case</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancer Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summary Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opinions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading cases...</td></tr>
              ) : cases.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No cases yet. Create your first case!</td></tr>
              ) : cases.map((caseItem) => (
                <tr key={caseItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {caseItem.caseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {caseItem.patientName || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {caseItem.age}Y, {caseItem.sex}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {caseItem.cancerType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      caseItem.summary === 'Case creation failed'
                        ? 'bg-red-100 text-red-700'
                        : caseItem.summary === null || caseItem.summary === undefined || caseItem.processing
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {caseItem.summary === 'Case creation failed'
                        ? 'Failed'
                        : caseItem.summary === null || caseItem.summary === undefined || caseItem.processing
                        ? 'Processing'
                        : 'Ready'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {countsLoading ? '…' : (opinionCounts[caseItem.id] || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {caseItem.createdDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/case/${caseItem.id}`)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
