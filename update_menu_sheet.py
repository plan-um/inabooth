import os
import re
from bs4 import BeautifulSoup
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Constants
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SPREADSHEET_ID = "1eplHcJ9KGK318chpZIcCUe6RZN0hSIFtDYigKRCHcLA"
SHEET_NAME_OLD = "메뉴구조도 0.9" # Not used for writing, just reference if needed
SHEET_NAME_NEW = "메뉴구조도 1.0"
PAGES_DIR = "/Users/hallymchoi/Dev/Projects/inabooth/pages"

def authenticate_sheets():
    """Authenticates with Google Sheets API."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("Token invalid or missing. Run authentication first.")
            return None
    
    try:
        service = build("sheets", "v4", credentials=creds)
        return service
    except HttpError as err:
        print(f"Authentication error: {err}")
        return None

def parse_html_files(directory):
    """Parses HTML files in the directory to extract menu structure."""
    file_data = []
    
    files = sorted([f for f in os.listdir(directory) if f.endswith(".html")])
    
    for filename in files:
        filepath = os.path.join(directory, filename)
        
        # 1. Parse Filename for Hierarchy (Depth 1, 2, 3)
        # Expected format: "1-1-1 PageName.html" or "10-1 Chat.html"
        depth1, depth2, depth3, page_name_from_file = "", "", "", ""
        
        match = re.match(r"^(\d+)(?:-(\d+))?(?:-(\d+))?(?:-(\d+))?\s+(.*)\.html$", filename)
        if match:
            # Simple heuristic mapping based on typical IA numbering
            # Assuming depth 1 is the first number, etc.
            # We will fill columns: No, Depth 1, Depth 2, Depth 3, Depth 4, Page Name
            # Let's adjust based on the file numbering structure 1-1-1
            d1 = match.group(1)
            d2 = match.group(2) if match.group(2) else ""
            d3 = match.group(3) if match.group(3) else ""
            d4 = match.group(4) if match.group(4) else ""
            page_name_from_file = match.group(5).replace("_", " ") # Replace underscores with spaces
            
            # Construct hierarchy string for sorting/ID
            full_id = f"{d1}-{d2}-{d3}-{d4}".strip("-")
        else:
            # Fallback for files like "index.html" or "00-sitemap.html"
            full_id = filename
            page_name_from_file = filename.replace(".html", "")

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f, "html.parser")
                
                # 2. Extract Page Title
                title_tag = soup.find("title")
                page_title = title_tag.get_text(strip=True).replace("- INABOOTH", "").strip() if title_tag else page_name_from_file

                # 3. Extract Content/Data
                # Heuristic: headers, labels, placeholders
                content_elements = []
                
                # Main headers
                for h in soup.find_all(["h1", "h2", "h3"]):
                    text = h.get_text(strip=True)
                    if text: content_elements.append(text)
                
                # Form labels
                for label in soup.find_all("label"):
                    text = label.get_text(strip=True)
                    if text: content_elements.append(text)
                    
                # Specific content areas (custom classes based on file view)
                for cls in [".auth-subtitle", ".chat-item__content", ".chat-main__text"]:
                    for el in soup.select(cls):
                        text = el.get_text(strip=True)
                        if text: content_elements.append(text[:50]) # limit length

                content_summary = ", ".join(list(set(content_elements))[:10])

                # 4. Extract Links/Buttons/Actions
                action_elements = []
                
                # Links
                for a in soup.find_all("a", href=True):
                    text = a.get_text(strip=True)
                    href = a['href']
                    if text and href and href != "#":
                        action_elements.append(f"[{text}] -> {href}")
                
                # Buttons
                for btn in soup.find_all("button"):
                    text = btn.get_text(strip=True)
                    if text:
                        action_elements.append(f"[BUTTON: {text}]")
                
                action_summary = " / ".join(list(set(action_elements))[:10])

                # MAPPING TO EXISTING HEADERS: 
                # ['No', 'Sector', '1 depth', '2 depth', '3 depth', '4 depth', '스토리보드 번호', '설명', '콘텐츠/데이터', '링크/버튼/액션', '코멘트']
                
                # 'No' is usually an index, we can use the file order or leave blank for auto-numbering later. 
                # Let's use loop index passed in, or just fill with hierarchy ID for now.
                # 'Sector' (System) -> empty for now or 'User Side'
                # Depths 1-4 -> mapped from filename
                # '스토리보드 번호' -> full_id (e.g. 1-1-1)
                # '설명' -> page_name (Page Title)
                # '콘텐츠/데이터' -> content_summary
                # '링크/버튼/액션' -> action_summary
                # '코멘트' -> Source file path for reference
                
                row_data = [
                    "",         # No
                    "User App", # Sector
                    match.group(1) if match else "", # 1 depth
                    match.group(2) if match and match.group(2) else "", # 2 depth
                    match.group(3) if match and match.group(3) else "", # 3 depth
                    match.group(4) if match and match.group(4) else "", # 4 depth
                    f"[{full_id}]", # 스토리보드 번호
                    page_title, # 설명
                    content_summary, # 콘텐츠/데이터
                    action_summary,  # 링크/버튼/액션
                    filename    # 코멘트
                ]
                
                file_data.append(row_data)
                
        except Exception as e:
            print(f"Error parsing {filename}: {e}")
            
    return file_data

def update_sheet(service, data):
    """Updates the Google Sheet with new data, preserving headers."""
    try:
        # Check sheet
        spreadsheet = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
        sheets = spreadsheet.get('sheets', [])
        sheet_id = None
        
        for s in sheets:
            if s['properties']['title'] == SHEET_NAME_NEW:
                sheet_id = s['properties']['sheetId']
                break
        
        if sheet_id is None:
            print(f"Sheet '{SHEET_NAME_NEW}' not found.")
            return

        # Clear Data Rows Only (Starting from Row 2)
        service.spreadsheets().values().clear(
            spreadsheetId=SPREADSHEET_ID, 
            range=f"'{SHEET_NAME_NEW}'!A2:K"
        ).execute()
        
        # Prepare Body (Data only)
        body = {
            "values": data
        }
        
        # Write Data starting from A2
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{SHEET_NAME_NEW}'!A2",
            valueInputOption="USER_ENTERED",
            body=body
        ).execute()
        
        print(f"Successfully updated {len(data)} rows in {SHEET_NAME_NEW} (Headers preserved)")
        
    except HttpError as err:
        print(f"Error updating sheet: {err}")

def main():
    service = authenticate_sheets()
    if not service:
        return

    print("Parsing local files...")
    data = parse_html_files(PAGES_DIR)
    
    print(f"Found {len(data)} files. Updating sheet...")
    update_sheet(service, data)
    print("Done!")

if __name__ == "__main__":
    main()
