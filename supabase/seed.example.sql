-- Rode no SQL Editor do Supabase DEPOIS do teu primeiro login com Google.
-- Troque <TEU-EMAIL> pelo e-mail da conta Google que você usou no login.
-- (O nome é .example de propósito: o Supabase CLI roda seed.sql sozinho em alguns comandos.)

insert into campaigns (name, slug, is_public)
values ('Rise of Tiamat', 'rise-of-tiamat', false);  -- troque pra true quando quiser abrir o Grimório

insert into campaign_members (campaign_id, user_id, role)
select c.id, u.id, 'dm'
from campaigns c, auth.users u
where c.slug = 'rise-of-tiamat' and u.email = '<TEU-EMAIL>';

-- Conferência: deve devolver 1 linha com role = dm
select c.name, m.role
from campaign_members m join campaigns c on c.id = m.campaign_id;
