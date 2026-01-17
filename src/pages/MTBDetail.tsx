import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Eye, Copy, Check } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useCases, Case } from '../context/CasesContext';
import { supabase } from '../Supabase/client';
import { useAuth } from '../context/AuthContext';

export function MTBDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, mtbs, addCaseToMTB } = useCases();
  const { user } = useAuth();
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [mtbCases, setMtbCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewedSet, setReviewedSet] = useState<Set<string>>(new Set());
  const [opinionCounts, setOpinionCounts] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const mtb = mtbs.find((m) => m.id === id);
  const isOwner = mtb?.ownerId === user?.id;
  const availableCases = cases.filter((c) => !mtb?.cases.includes(c.id));

  const handleCopyCode = () => {
    if (mtb?.joinCode) {
      navigator.clipboard.writeText(mtb.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchMTBCases = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: mtbCaseIds } = await supabase.from('mtb_cases').select('case_id').eq('mtb_id', id);
        const caseIds = (mtbCaseIds || []).map(mc => mc.case_id);
        if (caseIds.length > 0) {
          const { data: casesData } = await supabase.from('cases').select('*').in('id', caseIds);
          setMtbCases((casesData || []).map(row => ({
            id: row.id,
            caseName: row.case_name,
            patientName: row.patient_name,
            age: row.patient_age,
            sex: row.patient_sex,
            cancerType: row.cancer_type,
            createdDate: row.created_at.split('T')[0],
            ownerId: row.owner_id,
          })));
          // Fetch stats: reviewed by user + opinions count
          setStatsLoading(true);
          try {
            if (user?.id) {
              const { data: userOpinions } = await supabase
                .from('case_opinions')
                .select('case_id')
                .eq('user_id', user.id)
                .in('case_id', caseIds);
              const s = new Set<string>();
              (userOpinions || []).forEach((row: any) => s.add(row.case_id));
              setReviewedSet(s);
            }

            const { data: opinions } = await supabase
              .from('case_opinions')
              .select('case_id, user_id')
              .in('case_id', caseIds);
            const counts: Record<string, number> = {};
            const usersPerCase: Record<string, Set<string>> = {};
            (opinions || []).forEach((row: any) => {
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
            console.error('Failed to fetch case stats', err);
          } finally {
            setStatsLoading(false);
          }
        } else {
          setMtbCases([]);
        }
      } catch (err) {
        console.error('Failed to fetch MTB cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMTBCases();
  }, [id, mtbs]);

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleAddCases = async () => {
    if (id) {
      for (const caseId of selectedCaseIds) {
        await addCaseToMTB(id, caseId);
      }
      setSelectedCaseIds([]);
      setShowAddCaseModal(false);
      // Refetch MTB cases
      const { data: mtbCaseIds } = await supabase.from('mtb_cases').select('case_id').eq('mtb_id', id);
      const caseIds = (mtbCaseIds || []).map(mc => mc.case_id);
      if (caseIds.length > 0) {
        const { data: casesData } = await supabase.from('cases').select('*').in('id', caseIds);
        setMtbCases((casesData || []).map(row => ({
          id: row.id,
          caseName: row.case_name,
          patientName: row.patient_name,
          age: row.age,
          sex: row.sex,
          cancerType: row.cancer_type,
          createdDate: row.created_at.split('T')[0],
          ownerId: row.owner_id,
        })));
      }
    }
  };

  if (!mtb) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">MTB not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout wide>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mtb.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{mtb.experts} experts participating</p>
            {isOwner && mtb.joinCode && (
              <div className="mt-3 flex items-center space-x-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 flex items-center space-x-2">
                  <span className="text-sm font-mono font-semibold text-blue-900">{mtb.joinCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="Copy join code"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-xs text-gray-500">Share this code to invite members</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddCaseModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Case</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Loading cases...</p>
          </div>
        ) : mtbCases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No cases shared in this MTB yet</p>
            <button
              onClick={() => setShowAddCaseModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first case
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Name
                  </th>
                  {isOwner && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cancer Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opinions Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mtbCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseItem.caseName}
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {caseItem.patientName || 'Anonymous'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {caseItem.age}Y, {caseItem.sex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {caseItem.cancerType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {statsLoading ? '…' : (opinionCounts[caseItem.id] || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {caseItem.ownerId === user?.id ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">YOU</span>
                      ) : reviewedSet.has(caseItem.id) ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Reviewed</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Not Reviewed</span>
                      )}
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
        )}
      </div>

      <Modal
        isOpen={showAddCaseModal}
        onClose={() => setShowAddCaseModal(false)}
        title="Add Cases to MTB"
      >
        <div className="space-y-4">
          {availableCases.length === 0 ? (
            <p className="text-sm text-gray-600">No cases available to add</p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableCases.map((caseItem) => (
                  <label
                    key={caseItem.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCaseIds.includes(caseItem.id)}
                      onChange={() => toggleCaseSelection(caseItem.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{caseItem.caseName}</p>
                      <p className="text-xs text-gray-500">
                        {caseItem.patientName || 'Anonymous'} - {caseItem.cancerType}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddCaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCases}
                  disabled={selectedCaseIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedCaseIds.length > 0 && `(${selectedCaseIds.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
