-- Kenzie Birthday tribute schema

create extension if not exists "pgcrypto";

-- Site settings (single-row style)
create table if not exists public.site_settings (
  id text primary key default 'default',
  marquee_text text not null default '★ happy birthday kenzie ★ we love you ★ make a wish ★',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, marquee_text)
values ('default', '★ happy birthday kenzie ★ we love you ★ make a wish ★')
on conflict (id) do nothing;

-- Love notes
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  message text not null,
  image_url text,
  anchor_x float not null default 0.5,
  anchor_y float not null default 0.5,
  created_at timestamptz not null default now()
);

-- Shared collage layers
create table if not exists public.canvas_layers (
  id uuid primary key default gen_random_uuid(),
  author_name text,
  layer_type text not null check (layer_type in ('accessory', 'stroke', 'effect')),
  asset_id text,
  transform jsonb not null default '{}'::jsonb,
  stroke_data jsonb,
  settings jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists comments_created_at_idx on public.comments (created_at desc);
create index if not exists canvas_layers_created_at_idx on public.canvas_layers (created_at asc);

-- RLS
alter table public.site_settings enable row level security;
alter table public.comments enable row level security;
alter table public.canvas_layers enable row level security;

-- Public read
create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

create policy "Public read comments"
  on public.comments for select
  using (true);

create policy "Public read canvas_layers"
  on public.canvas_layers for select
  using (true);

-- Public insert (comments + layers)
create policy "Public insert comments"
  on public.comments for insert
  with check (
    char_length(author_name) between 1 and 60
    and char_length(message) between 1 and 500
  );

create policy "Public insert canvas_layers"
  on public.canvas_layers for insert
  with check (true);

-- Updates to settings via service role only (no public update policy)

-- Storage bucket for tribute uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tribute-uploads',
  'tribute-uploads',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Public read tribute uploads"
  on storage.objects for select
  using (bucket_id = 'tribute-uploads');

create policy "Public upload tribute images"
  on storage.objects for insert
  with check (
    bucket_id = 'tribute-uploads'
    and (storage.extension(name) = any (array['jpg', 'jpeg', 'png', 'webp', 'gif']))
  );

-- Realtime
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.canvas_layers;
alter publication supabase_realtime add table public.site_settings;
