export type Role = 'aluno' | 'professor' | 'coordenador';
export type ScoreMap = Record<string, number>;
export type Competency = { id: string; name: string; description: string; category: string };
export type Student = { id: string; name: string; registration: string; classId: string };
export type Evaluation = { id: string; studentId: string; author: 'aluno' | 'professor'; date: string; scores: ScoreMap; notes?: string };
export type ExtensionGroup = { id: string; name: string; project: string; classId: string; studentIds: string[] };
export type GroupEvaluation = { id: string; groupId: string; evaluatorStudentId: string; date: string; scores: ScoreMap; notes?: string };
export type Permission = 'evaluate_group' | 'view_own_history' | 'manage_groups' | 'evaluate_students' | 'view_reports' | 'manage_competencies' | 'manage_profiles';
export type DemoProfile = { id: string; name: string; identifier: string; role: Role; permissions: Permission[] };

export const permissionOptions: { id: Permission; label: string; description: string }[] = [
  { id:'evaluate_group', label:'Avaliar o próprio grupo', description:'Registrar a percepção do aluno sobre seu projeto.' },
  { id:'view_own_history', label:'Ver próprio histórico', description:'Consultar avaliações enviadas pelo aluno.' },
  { id:'manage_groups', label:'Gerenciar grupos', description:'Criar projetos e distribuir alunos.' },
  { id:'evaluate_students', label:'Avaliar alunos', description:'Registrar avaliações docentes individuais.' },
  { id:'view_reports', label:'Ver relatórios', description:'Consultar resultados de turmas e projetos.' },
  { id:'manage_competencies', label:'Gerenciar competências', description:'Editar o formulário de competências.' },
  { id:'manage_profiles', label:'Gerenciar perfis', description:'Cadastrar perfis e configurar permissões.' },
];
export const rolePermissions: Record<Role,Permission[]> = {
  aluno:['evaluate_group','view_own_history'],
  professor:['manage_groups','evaluate_students','view_reports'],
  coordenador:['view_reports','manage_competencies','manage_profiles'],
};

export const initialCompetencies: Competency[] = [
  ['autoconhecimento','Autoconhecimento','Reconhecer emoções, valores, forças e limites pessoais.','Intrapessoal'],
  ['autorregulacao','Autorregulação','Gerenciar emoções, impulsos e comportamentos.','Intrapessoal'],
  ['resiliencia','Resiliência','Adaptar-se e recuperar-se diante de desafios.','Intrapessoal'],
  ['empatia','Empatia','Compreender perspectivas e sentimentos de outras pessoas.','Interpessoal'],
  ['comunicacao','Comunicação eficaz','Expressar ideias com clareza e escutar ativamente.','Interpessoal'],
  ['conflitos','Resolução de conflitos','Construir acordos respeitosos em situações de divergência.','Interpessoal'],
  ['pensamento','Pensamento crítico','Analisar informações antes de formular conclusões.','Cognitiva'],
  ['criatividade','Criatividade','Propor soluções originais para problemas.','Cognitiva'],
  ['decisao','Tomada de decisão','Escolher caminhos considerando consequências.','Cognitiva'],
  ['colaboracao','Colaboração','Contribuir de forma construtiva em equipe.','Interpessoal'],
  ['adaptabilidade','Adaptabilidade','Ajustar-se a contextos e demandas diferentes.','Intrapessoal'],
  ['tempo','Gestão do tempo','Organizar prioridades e cumprir compromissos.','Organização'],
].map(([id,name,description,category]) => ({ id,name,description,category }));

export const classes = [
  { id: 'ENG001', name: 'Engenharia de Software', course: 'Tecnologia', period: '2026.2' },
  { id: 'GPR002', name: 'Gestão de Projetos', course: 'Gestão', period: '2026.2' },
  { id: 'MET003', name: 'Metodologia Científica', course: 'Pesquisa', period: '2026.2' },
];

export const students: Student[] = [
  ['ana','Ana Silva Santos','2021001','ENG001'],['bruno','Bruno Costa Lima','2021002','ENG001'],
  ['carlos','Carlos Eduardo Souza','2021003','ENG001'],['diana','Diana Ferreira Alves','2021004','ENG001'],
  ['eduardo','Eduardo Martins Rocha','2021005','ENG001'],['fernanda','Fernanda Oliveira Cruz','2021006','GPR002'],
  ['gabriel','Gabriel Santos Pereira','2021007','GPR002'],['helena','Helena Costa Ribeiro','2021008','GPR002'],
  ['igor','Igor Almeida Silva','2021009','MET003'],['julia','Julia Fernandes Lima','2021010','MET003'],
].map(([id,name,registration,classId]) => ({ id,name,registration,classId }));

