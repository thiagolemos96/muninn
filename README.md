# Muninn

O corvo da memória do Odin: voa pela campanha e volta contando o que viu.

Um app com duas áreas pras campanhas de D&D 2024:

- **Escudo** (`/`): o mestre entra com Google e vê tudo.
- **Grimório** (`/c/<slug>`): qualquer pessoa com o link vê só o que foi revelado ao grupo. Sem login.

Quem decide o que cada um vê é o banco (RLS do Postgres), nunca o front. As regras estão em `supabase/migrations` e são testadas por `npm run test:rls`.

Stack: React 19, TypeScript, Vite 8 (PWA), React Router, TanStack Query, Supabase (Postgres, Auth, Storage), Cloudflare (Workers com arquivos estáticos).

## Rodar localmente

Precisa de Node 24 (tem `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a publishable key do Supabase
npm run dev                  # http://localhost:5173
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck e build de produção em `dist/` |
| `npm run preview` | Serve o build localmente (testa o PWA) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run test:rls` | Schema e RLS num Postgres em memória (PGlite), sem Docker |
| `npm run icons` | Gera os ícones do PWA a partir de `public/icon.svg` |

O GitHub Actions roda lint, typecheck, `test:rls` e build em todo push.

## Deploy, passo a passo

A ordem importa: o seed precisa do seu usuário, e o usuário só existe depois do primeiro login.

### 1. Supabase: banco

1. Crie o projeto em [supabase.com](https://supabase.com) (o plano Free basta).
2. No **SQL Editor**, rode cada arquivo de `supabase/migrations/` em ordem de nome, um por vez.
   Não rode `supabase/tests/stubs.sql`: ele imita o Supabase só pros testes.
   Na primeira, o editor avisa que as tabelas nascem sem RLS: pode escolher "Run and enable RLS" (a 002 liga o RLS de qualquer jeito).
   Se o projeto estiver ligado ao GitHub, deixe **"Deploy to production"** desligado: as migrations foram aplicadas à mão e o deploy tentaria criar tudo de novo. Pra ligar um dia, marque antes as já aplicadas com `supabase migration repair --status applied`.
3. Em **Project Settings > API Keys**, copie a Project URL e a publishable key (`sb_publishable_...`). Elas vão no `.env.local` e no Cloudflare. A secret key nunca sai do painel.

### 2. Google e login

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto e configure a tela de consentimento (Google Auth Platform > Visão geral > Vamos começar), com público **Externo**.
2. Em **Público-alvo**, adicione o seu Gmail em **Usuários de teste**. O app fica em "Testando", e sem isso o Google bloqueia o seu próprio login.
3. Em **Clientes**, crie um client do tipo **Aplicativo da Web**. Em "URIs de redirecionamento autorizados", ponha `https://<ref-do-projeto>.supabase.co/auth/v1/callback`.
   O Google mostra o Client Secret **uma vez só**, na hora de criar. Perdeu? Abra o client, painel ⓘ, **Add secret**, e desative o antigo.
4. No Supabase, vá em **Authentication > Sign In / Providers**: ligue o **Google** com o Client ID e o Client Secret, e desligue o **Email**.
   Depois de salvar, confira que o Google aparece como **ENABLED** na lista.
5. Em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:5173` por enquanto (troque pela URL do Cloudflare no passo 4).
   - Redirect URLs: `http://localhost:5173/**`.

### 3. Primeiro login e seed

1. Rode `npm run dev`, abra http://localhost:5173 e entre com Google. Vai aparecer "Você ainda não é mestre de nenhuma campanha": é o esperado.
2. No SQL Editor, rode `supabase/seed.example.sql` trocando `<TEU-EMAIL>` pelo e-mail do login. Recarregue: a campanha aparece.
3. Opcional: rode `supabase/seed.demo.sql` pra ter cards de teste (um revelado, com bloco secreto, e um escondido). Ele também abre o Grimório.
4. Em **Authentication > Sign In / Providers**, desligue **"Allow new users to sign up"**. A partir daí, ninguém novo consegue criar conta, nem com Google.

Pra conferir o modelo de acesso: numa aba anônima, abra `http://localhost:5173/c/rise-of-tiamat`. Só pode aparecer o que está marcado como grupo.

### 4. Cloudflare (Workers, só arquivos estáticos)

A Cloudflare cria projetos novos de "Workers & Pages" como **Worker**. O `wrangler.jsonc` da raiz diz o que publicar: a pasta `dist/` em modo SPA, sem código de servidor.

1. Suba o repositório pro GitHub.
2. No Cloudflare: **Workers & Pages > Create > Import a repository** e escolha o repositório.
3. Build:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (o padrão)
4. Em **Settings > Build > Build variables and secrets**, crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Tem que ser aqui: o Vite lê essas variáveis no build, e as "Variables & Secrets" comuns só existem em execução. Se o build usar um Node antigo, adicione `NODE_VERSION` = `24`.
5. Faça o deploy e anote a URL (`https://muninn.<sua-conta>.workers.dev`).
6. De volta ao Supabase, em **URL Configuration**: troque a Site URL pela URL do Worker e adicione `https://muninn.<sua-conta>.workers.dev/**` nas Redirect URLs. Mantenha a do localhost pra continuar desenvolvendo.

Detalhes que mordem:

- As variáveis `VITE_*` entram no bundle na hora do build. Mudou alguma? Faça um novo deploy.
- Rotas do SPA: o `wrangler.jsonc` usa `not_found_handling: "single-page-application"`. Não crie `public/_redirects` com `/* /index.html 200`: os Workers recusam essa regra como loop infinito.
- O app é um PWA. Depois de um deploy novo, a versão nova entra no próximo carregamento da página.

### 5. Manutenção

- O Supabase Free pausa o projeto depois de uma semana sem atividade e não faz backup automático. Faça backup pelo botão **Exportar** da lista de cards (formato em `docs/importador.md`). A consulta periódica que evita a pausa ainda não foi feita.
- Mudou o schema ou uma política? Crie uma migration nova (nunca edite uma já aplicada), adicione o caso em `supabase/tests/rls.test.mjs` e rode `npm run test:rls`.
- Tabela nova nasce **sem acesso** pra `anon` e `authenticated` (migration 005). A migration que cria a tabela também dá os `grant` que ela precisa; o teste falha se faltar.

## Documentação

- `docs/escopo.md`: o quê, por quê, fases e o que está fora do escopo.
- `docs/design.md` e `src/styles/tokens.css`: sistema visual, tema claro (Rubrica) e escuro (Cinco Cabeças).

D&D é marca da Wizards of the Coast. Este projeto não usa logo, arte nem fonte oficial.
