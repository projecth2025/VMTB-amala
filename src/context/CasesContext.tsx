import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../Supabase/client';
import { useAuth } from './AuthContext';

export interface Case {
  id: string;
  caseName: string;
  patientName?: string;
  age: number;
  sex: string;
  cancerType: string;
  createdDate: string;
  summary?: string;
  questions?: string[];
  opinions?: Opinion[];
  documents?: Document[];
  treatmentPlan?: string;
  followUp?: string;
  finalized?: boolean;
  ownerId?: string;
}

export interface Opinion {
  id: string;
  author: string;
  authorUserId: string;
  content: string;
  date: string;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  type: 'NGS' | 'Clinical' | 'Text';
  storagePath?: string;
}

export interface MTB {
  id: string;
  name: string;
  experts: number;
  cases: string[];
  ownerId?: string;
  joinCode?: string;
}

interface CasesContextType {
  cases: Case[];
  mtbs: MTB[];
  loading: boolean;
  refetchCases: () => Promise<void>;
  refetchMTBs: () => Promise<void>;
  createCase: (caseData: Omit<Case, 'id' | 'createdDate' | 'ownerId'>, documents: Document[], questions: string[]) => Promise<string>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  createMTB: (name: string) => Promise<void>;
  joinMTB: (joinCode: string) => Promise<void>;
  addCaseToMTB: (mtbId: string, caseId: string) => Promise<void>;
  addOpinion: (caseId: string, content: string) => Promise<void>;
  updateOpinion: (opinionId: string, content: string) => Promise<void>;
  getCaseById: (id: string) => Promise<Case | null>;
}

const CasesContext = createContext<CasesContextType | undefined>(undefined);

