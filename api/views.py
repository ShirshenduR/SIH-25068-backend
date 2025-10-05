from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Station
from .wris_api import fetch_wris_data  # Import from the new file


class GroundwaterLevelView(APIView):
    def post(self, request):
        data, error = fetch_wris_data(request.data)
        if error:
            if "Missing" in error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": error}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(data, status=status.HTTP_200_OK)


class GroundwaterSummaryView(APIView):
    def post(self, request):
        data, error = fetch_wris_data(request.data)
        if error:
            if "Missing" in error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": error}, status=status.HTTP_502_BAD_GATEWAY)
        try:
            records = data.get("data", [])
            if not records:
                return Response({"message": "No records found for the given criteria."})
            valid_records = [r for r in records if r.get("dataValue") is not None]
            if not valid_records:
                return Response(
                    {"message": "No valid water level data available for processing."}
                )
            valid_records.sort(key=lambda x: datetime.fromisoformat(x["dataTime"]))
            levels = [r["dataValue"] for r in valid_records]
            latest_record = valid_records[-1]
            earliest_record = valid_records[0]
            summary = {
                "total_record_count": len(records),
                "valid_record_count": len(valid_records),
                "latest_water_level": {
                    "date": datetime.fromisoformat(latest_record["dataTime"]).strftime(
                        "%d-%m-%Y"
                    ),
                    "level": latest_record["dataValue"],
                },
                "min_level": min(levels),
                "max_level": max(levels),
                "average_level": round(sum(levels) / len(levels), 2),
                "net_change": round(
                    latest_record["dataValue"] - earliest_record["dataValue"], 2
                ),
            }
            return Response(summary, status=status.HTTP_200_OK)
        except (KeyError, TypeError, ValueError) as e:
            return Response(
                {"error": f"Internal server error during data processing: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WaterLevelTrendView(APIView):
    def post(self, request):
        data, error = fetch_wris_data(request.data)
        if error:
            if "Missing" in error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": error}, status=status.HTTP_502_BAD_GATEWAY)
        try:
            records = data.get("data", [])
            if not records:
                return Response({"trend_data": []})
            valid_records = [r for r in records if r.get("dataValue") is not None]
            valid_records.sort(key=lambda x: datetime.fromisoformat(x["dataTime"]))
            trend_data = [
                {
                    "date": datetime.fromisoformat(r["dataTime"]).strftime("%d-%m-%Y"),
                    "level": r["dataValue"],
                }
                for r in valid_records
            ]
            return Response({"trend_data": trend_data}, status=status.HTTP_200_OK)
        except (KeyError, TypeError, ValueError) as e:
            return Response(
                {"error": f"Internal server error during data processing: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AllStationsDataView(APIView):
    def get(self, request):
        stations = Station.objects.all()
        data = [
            {
                "station_code": station.station_code,
                "station_name": station.station_name,
                "state": station.state,
                "district": station.district,
                "latitude": station.latitude,
                "longitude": station.longitude,
                "latest_level": station.latest_level,
                "latest_date": station.latest_date.isoformat()
                if station.latest_date
                else None,
            }
            for station in stations
        ]
        return Response(data, status=status.HTTP_200_OK)
