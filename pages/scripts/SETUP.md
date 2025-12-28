# Notion 자동 동기화 설정 가이드

이 가이드를 따라 설정하면 HTML 페이지가 추가/수정/삭제될 때마다 Notion 데이터베이스가 자동으로 업데이트됩니다.

---

## 📋 설정 순서

### 1단계: Notion Integration 생성 (5분)

1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지 접속
2. **+ New integration** 클릭
3. 설정:
   - **Name**: `INABOOTH Page Sync`
   - **Associated workspace**: 본인 워크스페이스 선택
   - **Capabilities**:
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. **Submit** 클릭
5. **Internal Integration Secret** 복사 → 메모장에 저장 (나중에 사용)

---

### 2단계: Notion 데이터베이스 생성 (3분)

1. Notion에서 새 페이지 생성
2. `/database` 입력 → **Database - Full page** 선택
3. 데이터베이스 이름: `INABOOTH 페이지 목록`

4. **속성 추가** (정확한 이름 사용):

| 속성 이름 | 타입 | 설명 |
|----------|------|------|
| 페이지명 | Title | 기본 제목 (자동 생성됨) |
| 페이지 ID | Text | 예: 1-1-1, 3-2 |
| 섹션 | Select | 예: 🔐 Auth |
| 파일명 | Text | 예: 1-1-1 회원가입.html |
| 최종 수정 | Date | 파일 수정 시간 |
| 상태 | Select | ✅ 완료, 🚧 작업중, ⏳ 대기 |

5. **섹션 Select 옵션 추가**:
   - 🔐 Auth
   - 🏠 Main
   - 🔍 Browse
   - 📂 Open Project
   - 💡 Insight
   - 🎨 Character
   - 📋 Project Mgmt
   - 📝 Application
   - 👤 My Page
   - 💬 Chat
   - 🆘 Support

---

### 3단계: 데이터베이스 연결 (1분)

1. 생성한 데이터베이스 페이지 열기
2. 우측 상단 **...** 메뉴 클릭
3. **Connections** → **INABOOTH Page Sync** 선택
4. **Confirm** 클릭

---

### 4단계: 데이터베이스 ID 복사 (1분)

1. 데이터베이스 페이지 URL 확인:
   ```
   https://www.notion.so/your-workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        이 부분이 DATABASE_ID
   ```

2. 32자리 ID 복사 → 메모장에 저장

---

### 5단계: GitHub Secrets 설정 (2분)

1. GitHub 저장소 페이지 접속
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭:

   | Name | Value |
   |------|-------|
   | `NOTION_TOKEN` | 1단계에서 복사한 Integration Secret |
   | `NOTION_DATABASE_ID` | 4단계에서 복사한 32자리 ID |

---

### 6단계: 테스트 (1분)

1. 코드 변경 후 푸시하거나
2. GitHub → **Actions** → **Sync Pages to Notion** → **Run workflow**
3. 실행 로그 확인
4. Notion 데이터베이스에서 결과 확인

---

## 🎯 작동 방식

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  HTML 파일 수정  │ ──▶  │  GitHub Push    │ ──▶  │  Actions 실행   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  클라이언트 확인 │ ◀──  │  Notion 업데이트 │ ◀──  │  스크립트 실행   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

- **신규 페이지**: 자동 생성
- **수정된 페이지**: 최종 수정일 업데이트
- **삭제된 페이지**: 자동 아카이브

---

## 🔧 로컬 테스트 (선택)

```bash
cd pages/scripts
npm install

# 환경 변수 설정 후 실행
export NOTION_TOKEN="your_integration_secret"
export NOTION_DATABASE_ID="your_database_id"
npm run sync
```

---

## ⚠️ 주의사항

1. **페이지 ID**는 고유해야 합니다 (예: 1-1-1, 3-2)
2. **속성 이름**을 정확히 맞춰야 합니다 (대소문자, 공백 포함)
3. 데이터베이스에 Integration **연결 필수**

---

## 🆘 문제 해결

### "Could not find database"
→ Integration이 데이터베이스에 연결되었는지 확인 (3단계)

### "Property not found"
→ 데이터베이스 속성 이름이 정확한지 확인 (2단계)

### "Invalid API key"
→ NOTION_TOKEN이 올바른지 확인 (5단계)

---

## 📌 클라이언트 공유

1. Notion 데이터베이스 페이지에서 **Share** 클릭
2. **Invite** → 클라이언트 이메일 입력
3. 권한: **Can view** (읽기 전용) 또는 **Can comment** (댓글 가능)
