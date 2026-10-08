-- Muninn: quem chega a tocar em cada tabela pela API.
-- Projetos Supabase criados depois de 30/05/2026 não dão mais grant automático nas
-- tabelas novas do public (changelog 45329). Sem grant, a API responde
-- "permission denied" antes mesmo de o RLS olhar a linha.
-- O grant decide se o papel toca na tabela; o RLS decide quais linhas ele vê.

-- Visitante sem login (players pelo link): só lê, e só o que o Grimório usa.
-- campaign_members fica de fora: quem é mestre não é assunto do player.
grant select on campaigns, sessions, entities, blocks, links to anon;

-- Logado (na prática, o mestre): lê e escreve; o RLS barra quem não é mestre.
grant select, insert, update, delete
  on campaigns, campaign_members, sessions, entities, blocks, links to authenticated;

-- Chave de serviço (scripts de admin, nunca no front): acesso total, sem RLS.
grant select, insert, update, delete
  on campaigns, campaign_members, sessions, entities, blocks, links to service_role;
