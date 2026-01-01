/**
 * INABOOTH 통합 컴포넌트 시스템
 * 헤더, 푸터, 모달, 폼 검증 등 모든 페이지에서 공유되는 요소
 * v2.0 - 2026.12
 */

// ========================================
// 1. 기본 설정
// ========================================
const currentPath = window.location.pathname;
const isFileProtocol = window.location.protocol === 'file:';
const basePath = '';

// ========================================
// 1.1 사용자 역할 관리 시스템
// ========================================
/**
 * 사용자 역할 타입:
 * - 'guest': 비로그인 상태
 * - 'iph': IP홀더 (크리에이터)
 * - 'bp': 브랜드 파트너 (기업)
 */
const UserRole = {
  GUEST: 'guest',
  IPH: 'iph',
  BP: 'bp'
};

// 현재 사용자 역할 가져오기
function getUserRole() {
  return localStorage.getItem('inabooth_user_role') || UserRole.GUEST;
}

// 사용자 역할 설정
function setUserRole(role) {
  if (Object.values(UserRole).includes(role)) {
    localStorage.setItem('inabooth_user_role', role);
    return true;
  }
  return false;
}

// 로그인 여부 확인
function isLoggedIn() {
  const role = getUserRole();
  return role === UserRole.IPH || role === UserRole.BP;
}

// 사용자 역할 전환
function switchUserRole() {
  const currentRole = getUserRole();
  if (currentRole === UserRole.IPH) {
    setUserRole(UserRole.BP);
    Toast.success('브랜드 파트너 모드로 전환되었습니다');
  } else if (currentRole === UserRole.BP) {
    setUserRole(UserRole.IPH);
    Toast.success('IP홀더 모드로 전환되었습니다');
  }
  // 헤더 다시 렌더링
  setTimeout(() => window.location.reload(), 500);
}

// 로그인 처리 (데모용)
function handleLogin(role = UserRole.IPH) {
  setUserRole(role);
  Toast.success('로그인되었습니다');
  setTimeout(() => {
    window.location.href = basePath + 'index.html';
  }, 500);
}

// 로그아웃 처리
function handleLogout() {
  localStorage.removeItem('inabooth_user_role');
  Toast.info('로그아웃되었습니다.');
  setTimeout(() => {
    window.location.href = basePath + 'index.html';
  }, 1000);
}

// 페이지 접근 권한 정의
const PageAccess = {
  // 모든 사용자 접근 가능
  public: ['index.html', '2-1 메인.html', '3-1 탐색.html', '4-1 오픈 프로젝트.html', '5-1 인사이트.html'],
  // IPH 전용 페이지 (캐릭터 등록/관리, 프로젝트 지원)
  iphOnly: ['6-1', '6-2', '8-1', '8-2'],
  // BP 전용 페이지 (프로젝트 등록/관리, 지원자 관리)
  bpOnly: ['7-1', '7-2', '7-3'],
  // 로그인 필수 페이지
  authRequired: ['9-', '10-']
};

// 현재 페이지 접근 권한 체크
// ⚠️ 테스트 모드: 모든 페이지 접근 허용
const TEST_MODE = true;

function checkPageAccess() {
  // 테스트 모드에서는 모든 페이지 접근 허용
  if (TEST_MODE) {
    // 페이지에 맞는 역할 자동 설정
    const path = window.location.pathname;
    const fileName = path.split('/').pop() || 'index.html';

    // IPH 페이지면 자동으로 IPH 역할 설정
    if (PageAccess.iphOnly.some(prefix => fileName.startsWith(prefix))) {
      if (getUserRole() !== UserRole.IPH) {
        setUserRole(UserRole.IPH);
      }
    }
    // BP 페이지면 자동으로 BP 역할 설정
    else if (PageAccess.bpOnly.some(prefix => fileName.startsWith(prefix))) {
      if (getUserRole() !== UserRole.BP) {
        setUserRole(UserRole.BP);
      }
    }
    // 로그인 필수 페이지면 기본 IPH로 설정
    else if (PageAccess.authRequired.some(prefix => fileName.startsWith(prefix))) {
      if (!isLoggedIn()) {
        setUserRole(UserRole.IPH);
      }
    }
    return true;
  }

  const path = window.location.pathname;
  const fileName = path.split('/').pop() || 'index.html';
  const role = getUserRole();

  // IPH 전용 페이지 체크
  if (PageAccess.iphOnly.some(prefix => fileName.startsWith(prefix))) {
    if (role !== UserRole.IPH) {
      showAccessDenied('IP홀더');
      return false;
    }
  }

  // BP 전용 페이지 체크
  if (PageAccess.bpOnly.some(prefix => fileName.startsWith(prefix))) {
    if (role !== UserRole.BP) {
      showAccessDenied('브랜드 파트너');
      return false;
    }
  }

  // 로그인 필수 페이지 체크
  if (PageAccess.authRequired.some(prefix => fileName.startsWith(prefix))) {
    if (!isLoggedIn()) {
      showLoginRequired();
      return false;
    }
  }

  return true;
}

