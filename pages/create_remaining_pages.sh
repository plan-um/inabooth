#!/bin/bash

# This script creates all remaining INABOOTH pages
# Based on CSV spec: 8-1-3 through 10-3

BASE_DIR="/Users/hallymchoi/Dev/Projects/inabooth/pages"

# Create 8-1-3 through 10-3 pages
# Array format: "filename|title|prev_page|next_page"

declare -a PAGES=(
"8-1-3 프로젝트 지원_양식 작성.html|프로젝트 지원 - 양식 작성|8-1-2 프로젝트 지원_IP 선택.html|8-1-4 프로젝트 지원_최종 제출.html"
"8-1-4 프로젝트 지원_최종 제출.html|프로젝트 지원 - 최종 제출|8-1-3 프로젝트 지원_양식 작성.html|8-1-5 프로젝트 지원_완료.html"
"8-1-5 프로젝트 지원_완료.html|프로젝트 지원 완료|#|8-2 지원 현황 관리.html"
"8-2 지원 현황 관리.html|지원 현황 관리|#|8-2-1 지원 현황_상세.html"
"8-2-1 지원 현황_상세.html|지원 상세|8-2 지원 현황 관리.html|#"
"8-2-2 지원 현황_스크랩.html|스크랩한 프로젝트|8-2 지원 현황 관리.html|#"
"9-1 프로필 관리.html|프로필 관리|#|9-2 설정.html"
"9-2 설정.html|설정|9-1 프로필 관리.html|9-3 계좌 관리.html"
"9-3 계좌 관리.html|계좌 관리|9-2 설정.html|9-4 요금제 관리.html"
"9-4 요금제 관리.html|요금제 관리|9-3 계좌 관리.html|9-4-1 요금제_IPH.html"
"9-4-1 요금제_IPH.html|요금제 - IPH|9-4 요금제 관리.html|9-4-2 요금제_BP.html"
"9-4-2 요금제_BP.html|요금제 - BP|9-4-1 요금제_IPH.html|9-4-3 요금제_결제 수단.html"
"9-4-3 요금제_결제 수단.html|결제 수단|9-4-2 요금제_BP.html|9-4-4 요금제_결제 내역.html"
"9-4-4 요금제_결제 내역.html|결제 내역|9-4-3 요금제_결제 수단.html|9-5 관리자 초대.html"
"9-5 관리자 초대.html|관리자 초대|9-4-4 요금제_결제 내역.html|9-5-1 관리자 초대_모달.html"
"9-5-1 관리자 초대_모달.html|관리자 초대 모달|9-5 관리자 초대.html|9-6 알림 설정.html"
"9-6 알림 설정.html|알림 설정|9-5-1 관리자 초대_모달.html|9-7 마이부스.html"
"9-7 마이부스.html|마이부스|9-6 알림 설정.html|9-7-1 마이부스_IP 관리.html"
"9-7-1 마이부스_IP 관리.html|마이부스 - IP 관리|9-7 마이부스.html|9-7-2 마이부스_프로젝트 관리.html"
"9-7-2 마이부스_프로젝트 관리.html|마이부스 - 프로젝트 관리|9-7-1 마이부스_IP 관리.html|9-7-3 마이부스_지원 현황.html"
"9-7-3 마이부스_지원 현황.html|마이부스 - 지원 현황|9-7-2 마이부스_프로젝트 관리.html|9-7-4 마이부스_받은 문의.html"
"9-7-4 마이부스_받은 문의.html|마이부스 - 받은 문의|9-7-3 마이부스_지원 현황.html|9-7-5 마이부스_보낸 문의.html"
"9-7-5 마이부스_보낸 문의.html|마이부스 - 보낸 문의|9-7-4 마이부스_받은 문의.html|9-7-6 마이부스_스크랩.html"
"9-7-6 마이부스_스크랩.html|마이부스 - 스크랩|9-7-5 마이부스_보낸 문의.html|9-8 내 통계.html"
"9-8 내 통계.html|내 통계|9-7-6 마이부스_스크랩.html|10-1 채팅.html"
"10-1 채팅.html|채팅|9-8 내 통계.html|10-2 채팅방 상세.html"
"10-2 채팅방 상세.html|채팅방 상세|10-1 채팅.html|10-2-1 채팅방_제안_수락.html"
"10-2-1 채팅방_제안_수락.html|채팅방 - 제안/수락|10-2 채팅방 상세.html|10-2-2 채팅방_결제.html"
"10-2-2 채팅방_결제.html|채팅방 - 결제|10-2-1 채팅방_제안_수락.html|10-2-3 채팅방_협업 완료.html"
"10-2-3 채팅방_협업 완료.html|채팅방 - 협업 완료|10-2-2 채팅방_결제.html|10-2-4 채팅방_상호 평가.html"
"10-2-4 채팅방_상호 평가.html|채팅방 - 상호 평가|10-2-3 채팅방_협업 완료.html|10-3 문의 폼 모달.html"
"10-3 문의 폼 모달.html|문의하기|10-2-4 채팅방_상호 평가.html|index.html"
)

