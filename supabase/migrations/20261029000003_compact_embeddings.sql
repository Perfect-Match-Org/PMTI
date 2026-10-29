-- Half precision: 768 bytes a vector instead of 1,536. Cosine similarity stays accurate to about
-- 0.001, far finer than vibe-match scoring needs (it compares differences of 0.05 and more).
alter table public.texts alter column embedding type extensions.halfvec (384) using embedding::extensions.halfvec (384);
