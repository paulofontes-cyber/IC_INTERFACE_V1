import type { Metadata } from 'next';
import './globals.css';
import './landing.css';
import './group.css';

export const metadata: Metadata = {
  title: 'GPTICS | Competências além da sala de aula',
  description: 'Conheça a proposta acadêmica GPTICS e explore um protótipo de acompanhamento de competências socioemocionais.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
