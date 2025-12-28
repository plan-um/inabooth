#!/usr/bin/env node
/**
 * INABOOTH Image Validator
 * ========================
 * HTML에서 이미지가 누락된 영역을 검출하고 더미 이미지로 교체합니다.
 *
 * 사용법:
 *   node tools/validate-images.js              # 전체 검증
 *   node tools/validate-images.js --fix        # 누락 이미지 더미로 교체
 *   node tools/validate-images.js --file 8-2-2*.html  # 특정 파일만
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 설정
// ============================================================
const CONFIG = {
  pagesDir: path.resolve(__dirname, '..'),
  outputDir: path.resolve(__dirname, '../verify'),

  // 더미 이미지 서비스 (크기별)
  dummyImageService: 'https://placehold.co',
  dummyImageColors: {
    default: 'EEF2FF/4F46E5',  // 라이트 인디고
    avatar: 'E5E7EB/6B7280',    // 그레이
    character: 'FEE2E2/EF4444', // 레드
    project: 'DBEAFE/3B82F6',   // 블루
    brand: 'D1FAE5/10B981'      // 그린
  },

  // 빈 이미지 패턴 (CSS gradient placeholder 등)
  emptyImagePatterns: [
    /background:\s*linear-gradient/,
    /background:\s*#[0-9A-Fa-f]{3,6}/,
    /background:\s*var\(--color-/
  ],

  // 이미지가 있어야 할 요소 패턴
  imageContainerPatterns: [
    { selector: 'img:not([src])', type: 'img-no-src' },
    { selector: 'img[src=""]', type: 'img-empty-src' },
    { pattern: /--(img|image|avatar|thumb|photo|logo)/, type: 'class-hint' },
    { pattern: /width:\s*\d+px.*height:\s*\d+px/, type: 'sized-div' }
  ]
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * HTML에서 이미지 관련 요소 추출
 */