export const initialGroups: ExtensionGroup[] = [
  { id:'grupo-conexao', name:'Conexão Digital', project:'Inclusão digital para idosos', classId:'ENG001', studentIds:['ana','bruno','carlos'] },
  { id:'grupo-raizes', name:'Raízes', project:'Horta comunitária e educação ambiental', classId:'ENG001', studentIds:['diana','eduardo'] },
  { id:'grupo-pontes', name:'Pontes', project:'Mentoria para jovens da comunidade', classId:'GPR002', studentIds:['fernanda','gabriel','helena'] },
  { id:'grupo-ciencia', name:'Cientistas do Amanhã', project:'Oficinas de ciência em escolas públicas', classId:'MET003', studentIds:['igor','julia'] },
];

export const demoGroupEvaluations: GroupEvaluation[] = [
  { id:'grupo-demo-1', groupId:'grupo-conexao', evaluatorStudentId:'ana', date:'2026-08-14', scores:{autoconhecimento:4,autorregulacao:3,resiliencia:4,empatia:5,comunicacao:4,conflitos:3,pensamento:4,criatividade:4,decisao:3,colaboracao:5,adaptabilidade:4,tempo:3}, notes:'Nosso grupo se comunica bem; podemos organizar melhor os prazos.' },
  { id:'grupo-demo-2', groupId:'grupo-conexao', evaluatorStudentId:'ana', date:'2026-04-08', scores:{autoconhecimento:3,autorregulacao:2,resiliencia:3,empatia:4,comunicacao:3,conflitos:3,pensamento:3,criatividade:4,decisao:3,colaboracao:4,adaptabilidade:3,tempo:2} },
];

export const initialProfiles: DemoProfile[] = [
  { id:'perfil-ana', name:'Ana Silva Santos', identifier:'2021001', role:'aluno', permissions:rolePermissions.aluno },
  { id:'perfil-marina', name:'Marina Oliveira', identifier:'PROF001', role:'professor', permissions:rolePermissions.professor },
  { id:'perfil-coord', name:'Coordenação GPTICS', identifier:'COORD001', role:'coordenador', permissions:rolePermissions.coordenador },
];

export const demoEvaluations: Evaluation[] = [
  { id:'demo-3', studentId:'bruno', author:'professor', date:'2026-08-16', scores:{autoconhecimento:3,autorregulacao:4,resiliencia:3,empatia:4,comunicacao:3,conflitos:4,pensamento:4,criatividade:3,decisao:4,colaboracao:4,adaptabilidade:4,tempo:3} },
  { id:'demo-4', studentId:'eduardo', author:'professor', date:'2026-08-17', scores:{autoconhecimento:4,autorregulacao:3,resiliencia:4,empatia:3,comunicacao:4,conflitos:3,pensamento:5,criatividade:4,decisao:4,colaboracao:3,adaptabilidade:4,tempo:4} },
  { id:'demo-5', studentId:'gabriel', author:'professor', date:'2026-08-19', scores:{autoconhecimento:3,autorregulacao:3,resiliencia:4,empatia:4,comunicacao:5,conflitos:4,pensamento:3,criatividade:4,decisao:4,colaboracao:5,adaptabilidade:4,tempo:3} },
  { id:'demo-6', studentId:'igor', author:'professor', date:'2026-08-20', scores:{autoconhecimento:4,autorregulacao:4,resiliencia:5,empatia:3,comunicacao:3,conflitos:3,pensamento:5,criatividade:4,decisao:4,colaboracao:4,adaptabilidade:5,tempo:4} },
];

export const mean = (values: number[]) => values.length ? values.reduce((a,b) => a+b,0) / values.length : 0;
export const evaluationMean = (evaluation: Evaluation) => mean(Object.values(evaluation.scores));
export const groupEvaluationMean = (evaluation: GroupEvaluation) => mean(Object.values(evaluation.scores));
export const formatDate = (date: string) => new Date(date.includes('T') ? date : `${date}T12:00:00`).toLocaleDateString('pt-BR');
