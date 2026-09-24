# GPTICS — protótipo interativo

Interface acadêmica de demonstração para acompanhar competências socioemocionais em projetos de extensão feitos em grupo. O projeto original era uma coleção de páginas HTML sem um estado compartilhado. Esta versão usa React com Next.js e mantém os três percursos da proposta: aluno, professor e coordenação.

## Demonstração 
https://paulofontes-cyber.github.io/IC_INTERFACE_V1/

## Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/IC_INTERFACE_V1/` para a apresentação do projeto. O protótipo interativo fica em `/IC_INTERFACE_V1/demo/` e cada cartão de perfil na página inicial abre a demonstração correspondente. Para validar a compilação, use `npm run typecheck` e `npm run build`.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` compila o Next.js como site estático e publica a pasta `out`. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. A URL do projeto é `https://paulofontes-cyber.github.io/IC_INTERFACE_V1/`.

## O que é possível demonstrar

- **Aluno:** avaliar o grupo de extensão, fazer a própria autoavaliação individual e avaliar cada colega do grupo nas 12 competências. Cada pessoa tem rascunho e registro separados; o aluno pode consultar e exportar seu histórico.
- **Professor:** visualizar turmas, grupos, projetos e integrantes; criar e editar grupos, mover alunos entre eles, avaliar alunos individualmente e consultar relatórios da turma.
- **Coordenação:** visualizar indicadores, filtrar relatórios gerais, administrar competências e cadastrar perfis com permissões demonstrativas.
- **Dados:** as alterações feitas na interface ficam em `localStorage` no navegador. O botão “Restaurar demonstração” limpa esses dados e volta à amostra inicial. O CSV exportado corresponde aos filtros visíveis.

Os nomes, projetos e resultados são fictícios. A seleção de perfil é intencionalmente aberta para apresentação; as permissões cadastradas representam uma configuração visual e não controlam o acesso. Não há autenticação, servidor, banco de dados nem envio de e-mail. Não use dados pessoais reais. O protótipo também não afirma conformidade legal ou validade psicométrica.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `app/` | Rotas `/` (apresentação) e `/demo` (protótipo), além dos estilos |
| `src/components/LandingPage.tsx` | Site de introdução e navegação para os perfis |
| `src/components/DemoApp.tsx` | Telas e interações dos três perfis |
| `src/components/GroupExperience.tsx` | Avaliação coletiva e histórico do grupo pelo aluno |
| `src/components/MemberExperience.tsx` | Autoavaliação individual, avaliação dos colegas e acompanhamento docente |
| `src/components/ManagementPages.tsx` | Gestão de grupos, projetos, perfis e permissões |
| `src/data/demo.ts` | Turmas, alunos, competências e avaliações fictícias |
| `src/lib/storage.ts` | Persistência local do protótipo |

## Limites do protótipo

Os indicadores representam apenas a pequena amostra fictícia. Alterar competências modifica os formulários futuros; avaliações anteriores conservam suas notas e continuam visíveis no histórico. O professor pode mover um aluno para outro grupo da mesma turma; o histórico enviado pelo aluno continua acessível para ele. Um grupo com avaliações não pode ser excluído, para preservar os registros. Não há permissões reais entre os perfis.

