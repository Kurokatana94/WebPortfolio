from oauth2client.service_account import ServiceAccountCredentials
import datetime as dt
import pandas as pd
import requests
import gspread
import json
import os

class SpaceFlightsUpdates:
    def __init__(self, google_credentials_json):
        self.GOOGLE_CREDENTIALS_DICT = json.loads(google_credentials_json)
        
        # Auth Google Sheets
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_dict(self.GOOGLE_CREDENTIALS_DICT, scope)
        client = gspread.authorize(creds)

        spreadsheet = client.open("Space Flights Database")
        self.past_launches_sheet = spreadsheet.worksheet("past_launches")
        self.upcoming_launches_sheet = spreadsheet.worksheet("upcoming_launches")

    def fetch_upcoming_launches(self):
        upcoming_launches = []
        current_time = dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        upcoming_launches_url = f"https://ll.thespacedevs.com/2.2.0/launch/?limit=100&ordering=net&net__gte={current_time}"
        print("Fetching upcoming launches data...")

        while upcoming_launches_url:
            try:
                response = requests.get(upcoming_launches_url)
                response.raise_for_status()

                data = response.json()
                upcoming_launches.extend(data['results'])
                print(f"Fetched: {len(upcoming_launches)} launches")
                upcoming_launches_url = data.get('next')
            except requests.exceptions.HTTPError as e:
                if response.status_code == 429:
                    print("Failed to fetch launches: Error 429 - Too Many API calls")
                    return upcoming_launches
                else:
                    print(f"Failed to fetch launches:", e)
        print(f"Fetched a total of: {len(upcoming_launches)} launches")
        return upcoming_launches

    def fetch_past_launches(self):
        existing_records = self.past_launches_sheet.get_all_records()
        existing_names = {row["Name"] for row in existing_records}
        existing_launch_dates = {row["Date"] for row in existing_records}
        current_time = dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

        past_launches_url = f"https://ll.thespacedevs.com/2.2.0/launch/?limit=100&ordering=-net&net__lte={current_time}"

        print("Fetching new launches data...")
        new_records = []
        try:
            response = requests.get(past_launches_url)
            print(response)
            response.raise_for_status()

            valid_status_ids = [3, 4, 5]  # Success, Failure, Partial
            data = response.json()
            recent_launches = [launch for launch in data['results'] if launch.get("status", {}).get("id") in valid_status_ids]

            for launch in recent_launches[::-1]:
                name = launch.get("name")
                date = launch.get("window_start")
                if name not in existing_names and date not in existing_launch_dates:
                    new_records.append([name, date, launch.get("status", {}).get("name"), launch.get("rocket", {}).get("configuration", {}).get("name"), launch.get("launch_service_provider", {}).get("name"), launch.get("pad", {}).get("location", {}).get("name"), ])
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                print("Failed to fetch launches: Error 429 - Too Many API calls")
            else:
                print(f"Failed to fetch launches:", e)
        return new_records

    def past_launches_db_update(self):
        new_records = self.fetch_past_launches()
        if new_records:
            self.past_launches_sheet.append_rows(new_records)
            print(f"Added {len(new_records)} new launches to the sheet.")
        else:
            print("No new launches to add.")

    def upcoming_launches_db_update(self):
        upcoming_launches = self.fetch_upcoming_launches()
        records = []

        for launch in upcoming_launches:
            records.append({"Name": launch.get("name"), "Date": launch.get("window_start"), "Status": launch.get("status", {}).get("name"), "Rocket": launch.get("rocket", {}).get("configuration", {}).get("name"), "Provider": launch.get("launch_service_provider", {}).get("name"),
                "Location": launch.get("pad", {}).get("location", {}).get("name"), })
        if records:
            df = pd.DataFrame(records)
            print("Uploading to Google Sheets...")
            self.upcoming_launches_sheet.clear()
            self.upcoming_launches_sheet.update([df.columns.values.tolist()] + df.values.tolist())
            print("Upload complete.")
