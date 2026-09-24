import DemoApp from '../../src/components/DemoApp';
import type { Metadata } from 'next';
import type { Role } from '../../src/data/demo';

export const metadata: Metadata = { title: 'Demonstração | GPTICS' };

export default async function DemoPage({searchParams}:{searchParams:Promise<{perfil?:string}>}) {
  const {perfil}=await searchParams;
  const initialRole:Role=perfil==='professor'||perfil==='coordenador'?perfil:'aluno';
  return <DemoApp initialRole={initialRole}/>;
}