export function CasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [mtbs, setMTBs] = useState<MTB[]>([]);
  const [loading, setLoading] = useState(false);

  const refetchCases = async () => {
    if (!user) { setCases([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCases((data || []).map(row => ({
        id: row.id,
        caseName: row.case_name,
        patientName: row.patient_name,
        age: row.patient_age,
        sex: row.patient_sex,
        cancerType: row.cancer_type,
        createdDate: row.created_at.split('T')[0],
        summary: row.summary,
        treatmentPlan: row.treatment_plan,
        followUp: row.follow_up,
        finalized: row.finalized,
        ownerId: row.owner_id,
      })));
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetchMTBs = async () => {
    if (!user) { setMTBs([]); return; }
    setLoading(true);
    try {
      // Fetch MTBs where user is owner
      const { data: ownedMTBs, error: ownedError } = await supabase
        .from('mtbs')
        .select('*')
        .eq('owner_id', user.id);
      if (ownedError) throw ownedError;

      // Fetch MTBs where user is a member
      const { data: memberMTBs, error: memberError } = await supabase
        .from('mtb_members')
        .select('mtb_id')
        .eq('user_id', user.id);
      if (memberError) throw memberError;

      const memberMtbIds = (memberMTBs || []).map(m => m.mtb_id);
      let joinedMTBs: any[] = [];
      if (memberMtbIds.length > 0) {
        const { data, error } = await supabase.from('mtbs').select('*').in('id', memberMtbIds);
        if (error) throw error;
        joinedMTBs = data || [];
      }

      // Merge and deduplicate
      const allMTBs = [...(ownedMTBs || []), ...joinedMTBs];
      const uniqueMTBs = Array.from(new Map(allMTBs.map(m => [m.id, m])).values());

      // For each MTB, count members and cases
      const mtbsWithCounts = await Promise.all(uniqueMTBs.map(async (mtb) => {
        const { count: memberCount } = await supabase.from('mtb_members').select('*', { count: 'exact', head: true }).eq('mtb_id', mtb.id);
        const { data: mtbCases } = await supabase.from('mtb_cases').select('case_id').eq('mtb_id', mtb.id);
        return {
          id: mtb.id,
          name: mtb.name,
          experts: (memberCount || 0) + 1,
          cases: (mtbCases || []).map(c => c.case_id),
          ownerId: mtb.owner_id,
          joinCode: mtb.join_code,
        };
      }));

      setMTBs(mtbsWithCounts);
    } catch (err) {
      console.error('Failed to fetch MTBs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refetchCases();
      refetchMTBs();
    }
  }, [user]);

  const createCase = async (
    caseData: Omit<Case, 'id' | 'createdDate' | 'ownerId'>,
    documents: Document[],
    questions: string[]
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('cases')
      .insert({
        owner_id: user.id,
        case_name: caseData.caseName,
        patient_name: caseData.patientName,
        patient_age: caseData.age,
        patient_sex: caseData.sex,
        cancer_type: caseData.cancerType,
        summary: caseData.summary,
        finalized: caseData.finalized || false,
      })
      .select()
      .single();
    if (error) throw error;

    const caseId = data.id;

    // Insert documents
    if (documents.length > 0) {
      const docsToInsert = documents.map(doc => ({
        case_id: caseId,
        type: doc.type,
        file_name: doc.name,
        size: doc.size,
        storage_path: doc.storagePath || '',
      }));
      const { error: docsError } = await supabase.from('case_documents').insert(docsToInsert);
      if (docsError) throw docsError;
    }

    // Insert questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map(q => ({ case_id: caseId, question_text: q }));
      const { error: qError } = await supabase.from('case_questions').insert(questionsToInsert);
      if (qError) throw qError;
    }

    await refetchCases();
    return caseId;
  };

  const updateCase = async (id: string, updates: Partial<Case>) => {
    const dbUpdates: any = {};
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
    if (updates.treatmentPlan !== undefined) dbUpdates.treatment_plan = updates.treatmentPlan;
    if (updates.followUp !== undefined) dbUpdates.follow_up = updates.followUp;
    if (updates.finalized !== undefined) dbUpdates.finalized = updates.finalized;

    const { error } = await supabase.from('cases').update(dbUpdates).eq('id', id);
    if (error) throw error;
    await refetchCases();
  };

  const createMTB = async (name: string) => {
    if (!user) throw new Error('User not authenticated');
    // Check if user already owns an MTB
    const { data: existing } = await supabase.from('mtbs').select('id').eq('owner_id', user.id).maybeSingle();
    if (existing) throw new Error('You can only create one MTB');

    const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { error } = await supabase.from('mtbs').insert({
      owner_id: user.id,
      name,
      join_code: joinCode,
    });
    if (error) throw error;
    await refetchMTBs();
  };

  const joinMTB = async (joinCode: string) => {
    if (!user) throw new Error('User not authenticated');
    const { data: mtb, error: mtbError } = await supabase
      .from('mtbs')
      .select('id')
      .eq('join_code', joinCode)
      .maybeSingle();
    if (mtbError) throw mtbError;
    if (!mtb) throw new Error('Invalid join code');

    const { error } = await supabase.from('mtb_members').insert({ mtb_id: mtb.id, user_id: user.id });
    if (error) throw error;
    await refetchMTBs();
  };

  const addCaseToMTB = async (mtbId: string, caseId: string) => {
    const { error } = await supabase.from('mtb_cases').insert({ mtb_id: mtbId, case_id: caseId });
    if (error) throw error;
    await refetchMTBs();
  };

  const addOpinion = async (caseId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase.from('case_opinions').insert({
      case_id: caseId,
      user_id: user.id,
      opinion_text: content,
    });
    if (error) throw error;
  };

  const updateOpinion = async (opinionId: string, content: string) => {
    const { error } = await supabase
      .from('case_opinions')
      .update({ opinion_text: content })
      .eq('id', opinionId);
    if (error) throw error;
  };

  const getCaseById = async (id: string): Promise<Case | null> => {
    const { data: caseRow, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (caseError || !caseRow) return null;

    const { data: docs } = await supabase.from('case_documents').select('*').eq('case_id', id);
    const { data: questions } = await supabase.from('case_questions').select('*').eq('case_id', id);
    const { data: opinions } = await supabase.from('case_opinions').select('*').eq('case_id', id);

    return {
      id: caseRow.id,
      caseName: caseRow.case_name,
      patientName: caseRow.patient_name,
      age: caseRow.patient_age,
      sex: caseRow.patient_sex,
      cancerType: caseRow.cancer_type,
      createdDate: caseRow.created_at.split('T')[0],
      summary: caseRow.summary,
      treatmentPlan: caseRow.treatment_plan,
      followUp: caseRow.follow_up,
      finalized: caseRow.finalized,
      ownerId: caseRow.owner_id,
      documents: (docs || []).map(d => ({
        id: d.id,
        name: d.file_name,
        size: d.size,
        type: d.type,
        storagePath: d.storage_path,
      })),
      questions: (questions || []).map(q => q.question_text),
      opinions: (opinions || []).map(o => ({
        id: o.id,
        author: 'Expert',
        authorUserId: o.user_id,
        content: o.opinion_text,
        date: o.created_at.split('T')[0],
      })),
    };
  };

  return (
    <CasesContext.Provider
      value={{
        cases,
        mtbs,
        loading,
        refetchCases,
        refetchMTBs,
        createCase,
        updateCase,
        createMTB,
        joinMTB,
        addCaseToMTB,
        addOpinion,
        updateOpinion,
        getCaseById,
      }}
    >
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CasesContext);
  if (context === undefined) {
    throw new Error('useCases must be used within a CasesProvider');
  }
  return context;
}
