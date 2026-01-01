# INABOOTH Design System

> 프로젝트 전체에서 일관된 스타일을 유지하기 위한 디자인 시스템 문서

## 목차

1. [디자인 토큰](#1-디자인-토큰)
2. [레이아웃 시스템](#2-레이아웃-시스템)
3. [컴포넌트 라이브러리](#3-컴포넌트-라이브러리)
4. [페이지 구조](#4-페이지-구조)
5. [CSS 작성 규칙](#5-css-작성-규칙)
6. [검증 도구](#6-검증-도구)

---

## 1. 디자인 토큰

### 색상 (Colors)

```css
/* Primary */
--color-primary: #4F46E5;          /* 인디고 - 메인 액션 */
--color-primary-hover: #4338CA;
--color-primary-light: #EEF2FF;

/* Text */
--color-text-primary: #1F2937;     /* 본문 */
--color-text-secondary: #6B7280;   /* 보조 텍스트 */
--color-text-tertiary: #9CA3AF;    /* 비활성 */
--color-text-inverse: #FFFFFF;     /* 반전 (버튼 내) */

/* Background */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F9FAFB;
--color-bg-tertiary: #F3F4F6;

/* Border */
--color-border: #E2E4E9;

/* Status */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
```

### 타이포그래피 (Typography)

```css
/* Font Family */
--font-family: 'Pretendard Variable', sans-serif;

/* Font Sizes */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### 간격 (Spacing)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 테두리 및 그림자 (Borders & Shadows)

```css
/* Border Radius */
--radius-sm: 0.25rem;    /* 4px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-card: 0 1px 3px rgba(0,0,0,0.1);
```

---

## 2. 레이아웃 시스템

### 컨테이너

```html
<div class="container">
  <!-- 콘텐츠 -->
</div>
```

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);  /* 24px 좌우 패딩 */
}
```

### 헤더

```html
<header class="header header--sticky">
  <div class="header__inner">
    <a href="index.html" class="logo">INABOOTH</a>
    <nav class="header__nav">...</nav>
    <div class="header__actions">...</div>
  </div>
</header>
```

**주의**: `.header__inner`는 자동으로 좌우 패딩(24px)이 적용됩니다.

### 페이지 섹션

```html
<div class="page-section">
  <h1 class="page-section__title">제목</h1>
  <p class="page-section__desc">설명</p>
  <!-- 콘텐츠 -->
</div>
```

### 페이지 하단 액션 버튼

```html
<div class="page-actions">
  <a href="prev.html" class="btn btn--secondary btn--lg">이전</a>
  <a href="next.html" class="btn btn--primary btn--lg">다음</a>
</div>

<!-- 변형 -->
<div class="page-actions page-actions--center">...</div>
<div class="page-actions page-actions--between">...</div>
```

---

## 3. 컴포넌트 라이브러리

### 버튼 (Buttons)

```html
<!-- 크기 -->
<button class="btn btn--primary">기본</button>
<button class="btn btn--primary btn--sm">작은</button>
<button class="btn btn--primary btn--lg">큰</button>
<button class="btn btn--primary btn--full">전체 너비</button>

<!-- 스타일 -->
<button class="btn btn--primary">Primary</button>
<button class="btn btn--secondary">Secondary</button>
<button class="btn btn--outline">Outline</button>
<button class="btn btn--ghost">Ghost</button>
<button class="btn btn--danger">Danger</button>

<!-- 비활성 -->
<button class="btn btn--primary" disabled>비활성</button>
```

### 폼 요소 (Forms)

```html
<div class="form-group">
  <label class="form-label" for="input">라벨</label>
  <input type="text" id="input" class="form-input" placeholder="입력">
  <span class="form-hint">도움말</span>
</div>

<div class="form-group">
  <label class="form-label">옵션</label>
  <select class="form-input">
    <option>선택</option>
  </select>
</div>

<div class="form-group">
  <label class="form-label">내용</label>
  <textarea class="form-input" rows="4"></textarea>
</div>
```

### 카드 (Cards)

```html
<div class="card">
  <div class="card__image">
    <img src="..." alt="...">
  </div>
  <div class="card__content">
    <h3 class="card__title">제목</h3>
    <p class="card__desc">설명</p>
  </div>
  <div class="card__footer">
    <button class="btn btn--primary">액션</button>
  </div>
</div>
```

### 배지 (Badges)

```html
<span class="badge">기본</span>
<span class="badge badge--primary">Primary</span>
<span class="badge badge--success">Success</span>
<span class="badge badge--warning">Warning</span>
<span class="badge badge--error">Error</span>
```

### 모달 (Modals)

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal__header">
      <h2 class="modal__title">제목</h2>
      <button class="modal__close">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="modal__content">
      <!-- 콘텐츠 -->
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary">취소</button>
      <button class="btn btn--primary">확인</button>
    </div>
  </div>
</div>
```

---

## 4. 페이지 구조

### 기본 템플릿

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>페이지 제목 - INABOOTH</title>
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
  <link rel="stylesheet" href="components/shared.css">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* 페이지 전용 스타일 (최소화) */
  </style>
</head>
<body>
  <div id="header-placeholder"></div>

  <main>
    <div class="container">
      <!-- 페이지 콘텐츠 -->
    </div>
  </main>

  <div id="footer-placeholder"></div>
  <script src="components/shared.js"></script>
  <script>initPage({activePage:'탐색'});</script>
</body>
</html>
```

### 파일 명명 규칙

```
[번호] [페이지명].html

예시:
1-1-1 회원가입.html
3-2 IP 상세.html
8-2-2 지원 현황_스크랩.html
```

---

## 5. CSS 작성 규칙

### 원칙

1. **shared.css 우선**: 새 클래스를 만들기 전에 기존 클래스를 먼저 확인
2. **BEM 네이밍**: `.block__element--modifier` 패턴 사용
3. **CSS 변수 사용**: 하드코딩 값 대신 디자인 토큰 사용
4. **인라인 스타일 최소화**: 복잡한 스타일은 shared.css에 추가

### BEM 네이밍 예시

```css
/* Block */
.card { }

/* Element */
.card__title { }
.card__content { }
.card__footer { }

/* Modifier */
.card--featured { }
.card--compact { }
```

### 금지 사항

```css
/* BAD - 하드코딩 값 */
.element {
  margin: 24px;
  color: #1F2937;
}

/* GOOD - CSS 변수 사용 */
.element {
  margin: var(--space-6);
  color: var(--color-text-primary);
}
```

### shared.css에 클래스 추가하기

1. 적절한 섹션을 찾습니다 (BUTTONS, FORMS, CARDS 등)
2. BEM 네이밍 규칙을 따릅니다
3. CSS 변수만 사용합니다
4. 주석으로 용도를 설명합니다

```css
/* ========================================
   N. SECTION NAME
======================================== */

/* 클래스 설명 */
.new-class {
  display: flex;
  gap: var(--space-4);
  /* ... */
}
```

---

## 6. 검증 도구

### CSS 린터 실행

```bash
# 전체 검증
node tools/validate-css.js

# 누락 클래스 CSS 추천
node tools/validate-css.js --fix

# 특정 파일만 검증
node tools/validate-css.js --file=8-2-2
```

### 검증 리포트

- `verify/css-validation-report.json`: 전체 검증 결과
- `verify/missing-classes.css`: 누락 클래스 CSS 추천

### CI/CD 통합 (권장)

```yaml
# .github/workflows/validate.yml
name: CSS Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: node pages/tools/validate-css.js
```

---

## 빠른 참조 - 자주 사용하는 클래스

### 레이아웃

| 클래스 | 용도 |
|--------|------|
| `.container` | 중앙 정렬 컨테이너 |
| `.page-section` | 페이지 섹션 래퍼 |
| `.page-actions` | 하단 액션 버튼 영역 |

### 버튼

| 클래스 | 용도 |
|--------|------|
| `.btn` | 기본 버튼 |
| `.btn--primary` | 주요 액션 |
| `.btn--secondary` | 보조 액션 |
| `.btn--lg` | 큰 버튼 |
| `.btn--full` | 전체 너비 |

### 폼

| 클래스 | 용도 |
|--------|------|
| `.form-group` | 폼 필드 래퍼 |
| `.form-label` | 라벨 |
| `.form-input` | 입력 필드 |
| `.form-hint` | 도움말 |

### 텍스트

| 클래스 | 용도 |
|--------|------|
| `.page-section__title` | 섹션 제목 (24px) |
| `.page-section__desc` | 섹션 설명 |
| `.page-title` | 페이지 제목 (30px) |

---

## 업데이트 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-12-23 | 1.0.0 | 초기 문서 작성 |
| 2026-12-23 | 1.0.1 | `.page-actions`, `.page-section` 클래스 추가 |
