#!/usr/bin/env node
/**
 * INABOOTH CSS Validator
 * ======================
 * HTML에서 사용된 CSS 클래스가 shared.css에 정의되어 있는지 검증합니다.
 *
 * 사용법:
 *   node tools/validate-css.js              # 전체 검증
 *   node tools/validate-css.js --fix        # 누락 클래스 리포트 + 추천 CSS 생성
 *   node tools/validate-css.js --file 8-2-2*.html  # 특정 파일만 검증
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 설정
// ============================================================
const CONFIG = {
  pagesDir: path.resolve(__dirname, '..'),
  sharedCssPath: path.resolve(__dirname, '../components/shared.css'),
  outputDir: path.resolve(__dirname, '../verify'),

  // 무시할 클래스 패턴 (상태 클래스, 동적 클래스 등)
  ignoredClasses: [
    'active', 'show', 'hide', 'open', 'closed', 'disabled', 'selected',
    'checked', 'error', 'success', 'visible', 'hidden', 'loading',
    'expanded', 'collapsed', 'focus', 'hover', 'valid', 'invalid',
    // 동적으로 생성되는 클래스
    /^is-/, /^has-/, /^js-/, /^animate-/
  ],

  // 인라인 스타일에서 정의될 수 있는 페이지별 클래스 (검증 완화)
  allowInlineDefinition: true
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * HTML 파일에서 모든 클래스 추출
 */
function extractClassesFromHtml(htmlContent) {
  const classPattern = /class\s*=\s*["']([^"']+)["']/gi;
  const classes = new Set();
  let match;

  while ((match = classPattern.exec(htmlContent)) !== null) {
    const classList = match[1].split(/\s+/);
    classList.forEach(cls => {
      if (cls.trim()) classes.add(cls.trim());
    });
  }

  return classes;
}

/**
 * CSS 파일에서 정의된 클래스 추출
 */
function extractClassesFromCss(cssContent) {
  // 클래스 선택자 패턴: .class-name (의사 클래스, 후속 선택자 제외)
  const classPattern = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  const classes = new Set();
  let match;

  while ((match = classPattern.exec(cssContent)) !== null) {
    classes.add(match[1]);
  }

  return classes;
}

/**
 * HTML 인라인 스타일에서 정의된 클래스 추출
 */
function extractInlineClasses(htmlContent) {
  const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const classes = new Set();
  let match;

  while ((match = stylePattern.exec(htmlContent)) !== null) {
    const inlineCss = match[1];
    extractClassesFromCss(inlineCss).forEach(cls => classes.add(cls));
  }

  return classes;
}

/**
 * 클래스가 무시 목록에 있는지 확인
 */
function shouldIgnoreClass(className) {
  return CONFIG.ignoredClasses.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(className);
    }
    return pattern === className;
  });
}

/**
 * 누락된 클래스에 대한 CSS 추천 생성
 */
function generateCssRecommendation(className) {
  // BEM 패턴 분석
  const parts = className.split('__');
  const block = parts[0];
  const element = parts[1]?.split('--')[0];
  const modifier = className.split('--')[1];

  let css = '';

  if (modifier) {
    // 모디파이어인 경우
    css = `.${className} {\n  /* Modifier styles */\n}\n`;
  } else if (element) {
    // 엘리먼트인 경우
    css = `.${className} {\n  /* Element styles */\n}\n`;
  } else {
    // 블록인 경우 - 기본 레이아웃 추천
    css = `.${className} {\n  display: flex;\n  /* Block styles */\n}\n`;
  }

  return css;
}

// ============================================================
// 메인 검증 로직
// ============================================================