// 접근 거부 메시지 표시
function showAccessDenied(requiredRole) {
  Toast.warning(`이 페이지는 ${requiredRole} 전용입니다`);
  setTimeout(() => {
    window.location.href = basePath + 'index.html';
  }, 1500);
}

// 로그인 필요 메시지 표시
function showLoginRequired() {
  Toast.info('로그인이 필요한 페이지입니다');
  setTimeout(() => {
    window.location.href = basePath + '1-2-1 로그인.html';
  }, 1500);
}

// 공통 CSS 주입
(function injectSharedCSS() {
  if (!document.querySelector('link[href*="shared.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'components/shared.css';
    document.head.appendChild(link);
  }
})();

// ========================================
// 2. 헤더 HTML 템플릿
// ========================================
function getHeaderHTML(activePage = '') {
  const role = getUserRole();
  const headerActions = getHeaderActionsHTML(role);
  const mobileNavActions = getMobileNavActionsHTML(role);

  return `
  <!-- Background Blobs -->
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="blob blob-3"></div>

  <!-- HEADER [STD-01] -->
  <header class="header">
    <div class="container header__inner">
      <div class="header__left">
        <a href="${basePath}index.html" class="logo">
          <img src="${basePath}images/logo-full.svg" alt="INABOOTH" style="height: 28px;">
        </a>
        <nav class="nav">
          <a href="${basePath}3-1 탐색.html" class="nav__link ${activePage === 'browse' ? 'nav__link--active' : ''}">탐색</a>
          <a href="${basePath}4-1 오픈 프로젝트.html" class="nav__link ${activePage === 'project' ? 'nav__link--active' : ''}">오픈 프로젝트</a>
          <a href="${basePath}5-1 인사이트.html" class="nav__link ${activePage === 'insight' ? 'nav__link--active' : ''}">인사이트</a>
        </nav>
      </div>

      <div class="header__search" id="headerSearch">
        <div class="search-bar" id="searchBar">
          <i data-lucide="search" class="icon icon-sm search-bar__icon"></i>
          <input type="text" class="search-bar__input" id="searchInput" placeholder="캐릭터, 키워드로 검색" autocomplete="off">
        </div>
        ${getSearchExpandHTML()}
      </div>

      <div class="header__actions" id="headerActions">
        ${headerActions}
        <button class="hamburger" id="hamburgerBtn" aria-label="메뉴 열기">
          <span class="hamburger__icon"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Navigation -->
  <nav class="mobile-nav" id="mobileNav">
    <div class="mobile-nav__inner">
      <a href="${basePath}3-1 탐색.html" class="mobile-nav__link ${activePage === 'browse' ? 'active' : ''}">
        <i data-lucide="search" class="icon"></i>
        탐색
      </a>
      <a href="${basePath}4-1 오픈 프로젝트.html" class="mobile-nav__link ${activePage === 'project' ? 'active' : ''}">
        <i data-lucide="folder-open" class="icon"></i>
        오픈 프로젝트
      </a>
      <a href="${basePath}5-1 인사이트.html" class="mobile-nav__link ${activePage === 'insight' ? 'active' : ''}">
        <i data-lucide="lightbulb" class="icon"></i>
        인사이트
      </a>
      <div class="mobile-nav__divider"></div>
      <a href="${basePath}9-7 마이부스.html" class="mobile-nav__link ${activePage === 'mypage' ? 'active' : ''}">
        <i data-lucide="layout-dashboard" class="icon"></i>
        마이부스
      </a>
      <a href="${basePath}10-1 채팅.html" class="mobile-nav__link ${activePage === 'chat' ? 'active' : ''}">
        <i data-lucide="message-circle" class="icon"></i>
        채팅
      </a>
      ${mobileNavActions}
    </div>
  </nav>
  `;
}

// 역할별 헤더 액션 HTML
function getHeaderActionsHTML(role) {
  if (role === UserRole.GUEST) {
    // 비로그인 상태
    return `
      <a href="${basePath}1-2-1 로그인.html" class="btn btn--ghost">로그인</a>
      <a href="${basePath}1-1-1 회원가입.html" class="btn btn--primary">
        <i data-lucide="user-plus" class="icon icon-sm"></i>
        회원가입
      </a>
    `;
  } else if (role === UserRole.IPH) {
    // IP홀더
    return `
      <a href="${basePath}10-1 채팅.html" class="icon-btn">
        <i data-lucide="message-circle" class="icon"></i>
        <span class="icon-btn__badge"></span>
      </a>
      <a href="${basePath}9-6 알림 설정.html" class="icon-btn">
        <i data-lucide="bell" class="icon"></i>
      </a>
      <a href="${basePath}6-1 캐릭터 등록.html" class="btn btn--primary">
        <i data-lucide="palette" class="icon icon-sm"></i>
        캐릭터 등록
      </a>
      <div class="profile-trigger" id="profileTrigger">
        <button class="icon-btn" id="profileBtn">
          <img src="${basePath}images/people/Random People (1).png" alt="프로필" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
        </button>
        ${getProfilePopoverHTML(role)}
      </div>
    `;
  } else if (role === UserRole.BP) {
    // 브랜드 파트너
    return `
      <a href="${basePath}10-1 채팅.html" class="icon-btn">
        <i data-lucide="message-circle" class="icon"></i>
        <span class="icon-btn__badge"></span>
      </a>
      <a href="${basePath}9-6 알림 설정.html" class="icon-btn">
        <i data-lucide="bell" class="icon"></i>
      </a>
      <a href="${basePath}7-1 프로젝트 등록.html" class="btn btn--primary">
        <i data-lucide="briefcase" class="icon icon-sm"></i>
        프로젝트 등록
      </a>
      <div class="profile-trigger" id="profileTrigger">
        <button class="icon-btn" id="profileBtn">
          <img src="${basePath}images/people/Random People (1).png" alt="프로필" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
        </button>
        ${getProfilePopoverHTML(role)}
      </div>
    `;
  }
  return '';
}

// 역할별 모바일 네비게이션 액션 HTML
function getMobileNavActionsHTML(role) {
  if (role === UserRole.GUEST) {
    return `
      <div class="mobile-nav__actions">
        <a href="${basePath}1-2-1 로그인.html" class="btn btn--outline btn--lg">로그인</a>
        <a href="${basePath}1-1-1 회원가입.html" class="btn btn--primary btn--lg">회원가입</a>
      </div>
    `;
  } else if (role === UserRole.IPH) {
    return `
      <div class="mobile-nav__actions">
        <a href="${basePath}6-1 캐릭터 등록.html" class="btn btn--primary btn--lg">
          <i data-lucide="palette" class="icon icon-sm"></i>
          캐릭터 등록
        </a>
      </div>
    `;
  } else if (role === UserRole.BP) {
    return `
      <div class="mobile-nav__actions">
        <a href="${basePath}7-1 프로젝트 등록.html" class="btn btn--primary btn--lg">
          <i data-lucide="briefcase" class="icon icon-sm"></i>
          프로젝트 등록
        </a>
      </div>
    `;
  }
  return '';
}

// 로그인 상태 헤더 (프로필 아이콘 포함)
function getLoggedInHeaderActions() {
  return `
  <a href="${basePath}10-1 채팅.html" class="icon-btn">
    <i data-lucide="message-circle" class="icon"></i>
    <span class="icon-btn__badge"></span>
  </a>
  <a href="${basePath}9-6 알림 설정.html" class="icon-btn">
    <i data-lucide="bell" class="icon"></i>
  </a>
  <div class="profile-trigger" id="profileTrigger">
    <button class="icon-btn" id="profileBtn">
      <img src="${basePath}images/people/Random People (1).png" alt="프로필" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
    </button>
    ${getProfilePopoverHTML()}
  </div>
  `;
}

// ========================================
// 3. 푸터 HTML 템플릿
// ========================================
function getFooterHTML() {
  return `
  <!-- FOOTER [STD-02] -->
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="${basePath}index.html" class="footer__logo">
            <img src="${basePath}images/logo-full.svg" alt="INABOOTH" style="height: 24px; filter: brightness(0) invert(1);">
          </a>
          <p class="footer__desc">브랜드와 캐릭터 IP를 연결하는<br>가장 빠른 협업 플랫폼</p>
          <div class="footer__social">
            <a href="#" class="footer__social-link" target="_blank" rel="noopener">
              <i data-lucide="instagram" class="icon"></i>
            </a>
            <a href="#" class="footer__social-link" target="_blank" rel="noopener">
              <i data-lucide="linkedin" class="icon"></i>
            </a>
            <a href="#" class="footer__social-link" target="_blank" rel="noopener">
              <i data-lucide="pen-line" class="icon"></i>
            </a>
          </div>
        </div>

        <div class="footer__col">
          <h4 class="footer__col-title">서비스</h4>
          <ul class="footer__links">
            <li><a href="${basePath}3-1 탐색.html">IP 탐색</a></li>
            <li><a href="${basePath}4-1 오픈 프로젝트.html">오픈 프로젝트</a></li>
            <li><a href="${basePath}5-1 인사이트.html">인사이트</a></li>
            <li><a href="${basePath}6-1 캐릭터 등록.html">캐릭터 등록</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4 class="footer__col-title">지원</h4>
          <ul class="footer__links">
            <li><a href="${basePath}11-1 FAQ.html">FAQ</a></li>
            <li><a href="${basePath}11-2 1:1 문의.html">1:1 문의</a></li>
            <li><a href="#">업데이트 노트</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4 class="footer__col-title">회사</h4>
          <ul class="footer__links">
            <li><a href="#">회사소개</a></li>
            <li><a href="#">채용공고</a></li>
            <li><a href="#">이용약관</a></li>
            <li><a href="#">개인정보처리방침</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copyright">&copy; 2026 INABOOTH. All rights reserved.</p>
        <div class="footer__lang">
          <button class="footer__lang-btn active">한국어</button>
          <button class="footer__lang-btn">English</button>
          <button class="footer__lang-btn">日本語</button>
        </div>
      </div>
    </div>
  </footer>
  `;
}

// ========================================
// 4. 프로필 팝오버 HTML
// ========================================
function getProfilePopoverHTML(role = UserRole.IPH) {
  const roleLabel = role === UserRole.IPH ? 'IP홀더' : '브랜드 파트너';
  const switchLabel = role === UserRole.IPH ? '브랜드 파트너로 전환' : 'IP홀더로 전환';
  const switchIcon = role === UserRole.IPH ? 'briefcase' : 'palette';
  const roleBadgeClass = role === UserRole.IPH ? 'profile-popover__role--iph' : 'profile-popover__role--bp';

  // 역할별 전용 메뉴
  const roleSpecificMenu = role === UserRole.IPH ? `
      <a href="${basePath}6-2 캐릭터 관리.html" class="profile-popover__item">
        <i data-lucide="image" class="icon icon-sm"></i>
        내 캐릭터 관리
      </a>
      <a href="${basePath}9-7-3 마이부스_지원 현황.html" class="profile-popover__item">
        <i data-lucide="file-text" class="icon icon-sm"></i>
        지원 현황
      </a>
  ` : `
      <a href="${basePath}7-2 프로젝트 관리.html" class="profile-popover__item">
        <i data-lucide="folder" class="icon icon-sm"></i>
        내 프로젝트 관리
      </a>
      <a href="${basePath}7-3 지원자 관리.html" class="profile-popover__item">
        <i data-lucide="users" class="icon icon-sm"></i>
        지원자 관리
      </a>
  `;

  return `
  <div class="profile-popover" id="profilePopover">
    <div class="profile-popover__header">
      <img src="${basePath}images/people/Random People (1).png" alt="Profile" class="profile-popover__avatar">
      <div class="profile-popover__info">
        <span class="profile-popover__name">홍길동</span>
        <span class="profile-popover__role ${roleBadgeClass}">${roleLabel}</span>
      </div>
    </div>

    <!-- 역할 전환 버튼 -->
    <div class="profile-popover__switch">
      <button class="profile-popover__switch-btn" onclick="switchUserRole()">
        <i data-lucide="${switchIcon}" class="icon icon-sm"></i>
        ${switchLabel}
        <i data-lucide="arrow-right" class="icon icon-sm" style="margin-left:auto"></i>
      </button>
    </div>

    <div class="profile-popover__divider"></div>

    <div class="profile-popover__menu">
      <a href="${basePath}9-1 프로필 관리.html" class="profile-popover__item">
        <i data-lucide="user" class="icon icon-sm"></i>
        내 프로필
      </a>
      <a href="${basePath}9-7 마이부스.html" class="profile-popover__item">
        <i data-lucide="layout-dashboard" class="icon icon-sm"></i>
        마이부스
      </a>
      ${roleSpecificMenu}
      <a href="${basePath}9-8 내 통계.html" class="profile-popover__item">
        <i data-lucide="bar-chart-2" class="icon icon-sm"></i>
        내 통계
      </a>
      <a href="${basePath}9-2 설정.html" class="profile-popover__item">
        <i data-lucide="settings" class="icon icon-sm"></i>
        설정
      </a>
      <div class="profile-popover__divider"></div>
      <a href="${basePath}9-4 요금제 관리.html" class="profile-popover__item">
        <i data-lucide="crown" class="icon icon-sm"></i>
        요금제 관리
      </a>
      <a href="${basePath}11-2 1:1 문의.html" class="profile-popover__item">
        <i data-lucide="headphones" class="icon icon-sm"></i>
        1:1 문의
      </a>
      <button class="profile-popover__item profile-popover__item--logout" onclick="handleLogout()">
        <i data-lucide="log-out" class="icon icon-sm"></i>
        로그아웃
      </button>
    </div>
  </div>
  `;
}

// ========================================
// 5. 검색 확장 영역 HTML
// ========================================
function getSearchExpandHTML() {
  return `
  <div class="search-expand" id="searchExpand">
    <div class="search-expand__section">
      <div class="search-expand__header">
        <span class="search-expand__title">최근 검색어</span>
        <button class="search-expand__clear" onclick="clearRecentSearches()">전체 삭제</button>
      </div>
      <div class="search-expand__tags" id="recentSearches">
        <span class="search-expand__tag">귀여운 캐릭터 <button class="search-expand__tag-remove" onclick="removeSearch(this)"><i data-lucide="x" class="icon icon-sm"></i></button></span>
        <span class="search-expand__tag">펭수 <button class="search-expand__tag-remove" onclick="removeSearch(this)"><i data-lucide="x" class="icon icon-sm"></i></button></span>
        <span class="search-expand__tag">F&B 협업 <button class="search-expand__tag-remove" onclick="removeSearch(this)"><i data-lucide="x" class="icon icon-sm"></i></button></span>
      </div>
    </div>
    <div class="search-expand__section">
      <span class="search-expand__title">추천 검색어</span>
      <div class="search-expand__tags">
        <span class="search-expand__tag search-expand__tag--suggest" onclick="applySearch('동물 캐릭터')">동물 캐릭터</span>
        <span class="search-expand__tag search-expand__tag--suggest" onclick="applySearch('이모티콘')">이모티콘</span>
        <span class="search-expand__tag search-expand__tag--suggest" onclick="applySearch('웹툰')">웹툰</span>
      </div>
    </div>
    <div class="search-expand__section">
      <span class="search-expand__title">인기 태그</span>
      <div class="search-expand__tags">
        <span class="search-expand__tag search-expand__tag--hot" onclick="applySearch('귀여운')"><i data-lucide="trending-up" class="icon icon-sm"></i> 귀여운</span>
        <span class="search-expand__tag search-expand__tag--hot" onclick="applySearch('감성')"><i data-lucide="trending-up" class="icon icon-sm"></i> 감성</span>
        <span class="search-expand__tag search-expand__tag--hot" onclick="applySearch('MZ')"><i data-lucide="trending-up" class="icon icon-sm"></i> MZ</span>
      </div>
    </div>
  </div>
  `;
}

// ========================================
// 6. 모달 시스템
// ========================================
const Modal = {
  activeModals: [],

  // 모달 열기
  open(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modalBackdrop') || this.createBackdrop();

    if (modal) {
      backdrop.classList.add('modal-backdrop--active');
      modal.classList.add('modal--active');
      this.activeModals.push(modalId);
      document.body.style.overflow = 'hidden';
    }
  },

  // 모달 닫기
  close(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modalBackdrop');

    if (modal) {
      modal.classList.remove('modal--active');
      this.activeModals = this.activeModals.filter(id => id !== modalId);

      if (this.activeModals.length === 0 && backdrop) {
        backdrop.classList.remove('modal-backdrop--active');
        document.body.style.overflow = '';
      }
    }
  },

  // 모든 모달 닫기
  closeAll() {
    this.activeModals.forEach(id => {
      const modal = document.getElementById(id);
      if (modal) modal.classList.remove('modal--active');
    });
    this.activeModals = [];

    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.remove('modal-backdrop--active');
    document.body.style.overflow = '';
  },

  // 백드롭 생성
  createBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.id = 'modalBackdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.onclick = () => this.closeAll();
    document.body.appendChild(backdrop);
    return backdrop;
  }
};

