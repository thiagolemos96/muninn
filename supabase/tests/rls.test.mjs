// Testa o schema e as políticas RLS num Postgres em memória (PGlite), sem Docker.
// Carrega stubs.sql (imitação do Supabase) e depois todas as migrations em ordem.
// Uso: npm run test:rls   (precisa de @electric-sql/pglite como devDependency)
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');
const sqlFiles = [
  path.join(here, 'stubs.sql'),
  ...fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort().map((f) => path.join(migrationsDir, f)),
];

const db = new PGlite();
const run = (sql) => db.exec(sql);
const q = async (sql) => (await db.query(sql)).rows;
const changed = async (sql) => (await db.query(sql)).affectedRows;

let pass = 0, fail = 0;
const check = (label, cond, extra = '') => {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label + ' ' + extra); }
};
const expectError = async (label, fn, pattern) => {
  try { await fn(); check(label, false, '(no error)'); }
  catch (e) { check(label, pattern.test(e.message), `(got: ${e.message})`); }
};

for (const f of sqlFiles) await run(fs.readFileSync(f, 'utf8'));
// O Supabase concede isso por padrão. As tabelas do public ficam de fora de propósito:
// desde 30/05/2026 o grant delas vem da migration de grants, e é ela que este teste valida.
await run(`grant usage on schema public, auth, storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;`);
console.log(`carregados: ${sqlFiles.map((f) => path.basename(f)).join(', ')}`);

check('buckets assets e rules existem e são privados',
  Number((await q(`select count(*) as n from storage.buckets where id in ('assets','rules') and public = false`))[0].n) === 2);

// ---------- grants: o que cada papel alcança antes do RLS ----------
// Pelo oid, não pelo nome: o Postgres não garante a ordem do WHERE, e montar 'public.' || nome
// pra uma tabela de outro schema quebra a consulta.
const tablesWhere = async (cond) => (await q(`select c.relname as t from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and ${cond} order by 1`)).map((r) => r.t).join(',');
const can = (role, priv) => `has_table_privilege('${role}', c.oid, '${priv}')`;
check('grants: anônimo só lê, e só as 5 tabelas do Grimório',
  (await tablesWhere(can('anon', 'select'))) === 'blocks,campaigns,entities,links,sessions'
  && (await tablesWhere(can('anon', 'insert, update, delete'))) === '');
check('grants: logado lê e escreve em toda tabela do public (tabela nova sem grant falha aqui)',
  (await tablesWhere(`not (${['select', 'insert', 'update', 'delete'].map((p) => can('authenticated', p)).join(' and ')})`)) === '');

const DM = '11111111-1111-4111-8111-111111111111';
const X  = '33333333-3333-4333-8333-333333333333';
await run(`insert into auth.users values ('${DM}','mestre@example.com'),('${X}','estranho@example.com')`);

// bootstrap pelo SQL Editor do Supabase: campanhas, mestre e o JSON de regras privado
const [{ id: C }] = await q(`insert into campaigns(name, slug, is_public) values ('Rise of Tiamat','rise-of-tiamat', true) returning id`);
const [{ id: C2 }] = await q(`insert into campaigns(name, slug) values ('Ordem do Eclipse','ordem-do-eclipse') returning id`);
await run(`insert into campaign_members values ('${C}','${DM}','dm'), ('${C2}','${DM}','dm')`);
await run(`insert into storage.objects(bucket_id, name) values ('rules','phb-extra.json')`);

const asUser = (id, email) => run(
  `reset role; select set_config('request.jwt.claims', '${JSON.stringify({ sub: id, email })}', false); set role authenticated;`);
const asAnon = () => run(`reset role; select set_config('request.jwt.claims', '', false); set role anon;`);

// ---------- mestre monta o conteúdo pelo próprio app (passa pelo RLS) ----------
console.log('\nMestre');
await asUser(DM, 'mestre@example.com');
const [{ id: S1 }] = await q(`insert into sessions(campaign_id, number, title) values ('${C}', 1, 'A oficina') returning id`);
const [{ id: E1 }] = await q(`insert into entities(campaign_id, type, name, summary, visibility, revealed_in)
  values ('${C}','npc','Frickz','Goblin artífice que melhorou o equipamento do grupo','party','${S1}') returning id`);
const [{ id: E2 }] = await q(`insert into entities(campaign_id, type, name) values ('${C}','faction','Banda goblin') returning id`);
const [{ id: E3 }] = await q(`insert into entities(campaign_id, type, name, visibility) values ('${C2}','npc','NPC da campanha fechada','party') returning id`);
await run(`insert into blocks(entity_id, campaign_id, title, body_md, visibility) values
  ('${E1}','${C}','Oficina','Onde encontrar e o que cobra','party'),
  ('${E1}','${C}','Segredo','Possível ex-integrante da banda goblin','dm'),
  ('${E2}','${C}','Fuga','Fugindo do Culto do Dragão','party'),
  ('${E3}','${C2}','Rumor','Bloco revelado, mas a campanha está fechada','party')`);
await run(`insert into links(campaign_id, from_id, to_id, label, visibility) values ('${C}','${E1}','${E2}','amigo de','party')`);
await run(`insert into storage.objects(bucket_id, name) values
  ('assets','${E1}/retrato.webp'), ('assets','${E2}/brasao.webp'), ('assets','${E3}/fechada.webp')`);
