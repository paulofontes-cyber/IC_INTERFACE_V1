import type { Metadata } from 'next';
import DemoApp from '../../src/components/DemoApp';

export const metadata: Metadata = { title: 'Demonstração | GPTICS' };

export default function DemoPage() {
  return <DemoApp />;
}