// 뉴스레터 모달 HTML
function getNewsletterModalHTML() {
  return `
  <div class="modal-backdrop" id="modalBackdrop" onclick="Modal.closeAll()"></div>
  <div class="modal modal--md" id="newsletterModal">
    <div class="modal__body newsletter-modal">
      <div class="newsletter-modal__icon">
        <i data-lucide="mail" class="icon-xl"></i>
      </div>
      <h2 class="newsletter-modal__title">뉴스레터 구독</h2>
      <p class="newsletter-modal__desc">
        최신 캐릭터 IP 트렌드와 협업 기회를<br>
        매주 이메일로 받아보세요.
      </p>
      <form class="newsletter-modal__form" onsubmit="submitNewsletter(event)">
        <input type="email" class="form-input newsletter-modal__input" placeholder="이메일 주소 입력" required>
        <button type="submit" class="btn btn--primary">구독하기</button>
      </form>
    </div>
    <button class="modal__close" onclick="Modal.close('newsletterModal')">
      <i data-lucide="x" class="icon"></i>
    </button>
  </div>
  `;
}

// ========================================
// 7. Toast 알림 시스템
// ========================================
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    this.init();

    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type]}" class="icon toast__icon"></i>
      <div class="toast__content">
        <span class="toast__message">${message}</span>
      </div>
      <button class="toast__close" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="icon-sm"></i>
      </button>
    `;

    this.container.appendChild(toast);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  warning(message) { this.show(message, 'warning'); },
  info(message) { this.show(message, 'info'); }
};

// ========================================
// 8. 폼 검증 시스템
// ========================================
const FormValidator = {
  rules: {
    required: (value) => value.trim() !== '' || '필수 입력 항목입니다.',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '올바른 이메일 형식이 아닙니다.',
    phone: (value) => /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(value.replace(/-/g, '')) || '올바른 휴대폰 번호 형식이 아닙니다.',
    minLength: (min) => (value) => value.length >= min || `최소 ${min}자 이상 입력해주세요.`,
    maxLength: (max) => (value) => value.length <= max || `최대 ${max}자까지 입력 가능합니다.`,
    password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(value) || '영문, 숫자를 포함하여 8자 이상 입력해주세요.',
    match: (targetId) => (value) => value === document.getElementById(targetId)?.value || '입력값이 일치하지 않습니다.',
    businessNumber: (value) => /^\d{3}-\d{2}-\d{5}$/.test(value) || '올바른 사업자등록번호 형식이 아닙니다. (000-00-00000)'
  },

  // 단일 필드 검증
  validateField(input, rules) {
    const value = input.value;
    const errors = [];

    rules.forEach(rule => {
      let validator;
      let param;

      if (typeof rule === 'string') {
        validator = this.rules[rule];
      } else if (typeof rule === 'object') {
        const [ruleName, ruleParam] = Object.entries(rule)[0];
        validator = this.rules[ruleName];
        param = ruleParam;
      }

      if (validator) {
        const fn = param !== undefined ? validator(param) : validator;
        const result = fn(value);
        if (result !== true) {
          errors.push(result);
        }
      }
    });

    return errors;
  },

  // 필드 에러 표시
  showFieldError(input, message) {
    this.clearFieldError(input);
    input.classList.add('form-input--error');

    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.innerHTML = `<i data-lucide="alert-circle" class="icon icon-sm"></i> ${message}`;
    input.parentNode.appendChild(errorEl);

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  // 필드 성공 표시
  showFieldSuccess(input) {
    this.clearFieldError(input);
    input.classList.add('form-input--success');
  },

  // 필드 에러 제거
  clearFieldError(input) {
    input.classList.remove('form-input--error', 'form-input--success');
    const errorEl = input.parentNode.querySelector('.form-error');
    if (errorEl) errorEl.remove();
  },

  // 폼 전체 검증
  validateForm(formId, fieldRules) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;

    Object.entries(fieldRules).forEach(([fieldId, rules]) => {
      const input = document.getElementById(fieldId);
      if (input) {
        const errors = this.validateField(input, rules);
        if (errors.length > 0) {
          this.showFieldError(input, errors[0]);
          isValid = false;
        } else {
          this.showFieldSuccess(input);
        }
      }
    });

    return isValid;
  },

  // 실시간 검증 바인딩
  bindRealTimeValidation(fieldId, rules) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    input.addEventListener('blur', () => {
      const errors = this.validateField(input, rules);
      if (errors.length > 0) {
        this.showFieldError(input, errors[0]);
      } else {
        this.showFieldSuccess(input);
      }
    });

    input.addEventListener('input', () => {
      this.clearFieldError(input);
    });
  }
};

// 글자수 카운터
function initCharCounter(inputId, maxLength, warningThreshold = 0.8) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const counter = document.createElement('div');
  counter.className = 'form-char-count';
  input.parentNode.appendChild(counter);

  const updateCounter = () => {
    const length = input.value.length;
    counter.textContent = `${length} / ${maxLength}`;

    counter.classList.remove('form-char-count--warning', 'form-char-count--error');
    if (length > maxLength) {
      counter.classList.add('form-char-count--error');
    } else if (length >= maxLength * warningThreshold) {
      counter.classList.add('form-char-count--warning');
    }
  };

  input.addEventListener('input', updateCounter);
  updateCounter();
}

// ========================================
// 9. 검색 기능
// ========================================
function initSearchExpand() {
  const searchInput = document.getElementById('searchInput');
  const searchExpand = document.getElementById('searchExpand');

  if (!searchInput || !searchExpand) return;

  searchInput.addEventListener('focus', () => {
    searchExpand.classList.add('search-expand--active');
  });

  document.addEventListener('click', (e) => {
    const searchArea = document.getElementById('headerSearch');
    if (searchArea && !searchArea.contains(e.target)) {
      searchExpand.classList.remove('search-expand--active');
    }
  });
}

function applySearch(keyword) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = keyword;
    searchInput.focus();
  }
}

function removeSearch(button) {
  const tag = button.closest('.search-expand__tag');
  if (tag) tag.remove();
}

function clearRecentSearches() {
  const container = document.getElementById('recentSearches');
  if (container) container.innerHTML = '<span class="text-tertiary" style="font-size: 0.875rem;">최근 검색어가 없습니다.</span>';
}

// ========================================
// 10. 프로필 팝오버
// ========================================
function initProfilePopover() {
  const profileBtn = document.getElementById('profileBtn');
  const profilePopover = document.getElementById('profilePopover');

  if (!profileBtn || !profilePopover) return;

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profilePopover.classList.toggle('profile-popover--active');
  });

  document.addEventListener('click', (e) => {
    if (!profilePopover.contains(e.target) && e.target !== profileBtn) {
      profilePopover.classList.remove('profile-popover--active');
    }
  });
}

// ========================================
// 11. 뉴스레터 구독
// ========================================
function submitNewsletter(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;

  // 데모용 성공 처리
  Modal.close('newsletterModal');
  Toast.success('뉴스레터 구독이 완료되었습니다!');
}

function openNewsletterModal() {
  // 뉴스레터 모달이 없으면 생성
  if (!document.getElementById('newsletterModal')) {
    document.body.insertAdjacentHTML('beforeend', getNewsletterModalHTML());
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  Modal.open('newsletterModal');
}

// ========================================
// 12. 컴포넌트 주입
// ========================================
function injectComponents(options = {}) {
  const { activePage = '', showHeader = true, showFooter = true, checkAccess = true } = options;

  // 페이지 접근 권한 체크 (checkAccess가 true인 경우만)
  if (checkAccess && !checkPageAccess()) {
    return; // 권한 없으면 중단 (리다이렉트됨)
  }

  // 헤더 주입 (역할에 따라 자동으로 다른 헤더 렌더링)
  if (showHeader) {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = getHeaderHTML(activePage);
    } else {
      document.body.insertAdjacentHTML('afterbegin', getHeaderHTML(activePage));
    }
  }

  // 푸터 주입
  if (showFooter) {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = getFooterHTML();
    } else {
      document.body.insertAdjacentHTML('beforeend', getFooterHTML());
    }
  }

  // Lucide 아이콘 재초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ========================================
// 13. 기타 유틸리티
// ========================================

// 카테고리 탭 클릭 핸들러
function initCategoryTabs() {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// 인기 태그 클릭 핸들러
function initPopularTags() {
  document.querySelectorAll('.hero__tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const keyword = tag.textContent.trim();
      const searchInput = document.querySelector('.hero__search-input');
      if (searchInput) {
        searchInput.value = keyword;
        searchInput.focus();
      }
    });
  });
}

// 스크롤 애니메이션 초기화
function initScrollAnimations() {
  document.querySelectorAll('.ip-grid').forEach(grid => {
    grid.querySelectorAll('.ip-card').forEach((card, index) => {
      card.classList.add('animate-on-scroll');
      card.style.setProperty('--card-index', index);
    });
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Modal.closeAll();
  }
});

// ========================================
// 14. 페이지 초기화
// ========================================
// ========================================
// 13. 스크랩/공유 기능
// ========================================

// 스크랩 토글 (버튼 클릭)
function toggleScrap(btn, itemName = 'IP') {
  const isScraped = btn.classList.toggle('scraped');
  const icon = btn.querySelector('i[data-lucide]');
  const text = btn.querySelector('span');

  if (isScraped) {
    btn.style.background = 'var(--color-primary)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--color-primary)';
    if (icon) icon.setAttribute('data-lucide', 'bookmark-check');
    if (text) text.textContent = '스크랩됨';
    Toast.success(`${itemName}을(를) 스크랩했습니다`);
  } else {
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
    if (icon) icon.setAttribute('data-lucide', 'bookmark');
    if (text) text.textContent = '스크랩';
    Toast.info('스크랩에서 제거되었습니다');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 카드형 스크랩 버튼 토글 (아이콘 버튼)
function toggleCardScrap(btn, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const isScraped = btn.classList.toggle('scraped');
  const icon = btn.querySelector('i[data-lucide]');

  if (isScraped) {
    btn.style.color = 'var(--color-warning)';
    if (icon) {
      icon.setAttribute('data-lucide', 'bookmark');
      icon.style.fill = 'currentColor';
    }
    Toast.success('스크랩에 추가되었습니다');
  } else {
    btn.style.color = '';
    if (icon) {
      icon.setAttribute('data-lucide', 'bookmark');
      icon.style.fill = 'none';
    }
    Toast.info('스크랩에서 제거되었습니다');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 공유 기능
function shareContent(title, url) {
  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;

  if (navigator.share) {
    navigator.share({ title: shareTitle, url: shareUrl })
      .catch(() => copyToClipboard(shareUrl));
  } else {
    copyToClipboard(shareUrl);
  }
}

// 클립보드 복사
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      Toast.success('링크가 클립보드에 복사되었습니다');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    Toast.success('링크가 복사되었습니다');
  } catch (err) {
    Toast.error('복사에 실패했습니다');
  }
  document.body.removeChild(textarea);
}

// 스크랩 버튼들 초기화
function initScrapButtons() {
  // 카드형 스크랩 버튼 (.ip-card__scrap, .card-scrap 등)
  document.querySelectorAll('.ip-card__scrap, .card-scrap, [data-action="scrap"]').forEach(btn => {
    if (!btn.hasAttribute('data-scrap-init')) {
      btn.setAttribute('data-scrap-init', 'true');
      btn.addEventListener('click', (e) => toggleCardScrap(btn, e));
    }
  });
}

// ========================================
// 14. 정적 링크 연동 (# 링크, 뒤로가기)
// ========================================
function initLinkFeedback() {
  // # 링크에 "준비중" 피드백 추가
  document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      Toast.info('준비중인 기능입니다.');
    });
  });

  // "이전" 버튼에 history.back() 적용
  document.querySelectorAll('a.btn').forEach(btn => {
    const text = btn.textContent.trim();
    if (text.includes('이전') && !btn.getAttribute('data-no-back')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = basePath + 'index.html';
        }
      });
    }
  });

  // onclick="history.back()" 속성이 없는 뒤로가기 버튼들 처리
  document.querySelectorAll('[data-action="back"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.back();
    });
  });
}

// ========================================
// 14. 햄버거 메뉴 (모바일)
// ========================================
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (!hamburgerBtn || !mobileNav) return;

  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    mobileNav.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
  });

  // 링크 클릭시 메뉴 닫기
  mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      hamburgerBtn.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

function initPage(options = {}) {
  document.addEventListener('DOMContentLoaded', () => {
    injectComponents(options);
    initCategoryTabs();
    initPopularTags();
    initScrollAnimations();
    initSearchExpand();
    initProfilePopover();
    initHamburgerMenu();
    initLinkFeedback();
    initScrapButtons();
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    injectComponents,
    initPage,
    getHeaderHTML,
    getFooterHTML,
    Modal,
    Toast,
    FormValidator,
    initCharCounter
  };
}
