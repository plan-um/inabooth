/**
 * INABOOTH 페이지 검증 자동화 시스템 (Chrome DevTools MCP 버전)
 *
 * 이 스크립트는 Claude Code 내에서 직접 실행하는 것이 아닌,
 * Claude가 Chrome DevTools MCP 도구를 사용하여 검증하는 가이드입니다.
 *
 * 실제 검증은 Claude가 MCP 도구를 호출하여 수행합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '..');
const CSV_PATH = path.join(PAGES_DIR, '메뉴구조도.csv');

/**
 * Chrome DevTools MCP를 활용한 검증 워크플로우
 *
 * Claude Code에서 다음 MCP 도구들을 사용:
 *
 * 1. mcp__chrome-devtools__list_pages
 *    - 현재 열린 페이지 목록 확인
 *
 * 2. mcp__chrome-devtools__navigate_page
 *    - 검증할 페이지로 이동
 *    - url: "file:///path/to/page.html"
 *
 * 3. mcp__chrome-devtools__take_snapshot
 *    - 페이지 a11y 트리 스냅샷 (DOM 구조 분석용)
 *    - 모든 요소의 uid, 텍스트 확인 가능
 *
 * 4. mcp__chrome-devtools__take_screenshot
 *    - 페이지 스크린샷 캡처
 *    - fullPage: true로 전체 페이지 캡처
 *
 * 5. mcp__chrome-devtools__list_console_messages
 *    - JavaScript 콘솔 에러/경고 확인
 *
 * 6. mcp__chrome-devtools__evaluate_script
 *    - 커스텀 검증 스크립트 실행
 *    - 예: 특정 요소 존재 확인, 텍스트 내용 검증
 */

// CSV 파싱
function parseCSV() {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });
  return records;
}

// 스토리보드 번호 추출
function extractStoryboardNumber(str) {
  const match = str?.match(/\[(\d+-\d+(?:-\d+)?(?:-\d+)?)/);
  return match ? match[1] : null;
}

// HTML 파일 찾기
function findMatchingFile(storyboardNum) {
  const files = fs.readdirSync(PAGES_DIR);
  const matches = files.filter(f => {
    if (!f.endsWith('.html')) return false;
    const fileNum = f.split(' ')[0];
    return fileNum === storyboardNum;
  });
  return matches.length > 0 ? matches[0] : null;
}

// 검증 대상 페이지 목록 생성
function generateVerificationList() {
  const records = parseCSV();
  const pages = [];

  for (const record of records) {
    const storyboardNum = extractStoryboardNumber(record['스토리보드 번호']);
    if (!storyboardNum) continue;

    const filename = findMatchingFile(storyboardNum);
    if (!filename) {
      pages.push({
        storyboard: record['스토리보드 번호'],
        description: record['설명'],
        filename: null,
        status: 'missing',
        expectedContent: record['콘텐츠/데이터'],
        expectedActions: record['링크/버튼/액션']
      });
      continue;
    }

    pages.push({
      storyboard: record['스토리보드 번호'],
      description: record['설명'],
      filename,
      filePath: path.join(PAGES_DIR, filename),
      fileUrl: `file://${path.join(PAGES_DIR, filename)}`,
      status: 'pending',
      expectedContent: record['콘텐츠/데이터'],
      expectedActions: record['링크/버튼/액션']
    });
  }

  return pages;
}

// 검증 체크리스트 생성
function generateChecklistForPage(page) {
  const checklist = [];

  // 1. 플레이스홀더 체크
  checklist.push({
    id: 'placeholder',
    description: '플레이스홀더 텍스트가 없어야 함',
    script: `() => {
      const text = document.body.innerText;
      const patterns = ['메뉴구조도.csv 스펙에 따라', '페이지 콘텐츠가 여기에 표시됩니다'];
      for (const p of patterns) {
        if (text.includes(p)) return { found: true, pattern: p };
      }
      return { found: false };
    }`
  });

  // 2. 콘텐츠 길이 체크
  checklist.push({
    id: 'content_length',
    description: '충분한 콘텐츠가 있어야 함 (최소 100자)',
    script: `() => {
      const mainText = document.querySelector('main')?.innerText || '';
      return { length: mainText.length, sufficient: mainText.length >= 100 };
    }`
  });

  // 3. 필수 요소 체크
  checklist.push({
    id: 'structure',
    description: '기본 구조 (header, main, footer)',
    script: `() => ({
      header: !!document.querySelector('#header-placeholder, header'),
      main: !!document.querySelector('main'),
      footer: !!document.querySelector('#footer-placeholder, footer')
    })`
  });

  // 4. 링크 유효성 체크
  checklist.push({
    id: 'links',
    description: '내부 링크가 유효해야 함',
    script: `() => {
      const links = [...document.querySelectorAll('a[href$=".html"]')];
      return {
        count: links.length,
        links: links.map(a => ({ href: a.href, text: a.innerText.slice(0, 30) }))
      };
    }`
  });

  // 5. 키워드 존재 체크 (요구사항 기반)
  if (page.expectedContent) {
    const keywords = page.expectedContent
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 2)
      .slice(0, 5);

    checklist.push({
      id: 'keywords',
      description: `필수 키워드 존재: ${keywords.join(', ')}`,
      keywords,
      script: `(keywords) => {
        const text = document.body.innerText;
        const found = keywords.filter(k => text.includes(k));
        const missing = keywords.filter(k => !text.includes(k));
        return { found, missing, score: found.length / keywords.length };
      }`
    });
  }

  return checklist;
}

// 메인 - 검증 목록 출력
function main() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  Chrome DevTools MCP 기반 페이지 검증 가이드');
  console.log('══════════════════════════════════════════════════════════════\n');

  const pages = generateVerificationList();

  console.log(`총 ${pages.length}개 페이지 검증 대상\n`);

  // 누락 파일 목록
  const missing = pages.filter(p => p.status === 'missing');
  if (missing.length > 0) {
    console.log('❌ 누락된 파일:');
    missing.forEach(p => console.log(`   - ${p.storyboard}`));
    console.log('');
  }

  // 검증 대상 목록
  const pending = pages.filter(p => p.status === 'pending');
  console.log(`✓ 검증 가능: ${pending.length}개\n`);

  // JSON 형식으로 검증 목록 저장
  const verificationPlan = pending.map(page => ({
    ...page,
    checklist: generateChecklistForPage(page)
  }));

  fs.writeFileSync(
    path.join(__dirname, 'verification-plan.json'),
    JSON.stringify(verificationPlan, null, 2)
  );

  console.log('verification-plan.json 생성 완료\n');
  console.log('──────────────────────────────────────────────────────────────');
  console.log('Claude Code에서 다음 명령으로 검증 실행:\n');
  console.log('  "verification-plan.json을 읽고 Chrome DevTools MCP로 각 페이지 검증해줘"');
  console.log('──────────────────────────────────────────────────────────────\n');

  // 첫 번째 페이지 예시 출력
  if (pending.length > 0) {
    const example = pending[0];
    console.log('예시 - 첫 번째 페이지 검증 명령:\n');
    console.log(`1. navigate_page: ${example.fileUrl}`);
    console.log('2. take_snapshot (DOM 구조 확인)');
    console.log('3. list_console_messages (에러 확인)');
    console.log('4. take_screenshot (시각적 확인)');
    console.log('5. evaluate_script (커스텀 검증)\n');
  }
}

main();
