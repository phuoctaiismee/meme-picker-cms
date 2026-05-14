-- 1. Bật extension vector
create extension if not exists vector;

-- 2. Thêm cột embedding vào bảng interactions để làm Semantic Cache
alter table interactions add column if not exists embedding vector(768);

-- 3. Tạo index cho cả 2 bảng để tìm kiếm thần tốc
create index if not exists memes_embedding_idx on memes using ivfflat (embedding vector_cosine_ops);
create index if not exists interactions_embedding_idx on interactions using ivfflat (embedding vector_cosine_ops);

-- 4. RPC để tìm kiếm các tương tác (gợi ý) tương tự trong quá khứ
create or replace function match_past_suggestions (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id int8,
  meme_id uuid,
  context_metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    interactions.id,
    interactions.meme_id,
    interactions.context_metadata,
    1 - (interactions.embedding <=> query_embedding) as similarity
  from interactions
  where 
    interactions.action_type = 'ai_suggestion' 
    and 1 - (interactions.embedding <=> query_embedding) > match_threshold
  order by interactions.embedding <=> query_embedding
  limit match_count;
end;
$$;
