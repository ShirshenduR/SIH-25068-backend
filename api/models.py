from django.db import models


class Station(models.Model):
    """Represents a single groundwater monitoring station."""

    station_code = models.CharField(max_length=50, primary_key=True)
    station_name = models.CharField(max_length=200)
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    latest_level = models.FloatField(null=True, blank=True)
    latest_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.station_name} ({self.station_code})"
