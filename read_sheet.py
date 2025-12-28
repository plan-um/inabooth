import os.path
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

SAMPLE_SPREADSHEET_ID = "1eplHcJ9KGK318chpZIcCUe6RZN0hSIFtDYigKRCHcLA"
SAMPLE_RANGE_NAME = "A1:E20"  # Read comprehensive range

def main():
  creds = None
  if os.path.exists("token.json"):
    creds = Credentials.from_authorized_user_file("token.json", SCOPES)
  
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      print("Token invalid or missing.")
      return

  try:
    service = build("sheets", "v4", credentials=creds)

    # Call the Sheets API
    sheet = service.spreadsheets()
    
    # 1. Get Spreadsheet Metadata (Title, Sheets)
    spreadsheet = sheet.get(spreadsheetId=SAMPLE_SPREADSHEET_ID).execute()
    print(f"Spreadsheet Title: {spreadsheet.get('properties', {}).get('title')}")
    
    sheets = spreadsheet.get('sheets', [])
    print(f"Sheets found: {[s['properties']['title'] for s in sheets]}")

    # 2. Read Data from the first sheet
    first_sheet_title = sheets[0]['properties']['title']
    range_name = f"'{first_sheet_title}'!A1:Z100"
    
    result = sheet.values().get(spreadsheetId=SAMPLE_SPREADSHEET_ID, range=range_name).execute()
    values = result.get("values", [])

    if not values:
      print("No data found.")
      return

    print("\nData:")
    for row in values:
      print(row)

  except HttpError as err:
    print(err)

if __name__ == "__main__":
  main()
