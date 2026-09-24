import { Competency, DemoProfile, Evaluation, ExtensionGroup, GroupEvaluation, initialCompetencies, initialGroups, initialProfiles } from '../data/demo';

const KEY = 'gptics-demo-v2';
export type DemoState = { competencies: Competency[]; evaluations: Evaluation[]; draft: Record<string, number>; groupDraftNotes: string; groups: ExtensionGroup[]; groupEvaluations: GroupEvaluation[]; profiles: DemoProfile[] };
export const emptyState = (): DemoState => ({ competencies: initialCompetencies, evaluations: [], draft: {}, groupDraftNotes:'', groups:initialGroups, groupEvaluations:[], profiles:initialProfiles });

export function loadState(): DemoState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && Array.isArray(saved.competencies) && Array.isArray(saved.evaluations)) {
      const legacyStudentEvaluations = saved.evaluations.filter((evaluation:Evaluation)=>evaluation.author==='aluno');
      return {
        ...emptyState(), ...saved,
        evaluations:saved.evaluations.filter((evaluation:Evaluation)=>evaluation.author==='professor'),
        groups:Array.isArray(saved.groups)?saved.groups:initialGroups,
        groupEvaluations:Array.isArray(saved.groupEvaluations)?saved.groupEvaluations:legacyStudentEvaluations.map((evaluation:Evaluation)=>({id:evaluation.id,groupId:'grupo-conexao',evaluatorStudentId:evaluation.studentId,date:evaluation.date,scores:evaluation.scores,notes:evaluation.notes})),
        profiles:Array.isArray(saved.profiles)?saved.profiles:initialProfiles,
      };
    }
  } catch { /* Storage may be unavailable or contain old data. */ }
  return emptyState();
}

export function saveState(state: DemoState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Demo remains usable in memory. */ }
}
