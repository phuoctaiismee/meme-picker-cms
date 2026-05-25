-- 1. Bật extension vector nếu chưa có
create extension if not exists vector;

-- 2. Thêm cột embedding vào bảng tags để chứa vector GTE 768 chiều
alter table tags add column if not exists embedding vector(768);

-- 3. Tạo index ivfflat cho tags.embedding sử dụng vector_cosine_ops
create index if not exists tags_embedding_idx on tags using ivfflat (embedding vector_cosine_ops);

-- 4. RPC để so khớp ngữ nghĩa và tìm kiếm Tag có độ tương đồng Cosine gần nhất
create or replace function match_tags (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id int8,
  name text,
  slug text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    tags.id::int8,
    tags.name::text,
    tags.slug::text,
    (1 - (tags.embedding <=> query_embedding))::float as similarity
  from tags
  where tags.embedding is not null
    and 1 - (tags.embedding <=> query_embedding) > match_threshold
  order by tags.embedding <=> query_embedding
  limit match_count;
end;
$$;
