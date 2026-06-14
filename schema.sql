-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous reads, inserts, updates, and deletes
CREATE POLICY "Allow anonymous operations on inventory" ON public.inventory
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- NOTE: 
-- 1. 이 SQL 스크립트를 Supabase 대시보드의 SQL Editor에 붙여넣어 실행하세요.
-- 2. 제품 포장지 사진 업로드를 위해 Supabase Storage 대시보드에서 
--    'food-images'라는 이름의 Public 스토리지 버킷을 반드시 생성해 주세요.
