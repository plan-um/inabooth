#!/usr/bin/env node
/**
 * INABOOTH 페이지 목록 → Notion 자동 동기화 스크립트
 *
 * 사용법:
 *   NOTION_TOKEN=xxx NOTION_DATABASE_ID=xxx node sync-to-notion.js
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// 환경 변수
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error('❌ NOTION_TOKEN과 NOTION_DATABASE_ID 환경 변수가 필요합니다.');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

// 섹션 정의
const SECTIONS = {
  '1': { name: 'Auth', emoji: '🔐', description: '회원가입/로그인' },
  '2': { name: 'Main', emoji: '🏠', description: '메인' },
  '3': { name: 'Browse', emoji: '🔍', description: '탐색' },
  '4': { name: 'Open Project', emoji: '📂', description: '오픈 프로젝트' },
  '5': { name: 'Insight', emoji: '💡', description: '인사이트' },
  '6': { name: 'Character', emoji: '🎨', description: '캐릭터 등록/관리' },
  '7': { name: 'Project Mgmt', emoji: '📋', description: '프로젝트 등록/관리' },
  '8': { name: 'Application', emoji: '📝', description: '프로젝트 지원' },
  '9': { name: 'My Page', emoji: '👤', description: '마이페이지' },
  '10': { name: 'Chat', emoji: '💬', description: '채팅' },
  '11': { name: 'Support', emoji: '🆘', description: '지원' },
};

/**
 * pages 디렉토리에서 HTML 파일 목록 추출
 */
function scanPages(pagesDir) {
  const files = fs.readdirSync(pagesDir);
  const pages = [];

  for (const file of files) {
    // HTML 파일만, sitemap과 index 제외
    if (!file.endsWith('.html')) continue;
    if (file.startsWith('00-') || file === 'index.html' || file === 'index-v2.html') continue;

    const match = file.match(/^(\d+(?:-\d+)*)\s+(.+)\.html$/);
    if (!match) continue;

    const [, pageId, pageName] = match;
    const sectionId = pageId.split('-')[0];
    const section = SECTIONS[sectionId] || { name: 'Unknown', emoji: '❓', description: '' };

    // 파일 수정 시간 확인
    const filePath = path.join(pagesDir, file);
    const stats = fs.statSync(filePath);

    pages.push({
      pageId,
      pageName,
      fileName: file,
      section: section.name,
      sectionEmoji: section.emoji,
      sectionDescription: section.description,
      lastModified: stats.mtime,
      fullPath: filePath,
    });
  }

  // index.html 추가 (메인 페이지)
  const indexPath = path.join(pagesDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const stats = fs.statSync(indexPath);
    pages.push({
      pageId: '2-1',
      pageName: '메인',
      fileName: 'index.html',
      section: 'Main',
      sectionEmoji: '🏠',
      sectionDescription: '메인',
      lastModified: stats.mtime,
      fullPath: indexPath,
    });
  }

  // 페이지 ID 순으로 정렬
  pages.sort((a, b) => {
    const aParts = a.pageId.split('-').map(Number);
    const bParts = b.pageId.split('-').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) return aVal - bVal;
    }
    return 0;
  });

  return pages;
}

/**
 * Notion 데이터베이스의 기존 페이지 목록 가져오기
 */
async function getExistingNotionPages() {
  const pages = [];
  let cursor = undefined;

  do {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const pageIdProp = page.properties['페이지 ID'];
      if (pageIdProp && pageIdProp.rich_text && pageIdProp.rich_text[0]) {
        pages.push({
          notionPageId: page.id,
          pageId: pageIdProp.rich_text[0].plain_text,
        });
      }
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}

/**
 * Notion 페이지 생성
 */
async function createNotionPage(page) {
  await notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      '페이지명': {
        title: [{ text: { content: page.pageName } }],
      },
      '페이지 ID': {
        rich_text: [{ text: { content: page.pageId } }],
      },
      '섹션': {
        select: { name: `${page.sectionEmoji} ${page.section}` },
      },
      '파일명': {
        rich_text: [{ text: { content: page.fileName } }],
      },
      '최종 수정': {
        date: { start: page.lastModified.toISOString() },
      },
      '상태': {
        select: { name: '✅ 완료' },
      },
    },
  });
}

/**
 * Notion 페이지 업데이트
 */
async function updateNotionPage(notionPageId, page) {
  await notion.pages.update({
    page_id: notionPageId,
    properties: {
      '페이지명': {
        title: [{ text: { content: page.pageName } }],
      },
      '파일명': {
        rich_text: [{ text: { content: page.fileName } }],
      },
      '최종 수정': {
        date: { start: page.lastModified.toISOString() },
      },
    },
  });
}

/**
 * Notion 페이지 삭제 (아카이브)
 */
async function archiveNotionPage(notionPageId) {
  await notion.pages.update({
    page_id: notionPageId,
    archived: true,
  });
}

/**
 * 메인 동기화 함수
 */
async function sync() {
  const pagesDir = path.resolve(__dirname, '..');

  console.log('📂 페이지 스캔 중...');
  const localPages = scanPages(pagesDir);
  console.log(`   발견된 페이지: ${localPages.length}개`);

  console.log('☁️  Notion 데이터 조회 중...');
  const notionPages = await getExistingNotionPages();
  console.log(`   기존 페이지: ${notionPages.length}개`);

  // 매핑 생성
  const notionMap = new Map(notionPages.map(p => [p.pageId, p.notionPageId]));
  const localMap = new Map(localPages.map(p => [p.pageId, p]));

  let created = 0;
  let updated = 0;
  let archived = 0;

  // 신규 및 업데이트
  for (const page of localPages) {
    const existingNotionPageId = notionMap.get(page.pageId);

    if (existingNotionPageId) {
      // 업데이트
      await updateNotionPage(existingNotionPageId, page);
      updated++;
      console.log(`   🔄 업데이트: ${page.pageId} ${page.pageName}`);
    } else {
      // 신규 생성
      await createNotionPage(page);
      created++;
      console.log(`   ✨ 생성: ${page.pageId} ${page.pageName}`);
    }
  }

  // 삭제된 페이지 아카이브
  for (const notionPage of notionPages) {
    if (!localMap.has(notionPage.pageId)) {
      await archiveNotionPage(notionPage.notionPageId);
      archived++;
      console.log(`   🗑️  아카이브: ${notionPage.pageId}`);
    }
  }

  console.log('\n✅ 동기화 완료!');
  console.log(`   생성: ${created}개`);
  console.log(`   업데이트: ${updated}개`);
  console.log(`   아카이브: ${archived}개`);
}

// 실행
sync().catch(err => {
  console.error('❌ 동기화 실패:', err.message);
  process.exit(1);
});
