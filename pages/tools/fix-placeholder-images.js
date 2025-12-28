#!/usr/bin/env node
/**
 * INABOOTH Placeholder Image Fixer
 * =================================
 * gradient 배경 placeholder div를 실제 이미지로 교체합니다.
 *
 * 사용법:
 *   node tools/fix-placeholder-images.js         # 전체 수정
 *   node tools/fix-placeholder-images.js --dry   # 미리보기 (수정 안함)
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  pagesDir: path.resolve(__dirname, '..'),
  // 이미지 타입별 더미 이미지
  images: {
    project: 'https://picsum.photos/seed/project{n}/400/300',
    character: 'https://picsum.photos/seed/char{n}/300/300',
    avatar: 'https://i.pravatar.cc/150?img={n}',
    brand: 'https://picsum.photos/seed/brand{n}/200/200',
    thumbnail: 'https://picsum.photos/seed/thumb{n}/100/100'
  }
};

let imageCounter = 1;

/**
 * Gradient placeholder를 이미지로 교체
 */
function fixPlaceholderImages(htmlContent, fileName) {
  let fixedContent = htmlContent;
  let fixCount = 0;

  // 패턴 1: 100x100 썸네일 (프로젝트 카드 등)
  const thumbPattern = /<div\s+style="[^"]*width:\s*100px[^"]*height:\s*100px[^"]*background:\s*linear-gradient[^"]*"[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(thumbPattern, (match) => {
    fixCount++;
    const imgUrl = CONFIG.images.thumbnail.replace('{n}', imageCounter++);
    return `<img src="${imgUrl}" alt="프로젝트 이미지" style="width:100px;height:100px;border-radius:var(--radius-md);object-fit:cover;flex-shrink:0">`;
  });

  // 패턴 2: 큰 프로젝트/캐릭터 이미지 (200x200 이상)
  const largePattern = /<div\s+style="[^"]*(?:width|height):\s*(?:1[5-9]\d|[2-9]\d\d|\d{4,})px[^"]*background:\s*linear-gradient[^"]*"[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(largePattern, (match) => {
    const widthMatch = match.match(/width:\s*(\d+)px/);
    const heightMatch = match.match(/height:\s*(\d+)px/);
    const width = widthMatch ? widthMatch[1] : '300';
    const height = heightMatch ? heightMatch[1] : '300';
    fixCount++;
    const imgUrl = `https://picsum.photos/seed/large${imageCounter++}/${width}/${height}`;
    return `<img src="${imgUrl}" alt="이미지" style="width:${width}px;height:${height}px;border-radius:var(--radius-md);object-fit:cover">`;
  });

  // 패턴 3: 아바타/프로필 이미지 (40-60px 원형)
  const avatarPattern = /<div\s+style="[^"]*width:\s*(?:4[0-9]|5[0-9]|60)px[^"]*height:\s*(?:4[0-9]|5[0-9]|60)px[^"]*(?:background:[^"]*|border-radius:\s*(?:50%|var\(--radius-full\)))[^"]*"[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(avatarPattern, (match) => {
    const sizeMatch = match.match(/width:\s*(\d+)px/);
    const size = sizeMatch ? sizeMatch[1] : '48';
    fixCount++;
    const imgUrl = CONFIG.images.avatar.replace('{n}', (imageCounter++ % 70) + 1);
    return `<img src="${imgUrl}" alt="프로필" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover">`;
  });

  // 패턴 4: 클래스로 식별되는 빈 이미지 컨테이너
  const classPatterns = [
    { pattern: /class="[^"]*(?:ip-img|character-img|project-img)[^"]*"[^>]*>\s*<\/div>/gi, type: 'character' },
    { pattern: /class="[^"]*(?:avatar|profile-img|user-img)[^"]*"[^>]*>\s*<\/div>/gi, type: 'avatar' },
    { pattern: /class="[^"]*(?:company-img|brand-img|logo-img)[^"]*"[^>]*>\s*<\/div>/gi, type: 'brand' }
  ];

  classPatterns.forEach(({ pattern, type }) => {
    fixedContent = fixedContent.replace(pattern, (match) => {
      // div 시작 태그 찾기
      const divStart = match.substring(0, match.lastIndexOf('>') + 1);
      fixCount++;
      let imgUrl;
      if (type === 'avatar') {
        imgUrl = CONFIG.images.avatar.replace('{n}', (imageCounter++ % 70) + 1);
      } else {
        imgUrl = `https://picsum.photos/seed/${type}${imageCounter++}/200/200`;
      }
      return divStart.replace('></div>', `><img src="${imgUrl}" alt="${type}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`);
    });
  });

  // 패턴 5: project-card__img, ip-card__img 등 카드 이미지 (gradient 배경)
  const cardImgPattern = /<div\s+class="([^"]*(?:card__img|banner__img|hero__img)[^"]*)"\s+style="[^"]*background:\s*linear-gradient[^"]*"[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(cardImgPattern, (match, className) => {
    fixCount++;
    const imgUrl = `https://picsum.photos/seed/card${imageCounter++}/800/400`;
    return `<div class="${className}" style="background-image:url('${imgUrl}');background-size:cover;background-position:center;"></div>`;
  });

  // 패턴 6: 빈 div with img class (gradient 없이 빈 상태)
  const emptyImgDivPattern = /<div\s+class="([^"]*__img[^"]*)"\s*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(emptyImgDivPattern, (match, className) => {
    fixCount++;
    const imgUrl = `https://picsum.photos/seed/empty${imageCounter++}/400/300`;
    return `<div class="${className}"><img src="${imgUrl}" alt="이미지" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`;
  });

  // 패턴 7: ip-card, character-card 등의 이미지 영역
  const ipCardPattern = /<div\s+class="([^"]*(?:ip-card|character-card|creator-card)[^"]*)__(?:img|image|thumb)[^"]*"\s+style="[^"]*background:\s*linear-gradient[^"]*"[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(ipCardPattern, (match, className) => {
    fixCount++;
    const imgUrl = `https://picsum.photos/seed/ip${imageCounter++}/300/300`;
    return match.replace(/style="[^"]*"/, `style="background-image:url('${imgUrl}');background-size:cover;background-position:center;"`);
  });

  // 패턴 8: related-img, creator-img, application-ip__thumb 등 이미지 클래스 (gradient 배경)
  const simpleImgPattern = /<div\s+class="([^"]*(?:-(?:img|image|thumb|avatar|photo)|__(?:img|image|thumb|avatar|photo))[^"]*)"\s*(?:style="[^"]*background:\s*linear-gradient[^"]*")?[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(simpleImgPattern, (match, className) => {
    // 이미 이미지가 있으면 스킵
    if (/background-image:\s*url\(/i.test(match)) {
      return match;
    }
    fixCount++;
    const imgUrl = `https://picsum.photos/seed/simple${imageCounter++}/100/100`;
    // style 속성이 있으면 교체, 없으면 추가
    if (/style="[^"]*"/.test(match)) {
      return match.replace(/style="[^"]*"/, `style="background-image:url('${imgUrl}');background-size:cover;background-position:center;"`);
    } else {
      return match.replace(`class="${className}"`, `class="${className}" style="background-image:url('${imgUrl}');background-size:cover;background-position:center;"`);
    }
  });

  // 패턴 9: 일반 빈 div (gradient 배경, 50px 이상 크기)
  const generalGradientPattern = /<div\s+(?:class="[^"]*"\s+)?style="[^"]*(?:width|height):\s*(?:[5-9]\d|[1-9]\d{2,})px[^"]*background:\s*linear-gradient[^"]*"[^>]*>\s*<\/div>/gi;
  fixedContent = fixedContent.replace(generalGradientPattern, (match) => {
    const widthMatch = match.match(/width:\s*(\d+)px/);
    const heightMatch = match.match(/height:\s*(\d+)px/);
    const width = widthMatch ? widthMatch[1] : '200';
    const height = heightMatch ? heightMatch[1] : '200';
    fixCount++;
    const imgUrl = `https://picsum.photos/seed/gen${imageCounter++}/${width}/${height}`;
    return match.replace(/background:\s*linear-gradient[^;]*;?/, `background-image:url('${imgUrl}');background-size:cover;background-position:center;`);
  });

  return { content: fixedContent, fixCount };
}

/**
 * 메인 실행
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INABOOTH Placeholder Image Fixer');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('  [DRY RUN] 실제 수정하지 않습니다\n');
  }

  const htmlFiles = fs.readdirSync(CONFIG.pagesDir)
    .filter(f => f.endsWith('.html'));

  let totalFixed = 0;
  const fixedFiles = [];

  htmlFiles.forEach(file => {
    const filePath = path.join(CONFIG.pagesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const { content: fixed, fixCount } = fixPlaceholderImages(content, file);

    if (fixCount > 0) {
      fixedFiles.push({ file, count: fixCount });
      totalFixed += fixCount;

      if (!dryRun) {
        fs.writeFileSync(filePath, fixed);
      }
    }
  });

  console.log('───────────────────────────────────────────────────────────');
  console.log('  결과');
  console.log('───────────────────────────────────────────────────────────\n');

  if (fixedFiles.length === 0) {
    console.log('  수정할 placeholder 이미지가 없습니다.\n');
  } else {
    console.log(`  총 ${totalFixed}개 이미지 ${dryRun ? '발견' : '수정'} (${fixedFiles.length}개 파일)\n`);

    fixedFiles.forEach(({ file, count }) => {
      console.log(`  ${dryRun ? '⚠' : '✓'} ${file}: ${count}개`);
    });
    console.log('');
  }

  return fixedFiles.length > 0 ? 0 : 1;
}

main();