function validateCss(options = {}) {
  const { fix = false, filePattern = '*.html' } = options;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INABOOTH CSS Validator');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. shared.css에서 정의된 클래스 추출
  let sharedCssClasses = new Set();
  try {
    const sharedCss = fs.readFileSync(CONFIG.sharedCssPath, 'utf-8');
    sharedCssClasses = extractClassesFromCss(sharedCss);
    console.log(`✓ shared.css에서 ${sharedCssClasses.size}개 클래스 발견\n`);
  } catch (err) {
    console.error('✗ shared.css를 읽을 수 없습니다:', err.message);
    process.exit(1);
  }

  // 2. HTML 파일 스캔
  const htmlFiles = fs.readdirSync(CONFIG.pagesDir)
    .filter(f => f.endsWith('.html'))
    .filter(f => {
      if (filePattern === '*.html') return true;
      return f.includes(filePattern.replace('*.html', '').replace('*', ''));
    });

  console.log(`검증 대상: ${htmlFiles.length}개 HTML 파일\n`);

  // 3. 각 파일 검증
  const results = {
    passed: [],
    warnings: [],
    failed: [],
    missingClasses: new Map(), // className -> [files]
    allUsedClasses: new Set()
  };

  htmlFiles.forEach(file => {
    const filePath = path.join(CONFIG.pagesDir, file);
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    const usedClasses = extractClassesFromHtml(htmlContent);
    const inlineClasses = CONFIG.allowInlineDefinition
      ? extractInlineClasses(htmlContent)
      : new Set();

    const missingInFile = [];

    usedClasses.forEach(cls => {
      results.allUsedClasses.add(cls);

      // 무시할 클래스인지 확인
      if (shouldIgnoreClass(cls)) return;

      // shared.css 또는 인라인에 정의되어 있는지 확인
      const definedInShared = sharedCssClasses.has(cls);
      const definedInline = inlineClasses.has(cls);

      if (!definedInShared && !definedInline) {
        missingInFile.push(cls);

        if (!results.missingClasses.has(cls)) {
          results.missingClasses.set(cls, []);
        }
        results.missingClasses.get(cls).push(file);
      }
    });

    if (missingInFile.length === 0) {
      results.passed.push(file);
    } else if (missingInFile.length <= 3) {
      results.warnings.push({ file, missing: missingInFile });
    } else {
      results.failed.push({ file, missing: missingInFile });
    }
  });

  // 4. 결과 출력
  console.log('───────────────────────────────────────────────────────────');
  console.log('  검증 결과');
  console.log('───────────────────────────────────────────────────────────\n');

  console.log(`  ✓ 통과: ${results.passed.length}개`);
  console.log(`  ⚠ 경고: ${results.warnings.length}개`);
  console.log(`  ✗ 실패: ${results.failed.length}개`);
  console.log(`  총 누락 클래스: ${results.missingClasses.size}개\n`);

  // 경고/실패 상세
  if (results.warnings.length > 0) {
    console.log('⚠ 경고 파일:');
    results.warnings.forEach(({ file, missing }) => {
      console.log(`  ${file}`);
      console.log(`    누락: ${missing.join(', ')}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('✗ 실패 파일:');
    results.failed.forEach(({ file, missing }) => {
      console.log(`  ${file}`);
      console.log(`    누락 (${missing.length}개): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
    });
    console.log('');
  }

  // 5. 가장 많이 누락된 클래스 (공통 패턴)
  if (results.missingClasses.size > 0) {
    console.log('───────────────────────────────────────────────────────────');
    console.log('  자주 누락되는 클래스 (shared.css에 추가 권장)');
    console.log('───────────────────────────────────────────────────────────\n');

    const sorted = [...results.missingClasses.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20);

    sorted.forEach(([cls, files]) => {
      console.log(`  .${cls} (${files.length}개 파일)`);
    });
    console.log('');
  }

  // 6. --fix 옵션: 누락 클래스 CSS 생성
  if (fix && results.missingClasses.size > 0) {
    console.log('───────────────────────────────────────────────────────────');
    console.log('  추천 CSS (shared.css에 추가)');
    console.log('───────────────────────────────────────────────────────────\n');

    // 자주 사용되는 클래스만 (2개 이상 파일에서 사용)
    const frequentMissing = [...results.missingClasses.entries()]
      .filter(([, files]) => files.length >= 2)
      .map(([cls]) => cls);

    let recommendedCss = '/* ========================================\n';
    recommendedCss += '   AUTO-GENERATED: Missing Classes\n';
    recommendedCss += '   validate-css.js --fix 로 생성됨\n';
    recommendedCss += '======================================== */\n\n';

    frequentMissing.forEach(cls => {
      recommendedCss += generateCssRecommendation(cls);
    });

    // 파일로 저장
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const outputPath = path.join(CONFIG.outputDir, 'missing-classes.css');
    fs.writeFileSync(outputPath, recommendedCss);

    console.log(`추천 CSS가 생성되었습니다: ${outputPath}\n`);
    console.log(recommendedCss);
  }

  // 7. JSON 리포트 저장
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: htmlFiles.length,
      passed: results.passed.length,
      warnings: results.warnings.length,
      failed: results.failed.length,
      totalMissingClasses: results.missingClasses.size,
      sharedCssClasses: sharedCssClasses.size
    },
    missingClasses: Object.fromEntries(results.missingClasses),
    failedFiles: results.failed.map(f => f.file),
    warningFiles: results.warnings.map(w => w.file)
  };

  const reportPath = path.join(CONFIG.outputDir, 'css-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`상세 리포트: ${reportPath}\n`);

  // 종료 코드
  return results.failed.length === 0 ? 0 : 1;
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

  const exitCode = validateCss(options);
  process.exit(exitCode);
}

module.exports = { validateCss, extractClassesFromHtml, extractClassesFromCss };
