-- Expunge — Add source_file column to cases table
-- The upload API inserts source_file but the column was missing from schema

alter table public.cases
  add column if not exists source_file text;

comment on column public.source_file is 'Original filename of the uploaded credit report';
