# Muninn: escopo (v0.2)

Um app só, com duas lentes: o mestre vê a campanha inteira; quem tem o link do Grimório vê só o que foi revelado. O doc da sessão continua sendo o roteiro; o app é a memória da campanha.

## Dores → funcionalidades

| Dor na sessão | O que o app faz | Fase |
| --- | --- | --- |
| Player pergunta do NPC de três sessões atrás | Busca universal: digita três letras, abre o card | 1 |
| Descrição do NPC espalhada em vários docs | Um card por NPC, local, facção, item ou documento | 1 |
| Parar a sessão pra caçar imagem ou documento e mandar no grupo | Botão "Revelar": aparece no Grimório dos players | 2 |
| Consultar regra no meio do combate | Referência de regras com busca e favoritos, offline | 3 |
| Handout feito em site externo e perdido depois | O PNG/WEBP exportado vira card do tipo documento, com texto pesquisável | 4 |

## Módulos

- **M1 Login e campanhas**: só o mestre loga (Google; e-mail e senha desligados). Players abrem o Grimório por link, sem login. Interruptor `is_public` por campanha. Multi-campanha no schema; a v1 roda só a Rise of Tiamat.
- **M2 Compêndio**: card = cabeçalho (nome, tipo, resumo, imagem, tags) + blocos em Markdown, cada bloco com visibilidade. Relações entre cards, também com visibilidade. "Ver como player".
- **M3 Sessões e revelação**: linha do tempo; "Revelar" em card, bloco ou relação grava a sessão; Grimório abre em "Novidades"; revelação ao vivo via Realtime (opcional).
- **M4 Busca universal**: um campo (Ctrl K / lupa) que busca cards, blocos e regras no navegador (MiniSearch), tolerante a acento e erro de digitação.
- **M5 Regras**: condições, ações, maestrias, equipamento, itens mágicos, magias. Favoritos fixados. Offline.
- **M6 Handouts**: criados no [Cthulhu Architect](https://handouts.cthulhuarchitect.com/), exportados em WEBP e importados como card `document` (imagem + texto transcrito + link do original). Nascem secretos.

## Modelo de acesso

- Leitura anônima: só `visibility = 'party'` em campanha com `is_public = true`. Revelar = publicar pra quem tem o link.
- Escrita: só quem tem linha `role = 'dm'` em `campaign_members`.
- Toda regra de acesso vive no RLS (migrations em `supabase/migrations`), validada por `npm run test:rls` (39 checagens).
- Extras: login só Google; depois do primeiro login do mestre, desligar cadastro de usuários novos; `<meta name="robots" content="noindex">` no Grimório.

## Modelo de dados

Tabelas: `campaigns`, `campaign_members`, `sessions`, `entities` (cards), `blocks`, `links`. Tipos de card: `npc`, `location`, `faction`, `item`, `document` (missões e lore entram como `document` com tag por enquanto).

Regra de ouro: o RLS filtra linhas, não colunas. Segredo nunca mora numa linha pública; vai num bloco com `visibility = 'dm'`. A imagem herda a visibilidade do card (`assets/{entity_id}/{arquivo}`).

## Regras de jogo

| Camada | Fonte | Quem vê | Onde mora |
| --- | --- | --- | --- |
| Pública | SRD 5.2.1 (CC-BY-4.0, com atribuição visível) | Todos | JSON estático no bundle, cacheado offline |
| Privada | Banco 2024 do Thiago (PT-BR), extraído do PHB/DMG | Só o mestre | JSON no bucket privado `rules`, baixado após login e guardado em IndexedDB |

O app guarda nome em PT e EN (`name`, `name_en`) e a busca acha pelos dois. O SRD oficial não tem versão em português.

## Hospedagem (tudo no plano grátis)

- **Supabase Free**: 2 projetos ativos, 500 MB de banco, 1 GB de arquivos, 5 GB de egress, 200 conexões realtime. **Pausa após 1 semana sem atividade** (mesa semanal fica no limite) e **não tem backup automático**.
- **Cloudflare Pages Free**: 500 builds/mês, até 20 mil arquivos, 25 MiB por arquivo.
- Mitigações: GitHub Action com consulta leve a cada 3 dias; botão "Exportar campanha (JSON)" + dump semanal do banco; imagens comprimidas em WebP (~1600px) no upload.

## Roadmap

| Fase | Entrega | Horas | Pronto quando |
| --- | --- | --- | --- |
| 0 | Setup: projeto, login Google, deploy, schema + RLS | 4–6 | O teste de invasão passa |
| 1 | Compêndio: cards, blocos, imagens, relações, busca universal, importador JSON | 12–16 | Achei um NPC na mesa em menos de 10 s |
| 2 | Grimório: link público, visão do player, botão Revelar | 8–12 | Os players viram algo revelado na sessão |
| 3 | Regras: SRD + banco próprio, favoritos, offline | 8–10 | Consultei "agarrar" sem internet |
| 4 | Handouts: import do PNG/WEBP como card buscável | 2–4 | Revelei um handout sem caçar arquivo |

Regra: a fase N só começa depois que a N−1 rodou numa sessão real.

## Fora do escopo da v1

- Mapa interativo com pins (na v1, mapa é um card `location` com imagem).
- Visibilidade por player (exige login de player; o papel `player` já está reservado no schema).
- Edição offline com sincronização.
- Iniciativa, dados e mesa virtual.
- Notas de preparo de sessão no app.
- Editor próprio de handouts (ideia futura).

## Decisões já tomadas

- Nome: Muninn, o corvo da memória do Odin. Áreas: Escudo (mestre) e Grimório (players).
- Grimório por link público; login só do mestre.
- Nada do código do Aegis antigo é reaproveitado; só os JSONs de regras.
- Handouts continuam no Cthulhu Architect.
- 5 tipos de card, casados com as 5 cores do design.
- Tema claro (Rubrica) e escuro (Cinco Cabeças), mesma fonte nos dois.

## Em aberto

- O JSON 2024 do Thiago já tem itens, condições e ações? Define o tamanho da extração na Fase 3.
