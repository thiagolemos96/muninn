-- Muninn: schema base.
-- Modelo: card (entities) + blocos (blocks) com visibilidade própria.
-- RLS filtra linhas, não colunas: segredo nunca mora numa linha pública,
-- vai num bloco com visibility = 'dm'.

-- Tipos
create type member_role as enum ('dm', 'player');  -- 'player' fica pra v2 (login opcional)
create type visibility  as enum ('dm', 'party');
create type entity_type as enum ('npc', 'location', 'faction', 'item', 'document');
-- Os 5 tipos batem com as 5 cores do design. Missões e lore entram como
-- document com tag, até virarem um recurso próprio.

-- Campanhas; is_public abre ou fecha o Grimório pra quem tem o link
create table campaigns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  is_public  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Quem é mestre de cada campanha
create table campaign_members (
  campaign_id uuid not null references campaigns on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  role        member_role not null,
  primary key (campaign_id, user_id)
);

-- Sessões: só conteúdo que o grupo pode ver. A sessão atual é a de maior número.
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns on delete cascade,
  number      int  not null,
  title       text,
  played_on   date,
  recap_md    text,
  unique (campaign_id, number)
);

-- Cards: o cabeçalho é o que o player sabe quando o card é revelado
create table entities (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns on delete cascade,
  type        entity_type not null,
  name        text not null,
  summary     text,
  image_path  text,
  tags        text[] not null default '{}',
  visibility  visibility not null default 'dm',
  revealed_in uuid references sessions on delete set null,
  updated_at  timestamptz not null default now(),
  unique (id, campaign_id)  -- alvo das FKs compostas abaixo
);

-- Blocos: cada seção de texto tem a própria visibilidade
create table blocks (
  id          uuid primary key default gen_random_uuid(),
  entity_id   uuid not null,
  campaign_id uuid not null,
  sort_order  int  not null default 0,
  title       text,
  body_md     text not null default '',
  visibility  visibility not null default 'dm',
  revealed_in uuid references sessions on delete set null,
  foreign key (entity_id, campaign_id)
    references entities (id, campaign_id) on delete cascade
);

-- Relações entre cards ("conhece", "está em", "membro de")
create table links (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  from_id     uuid not null,
  to_id       uuid not null,
  label       text not null,
  visibility  visibility not null default 'dm',
  revealed_in uuid references sessions on delete set null,
  foreign key (from_id, campaign_id) references entities (id, campaign_id) on delete cascade,
  foreign key (to_id,   campaign_id) references entities (id, campaign_id) on delete cascade
);

create index on blocks (entity_id);
create index on links (from_id);
create index on links (to_id);