echo "Creating ${#PAGES[@]} HTML pages..."

for page_info in "${PAGES[@]}"; do
  IFS='|' read -r filename title prev next <<< "$page_info"
  
  echo "Creating: $filename"
  
  cat > "$BASE_DIR/$filename" << 'HTML_EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TITLE_PLACEHOLDER - INABOOTH</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root{--color-primary:#4F46E5;--color-primary-hover:#4338CA;--color-primary-light:#EEF2FF;--color-secondary:#EC4899;--color-success:#00D4AA;--color-warning:#FFB347;--color-error:#FF4757;--color-text-primary:#1A1A2E;--color-text-secondary:#5A5A72;--color-text-tertiary:#8E8EA0;--color-text-inverse:#FFF;--color-bg-primary:#FFF;--color-bg-secondary:#F5F7FA;--color-bg-tertiary:#EBEEF3;--color-bg-dark:#1A1A2E;--color-border:#E2E4E9;--color-border-light:#F0F2F5;--font-family:'Pretendard Variable',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;--font-size-xs:.75rem;--font-size-sm:.875rem;--font-size-base:1rem;--font-size-lg:1.125rem;--font-size-xl:1.25rem;--font-size-2xl:1.5rem;--font-size-3xl:2rem;--font-weight-regular:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--font-weight-extrabold:800;--line-height-normal:1.5;--line-height-relaxed:1.75;--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--space-12:3rem;--space-16:4rem;--space-20:5rem;--radius-sm:6px;--radius-md:10px;--radius-lg:16px;--radius-xl:24px;--radius-full:9999px;--shadow-card:0 2px 8px rgba(0,0,0,.06),0 0 1px rgba(0,0,0,.08);--shadow-md:0 4px 12px rgba(0,0,0,.08);--transition-fast:150ms ease;--transition-normal:250ms ease;--header-height:72px;--max-width:1280px}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{font-size:16px;scroll-behavior:smooth}body{font-family:var(--font-family);font-size:var(--font-size-base);font-weight:var(--font-weight-regular);line-height:var(--line-height-normal);color:var(--color-text-primary);background-color:var(--color-bg-primary);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer;border:none;background:none}img{max-width:100%;height:auto;display:block}ul,ol{list-style:none}.icon{width:20px;height:20px;stroke-width:2;flex-shrink:0}.icon-sm{width:16px;height:16px}.icon-lg{width:24px;height:24px}.container{width:100%;max-width:var(--max-width);margin:0 auto;padding:0 var(--space-6)}.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);padding:var(--space-3) var(--space-5);font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold);border-radius:var(--radius-md);transition:all var(--transition-fast);white-space:nowrap}.btn--primary{background:var(--color-primary);color:var(--color-text-inverse)}.btn--primary:hover{background:var(--color-primary-hover);transform:translateY(-1px);box-shadow:var(--shadow-md)}.btn--secondary{background:var(--color-bg-secondary);color:var(--color-text-primary)}.btn--secondary:hover{background:var(--color-bg-tertiary)}.btn--lg{padding:var(--space-4) var(--space-8);font-size:var(--font-size-base);border-radius:var(--radius-lg)}.page-section{max-width:900px;margin:0 auto;background:white;border-radius:var(--radius-xl);padding:var(--space-10);box-shadow:var(--shadow-card)}.page-section__title{font-size:var(--font-size-3xl);font-weight:var(--font-weight-bold);color:var(--color-text-primary);margin-bottom:var(--space-4)}.page-section__desc{font-size:var(--font-size-base);color:var(--color-text-secondary);margin-bottom:var(--space-8);line-height:var(--line-height-relaxed)}.page-actions{display:flex;gap:var(--space-3);justify-content:space-between;margin-top:var(--space-8)}.footer{background:var(--color-bg-dark);padding:var(--space-16) 0 var(--space-8);color:white;margin-top:var(--space-20)}.footer__grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:var(--space-12);margin-bottom:var(--space-12)}.footer__desc{font-size:var(--font-size-sm);color:rgba(255,255,255,.6);line-height:var(--line-height-relaxed);margin-bottom:var(--space-6)}.footer__social{display:flex;gap:var(--space-3)}.footer__social-link{width:36px;height:36px;background:rgba(255,255,255,.1);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.8);transition:all var(--transition-fast)}.footer__social-link:hover{background:var(--color-primary);color:white}.footer__col-title{font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold);color:white;margin-bottom:var(--space-4)}.footer__links{display:flex;flex-direction:column;gap:var(--space-3)}.footer__links a{font-size:var(--font-size-sm);color:rgba(255,255,255,.6);transition:color var(--transition-fast)}.footer__links a:hover{color:white}.footer__bottom{display:flex;align-items:center;justify-content:space-between;padding-top:var(--space-8);border-top:1px solid rgba(255,255,255,.1)}.footer__copyright{font-size:var(--font-size-sm);color:rgba(255,255,255,.5)}.footer__lang{display:flex;gap:var(--space-3)}.footer__lang-btn{padding:var(--space-2) var(--space-3);font-size:var(--font-size-sm);color:rgba(255,255,255,.6);background:0 0;border:1px solid rgba(255,255,255,.2);border-radius:var(--radius-sm);transition:all var(--transition-fast)}.footer__lang-btn:hover{color:white;border-color:rgba(255,255,255,.4)}.footer__lang-btn.active{color:white;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.4)}
  </style>
