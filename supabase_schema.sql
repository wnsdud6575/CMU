-- ==================================================
-- 1. 테이블 생성 (스키마 세팅)
-- ==================================================

-- 물품 기본 정보 테이블 (items)
CREATE TABLE public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_code TEXT DEFAULT 'Z',
    sub_type TEXT DEFAULT 'tablecloth',
    laundry_method TEXT,
    location TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 사이즈별 재고 테이블 (item_sizes)
-- 한 아이템에 여러 사이즈/색상 재고가 물립니다.
CREATE TABLE public.item_sizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    total_qty INTEGER DEFAULT 0,
    available_qty INTEGER DEFAULT 0
);

-- 타 부서 연동 안내 테이블 (external_deps)
-- 물품을 대여할 때 타 부서의 테이블/집기가 필요한 경우 안내합니다.
CREATE TABLE public.external_deps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    ext_name TEXT NOT NULL,
    ext_manager TEXT NOT NULL,
    ext_location TEXT NOT NULL
);


-- ==================================================
-- 2. 초기 데이터 (Seed Data) 자동 입력
-- (제공해주신 PPT 내용을 기반으로 작성되었습니다)
-- ==================================================

-- [1] 케이터링 테이블보 (화이트/네이비)
WITH new_item AS (
  INSERT INTO public.items (name, category_code, laundry_method, location, photo_url)
  VALUES ('케이터링 테이블보', 'Z', '전문 세탁소 의뢰', '지하 1층 의상창고', '/catering.png')
  RETURNING id
)
INSERT INTO public.external_deps (item_id, ext_name, ext_manager, ext_location)
SELECT id, '케이터링 테이블', '부녀회', '지하 1층 창고' FROM new_item;

WITH item_ref AS (SELECT id FROM public.items WHERE name = '케이터링 테이블보' LIMIT 1)
INSERT INTO public.item_sizes (item_id, size_label, total_qty, available_qty)
VALUES 
  ((SELECT id FROM item_ref), '화이트', 19, 19),
  ((SELECT id FROM item_ref), '네이비', 20, 20);

-- [2] 상담 테이블보 (화이트/옥수)
WITH new_item AS (
  INSERT INTO public.items (name, category_code, laundry_method, location, photo_url)
  VALUES ('상담 테이블보', 'Z', '전문 세탁소 의뢰', '지하 1층 의상창고', '/counseling.png')
  RETURNING id
)
INSERT INTO public.external_deps (item_id, ext_name, ext_manager, ext_location)
SELECT id, '교육관 책상(2개 한조)', '교육관 관리팀', '3층 모든 교육관' FROM new_item;

WITH item_ref AS (SELECT id FROM public.items WHERE name = '상담 테이블보' LIMIT 1)
INSERT INTO public.item_sizes (item_id, size_label, total_qty, available_qty)
VALUES 
  ((SELECT id FROM item_ref), '화이트', 81, 81),
  ((SELECT id FROM item_ref), '옥수', 73, 73);

-- [3] 1층 정사각형 테이블보 (베이지/옥수)
WITH new_item AS (
  INSERT INTO public.items (name, category_code, laundry_method, location, photo_url)
  VALUES ('1층 정사각형 테이블보', 'Z', '전문 세탁소 의뢰', '지하 1층 의상창고', '/square.png')
  RETURNING id
)
INSERT INTO public.external_deps (item_id, ext_name, ext_manager, ext_location)
SELECT id, '1층 정사각형 테이블', '홍보관', '1층 홍보관' FROM new_item;

WITH item_ref AS (SELECT id FROM public.items WHERE name = '1층 정사각형 테이블보' LIMIT 1)
INSERT INTO public.item_sizes (item_id, size_label, total_qty, available_qty)
VALUES 
  ((SELECT id FROM item_ref), '베이지', 17, 17),
  ((SELECT id FROM item_ref), '옥수', 17, 17);

-- [4] 7층 원형 테이블보 (옥수/베이지/핑크)
WITH new_item AS (
  INSERT INTO public.items (name, category_code, laundry_method, location, photo_url)
  VALUES ('7층 원형 테이블보', 'Z', '전문 세탁소 의뢰', '지하 1층 의상창고', '/round_7f.png')
  RETURNING id
)
INSERT INTO public.external_deps (item_id, ext_name, ext_manager, ext_location)
SELECT id, '7층 원형 테이블', '부녀회/운영팀', '7층 로비' FROM new_item;

WITH item_ref AS (SELECT id FROM public.items WHERE name = '7층 원형 테이블보' LIMIT 1)
INSERT INTO public.item_sizes (item_id, size_label, total_qty, available_qty)
VALUES 
  ((SELECT id FROM item_ref), '옥수', 19, 19),
  ((SELECT id FROM item_ref), '베이지', 20, 20),
  ((SELECT id FROM item_ref), '핑크', 16, 16);

-- [5] 야외 테이블보 (화이트)
WITH new_item AS (
  INSERT INTO public.items (name, category_code, laundry_method, location, photo_url)
  VALUES ('야외 테이블보', 'Z', '오염 제거 및 부분 세탁', '지하 1층 의상창고', '/outdoor.png')
  RETURNING id
)
INSERT INTO public.external_deps (item_id, ext_name, ext_manager, ext_location)
SELECT id, '야외 접이식 테이블', '관리팀', '지하 1층 창고' FROM new_item;

WITH item_ref AS (SELECT id FROM public.items WHERE name = '야외 테이블보' LIMIT 1)
INSERT INTO public.item_sizes (item_id, size_label, total_qty, available_qty)
VALUES 
  ((SELECT id FROM item_ref), '화이트 (180*75cm)', 9, 9),
  ((SELECT id FROM item_ref), '화이트 (180*60cm)', 1, 1);

-- ==================================================
-- 3. 대여 신청 및 현황 관리 테이블 (rentals) 추가
-- ==================================================
CREATE TABLE public.rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department TEXT NOT NULL,
    requester TEXT NOT NULL,
    contact TEXT NOT NULL,
    purpose TEXT,
    items_summary TEXT, -- 대여 품목 요약 (예: "상담 테이블보(화이트) 2개")
    lines JSONB NOT NULL, -- 상세 대여 내역 배열
    pickup_date DATE,
    event_date DATE,
    return_due_date DATE,
    status TEXT DEFAULT 'requested', -- requested, approved, renting, return-req, returned, rejected
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 설정 및 익명 읽기/쓰기 허용 정책 추가
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read on rentals" ON public.rentals
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on rentals" ON public.rentals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on rentals" ON public.rentals
    FOR UPDATE USING (true) WITH CHECK (true);
