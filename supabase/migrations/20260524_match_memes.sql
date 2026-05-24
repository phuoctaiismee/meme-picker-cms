-- Enable vector extension if not already done
create extension if not exists vector;

-- Drop existing function if exists to avoid signature/return type mismatch
drop function if exists match_memes(vector, double precision, integer);

-- RPC for direct semantic search on memes
create or replace function match_memes (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    memes.id,
    (1 - (memes.embedding <=> query_embedding))::float as similarity
  from memes
  where 
    memes.is_active = true
    and memes.embedding is not null
    and 1 - (memes.embedding <=> query_embedding) > match_threshold
  order by memes.embedding <=> query_embedding
  limit match_count;
end;
$$;
