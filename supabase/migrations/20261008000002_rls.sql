-- Muninn: quem vê o quê.
-- Só o mestre faz login. O resto do mundo é anônimo e vê apenas o que
-- está marcado 'party' numa campanha com is_public = true.

-- Quem é mestre. security definer: roda como dono da função,
-- então não cai em loop de RLS ao consultar campaign_members.
create function is_dm(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = c and user_id = auth.uid() and role = 'dm'
  );
$$;

-- Grimório aberto? É o interruptor de cada campanha.
create function is_public_campaign(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_public from public.campaigns where id = c), false);
$$;

alter table campaigns        enable row level security;
alter table campaign_members enable row level security;
alter table sessions         enable row level security;
alter table entities         enable row level security;
alter table blocks           enable row level security;
alter table links            enable row level security;

-- Campanha e mesa
create policy "campanha aberta é pública" on campaigns
  for select to anon, authenticated using (is_public or is_dm(id));
create policy "mestre edita a campanha" on campaigns
  for update to authenticated using (is_dm(id)) with check (is_dm(id));
create policy "mestre gerencia a mesa" on campaign_members
  for all to authenticated using (is_dm(campaign_id)) with check (is_dm(campaign_id));

-- Sessões: públicas na campanha aberta; só o mestre escreve
create policy "público lê sessões" on sessions
  for select to anon, authenticated using (is_public_campaign(campaign_id));
create policy "mestre gerencia sessões" on sessions
  for all to authenticated using (is_dm(campaign_id)) with check (is_dm(campaign_id));

-- Cards
create policy "mestre: tudo" on entities
  for all to authenticated using (is_dm(campaign_id)) with check (is_dm(campaign_id));
create policy "público: só o revelado" on entities
  for select to anon, authenticated
  using (visibility = 'party' and is_public_campaign(campaign_id));

-- Blocos: o bloco E o card precisam estar revelados
create policy "mestre: tudo" on blocks
  for all to authenticated using (is_dm(campaign_id)) with check (is_dm(campaign_id));
create policy "público: só o revelado" on blocks
  for select to anon, authenticated
  using (
    visibility = 'party' and is_public_campaign(campaign_id)
    and exists (select 1 from entities e
                where e.id = blocks.entity_id and e.visibility = 'party')
  );

-- Relações: a relação E os dois cards precisam estar revelados
create policy "mestre: tudo" on links
  for all to authenticated using (is_dm(campaign_id)) with check (is_dm(campaign_id));
create policy "público: só o revelado" on links
  for select to anon, authenticated
  using (
    visibility = 'party' and is_public_campaign(campaign_id)
    and exists (select 1 from entities e where e.id = links.from_id and e.visibility = 'party')
    and exists (select 1 from entities e where e.id = links.to_id   and e.visibility = 'party')
  );
