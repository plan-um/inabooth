#!/usr/bin/env python3
"""
Sync HTML pages to Google Sheets menu structure.
For use in GitHub Actions with service account authentication.
"""
import os
import re
from bs4 import BeautifulSoup
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Constants
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SPREADSHEET_ID = os.environ.get("SPREADSHEET_ID", "1eplHcJ9KGK318chpZIcCUe6RZN0hSIFtDYigKRCHcLA")
SHEET_NAME = "메뉴구조도 1.0"
PAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pages")


def authenticate_sheets():
    """Authenticates with Google Sheets API using service account."""
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

    if not creds_path or not os.path.exists(creds_path):
        print("Error: Service account credentials not found")
        return None

    try:
        creds = service_account.Credentials.from_service_account_file(
            creds_path, scopes=SCOPES
        )
        service = build("sheets", "v4", credentials=creds)
        return service
    except Exception as err:
        print(f"Authentication error: {err}")
        return None


def parse_html_files(directory):
    """Parses HTML files in the directory to extract menu structure."""
    file_data = []

    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return file_data

    files = sorted([f for f in os.listdir(directory) if f.endswith(".html")])

    for filename in files:
        filepath = os.path.join(directory, filename)

        # Parse Filename for Hierarchy
        match = re.match(r"^(\d+)(?:-(\d+))?(?:-(\d+))?(?:-(\d+))?\s+(.*)\.html$", filename)
        if match:
            d1 = match.group(1)
            d2 = match.group(2) if match.group(2) else ""
            d3 = match.group(3) if match.group(3) else ""
            d4 = match.group(4) if match.group(4) else ""
            page_name_from_file = match.group(5).replace("_", " ")
            full_id = f"{d1}-{d2}-{d3}-{d4}".strip("-")
        else:
            full_id = filename
            page_name_from_file = filename.replace(".html", "")

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f, "html.parser")

                # Extract Page Title
                title_tag = soup.find("title")
                page_title = title_tag.get_text(strip=True).replace("- INABOOTH", "").strip() if title_tag else page_name_from_file

                # Extract Content/Data
                content_elements = []
                for h in soup.find_all(["h1", "h2", "h3"]):
                    text = h.get_text(strip=True)
                    if text:
                        content_elements.append(text)
                for label in soup.find_all("label"):
                    text = label.get_text(strip=True)
                    if text:
                        content_elements.append(text)
                content_summary = ", ".join(list(set(content_elements))[:10])

                # Extract Links/Buttons/Actions
                action_elements = []
                for a in soup.find_all("a", href=True):
                    text = a.get_text(strip=True)
                    href = a['href']
                    if text and href and href != "#":
                        action_elements.append(f"[{text}] -> {href}")
                for btn in soup.find_all("button"):
                    text = btn.get_text(strip=True)
                    if text:
                        action_elements.append(f"[BUTTON: {text}]")
                action_summary = " / ".join(list(set(action_elements))[:10])

                # Build row: No, Sector, 1 depth, 2 depth, 3 depth, 스토리보드 번호, 설명, 콘텐츠/데이터, 링크/버튼/액션
                row_data = [
                    "",         # No (auto-numbered)
                    "User App", # Sector
                    match.group(1) if match else "", # 1 depth
                    match.group(2) if match and match.group(2) else "", # 2 depth
                    match.group(3) if match and match.group(3) else "", # 3 depth
                    f"[{full_id}]", # 스토리보드 번호
                    page_title, # 설명
                    content_summary, # 콘텐츠/데이터
                    action_summary,  # 링크/버튼/액션
                ]

                file_data.append(row_data)

        except Exception as e:
            print(f"Error parsing {filename}: {e}")

    return file_data


def update_sheet(service, data):
    """Updates the Google Sheet with new data, preserving headers."""
    try:
        # Verify sheet exists
        spreadsheet = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
        sheets = spreadsheet.get('sheets', [])
        sheet_exists = any(s['properties']['title'] == SHEET_NAME for s in sheets)

        if not sheet_exists:
            print(f"Sheet '{SHEET_NAME}' not found.")
            return False

        # Clear Data Rows Only (Starting from Row 2)
        service.spreadsheets().values().clear(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{SHEET_NAME}'!A2:I"
        ).execute()

        # Write Data starting from A2
        body = {"values": data}
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{SHEET_NAME}'!A2",
            valueInputOption="USER_ENTERED",
            body=body
        ).execute()

        print(f"Successfully updated {len(data)} rows in {SHEET_NAME}")
        return True

    except HttpError as err:
        print(f"Error updating sheet: {err}")
        return False


def main():
    print("Authenticating with Google Sheets...")
    service = authenticate_sheets()
    if not service:
        print("Failed to authenticate. Exiting.")
        exit(1)

    print(f"Parsing HTML files from {PAGES_DIR}...")
    data = parse_html_files(PAGES_DIR)

    if not data:
        print("No files found to sync.")
        exit(0)

    print(f"Found {len(data)} pages. Updating sheet...")
    success = update_sheet(service, data)

    if success:
        print("Done!")
    else:
        print("Failed to update sheet.")
        exit(1)


if __name__ == "__main__":
    main()
