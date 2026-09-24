'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, FileBarChart2, GraduationCap, LayoutDashboard, Menu, Pencil, Plus, RotateCcw, Save, Search, Settings2, Sparkles, Trash2, Users, X } from 'lucide-react';
import { classes, Competency, demoEvaluations, demoGroupEvaluations, DemoProfile, Evaluation, evaluationMean, ExtensionGroup, formatDate, GroupEvaluation, groupEvaluationMean, initialCompetencies, mean, Role, ScoreMap, students } from '../data/demo';
import { DemoState, emptyState, loadState, saveState } from '../lib/storage';
import { GroupAssessment, GroupHistory, GroupReportPanel, StudentGroupDashboard } from './GroupExperience';
import { GroupsPage, ProfilesPage, TeacherGroupsOverview } from './ManagementPages';

type Page = 'dashboard' | 'self' | 'history' | 'assess' | 'class-report' | 'aggregate' | 'competencies' | 'groups' | 'profiles';
type Modal = { type: 'evaluation'; evaluation: Evaluation } | { type:'group-evaluation'; evaluation:GroupEvaluation } | { type: 'competency'; competency?: Competency } | null;
const roleLabels: Record<Role,string> = { aluno:'Aluno', professor:'Professor', coordenador:'Coordenação' };
const rolePages: Record<Role,{ id:Page; label:string; icon:typeof LayoutDashboard }[]> = {
  aluno:[{id:'dashboard',label:'Meu projeto',icon:LayoutDashboard},{id:'self',label:'Avaliar meu grupo',icon:ClipboardCheck},{id:'history',label:'Histórico do grupo',icon:Clock3}],
  professor:[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'groups',label:'Grupos e projetos',icon:Users},{id:'assess',label:'Avaliar alunos',icon:ClipboardCheck},{id:'class-report',label:'Relatórios da turma',icon:FileBarChart2}],
  coordenador:[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'aggregate',label:'Relatórios gerais',icon:BarChart3},{id:'competencies',label:'Competências',icon:Settings2},{id:'profiles',label:'Perfis e permissões',icon:Users}],
};
const demoStudent = students[0];
const allEvaluations = (state: DemoState) => [...state.evaluations, ...demoEvaluations].sort((a,b)=>b.date.localeCompare(a.date));
const latest = (items: Evaluation[], studentId: string, author?: Evaluation['author']) => items.find(e=>e.studentId===studentId && (!author || e.author===author));
const initials = (name:string) => name.split(' ').slice(0,2).map(part=>part[0]).join('').toUpperCase();

function downloadCsv(filename:string, rows:(string|number)[][]) {
  const csv = '\uFEFF' + rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a'); link.href=url; link.download=filename; link.click(); URL.revokeObjectURL(url);
}

function Pill({children,tone='neutral'}:{children:React.ReactNode;tone?:'neutral'|'green'|'amber'|'blue'}) { return <span className={`pill ${tone}`}>{children}</span>; }
function Empty({title,description,action}:{title:string;description:string;action?:React.ReactNode}) { return <div className="empty"><div className="empty-icon"><BookOpen size={23}/></div><h3>{title}</h3><p>{description}</p>{action}</div>; }
function ScoreBar({value,max=5}:{value:number;max?:number}) { return <div className="score-track"><span style={{width:`${Math.max(0,Math.min(100,value/max*100))}%`}}/></div>; }
function Metric({label,value,detail,icon:Icon,tone='violet'}:{label:string;value:string;detail:string;icon:typeof Activity;tone?:string}) { return <div className="metric card"><div className={`metric-icon ${tone}`}><Icon size={20}/></div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>; }

