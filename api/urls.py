from django.urls import path
from .views import (
    GroundwaterLevelView,
    GroundwaterSummaryView,
    WaterLevelTrendView,
    AllStationsDataView,
)

urlpatterns = [
    path(
        "groundwater-level/", GroundwaterLevelView.as_view(), name="groundwater-level"
    ),
    path(
        "groundwater-summary/",
        GroundwaterSummaryView.as_view(),
        name="groundwater-summary",
    ),
    path("water-level-trend/", WaterLevelTrendView.as_view(), name="water-level-trend"),
    path("all-stations-live/", AllStationsDataView.as_view(), name="all-stations-live"),
]
