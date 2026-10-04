alter table public.posts
  add column if not exists pet_name text;

alter table public.posts
  drop constraint if exists posts_pet_name_len;

alter table public.posts
  add constraint posts_pet_name_len check (pet_name is null or char_length(pet_name) between 1 and 12);

update public.posts
set pet_name = case title
  when '노란 왕관앵무 루비' then '루비'
  when '수다쟁이 샴 모카' then '모카'
  when '느긋한 시츄 몽실' then '몽실'
  when '동글동글 브리티시숏헤어 치즈' then '치즈'
  when '듬직한 진돗개 한별' then '한별'
  when '말 잘하는 사랑앵무 피코' then '피코'
  when '손 위에 올라오는 레오파드게코 레오' then '레오'
  when '포근한 랙돌 구름' then '구름'
  when '소리에 익숙한 기니피그 콩콩' then '콩콩'
  when '웃는 얼굴 웰시코기 두부' then '두부'
  when '조용한 러시안블루 하늘' then '하늘'
  when '볼주머니 골든햄스터 모찌' then '모찌'
  when '붉은 베타 빨강이' then '빨강이'
  when '애교 많은 포메라니안 콩이' then '콩이'
  when '건초를 좋아하는 토끼 토리' then '토리'
  when '무릎냥이 코리안숏헤어 나비' then '나비'
  when '사람 좋아하는 2살 말티즈 코코' then '코코'
  when '밤 산책 크레스티드게코 크림' then '크림'
  when '동글동글 금붕어 금이' then '금이'
  when '순한 믹스 보리, 새 가족이 급해요' then '보리'
  else pet_name
end
where pet_name is null;