export default function DemoApp({initialRole='aluno'}:{initialRole?:Role}) {
  const [role,setRole]=useState<Role>(initialRole);
  const [page,setPage]=useState<Page>('dashboard');
  const [state,setState]=useState<DemoState>(emptyState);
  const [ready,setReady]=useState(false);
  const [notice,setNotice]=useState('');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [modal,setModal]=useState<Modal>(null);
  const [confirmation,setConfirmation]=useState<{title:string;message:string;action:()=>void}|null>(null);
  const [classId,setClassId]=useState(classes[0].id);
  const [search,setSearch]=useState('');
  const [reportCourse,setReportCourse]=useState('all');
  const [reportCompetency,setReportCompetency]=useState('all');
  const [period,setPeriod]=useState('all');
  const [assessing,setAssessing]=useState<string|null>(null);
  const [scores,setScores]=useState<ScoreMap>({});
  const [notes,setNotes]=useState('');

  useEffect(()=>{
    setState(loadState());
    setReady(true);
  },[]);
  useEffect(()=>{ if(ready) saveState(state); },[state,ready]);
  useEffect(()=>{ if(notice){const timer=setTimeout(()=>setNotice(''),4000);return ()=>clearTimeout(timer);} },[notice]);

  const evaluations=useMemo(()=>allEvaluations(state),[state]);
  const groupEvaluations=useMemo(()=>[...state.groupEvaluations,...demoGroupEvaluations].sort((a,b)=>b.date.localeCompare(a.date)),[state.groupEvaluations]);
  const myGroup=state.groups.find(g=>g.studentIds.includes(demoStudent.id));
  const myGroupEvaluations=groupEvaluations.filter(e=>e.evaluatorStudentId===demoStudent.id&&e.groupId===myGroup?.id);
  const allMyGroupEvaluations=groupEvaluations.filter(e=>e.evaluatorStudentId===demoStudent.id);
  const currentClass=classes.find(c=>c.id===classId)!;
  const classStudents=students.filter(s=>s.classId===classId);
  const selectedStudent=students.find(s=>s.id===assessing);
  const title=rolePages[role].find(item=>item.id===page)?.label || 'Visão geral';
  const filteredReports=evaluations.filter(e=>{
    const student=students.find(s=>s.id===e.studentId);
    const classMatch=role==='professor' ? student?.classId===classId : reportCourse==='all' || student?.classId===reportCourse;
    const periodMatch=period==='all' || e.date.slice(0,7)>=period;
    const competencyMatch=reportCompetency==='all' || e.scores[reportCompetency]!==undefined;
    return classMatch && periodMatch && competencyMatch;
  });
  const filteredGroupReports=groupEvaluations.filter(e=>{
    const group=state.groups.find(g=>g.id===e.groupId);
    const selectedClass=role==='professor'?classId:reportCourse;
    return group&&(selectedClass==='all'||group.classId===selectedClass)&&(period==='all'||e.date.slice(0,7)>=period)&&(reportCompetency==='all'||e.scores[reportCompetency]!==undefined);
  });
  const reportMean=mean([...filteredReports.map(e=>reportCompetency==='all'?evaluationMean(e):e.scores[reportCompetency]),...filteredGroupReports.map(e=>reportCompetency==='all'?groupEvaluationMean(e):e.scores[reportCompetency])]);
  const reportCompetencies=state.competencies.filter(c=>reportCompetency==='all'||c.id===reportCompetency);
  const reportBars=reportCompetencies.map(c=>({ ...c, value:mean([...filteredReports,...filteredGroupReports].map(e=>e.scores[c.id]).filter(Boolean)) }));
  const notify=(message:string)=>setNotice(message);
  const navigate=(target:Page)=>{setPage(target);setMobileOpen(false);setAssessing(null);window.scrollTo({top:0,behavior:'smooth'});};
  const switchRole=(next:Role)=>{setRole(next);setPage('dashboard');setAssessing(null);setMobileOpen(false);};
  const resetDemo=()=>setConfirmation({title:'Restaurar demonstração?',message:'Avaliações, grupos, perfis e competências criados neste navegador serão removidos. Os dados fictícios iniciais voltarão.',action:()=>{setState(emptyState());notify('Dados de demonstração restaurados.');navigate('dashboard');}});
  const beginAssessment=(studentId:string)=>{const previous=latest(evaluations,studentId,'professor');setScores(previous?.scores||{});setNotes(previous?.notes||'');setAssessing(studentId);};
  const submitAssessment=()=>{
    if(!assessing || state.competencies.some(c=>!scores[c.id])) {notify('Preencha todas as competências antes de salvar.');return;}
    const evaluation:Evaluation={id:crypto.randomUUID(),studentId:assessing,author:'professor',date:new Date().toISOString(),scores:{...scores},notes:notes.trim()};
    setState(s=>({...s,evaluations:[evaluation,...s.evaluations]})); setAssessing(null);notify('Avaliação do professor salva.');
  };
  const submitSelf=()=>{
    if(!myGroup){notify('Peça ao professor para incluir você em um grupo.');return;}
    if(state.competencies.some(c=>!state.draft[c.id])){notify('Responda todas as competências para concluir.');return;}
    const evaluation:GroupEvaluation={id:crypto.randomUUID(),groupId:myGroup.id,evaluatorStudentId:demoStudent.id,date:new Date().toISOString(),scores:{...state.draft},notes:state.groupDraftNotes.trim()};
    setState(s=>({...s,groupEvaluations:[evaluation,...s.groupEvaluations],draft:{},groupDraftNotes:''}));notify('Avaliação do grupo enviada e adicionada ao histórico.');navigate('history');
  };
  const saveGroup=(group:ExtensionGroup)=>{
    setState(s=>({ ...s, groups:[...s.groups.filter(g=>g.id!==group.id).map(g=>g.classId===group.classId?{...g,studentIds:g.studentIds.filter(id=>!group.studentIds.includes(id))}:g).filter(g=>g.studentIds.length>0),group] }));
    notify('Grupo e integrantes salvos.');
  };
  const deleteGroup=(id:string)=>{
    if(groupEvaluations.some(e=>e.groupId===id)){notify('Este grupo já tem avaliações. Edite os integrantes ou o projeto para preservar o histórico.');return;}
    setConfirmation({title:'Remover grupo?',message:'O grupo será removido da demonstração e seus alunos ficarão disponíveis para outra equipe.',action:()=>{setState(s=>({...s,groups:s.groups.filter(g=>g.id!==id)}));notify('Grupo removido.');}});
  };
  const saveProfile=(profile:DemoProfile)=>{
    if(state.profiles.some(p=>p.id!==profile.id&&p.identifier.toLowerCase()===profile.identifier.toLowerCase()))return 'Já existe um perfil com esta matrícula ou código.';
    setState(s=>({...s,profiles:s.profiles.some(p=>p.id===profile.id)?s.profiles.map(p=>p.id===profile.id?profile:p):[...s.profiles,profile]}));notify('Perfil e permissões salvos.');
  };
  const deleteProfile=(id:string)=>{
    setConfirmation({title:'Remover perfil?',message:'Este registro e suas permissões serão removidos da demonstração.',action:()=>{setState(s=>({...s,profiles:s.profiles.filter(p=>p.id!==id)}));notify('Perfil removido.');}});
  };
  const exportGroupHistory=()=>downloadCsv('gptics-avaliacoes-do-grupo.csv',[['Data','Grupo','Projeto','Competência','Nota','Observações'],...allMyGroupEvaluations.flatMap(e=>Object.entries(e.scores).map(([id,score])=>{const group=state.groups.find(g=>g.id===e.groupId);return [formatDate(e.date),group?.name||'',group?.project||'',state.competencies.find(c=>c.id===id)?.name||id,score,e.notes||'']}))]);
  const exportReport=()=>{
    const classFilter=role==='professor'?classId:reportCourse;
    const groupRows=groupEvaluations.filter(e=>{const g=state.groups.find(group=>group.id===e.groupId);return g&&(classFilter==='all'||g.classId===classFilter)&&(period==='all'||e.date.slice(0,7)>=period)&&(reportCompetency==='all'||e.scores[reportCompetency]!==undefined);});
    downloadCsv(`gptics-relatorio-${role}.csv`,[['Data','Tipo','Turma','Grupo','Projeto','Aluno ou avaliador','Competência','Nota'],...filteredReports.flatMap(e=>Object.entries(e.scores).filter(([id])=>reportCompetency==='all'||id===reportCompetency).map(([id,score])=>[formatDate(e.date),'Avaliação docente',students.find(s=>s.id===e.studentId)?.classId||'','','',students.find(s=>s.id===e.studentId)?.name||'',state.competencies.find(c=>c.id===id)?.name||id,score])),...groupRows.flatMap(e=>Object.entries(e.scores).filter(([id])=>reportCompetency==='all'||id===reportCompetency).map(([id,score])=>{const g=state.groups.find(group=>group.id===e.groupId);return [formatDate(e.date),'Avaliação do grupo',g?.classId||'',g?.name||'',g?.project||'',students.find(s=>s.id===e.evaluatorStudentId)?.name||'',state.competencies.find(c=>c.id===id)?.name||id,score]}))]);
  };
  const saveCompetency=(competency:Competency)=>{
    if(!competency.name.trim()||!competency.description.trim()){notify('Informe nome e descrição da competência.');return;}
    const exists=state.competencies.some(c=>c.id===competency.id);
    setState(s=>({...s,competencies:exists?s.competencies.map(c=>c.id===competency.id?competency:c):[...s.competencies,competency]}));setModal(null);notify(exists?'Competência atualizada.':'Competência adicionada.');
  };
  const deleteCompetency=(id:string)=>{
    setConfirmation({title:'Remover competência?',message:'Ela sairá dos formulários futuros. As avaliações anteriores continuarão no histórico.',action:()=>{setState(s=>({...s,competencies:s.competencies.filter(c=>c.id!==id)}));notify('Competência removida do formulário.');}});
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={20}/></div><div><strong>GPTICS</strong><small>Competências em foco</small></div><button className="mobile-close icon-button" onClick={()=>setMobileOpen(false)} aria-label="Fechar menu"><X size={19}/></button></div>
      <div className="workspace-label">ESPAÇO DE DEMONSTRAÇÃO</div>
      <div className="role-picker"><label htmlFor="role-select">Explorar como</label><div className="select-wrap"><select id="role-select" value={role} onChange={e=>switchRole(e.target.value as Role)}><option value="aluno">Aluno</option><option value="professor">Professor</option><option value="coordenador">Coordenação</option></select><ChevronDown size={17}/></div></div>
      <div className="nav-caption">MENU PRINCIPAL</div>
      <nav aria-label="Navegação principal">{rolePages[role].map(item=><button key={item.id} className={`nav-link ${page===item.id?'active':''}`} onClick={()=>navigate(item.id)}><item.icon size={19}/><span>{item.label}</span>{page===item.id&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="demo-tip"><div className="tip-icon"><Sparkles size={17}/></div><strong>Protótipo interativo</strong><p>Explore os três perfis. As alterações ficam salvas neste navegador.</p></div><a className="reset-button" href="/"><ArrowLeft size={16}/> Voltar à apresentação</a><button className="reset-button" onClick={resetDemo}><RotateCcw size={16}/> Restaurar demonstração</button><div className="sidebar-user"><div className="avatar">{role==='aluno'?'AS':role==='professor'?'PM':'CO'}</div><div><strong>{role==='aluno'?'Ana Silva':role==='professor'?'Prof. Marina':'Coordenação'}</strong><small>{roleLabels[role]} · acesso demo</small></div></div></div>
    </aside>
    {mobileOpen&&<button className="mobile-scrim" onClick={()=>setMobileOpen(false)} aria-label="Fechar menu"/>}
    <main className="main"><header className="topbar"><button className="mobile-menu icon-button" onClick={()=>setMobileOpen(true)} aria-label="Abrir menu"><Menu size={22}/></button><div className="breadcrumbs">GPTICS <span>/</span> {roleLabels[role]} <span>/</span> <strong>{title}</strong></div><Pill tone="blue">Ambiente de demonstração</Pill></header>
      <div className="content">
        {page==='dashboard'&&role==='aluno'&&<StudentGroupDashboard group={myGroup} evaluations={myGroupEvaluations} competencies={state.competencies} onStart={()=>navigate('self')} onHistory={()=>navigate('history')}/>}
        
        {page==='dashboard'&&role==='professor'&&<>
          <div className="page-heading"><div><div className="eyebrow">PAINEL DO PROFESSOR</div><h1>Turmas e projetos</h1><p>Acompanhe os alunos e os grupos dos projetos de extensão.</p></div><button className="button primary" onClick={()=>navigate('groups')}><Plus size={17}/> Criar grupo</button></div>
          <div className="metric-grid four"><Metric label="Turmas ativas" value={String(classes.length)} detail="período 2026.2" icon={BookOpen}/><Metric label="Grupos de extensão" value={String(state.groups.length)} detail="projetos organizados" icon={Users} tone="blue"/><Metric label="Alunos" value={String(students.length)} detail="nas turmas demonstrativas" icon={GraduationCap} tone="peach"/><Metric label="Avaliações de grupo" value={String(groupEvaluations.length)} detail="enviadas pelos alunos" icon={ClipboardCheck} tone="green"/></div>
          <div className="section-heading"><h2>Turmas em andamento</h2><span>Período 2026.2</span></div>
          <div className="class-grid">{classes.map(c=>{const members=students.filter(s=>s.classId===c.id);const groups=state.groups.filter(g=>g.classId===c.id);return <div className="card class-card" key={c.id}><div className="class-icon"><BookOpen size={22}/></div><Pill tone="blue">{c.id}</Pill><h3>{c.name}</h3><p>{members.length} alunos · {groups.length} {groups.length===1?'grupo':'grupos'}</p><div className="class-progress"><div><span>Alunos em grupos</span><strong>{groups.reduce((total,g)=>total+g.studentIds.length,0)}/{members.length}</strong></div><ScoreBar value={groups.reduce((total,g)=>total+g.studentIds.length,0)} max={members.length}/></div><div className="card-actions"><button className="button secondary" onClick={()=>{setClassId(c.id);navigate('groups');}}>Ver grupos</button><button className="icon-button bordered" title="Ver relatório" onClick={()=>{setClassId(c.id);navigate('class-report');}}><BarChart3 size={17}/></button></div></div>})}</div>
          <TeacherGroupsOverview groups={state.groups} onOpen={id=>{setClassId(id);navigate('groups');}}/>
        </>}
        
        {page==='dashboard'&&role==='coordenador'&&<><div className="page-heading"><div><div className="eyebrow">VISÃO INSTITUCIONAL</div><h1>Panorama geral</h1><p>Uma leitura consolidada das competências nas turmas de demonstração.</p></div><button className="button primary" onClick={()=>navigate('aggregate')}><FileBarChart2 size={17}/> Explorar relatórios</button></div><div className="metric-grid four"><Metric label="Alunos" value={String(students.length)} detail="amostra demonstrativa" icon={Users}/><Metric label="Turmas" value={String(classes.length)} detail="em acompanhamento" icon={BookOpen} tone="blue"/><Metric label="Avaliações" value={String(evaluations.length+groupEvaluations.length)} detail="docentes e de grupo" icon={ClipboardCheck} tone="peach"/><Metric label="Média geral" value={mean([...evaluations.map(evaluationMean),...groupEvaluations.map(groupEvaluationMean)]).toFixed(1).replace('.',',')} detail="escala de 1 a 5" icon={Activity} tone="green"/></div><div className="two-column"><section className="card panel"><div className="panel-head"><div><h2>Competências em destaque</h2><p>Médias da amostra</p></div><button className="text-button" onClick={()=>navigate('aggregate')}>Analisar dados <ArrowRight size={16}/></button></div><div className="bars">{state.competencies.slice(0,6).map(c=>{const v=mean([...evaluations,...groupEvaluations].map(e=>e.scores[c.id]).filter(Boolean));return <div className="bar-row" key={c.id}><span>{c.name}</span><ScoreBar value={v}/><strong>{v.toFixed(1).replace('.',',')}</strong></div>})}</div></section><section className="card panel"><div className="panel-head"><div><h2>Ferramentas de gestão</h2><p>Configure e explore o protótipo</p></div></div><div className="tool-list"><button onClick={()=>navigate('profiles')}><div className="tool-icon"><Users size={20}/></div><span><strong>Perfis e permissões</strong><small>Cadastre pessoas e configure acessos</small></span><ArrowRight size={17}/></button><button onClick={()=>navigate('aggregate')}><div className="tool-icon"><BarChart3 size={20}/></div><span><strong>Relatórios gerais</strong><small>Filtre turmas e competências</small></span><ArrowRight size={17}/></button><button onClick={()=>navigate('competencies')}><div className="tool-icon peach"><Settings2 size={20}/></div><span><strong>Competências</strong><small>Edite as habilidades avaliadas</small></span><ArrowRight size={17}/></button></div></section></div></>}
        {page==='self'&&<GroupAssessment group={myGroup} competencies={state.competencies} draft={state.draft} notes={state.groupDraftNotes} onScore={(id,value)=>setState(s=>({...s,draft:{...s.draft,[id]:value}}))} onNotes={value=>setState(s=>({...s,groupDraftNotes:value}))} onSubmit={submitSelf}/>}
        
        {page==='history'&&<GroupHistory groups={state.groups} evaluations={allMyGroupEvaluations} onView={evaluation=>setModal({type:'group-evaluation',evaluation})} onExport={exportGroupHistory} onStart={()=>navigate('self')}/>}
        {page==='groups'&&<GroupsPage groups={state.groups} evaluations={groupEvaluations} classId={classId} onClassChange={setClassId} onSave={saveGroup} onDelete={deleteGroup}/>}
        
        {page==='assess'&&<><div className="page-heading"><div><div className="eyebrow">AVALIAÇÃO DOCENTE</div><h1>Avaliar turma</h1><p>Registre sua observação sobre as competências de cada aluno.</p></div><Pill tone="blue">{currentClass.period}</Pill></div><div className="card filter-card"><div className="field"><label htmlFor="class-picker">Turma</label><div className="select-wrap"><select id="class-picker" value={classId} onChange={e=>{setClassId(e.target.value);setAssessing(null);}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.id}</option>)}</select><ChevronDown size={17}/></div></div><div className="field search-field"><label htmlFor="student-search">Buscar aluno</label><div className="input-icon"><Search size={18}/><input id="student-search" placeholder="Nome ou matrícula" value={search} onChange={e=>setSearch(e.target.value)}/></div></div></div>{assessing&&selectedStudent?<div className="assessment-editor"><div className="editor-heading"><button className="text-button" onClick={()=>setAssessing(null)}><ArrowLeft size={17}/> Voltar à turma</button><h2>Avaliar {selectedStudent.name}</h2><p>Use a escala de 1 (inicial) a 5 (excelente).</p></div><div className="assessment-layout"><div className="assessment-list">{state.competencies.map((c,index)=><div className="card assessment-item" key={c.id}><div className="assessment-number">{String(index+1).padStart(2,'0')}</div><div className="assessment-content"><h3>{c.name}</h3><p>{c.description}</p><div className="scale" role="group" aria-label={`Nota para ${c.name}`}>{[1,2,3,4,5].map(value=><button key={value} className={scores[c.id]===value?'selected':''} onClick={()=>setScores(s=>({...s,[c.id]:value}))} aria-pressed={scores[c.id]===value}>{value}</button>)}</div><div className="scale-labels"><span>Inicial</span><span>Excelente</span></div></div></div>)}<div className="card notes-card"><label htmlFor="assessment-notes">Observações (opcional)</label><textarea id="assessment-notes" rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Registre um comentário construtivo sobre o desenvolvimento do aluno."/></div></div><aside className="card assessment-aside"><div className="aside-icon"><ClipboardCheck size={24}/></div><h3>Avaliação de {selectedStudent.name.split(' ')[0]}</h3><p>{Object.keys(scores).filter(id=>scores[id]).length} de {state.competencies.length} competências respondidas.</p><ScoreBar value={Object.keys(scores).filter(id=>scores[id]).length} max={state.competencies.length}/><div className="divider"/><button className="button primary full" onClick={submitAssessment}><Save size={17}/> Salvar avaliação</button></aside></div></div>:<section className="card panel"><div className="panel-head"><div><h2>{currentClass.name}</h2><p>{classStudents.length} alunos matriculados · {currentClass.id}</p></div></div><div className="student-list">{classStudents.filter(s=>`${s.name} ${s.registration}`.toLowerCase().includes(search.toLowerCase())).map(s=>{const previous=latest(evaluations,s.id,'professor');return <div className="student-row" key={s.id}><div className="avatar small">{initials(s.name)}</div><div className="student-name"><strong>{s.name}</strong><small>Matrícula {s.registration}</small></div><Pill tone={previous?'green':'amber'}>{previous?'Avaliado':'Pendente'}</Pill><div className="student-actions">{previous&&<button className="button secondary compact" onClick={()=>setModal({type:'evaluation',evaluation:previous})}>Ver</button>}<button className="button primary compact" onClick={()=>beginAssessment(s.id)}>{previous?'Reavaliar':'Avaliar'} <ArrowRight size={15}/></button></div></div>})}</div>{!classStudents.some(s=>`${s.name} ${s.registration}`.toLowerCase().includes(search.toLowerCase()))&&<Empty title="Nenhum aluno encontrado" description="Tente buscar por outro nome ou matrícula."/>}</section>}</>}
        {(page==='class-report'||page==='aggregate')&&<>
          <div className="page-heading"><div><div className="eyebrow">{role==='professor'?'ACOMPANHAMENTO DA TURMA':'ANÁLISE INSTITUCIONAL'}</div><h1>{role==='professor'?'Relatórios da turma':'Relatórios gerais'}</h1><p>Compare avaliações docentes e percepções dos alunos sobre seus grupos de extensão.</p></div><button className="button secondary" onClick={exportReport}><ArrowDownToLine size={17}/> Exportar CSV</button></div>
          <div className="card filter-card report-filters"><div className="field"><label htmlFor="report-class">Turma</label><div className="select-wrap"><select id="report-class" value={role==='professor'?classId:reportCourse} onChange={e=>role==='professor'?setClassId(e.target.value):setReportCourse(e.target.value)}>{role==='coordenador'&&<option value="all">Todas as turmas</option>}{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={17}/></div></div><div className="field"><label htmlFor="report-competency">Competência</label><div className="select-wrap"><select id="report-competency" value={reportCompetency} onChange={e=>setReportCompetency(e.target.value)}><option value="all">Todas as competências</option>{state.competencies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={17}/></div></div><div className="field"><label htmlFor="report-period">Período</label><div className="select-wrap"><select id="report-period" value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Todo o período</option><option value="2026-09">Desde setembro/2026</option><option value="2026-08">Desde agosto/2026</option><option value="2026-04">Desde abril/2026</option></select><ChevronDown size={17}/></div></div></div>
          <div className="metric-grid"><Metric label="Avaliações no filtro" value={String(filteredReports.length+filteredGroupReports.length)} detail="individuais e de grupo" icon={ClipboardCheck}/><Metric label="Avaliações de grupo" value={String(filteredGroupReports.length)} detail="enviadas pelos alunos" icon={Users} tone="blue"/><Metric label="Média no filtro" value={filteredReports.length+filteredGroupReports.length?reportMean.toFixed(1).replace('.',','):'—'} detail="escala de 1 a 5" icon={Activity} tone="peach"/></div>
          <GroupReportPanel groups={state.groups} evaluations={groupEvaluations} classId={role==='professor'?classId:reportCourse} period={period} competency={reportCompetency} onView={evaluation=>setModal({type:'group-evaluation',evaluation})}/>
          <div className="two-column report-grid"><section className="card panel"><div className="panel-head"><div><h2>Média por competência</h2><p>Registros individuais e de grupo no filtro</p></div></div>{filteredReports.length+filteredGroupReports.length?<div className="bars">{reportBars.map(c=><div className="bar-row" key={c.id}><span>{c.name}</span><ScoreBar value={c.value}/><strong>{c.value.toFixed(1).replace('.',',')}</strong></div>)}</div>:<Empty title="Sem dados para este filtro" description="Altere a turma, a competência ou o período."/>}</section><section className="card panel"><div className="panel-head"><div><h2>Avaliações docentes</h2><p>Registros individuais recentes</p></div></div>{filteredReports.length?<div className="recent-list">{filteredReports.slice(0,8).map(e=><button key={e.id} onClick={()=>setModal({type:'evaluation',evaluation:e})}><div className="avatar tiny">{initials(students.find(s=>s.id===e.studentId)?.name||'Aluno')}</div><span><strong>{students.find(s=>s.id===e.studentId)?.name}</strong><small>Professor · {formatDate(e.date)}</small></span><b>{(reportCompetency==='all'?evaluationMean(e):e.scores[reportCompetency]).toFixed(1).replace('.',',')}</b></button>)}</div>:<Empty title="Nenhum registro docente" description="As avaliações individuais aparecerão aqui."/>}</section></div>
        </>}
        {page==='profiles'&&<ProfilesPage profiles={state.profiles} onSave={saveProfile} onDelete={deleteProfile}/>}
        
        {page==='competencies'&&<><div className="page-heading"><div><div className="eyebrow">CONFIGURAÇÃO DO PROTÓTIPO</div><h1>Competências</h1><p>Organize as habilidades exibidas nos formulários de avaliação.</p></div><button className="button primary" onClick={()=>setModal({type:'competency'})}><Plus size={17}/> Adicionar competência</button></div><div className="card panel"><div className="panel-head"><div><h2>Competências cadastradas</h2><p>{state.competencies.length} itens ativos no formulário</p></div></div><div className="competency-grid">{state.competencies.map((c,index)=><div className="competency-card" key={c.id}><div className="competency-top"><span className="competency-index">{String(index+1).padStart(2,'0')}</span><Pill>{c.category}</Pill></div><h3>{c.name}</h3><p>{c.description}</p><div className="competency-actions"><button className="text-button" onClick={()=>setModal({type:'competency',competency:c})}><Pencil size={15}/> Editar</button><button className="text-button danger" onClick={()=>deleteCompetency(c.id)}><Trash2 size={15}/> Excluir</button></div></div>)}</div></div></>}
      </div>
    </main>
    {notice&&<div className="toast" role="status"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice('')} aria-label="Fechar aviso"><X size={16}/></button></div>}
    {modal?.type==='evaluation'&&<div className="modal-backdrop" onMouseDown={()=>setModal(null)}><div className="modal card" role="dialog" aria-modal="true" aria-label="Detalhes da avaliação" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">DETALHES DA AVALIAÇÃO</div><h2>{students.find(s=>s.id===modal.evaluation.studentId)?.name}</h2><p>{modal.evaluation.author==='aluno'?'Autoavaliação':'Avaliação do professor'} · {formatDate(modal.evaluation.date)}</p></div><button className="icon-button" onClick={()=>setModal(null)} aria-label="Fechar"><X size={20}/></button></div><div className="modal-score"><strong>{evaluationMean(modal.evaluation).toFixed(1).replace('.',',')}</strong><span>Média geral / 5</span></div><div className="modal-bars">{Object.entries(modal.evaluation.scores).map(([id,value])=><div className="bar-row" key={id}><span>{state.competencies.find(c=>c.id===id)?.name||initialCompetencies.find(c=>c.id===id)?.name||id}</span><ScoreBar value={value}/><strong>{value}</strong></div>)}</div>{modal.evaluation.notes&&<div className="modal-note"><strong>Observações</strong><p>{modal.evaluation.notes}</p></div>}<button className="button secondary full" onClick={()=>setModal(null)}>Fechar</button></div></div>}
    {modal?.type==='group-evaluation'&&<div className="modal-backdrop" onMouseDown={()=>setModal(null)}><div className="modal card" role="dialog" aria-modal="true" aria-label="Detalhes da avaliação do grupo" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">AVALIAÇÃO DO PROJETO DE EXTENSÃO</div><h2>{state.groups.find(g=>g.id===modal.evaluation.groupId)?.project||'Projeto de extensão'}</h2><p>{state.groups.find(g=>g.id===modal.evaluation.groupId)?.name||'Grupo arquivado'} · enviada por {students.find(s=>s.id===modal.evaluation.evaluatorStudentId)?.name||'Aluno'} em {formatDate(modal.evaluation.date)}</p></div><button className="icon-button" onClick={()=>setModal(null)} aria-label="Fechar"><X size={20}/></button></div><div className="modal-score"><strong>{groupEvaluationMean(modal.evaluation).toFixed(1).replace('.',',')}</strong><span>Média do grupo / 5</span></div><div className="modal-bars">{Object.entries(modal.evaluation.scores).map(([id,value])=><div className="bar-row" key={id}><span>{state.competencies.find(c=>c.id===id)?.name||initialCompetencies.find(c=>c.id===id)?.name||id}</span><ScoreBar value={value}/><strong>{value}</strong></div>)}</div>{modal.evaluation.notes&&<div className="modal-note"><strong>Observações do aluno</strong><p>{modal.evaluation.notes}</p></div>}<button className="button secondary full" onClick={()=>setModal(null)}>Fechar</button></div></div>}
    {modal?.type==='competency'&&<CompetencyModal competency={modal.competency} onClose={()=>setModal(null)} onSave={saveCompetency}/>}
    {confirmation&&<div className="modal-backdrop" onMouseDown={()=>setConfirmation(null)}><div className="modal card confirm-modal" role="dialog" aria-modal="true" aria-label={confirmation.title} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">CONFIRMAÇÃO</div><h2>{confirmation.title}</h2><p>{confirmation.message}</p></div><button className="icon-button" onClick={()=>setConfirmation(null)} aria-label="Fechar"><X size={20}/></button></div><div className="modal-actions"><button className="button secondary" onClick={()=>setConfirmation(null)}>Cancelar</button><button className="button primary" onClick={()=>{confirmation.action();setConfirmation(null);}}>Confirmar</button></div></div></div>}
  </div>;
}

function CompetencyModal({competency,onClose,onSave}:{competency?:Competency;onClose:()=>void;onSave:(value:Competency)=>void}) {
  const [name,setName]=useState(competency?.name||'');const [description,setDescription]=useState(competency?.description||'');const [category,setCategory]=useState(competency?.category||'Intrapessoal');
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal card competency-modal" role="dialog" aria-modal="true" aria-label={competency?'Editar competência':'Adicionar competência'} onMouseDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();onSave({id:competency?.id||`custom-${crypto.randomUUID()}`,name:name.trim(),description:description.trim(),category});}}><div className="modal-head"><div><div className="eyebrow">GESTÃO DE COMPETÊNCIAS</div><h2>{competency?'Editar competência':'Nova competência'}</h2><p>Esta alteração aparecerá nos formulários do protótipo.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div><div className="field"><label htmlFor="competency-name">Nome</label><input id="competency-name" value={name} onChange={e=>setName(e.target.value)} required maxLength={70} placeholder="Ex.: Escuta ativa"/></div><div className="field"><label htmlFor="competency-description">Descrição</label><textarea id="competency-description" value={description} onChange={e=>setDescription(e.target.value)} required rows={4} maxLength={240} placeholder="O que será observado nesta competência?"/></div><div className="field"><label htmlFor="competency-category">Categoria</label><div className="select-wrap"><select id="competency-category" value={category} onChange={e=>setCategory(e.target.value)}><option>Intrapessoal</option><option>Interpessoal</option><option>Cognitiva</option><option>Organização</option></select><ChevronDown size={17}/></div></div><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary"><Save size={17}/> Salvar competência</button></div></form></div>;
}

