/**
 * INABOOTH 페이지 검증 자동화 시스템
 *
 * Usage:
 *   node verify.js              # 전체 검증 (Level 3)
 *   node verify.js --level=1    # 정적 분석만
 *   node verify.js --level=2    # 정적 + 브라우저
 *   node verify.js --level=3    # 정적 + 브라우저 + AI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '..');
const CSV_PATH = path.join(PAGES_DIR, '메뉴구조도.csv');

// CLI 인자 파싱
const args = process.argv.slice(2);
const levelArg = args.find(a => a.startsWith('--level='));
const LEVEL = levelArg ? parseInt(levelArg.split('=')[1]) : 3;

// 결과 저장
const results = {
  timestamp: new Date().toISOString(),
  level: LEVEL,
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  pages: []
};

// 색상 출력 (간단한 구현)
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`
};

console.log(colors.bold('\n═══════════════════════════════════════════════════════════'));
console.log(colors.bold('  INABOOTH 페이지 검증 시스템'));
console.log(colors.bold(`  검증 레벨: ${LEVEL} ${LEVEL === 1 ? '(정적분석)' : LEVEL === 2 ? '(정적+브라우저)' : '(전체)'}`));
console.log(colors.bold('═══════════════════════════════════════════════════════════\n'));

// ============================================================================
// LEVEL 1: 정적 분석
// ============================================================================

function parseCSV() {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });
  return records;
}

function extractStoryboardNumber(str) {
  // [6-1-1 캐릭터 등록>기본 정보] -> 6-1-1
  const match = str.match(/\[(\d+-\d+(?:-\d+)?(?:-\d+)?)/);
  return match ? match[1] : null;
}

function storyboardToFilename(storyboardNum, description) {
  // 6-1-1 -> "6-1-1 캐릭터 등록_기본 정보.html" 같은 형태로 매핑
  // 실제 파일명 패턴에 맞게 매핑 필요
  return storyboardNum;
}

function findMatchingFile(storyboardNum) {
  const files = fs.readdirSync(PAGES_DIR);

  // 정확한 번호로 시작하는 파일 찾기
  const matches = files.filter(f => {
    if (!f.endsWith('.html')) return false;
    // 파일명에서 번호 추출: "6-1-1 캐릭터..." -> "6-1-1"
    const fileNum = f.split(' ')[0];
    return fileNum === storyboardNum;
  });

  return matches.length > 0 ? matches[0] : null;
}

function parseContent(contentStr) {
  // "콘텐츠/데이터" 컬럼을 파싱하여 체크 항목 추출
  if (!contentStr) return [];

  return contentStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function parseActions(actionStr) {
  // "링크/버튼/액션" 컬럼을 파싱
  if (!actionStr) return [];

  // "버튼 클릭→[페이지] 이동" 패턴에서 링크 추출
  const linkPattern = /→\[([^\]]+)\]/g;
  const links = [];
  let match;

  while ((match = linkPattern.exec(actionStr)) !== null) {
    links.push(match[1]);
  }

  return links;
}

async function staticAnalysis(record) {
  const result = {
    storyboard: record['스토리보드 번호'] || '',
    description: record['설명'] || '',
    checks: [],
    status: 'passed'
  };

  const storyboardNum = extractStoryboardNumber(result.storyboard);

  if (!storyboardNum) {
    // 스토리보드 번호가 없는 행 (섹터 헤더 등)은 스킵
    result.status = 'skipped';
    return result;
  }

  // 1. 파일 존재 체크
  const filename = findMatchingFile(storyboardNum);

  if (!filename) {
    result.checks.push({
      type: 'file_existence',
      status: 'failed',
      message: `파일 없음: ${storyboardNum}*.html`
    });
    result.status = 'failed';
    return result;
  }

  result.filename = filename;
  result.checks.push({
    type: 'file_existence',
    status: 'passed',
    message: `파일 존재: ${filename}`
  });

  // 2. HTML 파싱
  const htmlPath = path.join(PAGES_DIR, filename);
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  // 3. 플레이스홀더 텍스트 체크
  const placeholderPatterns = [
    '메뉴구조도.csv 스펙에 따라',
    '페이지 콘텐츠가 여기에 표시됩니다',
    '이 페이지의 상세 콘텐츠는'
  ];

  for (const pattern of placeholderPatterns) {
    if (html.includes(pattern)) {
      result.checks.push({
        type: 'placeholder',
        status: 'failed',
        message: `플레이스홀더 텍스트 발견: "${pattern.substring(0, 30)}..."`
      });
      result.status = 'failed';
    }
  }

  if (!result.checks.some(c => c.type === 'placeholder')) {
    result.checks.push({
      type: 'placeholder',
      status: 'passed',
      message: '플레이스홀더 텍스트 없음'
    });
  }

  // 4. 필수 콘텐츠 체크 (간단한 키워드 매칭)
  const expectedContent = parseContent(record['콘텐츠/데이터']);
  const contentText = $('body').text();

  // 주요 키워드 추출 및 체크
  const keywordsMissing = [];
  const keywordsFound = [];

  for (const content of expectedContent.slice(0, 5)) { // 상위 5개만 체크
    // 핵심 키워드 추출 (한글 명사 패턴)
    const keywords = content.match(/[\uAC00-\uD7AF]+/g) || [];
    const mainKeyword = keywords.find(k => k.length >= 2);

    if (mainKeyword && contentText.includes(mainKeyword)) {
      keywordsFound.push(mainKeyword);
    } else if (mainKeyword) {
      keywordsMissing.push(mainKeyword);
    }
  }

  if (keywordsFound.length > 0) {
    result.checks.push({
      type: 'content_keywords',
      status: 'passed',
      message: `키워드 발견: ${keywordsFound.join(', ')}`
    });
  }

  if (keywordsMissing.length > 0) {
    result.checks.push({
      type: 'content_keywords',
      status: 'warning',
      message: `키워드 미발견: ${keywordsMissing.join(', ')}`
    });
    if (result.status === 'passed') result.status = 'warning';
  }

  // 5. 링크 체크
  const expectedLinks = parseActions(record['링크/버튼/액션']);
  const actualLinks = [];

  $('a[href]').each((_, el) => {
    actualLinks.push($(el).attr('href'));
  });

  // 링크 유효성 체크 (내부 링크만)
  const brokenLinks = [];
  for (const link of actualLinks) {
    if (link.endsWith('.html') && !link.startsWith('http')) {
      const linkPath = path.join(PAGES_DIR, link);
      if (!fs.existsSync(linkPath)) {
        brokenLinks.push(link);
      }
    }
  }

  if (brokenLinks.length > 0) {
    result.checks.push({
      type: 'broken_links',
      status: 'failed',
      message: `깨진 링크: ${brokenLinks.join(', ')}`
    });
    result.status = 'failed';
  } else if (actualLinks.length > 0) {
    result.checks.push({
      type: 'links',
      status: 'passed',
      message: `링크 ${actualLinks.length}개 정상`
    });
  }

  // 6. 버튼 존재 체크
  const buttons = $('button, .btn, [class*="btn"]');
  if (buttons.length === 0 && expectedLinks.length > 0) {
    result.checks.push({
      type: 'buttons',
      status: 'warning',
      message: '버튼 요소가 없음'
    });
    if (result.status === 'passed') result.status = 'warning';
  } else if (buttons.length > 0) {
    result.checks.push({
      type: 'buttons',
      status: 'passed',
      message: `버튼 ${buttons.length}개 존재`
    });
  }

  // 7. 기본 구조 체크
  const hasHeader = $('#header-placeholder').length > 0;
  const hasFooter = $('#footer-placeholder').length > 0;
  const hasMain = $('main').length > 0;

  if (hasHeader && hasFooter && hasMain) {
    result.checks.push({
      type: 'structure',
      status: 'passed',
      message: '기본 구조 정상 (header, main, footer)'
    });
  } else {
    result.checks.push({
      type: 'structure',
      status: 'warning',
      message: `기본 구조 불완전: header=${hasHeader}, main=${hasMain}, footer=${hasFooter}`
    });
    if (result.status === 'passed') result.status = 'warning';
  }

  return result;
}

// ============================================================================
// LEVEL 2: 브라우저 검증
// ============================================================================

async function browserVerification(pageResult) {
  if (pageResult.status === 'skipped' || !pageResult.filename) {
    return pageResult;
  }

  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const filePath = path.join(PAGES_DIR, pageResult.filename);
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });

    // 1. 렌더링 에러 체크
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 잠시 대기
    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      pageResult.checks.push({
        type: 'console_errors',
        status: 'warning',
        message: `콘솔 에러 ${consoleErrors.length}개: ${consoleErrors[0].substring(0, 50)}...`
      });
      if (pageResult.status === 'passed') pageResult.status = 'warning';
    } else {
      pageResult.checks.push({
        type: 'console_errors',
        status: 'passed',
        message: '콘솔 에러 없음'
      });
    }

    // 2. 빈 페이지 체크
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    if (bodyText.length < 50) {
      pageResult.checks.push({
        type: 'empty_content',
        status: 'failed',
        message: `콘텐츠 부족: ${bodyText.length}자`
      });
      pageResult.status = 'failed';
    } else {
      pageResult.checks.push({
        type: 'content_length',
        status: 'passed',
        message: `콘텐츠 길이: ${bodyText.length}자`
      });
    }

    // 3. 스크린샷 저장
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, `${pageResult.filename.replace('.html', '.png')}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    pageResult.screenshot = screenshotPath;

    pageResult.checks.push({
      type: 'screenshot',
      status: 'passed',
      message: `스크린샷 저장: ${path.basename(screenshotPath)}`
    });

  } catch (error) {
    pageResult.checks.push({
      type: 'browser_error',
      status: 'failed',
      message: `브라우저 에러: ${error.message.substring(0, 100)}`
    });
    pageResult.status = 'failed';
  } finally {
    if (browser) await browser.close();
  }

  return pageResult;
}

// ============================================================================
// LEVEL 3: AI 시맨틱 검증
// ============================================================================

async function aiVerification(pageResult, expectedContent) {
  if (pageResult.status === 'skipped' || !pageResult.filename) {
    return pageResult;
  }

  // API 키 체크
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    pageResult.checks.push({
      type: 'ai_verification',
      status: 'skipped',
      message: 'ANTHROPIC_API_KEY 환경변수 필요'
    });
    return pageResult;
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    // HTML 읽기
    const htmlPath = path.join(PAGES_DIR, pageResult.filename);
    const html = fs.readFileSync(htmlPath, 'utf-8');

    // body 내용만 추출 (토큰 절약)
    const $ = cheerio.load(html);
    const bodyHtml = $('main').html() || $('body').html();
    const truncatedHtml = bodyHtml.substring(0, 8000); // 토큰 제한

    const prompt = `
당신은 웹 페이지 QA 전문가입니다. 아래 HTML이 요구사항을 충족하는지 검증해주세요.

## 요구사항 (콘텐츠/데이터)
${expectedContent}

## 실제 HTML
\`\`\`html
${truncatedHtml}
\`\`\`

## 검증 결과를 다음 JSON 형식으로만 응답하세요:
{
  "score": 0-100,
  "missing": ["누락된 항목들"],
  "present": ["존재하는 항목들"],
  "issues": ["문제점들"]
}
`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].text;

    // JSON 파싱 시도
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0]);

        pageResult.aiScore = aiResult.score;

        if (aiResult.score >= 80) {
          pageResult.checks.push({
            type: 'ai_semantic',
            status: 'passed',
            message: `AI 검증 점수: ${aiResult.score}/100`
          });
        } else if (aiResult.score >= 50) {
          pageResult.checks.push({
            type: 'ai_semantic',
            status: 'warning',
            message: `AI 검증 점수: ${aiResult.score}/100, 누락: ${aiResult.missing?.join(', ') || 'N/A'}`
          });
          if (pageResult.status === 'passed') pageResult.status = 'warning';
        } else {
          pageResult.checks.push({
            type: 'ai_semantic',
            status: 'failed',
            message: `AI 검증 점수: ${aiResult.score}/100, 누락: ${aiResult.missing?.join(', ') || 'N/A'}`
          });
          pageResult.status = 'failed';
        }

        pageResult.aiDetails = aiResult;
      }
    } catch (parseError) {
      pageResult.checks.push({
        type: 'ai_semantic',
        status: 'warning',
        message: 'AI 응답 파싱 실패'
      });
    }

  } catch (error) {
    pageResult.checks.push({
      type: 'ai_verification',
      status: 'warning',
      message: `AI 검증 에러: ${error.message.substring(0, 50)}`
    });
  }

  return pageResult;
}

// ============================================================================
// 메인 실행
// ============================================================================

async function main() {
  console.log(colors.cyan('📋 메뉴구조도.csv 파싱 중...\n'));

  const records = parseCSV();
  console.log(`   총 ${records.length}개 행 발견\n`);

  console.log(colors.cyan('🔍 Level 1: 정적 분석 시작\n'));

  for (const record of records) {
    const pageResult = await staticAnalysis(record);

    if (pageResult.status !== 'skipped') {
      results.pages.push(pageResult);
      results.summary.total++;

      // 상태별 카운트
      if (pageResult.status === 'passed') {
        results.summary.passed++;
        console.log(colors.green(`  ✓ ${pageResult.storyboard}`));
      } else if (pageResult.status === 'warning') {
        results.summary.warnings++;
        console.log(colors.yellow(`  ⚠ ${pageResult.storyboard}`));
      } else {
        results.summary.failed++;
        console.log(colors.red(`  ✗ ${pageResult.storyboard}`));
        for (const check of pageResult.checks.filter(c => c.status === 'failed')) {
          console.log(colors.dim(`      → ${check.message}`));
        }
      }
    }
  }

  // Level 2: 브라우저 검증
  if (LEVEL >= 2) {
    console.log(colors.cyan('\n🌐 Level 2: 브라우저 검증 시작\n'));

    for (let i = 0; i < results.pages.length; i++) {
      const pageResult = results.pages[i];
      if (pageResult.status !== 'skipped' && pageResult.filename) {
        process.stdout.write(`  검증 중: ${pageResult.filename}...`);
        await browserVerification(pageResult);
        console.log(pageResult.status === 'failed' ? colors.red(' ✗') : colors.green(' ✓'));
      }
    }
  }

  // Level 3: AI 시맨틱 검증
  if (LEVEL >= 3) {
    console.log(colors.cyan('\n🤖 Level 3: AI 시맨틱 검증 시작\n'));

    // AI 호출은 비용이 있으므로 failed/warning인 페이지만 검증
    const pagesToVerify = results.pages.filter(p =>
      p.status !== 'skipped' && p.filename
    ).slice(0, 10); // 최대 10개

    console.log(`   ${pagesToVerify.length}개 페이지 AI 검증 예정\n`);

    for (const record of records) {
      const storyboardNum = extractStoryboardNumber(record['스토리보드 번호'] || '');
      const pageResult = pagesToVerify.find(p =>
        p.filename && p.filename.startsWith(storyboardNum)
      );

      if (pageResult) {
        process.stdout.write(`  AI 검증: ${pageResult.filename}...`);
        await aiVerification(pageResult, record['콘텐츠/데이터'] || '');
        console.log(pageResult.aiScore ? `${pageResult.aiScore}점` : 'skipped');
      }
    }
  }

  // 최종 결과 출력
  console.log(colors.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(colors.bold('  검증 결과 요약'));
  console.log(colors.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  총 검증: ${results.summary.total}개 페이지`);
  console.log(colors.green(`  ✓ 통과: ${results.summary.passed}개`));
  console.log(colors.yellow(`  ⚠ 경고: ${results.summary.warnings}개`));
  console.log(colors.red(`  ✗ 실패: ${results.summary.failed}개`));

  const passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
  console.log(`\n  통과율: ${passRate}%\n`);

  // 상세 리포트 저장
  const reportPath = path.join(__dirname, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(colors.dim(`  상세 리포트: ${reportPath}\n`));

  // HTML 리포트 생성
  await generateHtmlReport(results);

  // 실패한 페이지 상세
  if (results.summary.failed > 0) {
    console.log(colors.bold('\n══ 실패한 페이지 상세 ══\n'));
    for (const page of results.pages.filter(p => p.status === 'failed')) {
      console.log(colors.red(`  ${page.storyboard}`));
      for (const check of page.checks.filter(c => c.status === 'failed')) {
        console.log(colors.dim(`    → ${check.message}`));
      }
    }
  }

  // Exit code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// HTML 리포트 생성
async function generateHtmlReport(results) {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INABOOTH 페이지 검증 리포트</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #6366f1, #ec4899); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header .meta { opacity: 0.9; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .summary-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .summary-card .value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .summary-card .label { color: #666; font-size: 14px; }
    .summary-card.total .value { color: #6366f1; }
    .summary-card.passed .value { color: #22c55e; }
    .summary-card.warning .value { color: #f59e0b; }
    .summary-card.failed .value { color: #ef4444; }
    .pages { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .page-item { padding: 16px 20px; border-bottom: 1px solid #eee; }
    .page-item:last-child { border-bottom: none; }
    .page-item.passed { border-left: 4px solid #22c55e; }
    .page-item.warning { border-left: 4px solid #f59e0b; }
    .page-item.failed { border-left: 4px solid #ef4444; }
    .page-title { font-weight: 600; margin-bottom: 8px; }
    .page-checks { display: flex; flex-wrap: wrap; gap: 8px; }
    .check { font-size: 12px; padding: 4px 8px; border-radius: 4px; background: #f5f5f5; }
    .check.passed { background: #dcfce7; color: #166534; }
    .check.warning { background: #fef3c7; color: #92400e; }
    .check.failed { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>INABOOTH 페이지 검증 리포트</h1>
      <div class="meta">생성: ${results.timestamp} | 검증 레벨: ${results.level}</div>
    </div>

    <div class="summary">
      <div class="summary-card total">
        <div class="value">${results.summary.total}</div>
        <div class="label">총 페이지</div>
      </div>
      <div class="summary-card passed">
        <div class="value">${results.summary.passed}</div>
        <div class="label">통과</div>
      </div>
      <div class="summary-card warning">
        <div class="value">${results.summary.warnings}</div>
        <div class="label">경고</div>
      </div>
      <div class="summary-card failed">
        <div class="value">${results.summary.failed}</div>
        <div class="label">실패</div>
      </div>
    </div>

    <div class="pages">
      ${results.pages.map(page => `
        <div class="page-item ${page.status}">
          <div class="page-title">${page.storyboard} ${page.filename ? `(${page.filename})` : ''}</div>
          <div class="page-checks">
            ${page.checks.map(check => `
              <span class="check ${check.status}">${check.type}: ${check.status}</span>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  const reportPath = path.join(__dirname, 'report.html');
  fs.writeFileSync(reportPath, html);
  console.log(colors.dim(`  HTML 리포트: ${reportPath}`));
}

main().catch(console.error);
