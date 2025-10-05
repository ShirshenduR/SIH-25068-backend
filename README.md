# Real-time Groundwater Resource Evaluation Backend

This Django project provides a backend service for a mobile application focused on real-time groundwater resource evaluation. It acts as an intelligent service layer on top of the public India-WRIS API, offering not just raw data, but also pre-processed, analytical insights about groundwater levels.

## Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd SIH-25068-backend
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install the required dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the database migrations:**
    ```bash
    python manage.py migrate
    ```

5.  **Run the Django development server:**
    ```bash
    python manage.py runserver
    ```
    The backend will be running at `http://127.0.0.1:8000/`.

## API Endpoints

All endpoints are accessible at the base URL `http://127.0.0.1:8000/api/`.

The API expects a `POST` request with a JSON body containing the following parameters:

*   `stateName` (string, required)
*   `districtName` (string, required)
*   `startdate` (string, required, format: `YYYY-MM-DD`)
*   `enddate` (string, required, format: `YYYY-MM-DD`)

---


### 1. Raw Data Proxy

Fetches and returns the raw, unmodified JSON data directly from the India-WRIS API. This is useful for debugging or for clients that want to perform their own data processing.

*   **URL:** `/api/groundwater-level/`
*   **Method:** `POST`

**Sample `curl` command:**
```bash
curl -X POST http://127.0.0.1:8000/api/groundwater-level/ \
-H "Content-Type: application/json" \
-d '{
    "stateName": "ODISHA",
    "districtName": "PURI",
    "startdate": "2022-01-01",
    "enddate": "2023-01-01"
}'
```

**Sample Success Response (200 OK):**
```json
{
    "message": "Dataset fetched successfully",
    "data": [
        {
            "stationCode": "195657085492201",
            "stationName": "Uansdiha",
            "dataValue": 1.78,
            "dataTime": "2022-01-30T07:00:00",
            ...
        }
    ]
}
```

---


### 2. Resource Evaluation Summary

Fetches data and returns a calculated summary analysis. This is the most useful endpoint for getting a quick overview of the groundwater situation.

*   **URL:** `/api/groundwater-summary/`
*   **Method:** `POST`

**Sample `curl` command:**
```bash
curl -X POST http://127.0.0.1:8000/api/groundwater-summary/ \
-H "Content-Type: application/json" \
-d '{
    "stateName": "ODISHA",
    "districtName": "PURI",
    "startdate": "2022-01-01",
    "enddate": "2023-01-01"
}'
```

**Sample Success Response (200 OK):**
```json
{
    "total_record_count": 100,
    "valid_record_count": 98,
    "latest_water_level": {
        "date": "10-11-2022",
        "level": 1.35
    },
    "min_level": 0.1,
    "max_level": 9.4,
    "average_level": 2.74,
    "net_change": -0.43
}
```

---


### 3. Visualization & Trend Data

Fetches data and formats it specifically for use in charting libraries (e.g., Chart.js, D3.js).

*   **URL:** `/api/water-level-trend/`
*   **Method:** `POST`

**Sample `curl` command:**
```bash
curl -X POST http://127.0.0.1:8000/api/water-level-trend/ \
-H "Content-Type: application/json" \
-d '{
    "stateName": "ODISHA",
    "districtName": "PURI",
    "startdate": "2022-01-01",
    "enddate": "2023-01-01"
}'
```

**Sample Success Response (200 OK):**
```json
{
    "trend_data": [
        {
            "date": "10-01-2022",
            "level": 8.75
        },
        {
            "date": "30-01-2022",
            "level": 1.78
        }
    ]
}
```

## Error Handling

The API will return standard HTTP error codes:

*   `400 Bad Request`: The request is missing required parameters (`stateName`, `districtName`, `startdate`, `enddate`).
*   `502 Bad Gateway`: The external India-WRIS API is down, unreachable, or returning an error.
*   `500 Internal Server Error`: An unexpected error occurred during data processing, likely due to a change in the data format from the external API.
