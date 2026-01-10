import { createContext, useContext, useState, ReactNode } from 'react';

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
}

export interface Opinion {
  id: string;
  author: string;
  content: string;
  date: string;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  type: 'NGS' | 'Clinical' | 'Text';
}

export interface MTB {
  id: string;
  name: string;
  experts: number;
  cases: string[];
}

interface CasesContextType {
  cases: Case[];
  mtbs: MTB[];
  addCase: (caseData: Case) => void;
  updateCase: (id: string, updates: Partial<Case>) => void;
  addMTB: (mtb: MTB) => void;
  addCaseToMTB: (mtbId: string, caseId: string) => void;
  addOpinion: (caseId: string, opinion: Opinion) => void;
}

const CasesContext = createContext<CasesContextType | undefined>(undefined);

const mockCases: Case[] = [
  {
    id: '1',
    caseName: 'Lung Adenocarcinoma - EGFR Mutation',
    patientName: 'Patient A',
    age: 62,
    sex: 'Female',
    cancerType: 'Lung Adenocarcinoma',
    createdDate: '2024-01-15',
    summary: 'A 62-year-old female patient diagnosed with stage IV lung adenocarcinoma. NGS results show EGFR exon 19 deletion. Patient has no prior treatment history. Performance status ECOG 1.',
    questions: [
      'What is the most appropriate first-line treatment option?',
      'Should we consider combination therapy or monotherapy?',
    ],
    opinions: [
      {
        id: '1',
        author: 'Dr. Emily Chen',
        content: 'Based on the EGFR exon 19 deletion, I recommend osimertinib as first-line therapy. This shows superior efficacy compared to earlier generation EGFR TKIs.',
        date: '2024-01-16',
      },
    ],
    documents: [
      { id: '1', name: 'NGS_Report_Patient_A.pdf', size: '2.4 MB', type: 'NGS' },
      { id: '2', name: 'Clinical_History.pdf', size: '1.2 MB', type: 'Clinical' },
    ],
  },
  {
    id: '2',
    caseName: 'Colorectal Cancer with RAS Wild-type',
    patientName: 'Patient B',
    age: 55,
    sex: 'Male',
    cancerType: 'Colorectal Cancer',
    createdDate: '2024-01-20',
    summary: 'A 55-year-old male with metastatic colorectal cancer. RAS wild-type confirmed by NGS. MSI-stable. Liver and lung metastases present.',
    questions: [
      'Should we add anti-EGFR therapy to chemotherapy?',
    ],
    opinions: [],
    documents: [
      { id: '3', name: 'NGS_Report_Patient_B.pdf', size: '3.1 MB', type: 'NGS' },
    ],
  },
];

const mockMTBs: MTB[] = [
  {
    id: '1',
    name: 'Thoracic Oncology Board',
    experts: 12,
    cases: ['1'],
  },
  {
    id: '2',
    name: 'GI Cancer Board',
    experts: 8,
    cases: [],
  },
];

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [mtbs, setMTBs] = useState<MTB[]>(mockMTBs);

  const addCase = (caseData: Case) => {
    setCases([...cases, caseData]);
  };

  const updateCase = (id: string, updates: Partial<Case>) => {
    setCases(cases.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addMTB = (mtb: MTB) => {
    setMTBs([...mtbs, mtb]);
  };

  const addCaseToMTB = (mtbId: string, caseId: string) => {
    setMTBs(mtbs.map(m =>
      m.id === mtbId ? { ...m, cases: [...m.cases, caseId] } : m
    ));
  };

  const addOpinion = (caseId: string, opinion: Opinion) => {
    setCases(cases.map(c =>
      c.id === caseId
        ? { ...c, opinions: [...(c.opinions || []), opinion] }
        : c
    ));
  };

  return (
    <CasesContext.Provider value={{ cases, mtbs, addCase, updateCase, addMTB, addCaseToMTB, addOpinion }}>
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
