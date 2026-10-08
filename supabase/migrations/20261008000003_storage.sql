-- Muninn: arquivos.
-- assets: imagens dos cards e handouts, caminho = {entity_id}/{arquivo}.
--         A imagem herda a visibilidade do card.
-- rules:  JSON com as regras extras do PHB/DMG (fora do SRD). Só o mestre lê.

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false), ('rules', 'rules', false)
on conflict (id) do nothing;

-- Atenção: é objects.name, qualificado. Sem o prefixo, "name" vira a coluna
-- name de entities dentro da subconsulta e a política falha calada.
create policy "assets: mestre gerencia" on storage.objects
  for all to authenticated
  using (bucket_id = 'assets' and exists (
    select 1 from public.entities e
    where e.id::text = (storage.foldername(objects.name))[1] and public.is_dm(e.campaign_id)))
  with check (bucket_id = 'assets' and exists (
    select 1 from public.entities e
    where e.id::text = (storage.foldername(objects.name))[1] and public.is_dm(e.campaign_id)));

create policy "assets: público vê o revelado" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'assets' and exists (
    select 1 from public.entities e
    where e.id::text = (storage.foldername(objects.name))[1]
      and e.visibility = 'party' and public.is_public_campaign(e.campaign_id)));

create policy "rules: só mestre lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'rules' and exists (
    select 1 from public.campaign_members m
    where m.user_id = auth.uid() and m.role = 'dm'));
