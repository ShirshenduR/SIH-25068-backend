import requests
from datetime import datetime


def fetch_wris_data(request_data):
    """
    Fetches groundwater data from the India-WRIS API.
    """
    payload = {
        "agencyName": "CGWB",
        "stateName": request_data["stateName"],
        "districtName": request_data["districtName"],
        "startdate": request_data["startdate"],
        "enddate": request_data["enddate"],
        "download": False,
        "page": 0,
        "size": 1000,
    }

    wris_url = "https://indiawris.gov.in/Dataset/Ground Water Level"

    try:
        response = requests.post(wris_url, params=payload, timeout=30)
        response.raise_for_status()
        return response.json(), None
    except requests.exceptions.Timeout:
        return None, "The request to the external WRIS API timed out."
    except requests.exceptions.RequestException as e:
        return None, f"Failed to connect to the external WRIS API: {e}"
