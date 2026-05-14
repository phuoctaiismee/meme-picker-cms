-- Run this in your Supabase SQL Editor
create extension if not exists vector;

create table if not exists semantic_cache (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768),
  meme_ids jsonb not null,
  created_at timestamp with time zone default now()
);

create index on semantic_cache using ivfflat (embedding vector_cosine_ops);

-- RPC for semantic search
create or replace function match_semantic_cache (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  meme_ids jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    semantic_cache.id,
    semantic_cache.content,
    semantic_cache.meme_ids,
    1 - (semantic_cache.embedding <=> query_embedding) as similarity
  from semantic_cache
  where 1 - (semantic_cache.embedding <=> query_embedding) > match_threshold
  order by semantic_cache.embedding <=> query_embedding
  limit match_count;
end;
$$;
