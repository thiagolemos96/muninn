-- Muninn: quem chega a tocar em cada tabela pela API.
-- O grant decide se o papel toca na tabela; o RLS decide quais linhas ele vê.
--
-- Dois cenários de Supabase, e esta migration serve pros dois:
-- - "expor tabelas automaticamente" (padrão antigo): toda tabela nova já nasce com
--   TUDO pra anon e authenticated, inclusive TRUNCATE. Por isso o revoke vem primeiro.
-- - padrão novo (projetos desde 30/05/2026, todos a partir de 30/10/2026, changelog 45329):
--   tabela nova nasce sem grant e a API responde "permission denied". Por isso os grants.

revoke all on campaigns, campaign_members, sessions, entities, blocks, links
  from anon, authenticated;

-- Visitante sem login (players pelo link): só lê, e só o que o Grimório usa.
-- campaign_members fica de fora: quem é mestre não é assunto do player.
grant select on campaigns, sessions, entities, blocks, links to anon;

-- Logado (na prática, o mestre): lê e escreve; o RLS barra quem não é mestre.
grant select, insert, update, delete
  on campaigns, campaign_members, sessions, entities, blocks, links to authenticated;

-- Chave de serviço (scripts de admin, nunca no front): acesso total, sem RLS.
grant select, insert, update, delete
  on campaigns, campaign_members, sessions, entities, blocks, links to service_role;
