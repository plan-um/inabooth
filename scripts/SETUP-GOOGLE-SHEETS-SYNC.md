# Google Sheets 자동 동기화 설정 가이드

페이지 HTML이 커밋될 때마다 메뉴구조도 Google Sheet가 자동으로 업데이트됩니다.

## 설정 단계

### 1. Google Cloud 서비스 계정 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 생성
3. **API 및 서비스** > **사용자 인증 정보** 이동
4. **사용자 인증 정보 만들기** > **서비스 계정** 클릭
5. 서비스 계정 이름 입력 (예: `inabooth-sheets-sync`)
6. **완료** 클릭

### 2. 서비스 계정 키 생성

1. 생성된 서비스 계정 클릭
2. **키** 탭 이동
3. **키 추가** > **새 키 만들기** > **JSON** 선택
4. 다운로드된 JSON 파일 내용 복사

### 3. Google Sheets API 활성화

1. **API 및 서비스** > **라이브러리** 이동
2. "Google Sheets API" 검색
3. **사용** 클릭

### 4. 스프레드시트에 서비스 계정 공유

1. 메뉴구조도 스프레드시트 열기
2. **공유** 버튼 클릭
3. 서비스 계정 이메일 입력 (형식: `xxx@xxx.iam.gserviceaccount.com`)
4. **편집자** 권한 부여

### 5. GitHub Secrets 설정

Repository > Settings > Secrets and variables > Actions:

| Secret 이름 | 값 |
|------------|-----|
| `GOOGLE_SERVICE_ACCOUNT` | JSON 키 파일 전체 내용 |
| `MENU_SPREADSHEET_ID` | `1eplHcJ9KGK318chpZIcCUe6RZN0hSIFtDYigKRCHcLA` |

## 동작 방식

- `pages/*.html` 파일이 main/master 브랜치에 푸시될 때 자동 실행
- 각 HTML 파일에서 제목, 콘텐츠, 링크/버튼 정보 추출
- 메뉴구조도 1.0 시트에 업데이트

## 수동 실행

GitHub Actions 탭 > "Sync Menu Structure to Google Sheets" > "Run workflow"
