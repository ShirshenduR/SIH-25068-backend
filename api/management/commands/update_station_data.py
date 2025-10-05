import requests
from datetime import datetime
from django.core.management.base import BaseCommand
from api.models import Station
from api.wris_api import fetch_wris_data  # Re-use the helper function

# We use the same public JSON for the location list as the frontend
LOCATIONS_API_URL = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json"


class Command(BaseCommand):
    help = "Fetches groundwater data for all districts in India and updates the local database."

    def handle(self, *args, **options):
        self.stdout.write("Starting data fetch for all stations...")

        try:
            locations_response = requests.get(LOCATIONS_API_URL)
            locations_response.raise_for_status()
            locations_data = locations_response.json()
        except requests.exceptions.RequestException as e:
            self.stderr.write(self.style.ERROR(f"Failed to fetch location list: {e}"))
            return

        total_states = len(locations_data["states"])
        for i, state_data in enumerate(locations_data["states"]):
            state_name = state_data["state"]
            for district_name in state_data["districts"]:
                self.stdout.write(
                    f"Fetching data for {district_name}, {state_name} ({i + 1}/{total_states}) ..."
                )

                # Use a recent, wide date range to get latest data
                request_payload = {
                    "stateName": state_name.upper(),
                    "districtName": district_name.upper(),
                    "startdate": "2023-01-01",  # Fetch data for the last couple of years
                    "enddate": datetime.now().strftime("%Y-%m-%d"),
                }

                # Reuse the existing fetch_wris_data function
                # Note: This function is in views.py, which is not ideal for a management command
                # but we reuse it to avoid duplicating code.
                data, error = fetch_wris_data(request_payload)

                if error or not data or not data.get("data"):
                    self.stderr.write(
                        self.style.WARNING(
                            f"Could not fetch data for {district_name}: {error or 'No data returned'}"
                        )
                    )
                    continue

                station_updates = {}
                for record in data["data"]:
                    station_code = record.get("stationCode")
                    if (
                        not station_code
                        or not record.get("latitude")
                        or not record.get("longitude")
                    ):
                        continue

                    try:
                        record_date = datetime.fromisoformat(record["dataTime"])
                        # Only update if the current record is newer
                        if (
                            station_code not in station_updates
                            or record_date
                            > station_updates[station_code]["latest_date"]
                        ):
                            station_updates[station_code] = {
                                "station_name": record.get("stationName", "N/A"),
                                "state": record.get("state", state_name),
                                "district": record.get("district", district_name),
                                "latitude": record.get("latitude"),
                                "longitude": record.get("longitude"),
                                "latest_level": record.get("dataValue"),
                                "latest_date": record_date,
                            }
                    except (TypeError, ValueError):
                        continue  # Skip records with invalid date formats

                # Bulk update the database
                for code, fields in station_updates.items():
                    Station.objects.update_or_create(station_code=code, defaults=fields)

        self.stdout.write(
            self.style.SUCCESS("Successfully finished updating station data.")
        )
