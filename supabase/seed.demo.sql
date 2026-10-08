-- Conteúdo de teste pra Fase 0 (ainda não tem editor).
-- Rode no SQL Editor do Supabase DEPOIS do seed.example.sql.
-- Cria o mesmo cenário do teste de RLS: um NPC revelado com um bloco do grupo e um
-- bloco secreto, e uma facção ainda escondida. No fim, abre o Grimório.
-- Pode rodar de novo: apaga e recria só estes três cards.

do $$
declare
  c  uuid;
  s1 uuid;
  frickz uuid;
  banda  uuid;
begin
  select id into c from campaigns where slug = 'rise-of-tiamat';
  if c is null then
    raise exception 'Campanha rise-of-tiamat não encontrada. Rode o seed.example.sql antes.';
  end if;

  delete from entities where campaign_id = c and name in ('Frickz', 'Banda goblin', 'Oficina do Frickz');

  insert into sessions (campaign_id, number, title, played_on)
  values (c, 1, 'A oficina', current_date)
  on conflict (campaign_id, number) do update set title = excluded.title
  returning id into s1;

  -- Revelado na sessão 1
  insert into entities (campaign_id, type, name, summary, tags, visibility, revealed_in)
  values (c, 'npc', 'Frickz', 'goblin artífice', '{goblin,artífice}', 'party', s1)
  returning id into frickz;

  insert into blocks (entity_id, campaign_id, sort_order, title, body_md, visibility, revealed_in) values
    (frickz, c, 1, 'Oficina',
     E'Melhorou o equipamento do grupo em troca de **sucata de dragão**.\n\n- Cobra em peças de ouro ou em favores\n- Atende só de noite',
     'party', s1),
    (frickz, c, 2, 'Segredo',
     'Pode ter sido da banda goblin que está fugindo do Culto do Dragão.',
     'dm', null),
    (frickz, c, 3, 'Ganchos',
     'Se o grupo trouxer uma escama azul, ele conta onde fica o esconderijo da banda.',
     'dm', null);

  -- Ainda escondida: o anônimo não pode ver nem o card, nem a relação
  insert into entities (campaign_id, type, name, summary, visibility)
  values (c, 'faction', 'Banda goblin', 'fugindo do Culto do Dragão', 'dm')
  returning id into banda;

  insert into blocks (entity_id, campaign_id, title, body_md, visibility)
  values (banda, c, 'Fuga', 'Seis goblins escondidos nos esgotos da cidade.', 'party');

  insert into links (campaign_id, from_id, to_id, label, visibility)
  values (c, frickz, banda, 'ex-integrante de', 'party');

  -- Um lugar revelado, sem blocos, pra lista ter mais de um tipo
  insert into entities (campaign_id, type, name, summary, visibility, revealed_in)
  values (c, 'location', 'Oficina do Frickz', 'porão atrás da taverna', 'party', s1);

  update campaigns set is_public = true where id = c;
end $$;

-- Conferência: o que um player veria (party em campanha aberta)
select e.name, e.visibility as card, b.title as bloco, b.visibility as bloco_vis
from entities e
left join blocks b on b.entity_id = e.id
join campaigns c on c.id = e.campaign_id and c.slug = 'rise-of-tiamat'
order by e.name, b.sort_order;