function extractImageElements(htmlContent) {
  const issues = [];

  // 1. src 없는 img 태그
  const imgNoSrc = htmlContent.match(/<img(?![^>]*src=)[^>]*>/gi) || [];
  imgNoSrc.forEach(match => {
    issues.push({
      type: 'img-no-src',
      element: match,
      line: getLineNumber(htmlContent, match)
    });
  });

  // 2. src="" 인 img 태그
  const imgEmptySrc = htmlContent.match(/<img[^>]*src=["'][^"']*["'][^>]*>/gi) || [];
  imgEmptySrc.forEach(match => {
    if (match.includes('src=""') || match.includes("src=''")) {
      issues.push({
        type: 'img-empty-src',
        element: match,
        line: getLineNumber(htmlContent, match)
      });
    }
  });

  // 3. 이미지 플레이스홀더 div (gradient 배경만 있는)
  const placeholderDivs = [];
  const divPattern = /<div[^>]*style="[^"]*(?:width|height)[^"]*"[^>]*>/gi;
  let match;

  while ((match = divPattern.exec(htmlContent)) !== null) {
    const style = match[0];
    // 이미 background-image:url()이 있으면 스킵 (이미 수정됨)
    if (/background-image:\s*url\(/i.test(style)) {
      continue;
    }
    // gradient 배경이 있고 실제 이미지가 없는 경우
    if (CONFIG.emptyImagePatterns.some(p => p.test(style))) {
      // 크기 추출
      const widthMatch = style.match(/width:\s*(\d+)px/);
      const heightMatch = style.match(/height:\s*(\d+)px/);

      if (widthMatch && heightMatch) {
        const width = parseInt(widthMatch[1]);
        const height = parseInt(heightMatch[1]);
        // 80px 이하는 아이콘/뱃지 컨테이너일 가능성이 높으므로 제외
        if (width > 80 && height > 80) {
          issues.push({
            type: 'placeholder-div',
            element: match[0],
            width,
            height,
            line: getLineNumber(htmlContent, match[0])
          });
        }
      }
    }
  }

  // 4. 이미지 힌트가 있는 클래스명 가진 빈 div
  // background-image:url()이 있거나 <img가 포함된 경우 제외
  const imgHintPattern = /<div[^>]*class="[^"]*(?:img|image|avatar|thumb|photo|logo)[^"]*"[^>]*>([^<]*)<\/div>/gi;
  while ((match = imgHintPattern.exec(htmlContent)) !== null) {
    const fullMatch = match[0];
    const innerContent = match[1];
    // 이미 background-image:url()이 있으면 스킵
    if (/background-image:\s*url\(/i.test(fullMatch)) {
      continue;
    }
    // 내용이 있으면 스킵 (공백 제외)
    if (innerContent && innerContent.trim().length > 0) {
      continue;
    }
    issues.push({
      type: 'empty-img-container',
      element: fullMatch,
      line: getLineNumber(htmlContent, fullMatch)
    });
  }

  return issues;
}

/**
 * 라인 번호 찾기
 */
function getLineNumber(content, substring) {
  const index = content.indexOf(substring);
  if (index === -1) return -1;
  return content.substring(0, index).split('\n').length;
}

/**
 * 더미 이미지 URL 생성
 */
function generateDummyImageUrl(width, height, type = 'default', text = 'Image') {
  const colors = CONFIG.dummyImageColors[type] || CONFIG.dummyImageColors.default;
  return `${CONFIG.dummyImageService}/${width}x${height}/${colors}?text=${encodeURIComponent(text)}`;
}

/**
 * 이미지 누락 수정
 */
function fixMissingImages(htmlContent, issues) {
  let fixedContent = htmlContent;

  issues.forEach(issue => {
    switch (issue.type) {
      case 'img-no-src':
      case 'img-empty-src': {
        // alt 태그에서 타입 추측
        const altMatch = issue.element.match(/alt=["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : 'Image';

        // 크기 추출 (style 또는 width/height 속성)
        const widthAttr = issue.element.match(/width=["']?(\d+)/i);
        const heightAttr = issue.element.match(/height=["']?(\d+)/i);
        const styleWidth = issue.element.match(/width:\s*(\d+)px/);
        const styleHeight = issue.element.match(/height:\s*(\d+)px/);

        const width = widthAttr?.[1] || styleWidth?.[1] || '400';
        const height = heightAttr?.[1] || styleHeight?.[1] || '300';

        // 타입 추측
        let type = 'default';
        if (alt.includes('캐릭터') || alt.includes('IP')) type = 'character';
        if (alt.includes('아바타') || alt.includes('프로필')) type = 'avatar';
        if (alt.includes('프로젝트')) type = 'project';
        if (alt.includes('브랜드') || alt.includes('로고')) type = 'brand';

        const dummySrc = generateDummyImageUrl(width, height, type, alt);

        // src 속성 추가/교체
        if (issue.type === 'img-no-src') {
          const newElement = issue.element.replace('<img', `<img src="${dummySrc}"`);
          fixedContent = fixedContent.replace(issue.element, newElement);
        } else {
          const newElement = issue.element.replace(/src=["'][^"']*["']/, `src="${dummySrc}"`);
          fixedContent = fixedContent.replace(issue.element, newElement);
        }
        break;
      }

      case 'placeholder-div': {
        // gradient div에 실제 이미지 추가 (TODO: 필요시 구현)
        break;
      }
    }
  });

  return fixedContent;
}

// ============================================================
// 메인 검증 로직
// ============================================================

function validateImages(options = {}) {
  const { fix = false, filePattern = '*.html' } = options;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INABOOTH Image Validator');
  console.log('═══════════════════════════════════════════════════════════\n');

  // HTML 파일 스캔
  const htmlFiles = fs.readdirSync(CONFIG.pagesDir)
    .filter(f => f.endsWith('.html'))
    .filter(f => {
      if (filePattern === '*.html') return true;
      return f.includes(filePattern.replace('*.html', '').replace('*', ''));
    });

  console.log(`검증 대상: ${htmlFiles.length}개 HTML 파일\n`);

  const results = {
    passed: [],
    issues: [],
    totalIssues: 0,
    fixed: 0
  };

  htmlFiles.forEach(file => {
    const filePath = path.join(CONFIG.pagesDir, file);
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    const fileIssues = extractImageElements(htmlContent);

    if (fileIssues.length === 0) {
      results.passed.push(file);
    } else {
      results.issues.push({
        file,
        issues: fileIssues
      });
      results.totalIssues += fileIssues.length;

      // --fix 옵션
      if (fix) {
        const fixedContent = fixMissingImages(htmlContent, fileIssues);
        if (fixedContent !== htmlContent) {
          fs.writeFileSync(filePath, fixedContent);
          results.fixed += fileIssues.length;
          console.log(`  ✓ 수정됨: ${file} (${fileIssues.length}개 이슈)`);
        }
      }
    }
  });

  // 결과 출력
  console.log('───────────────────────────────────────────────────────────');
  console.log('  검증 결과');
  console.log('───────────────────────────────────────────────────────────\n');

  console.log(`  ✓ 통과: ${results.passed.length}개`);
  console.log(`  ⚠ 이슈: ${results.issues.length}개 파일`);
  console.log(`  총 이슈: ${results.totalIssues}개`);
  if (fix) {
    console.log(`  수정됨: ${results.fixed}개`);
  }
  console.log('');

  // 이슈 상세
  if (results.issues.length > 0 && !fix) {
    console.log('⚠ 이슈 파일:');
    results.issues.slice(0, 20).forEach(({ file, issues }) => {
      console.log(`  ${file}`);
      issues.forEach(issue => {
        console.log(`    - [${issue.type}] 라인 ${issue.line}`);
      });
    });
    console.log('');

    if (!fix) {
      console.log('💡 자동 수정하려면: node tools/validate-images.js --fix\n');
    }
  }

  // JSON 리포트 저장
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: htmlFiles.length,
      passed: results.passed.length,
      issueFiles: results.issues.length,
      totalIssues: results.totalIssues,
      fixed: results.fixed
    },
    issues: results.issues.map(({ file, issues }) => ({
      file,
      issues: issues.map(i => ({ type: i.type, line: i.line }))
    }))
  };

  const reportPath = path.join(CONFIG.outputDir, 'image-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`상세 리포트: ${reportPath}\n`);

  return results.totalIssues === 0 ? 0 : 1;
}

// ============================================================
// CLI 실행
// ============================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix'),
    filePattern: args.find(a => a.startsWith('--file='))?.split('=')[1] || '*.html'
  };

  const exitCode = validateImages(options);
  process.exit(exitCode);
}

module.exports = { validateImages, extractImageElements, generateDummyImageUrl };
