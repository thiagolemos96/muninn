# Muninn

O corvo da memória do Odin: voa pela campanha e volta contando o que viu.

Um app com duas áreas pras campanhas de D&D 2024:

- **Escudo** (`/`): o mestre entra com Google e vê tudo.
- **Grimório** (`/c/<slug>`): qualquer pessoa com o link vê só o que foi revelado ao grupo. Sem login.

Quem decide o que cada um vê é o banco (RLS do Postgres), nunca o front. As regras estão em `supabase/migrations` e são testadas por `npm run test:rls`.

Stack: React 19, TypeScript, Vite 8 (PWA), React Router, TanStack Query, Supabase (Postgres, Auth, Storage), Cloudflare Pages.

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
3. Em **Project Settings > API Keys**, copie a Project URL e a publishable key (`sb_publishable_...`). Elas vão no `.env.local` e no Cloudflare. A secret key nunca sai do painel.

### 2. Google e login

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto e configure a tela de consentimento (Google Auth Platform > Branding e Audience). Pode deixar em "Testing" e adicionar o seu Gmail como test user.
2. Em **Clients**, crie um client do tipo **Web application**. Em "Authorized redirect URIs", ponha `https://<ref-do-projeto>.supabase.co/auth/v1/callback`.
3. No Supabase, vá em **Authentication > Sign In / Providers**: ligue o **Google** com o Client ID e o Client Secret, e desligue o **Email**.
4. Em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:5173` por enquanto (troque pela URL do Pages no passo 4).
   - Redirect URLs: `http://localhost:5173/**`.

### 3. Primeiro login e seed

1. Rode `npm run dev`, abra http://localhost:5173 e entre com Google. Vai aparecer "Você ainda não é mestre de nenhuma campanha": é o esperado.
2. No SQL Editor, rode `supabase/seed.example.sql` trocando `<TEU-EMAIL>` pelo e-mail do login. Recarregue: a campanha aparece.
3. Opcional: rode `supabase/seed.demo.sql` pra ter cards de teste (um revelado, com bloco secreto, e um escondido). Ele também abre o Grimório.
4. Em **Authentication > Sign In / Providers**, desligue **"Allow new users to sign up"**. A partir daí, ninguém novo consegue criar conta, nem com Google.

Pra conferir o modelo de acesso: numa aba anônima, abra `http://localhost:5173/c/rise-of-tiamat`. Só pode aparecer o que está marcado como grupo.

### 4. Cloudflare Pages

1. Suba o repositório pro GitHub.
2. No Cloudflare: **Workers & Pages > Create > Pages > Connect to Git** e escolha o repositório.
3. Build:
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Em **Environment variables** (Production e Preview), crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. O Node vem do `.nvmrc`; se o build usar uma versão antiga, adicione `NODE_VERSION` = `24`.
5. Faça o deploy e anote a URL (`https://<projeto>.pages.dev`).
6. De volta ao Supabase, em **URL Configuration**: troque a Site URL pela URL do Pages e adicione `https://<projeto>.pages.dev/**` nas Redirect URLs. Mantenha a do localhost pra continuar desenvolvendo.

Detalhes que mordem:

- As variáveis `VITE_*` entram no bundle na hora do build. Mudou alguma? Faça um novo deploy.
- Rotas do SPA: o `public/_redirects` manda tudo pro `index.html`. O Pages já faz isso sozinho enquanto não existir um `404.html` na raiz, então o arquivo é só garantia.
- O app é um PWA. Depois de um deploy novo, a versão nova entra no próximo carregamento da página.

### 5. Manutenção

- O Supabase Free pausa o projeto depois de uma semana sem atividade e não faz backup automático. As mitigações (consulta periódica e exportação) estão no `docs/escopo.md` e ainda não foram feitas.
- Mudou o schema ou uma política? Crie uma migration nova (nunca edite uma já aplicada), adicione o caso em `supabase/tests/rls.test.mjs` e rode `npm run test:rls`.

## Documentação

- `docs/escopo.md`: o quê, por quê, fases e o que está fora do escopo.
- `docs/design.md` e `src/styles/tokens.css`: sistema visual, tema claro (Rubrica) e escuro (Cinco Cabeças).

D&D é marca da Wizards of the Coast. Este projeto não usa logo, arte nem fonte oficial.