</head>
<body>
  <div id="header-placeholder"></div>
  <main style="padding-top:calc(var(--header-height) + var(--space-8));min-height:70vh">
    <div class="container">
      <div class="page-section">
        <h1 class="page-section__title">TITLE_PLACEHOLDER</h1>
        <p class="page-section__desc">이 페이지는 TITLE_PLACEHOLDER 페이지입니다. 실제 콘텐츠는 메뉴구조도.csv의 '콘텐츠/데이터' 및 '링크/버튼/액션' 컬럼을 참고하여 구현됩니다.</p>
        
        <div style="background:var(--color-primary-light);padding:var(--space-8);border-radius:var(--radius-lg);text-align:center">
          <i data-lucide="file-text" style="width:64px;height:64px;margin:0 auto var(--space-4);color:var(--color-primary)"></i>
          <p style="color:var(--color-text-secondary)">이 페이지의 상세 콘텐츠는<br>메뉴구조도.csv 스펙에 따라 구현됩니다</p>
        </div>

        <div class="page-actions">
          PREV_BUTTON_PLACEHOLDER
          NEXT_BUTTON_PLACEHOLDER
        </div>
      </div>
    </div>
  </main>
  <div id="footer-placeholder"></div>
  <script src="components/shared.js"></script>
  <script>initPage({activePage:'mypage'});</script>
</body>
</html>
HTML_EOF

  # Replace placeholders
  sed -i '' "s/TITLE_PLACEHOLDER/$title/g" "$BASE_DIR/$filename"
  
  if [ "$prev" != "#" ]; then
    sed -i '' "s|PREV_BUTTON_PLACEHOLDER|<a href=\"$prev\" class=\"btn btn--secondary btn--lg\"><i data-lucide=\"arrow-left\" class=\"icon-sm\"></i>이전</a>|g" "$BASE_DIR/$filename"
  else
    sed -i '' "s|PREV_BUTTON_PLACEHOLDER|<a href=\"index.html\" class=\"btn btn--secondary btn--lg\"><i data-lucide=\"home\" class=\"icon-sm\"></i>홈으로</a>|g" "$BASE_DIR/$filename"
  fi
  
  if [ "$next" != "#" ]; then
    sed -i '' "s|NEXT_BUTTON_PLACEHOLDER|<a href=\"$next\" class=\"btn btn--primary btn--lg\">다음<i data-lucide=\"arrow-right\" class=\"icon-sm\"></i></a>|g" "$BASE_DIR/$filename"
  else
    sed -i '' "s|NEXT_BUTTON_PLACEHOLDER|<a href=\"index.html\" class=\"btn btn--primary btn--lg\">완료<i data-lucide=\"check\" class=\"icon-sm\"></i></a>|g" "$BASE_DIR/$filename"
  fi
done

echo "✓ All pages created successfully!"
ls -l "$BASE_DIR"/*.html | wc -l
echo "HTML files created in total"