check('mestre vê os 3 cards nas 2 campanhas', (await q('select * from entities')).length === 3);
check('mestre vê os 4 blocos', (await q('select * from blocks')).length === 4);
check('mestre lê o JSON de regras privado', (await q(`select * from storage.objects where bucket_id = 'rules'`)).length === 1);
await expectError('FK composta barra bloco apontando pra card de outra campanha',
  () => run(`insert into blocks(entity_id, campaign_id, body_md) values ('${E3}','${C}','x')`), /foreign key/);

// ---------- visitante sem login (é assim que os players entram) ----------
// O anônimo só tem SELECT (migration de grants): escrita dele falha na permissão, antes do RLS.
// O logado sem papel tem o grant, então quem barra é o RLS (0 linhas ou erro de RLS).
const visitorChecks = async (who, { anon }) => {
  const writeBlocked = async (label, sql) => anon
    ? expectError(label, () => run(sql), /permission denied/)
    : check(label, (await changed(sql)) === 0);
  const ents = await q('select name from entities');
  check(`${who}: vê só o Frickz`, ents.length === 1 && ents[0].name === 'Frickz', JSON.stringify(ents));
  const blks = await q('select title from blocks');
  check(`${who}: vê só o bloco "Oficina"`, blks.length === 1 && blks[0].title === 'Oficina', JSON.stringify(blks));
  check(`${who}: não vê a relação com card escondido`, (await q('select * from links')).length === 0);
  check(`${who}: vê a sessão 1 e nenhuma da campanha fechada`, (await q('select * from sessions')).length === 1);
  check(`${who}: só a campanha aberta aparece`, (await q('select * from campaigns')).length === 1);
  if (anon) await expectError(`${who}: não vê quem é mestre`, () => q('select * from campaign_members'), /permission denied/);
  else check(`${who}: não vê quem é mestre`, (await q('select * from campaign_members')).length === 0);
  const objs = await q('select name from storage.objects');
  check(`${who}: vê só a imagem do Frickz (nem regras privadas, nem campanha fechada)`,
    objs.length === 1 && objs[0].name.endsWith('retrato.webp'), JSON.stringify(objs));
  await writeBlocked(`${who}: não altera card`, `update entities set name = 'hack'`);
  await writeBlocked(`${who}: não revela card sozinho`, `update entities set visibility = 'party' where id = '${E2}'`);
  await writeBlocked(`${who}: não abre a campanha fechada`, `update campaigns set is_public = true where id = '${C2}'`);
  await expectError(`${who}: não insere bloco`,
    () => run(`insert into blocks(entity_id, campaign_id, body_md) values ('${E1}','${C}','x')`),
    anon ? /permission denied/ : /row-level security/);
  await expectError(`${who}: não sobe imagem`,
    () => run(`insert into storage.objects(bucket_id, name) values ('assets','${E1}/x.webp')`), /row-level security/);
};

console.log('\nVisitante sem login (link do Grimório)');
await asAnon();
await visitorChecks('anônimo', { anon: true });
await expectError('anônimo: não se coloca na mesa',
  () => run(`insert into campaign_members values ('${C}','${X}','dm')`), /permission denied/);

console.log('\nLogado com Google, mas não é mestre');
await asUser(X, 'estranho@example.com');
await visitorChecks('logado sem papel', { anon: false });
await expectError('logado sem papel: não se promove a mestre',
  () => run(`insert into campaign_members values ('${C}','${X}','dm')`), /row-level security/);

// ---------- revelação ----------
console.log('\nMestre revela a banda');
await asUser(DM, 'mestre@example.com');
check('update de revelação afeta 1 linha',
  (await changed(`update entities set visibility = 'party', revealed_in = '${S1}' where id = '${E2}'`)) === 1);
await asAnon();
check('anônimo agora vê 2 cards', (await q('select * from entities')).length === 2);
check('relação aparece quando os dois cards estão revelados', (await q('select * from links')).length === 1);
check('bloco "Fuga" aparece; "Segredo" continua escondido',
  JSON.stringify((await q('select title from blocks order by title')).map((r) => r.title)) === '["Fuga","Oficina"]');
check('imagem da banda liberada junto; regras e campanha fechada continuam fora',
  (await q('select * from storage.objects')).length === 2);

// ---------- interruptor ----------
console.log('\nMestre fecha o Grimório');
await asUser(DM, 'mestre@example.com');
check('mestre fecha a campanha (1 linha)', (await changed(`update campaigns set is_public = false where id = '${C}'`)) === 1);
await asAnon();
const leak = (await q(`select (select count(*) from campaigns) + (select count(*) from entities) + (select count(*) from blocks)
  + (select count(*) from links) + (select count(*) from sessions) + (select count(*) from storage.objects) as n`))[0].n;
check('com o Grimório fechado, o anônimo não vê nada', Number(leak) === 0, `(viu ${leak})`);
await asUser(DM, 'mestre@example.com');
check('o mestre continua vendo tudo', (await q('select * from entities')).length === 3);

console.log(`\n${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
