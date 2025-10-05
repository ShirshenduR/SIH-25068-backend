import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Calendar as CalendarIcon,
  Droplet,
  TrendingUp,
  TrendingDown,
  Baseline,
  ArrowUp,
  ArrowDown,
  Loader2,
  MapPin,
  BarChart2,
  Map,
  X,
} from "lucide-react";

// --- DATA & UTILS ---
const LOCATIONS_API_URL =
  "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const getMarkerColor = (level, min, max) => {
  if (level === null || min === max) return "#8884d8";
  const percentage = (level - min) / (max - min);
  if (percentage < 0.33) return "#e74c3c";
  if (percentage < 0.66) return "#2ecc71";
  return "#3498db";
};

// --- SHADCN/UI COMPONENT MOCKS ---
const Card = ({ children, className }) => (
  <div
    className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`}
  >
    {children}
  </div>
);
const CardHeader = ({ children, className }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
);
const CardTitle = ({ children, className }) => (
  <h3 className={`text-sm font-medium text-gray-400 ${className}`}>
    {children}
  </h3>
);
const CardContent = ({ children, className }) => (
  <div className={`text-3xl font-bold text-white ${className}`}>{children}</div>
);
const Button = ({ children, className, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);
const Select = ({ children, ...props }) => (
  <select
    className={`h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className}`}
    {...props}
  >
    {children}
  </select>
);
const Table = ({ children, className }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>
      {children}
    </table>
  </div>
);
const TableHeader = ({ children, className }) => (
  <thead className={`[&_tr]:border-b [&_tr]:border-gray-700 ${className}`}>
    {children}
  </thead>
);
const TableRow = ({ children, className }) => (
  <tr
    className={`border-b border-gray-700 transition-colors hover:bg-gray-800/50 ${className}`}
  >
    {children}
  </tr>
);
const TableHead = ({ children, className }) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-gray-400 ${className}`}
  >
    {children}
  </th>
);
const TableBody = ({ children, className }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
    {children}
  </tbody>
);
const TableCell = ({ children, className }) => (
  <td className={`p-4 align-middle ${className}`}>{children}</td>
);
const Alert = ({ children, className }) => (
  <div
    className={`relative w-full rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-red-400 ${className}`}
  >
    {children}
  </div>
);
const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-md bg-gray-700 ${className}`} />
);

// --- SUB-COMPONENTS (Defined outside the main App component to prevent re-creation on every render) ---

const Header = ({ view, setView }) => (
  <header className="bg-gray-900 border-b border-gray-700 p-4 flex justify-center items-center relative">
    <h1 className="text-2xl font-bold text-white">
      India's Real-time Groundwater Dashboard
    </h1>
    <div className="absolute right-4">
      {view === "dashboard" ? (
        <Button onClick={() => setView("liveMap")} title="Go to Live Map">
          <Map className="mr-2 h-4 w-4" /> Live Map
        </Button>
      ) : (
        <Button onClick={() => setView("dashboard")} title="Back to Dashboard">
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  </header>
);

const ControlPanel = ({
  selectedState,
  setSelectedState,
  selectedDistrict,
  setSelectedDistrict,
  dateRange,
  setDateRange,
  handleAnalyze,
  loading,
  statesWithDistricts,
  availableDistricts,
}) => {
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [datePickerRef]);

  return (
    <div className="p-4 bg-gray-900/50 border-b border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end max-w-7xl mx-auto">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            State
          </label>
          <Select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            disabled={loading || statesWithDistricts.length === 0}
          >
            {statesWithDistricts.map((s) => (
              <option key={s.state} value={s.state}>
                {s.state}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            District
          </label>
          <Select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={loading || availableDistricts.length === 0}
          >
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative" ref={datePickerRef}>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            Date Range
          </label>
          <button
            onClick={() => setDatePickerOpen(!isDatePickerOpen)}
            className="flex items-center h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white text-left"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </button>
          {isDatePickerOpen && (
            <div className="absolute top-full mt-2 z-10 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </div>
          )}
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || statesWithDistricts.length === 0}
          className="w-full md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>
    </div>
  );
};

const SummaryCards = ({ loading, summaryData }) => {
  if (loading && !summaryData)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[126px]" />
        ))}
      </div>
    );
  if (!summaryData) return null;
  const netChange = summaryData.net_change,
    NetChangeIcon = netChange >= 0 ? TrendingUp : TrendingDown,
    netChangeColor = netChange >= 0 ? "text-green-400" : "text-red-400";
  const cards = [
    {
      title: "Latest Water Level",
      value: `${summaryData.latest_water_level?.level?.toFixed(2) || "N/A"} m`,
      icon: <Droplet className="text-blue-400" />,
    },
    {
      title: "Net Change",
      value: `${netChange?.toFixed(2) || "N/A"} m`,
      icon: <NetChangeIcon className={netChangeColor} />,
      color: netChangeColor,
    },
    {
      title: "Average Level",
      value: `${summaryData.average_level?.toFixed(2) || "N/A"} m`,
      icon: <Baseline className="text-yellow-400" />,
    },
    {
      title: "Maximum Level",
      value: `${summaryData.max_level?.toFixed(2) || "N/A"} m`,
      icon: <ArrowUp className="text-red-400" />,
    },
    {
      title: "Minimum Level",
      value: `${summaryData.min_level?.toFixed(2) || "N/A"} m`,
      icon: <ArrowDown className="text-green-400" />,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader>
            <CardTitle>{c.title}</CardTitle>
            {c.icon}
          </CardHeader>
          <CardContent className={c.color}>{c.value}</CardContent>
        </Card>
      ))}
    </div>
  );
};

const TrendChart = ({ loading, trendData }) => {
  if (loading && !trendData) return <Skeleton className="h-[400px] w-full" />;
  if (!trendData || trendData.length === 0) return null;
  return (
    <Card className="h-[400px] w-full p-4">
      <CardTitle>Water Level Trend</CardTitle>
      <ResponsiveContainer>
        <AreaChart
          data={trendData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
          <YAxis
            stroke="#A0AEC0"
            tick={{ fontSize: 12 }}
            label={{
              value: "Level (m)",
              angle: -90,
              position: "insideLeft",
              fill: "#A0AEC0",
              dy: 40,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A202C",
              border: "1px solid #4A5568",
            }}
            labelStyle={{ color: "#E2E8F0" }}
          />
          <Area
            type="monotone"
            dataKey="level"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#cT)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

const StationBarChart = ({ loading, rawData }) => {
  if (loading && !rawData) return <Skeleton className="h-[400px] w-full" />;
  if (!rawData || rawData.length === 0) return null;
  const avgData = useMemo(() => {
    const stationAverages = rawData.reduce((acc, curr) => {
      if (curr.dataValue === null) return acc;
      acc[curr.stationName] = acc[curr.stationName] || { sum: 0, count: 0 };
      acc[curr.stationName].sum += curr.dataValue;
      acc[curr.stationName].count++;
      return acc;
    }, {});
    return Object.entries(stationAverages).map(([name, { sum, count }]) => ({
      name,
      avgLevel: parseFloat((sum / count).toFixed(2)),
    }));
  }, [rawData]);
  return (
    <Card className="h-[400px] w-full p-4">
      <CardHeader>
        <CardTitle>Average Water Level by Station</CardTitle>
        <BarChart2 className="text-indigo-400" />
      </CardHeader>
      <ResponsiveContainer>
        <BarChart
          data={avgData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis type="number" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#A0AEC0"
            tick={{ fontSize: 10 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A202C",
              border: "1px solid #4A5568",
            }}
            labelStyle={{ color: "#E2E8F0" }}
          />
          <Legend />
          <Bar dataKey="avgLevel" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

const MapView = ({
  isLive,
  rawData,
  summaryData,
  mapCenter,
  mapZoom,
  loading,
}) => {
  if (loading && !rawData)
    return (
      <Skeleton className={isLive ? "h-full w-full" : "h-[400px] w-full"} />
    );
  if (!rawData || !summaryData) return null;

  const { min_level, max_level } = summaryData;

  const mapElement = (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="..."
      />
      {rawData
        .filter(
          (d) =>
            typeof d.latitude === "number" && typeof d.longitude === "number",
        )
        .map((d) => {
          const level =
            d.dataValue !== undefined ? d.dataValue : d.latest_level;
          const name = d.stationName || d.station_name;
          const code = d.stationCode || d.station_code;
          if (level === null || level === undefined) return null;
          const color = getMarkerColor(level, min_level, max_level);
          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color:${color};" class='w-4 h-4 rounded-full border-2 border-white shadow-lg'></div>`,
            iconSize: [16, 16],
          });
          return (
            <Marker key={code} position={[d.latitude, d.longitude]} icon={icon}>
              <Popup>
                <div className="text-black">
                  <h4 className="font-bold">{name}</h4>
                  <p>Level: {level.toFixed(2)} m</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );

  if (isLive) return mapElement;
  return (
    <Card className="h-[400px] w-full p-0 overflow-hidden">{mapElement}</Card>
  );
};

const DataTable = ({ loading, rawData }) => {
  if (loading && !rawData) return <Skeleton className="h-[300px] w-full" />;
  if (!rawData || rawData.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Data Points</CardTitle>
      </CardHeader>
      <div className="max-h-[300px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-800">
            <TableRow>
              <TableHead>Station Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Water Level (m)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rawData.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.stationName}</TableCell>
                <TableCell>
                  {format(new Date(row.dataTime), "dd-MM-yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  {row.dataValue.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

const LiveMapPage = ({
  liveRawData,
  liveSummaryData,
  setLiveRawData,
  setLiveSummaryData,
  liveError,
  setLiveError,
}) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const fetchAllStations = async () => {
      setLiveError(null);
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/all-stations-live/",
        );
        if (!response.ok) throw new Error("Failed to fetch all stations data");
        const data = await response.json();
        setLiveRawData(data);
        const levels = data
          .map((d) => d.latest_level)
          .filter((l) => l !== null);
        if (levels.length > 0) {
          setLiveSummaryData({
            min_level: Math.min(...levels),
            max_level: Math.max(...levels),
          });
        } else {
          setLiveSummaryData(null);
        }
      } catch (err) {
        setLiveError(err.message);
      } finally {
        if (isInitialLoading) setIsInitialLoading(false);
      }
    };

    fetchAllStations();
    const intervalId = setInterval(fetchAllStations, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="h-[calc(100vh-65px)] w-full">
      {liveError && (
        <Alert className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
          {liveError}
        </Alert>
      )}
      <MapView
        isLive={true}
        rawData={liveRawData}
        summaryData={liveSummaryData}
        mapCenter={[22.5937, 78.9629]}
        mapZoom={4}
        loading={isInitialLoading}
      />
    </div>
  );
};

const DashboardPage = ({
  loading,
  error,
  rawData,
  summaryData,
  trendData,
  mapCenter,
  mapZoom,
}) => (
  <main className="p-4 md:p-8 max-w-7xl mx-auto">
    {error && <Alert className="mb-4">{error}</Alert>}
    {!summaryData && !loading && !error && (
      <div className="text-center py-16">
        <MapPin className="mx-auto h-12 w-12 text-gray-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-300">
          Begin Analysis
        </h2>
        <p className="mt-1 text-gray-500">Please select a location to begin.</p>
      </div>
    )}
    <div className="space-y-8">
      <SummaryCards loading={loading} summaryData={summaryData} />
      {(loading || (trendData && trendData.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TrendChart loading={loading} trendData={trendData} />
          </div>
          <div>
            <MapView
              rawData={rawData}
              summaryData={summaryData}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              loading={loading}
            />
          </div>
        </div>
      )}
      {(loading || (rawData && rawData.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StationBarChart loading={loading} rawData={rawData} />
          <DataTable loading={loading} rawData={rawData} />
        </div>
      )}
    </div>
  </main>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState("dashboard");
  const [statesWithDistricts, setStatesWithDistricts] = useState([]);

  // State for Dashboard
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [rawData, setRawData] = useState(null);

  // State for Live Map
  const [liveRawData, setLiveRawData] = useState(null);
  const [liveSummaryData, setLiveSummaryData] = useState(null);
  const [liveError, setLiveError] = useState(null);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    to: new Date(),
  });
  const [mapCenter, setMapCenter] = useState([22.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(4);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(LOCATIONS_API_URL);
        if (!response.ok) throw new Error("Failed to load location data");
        const data = await response.json();
        setStatesWithDistricts(data.states);
        if (data.states.length > 0) {
          setSelectedState(data.states[0].state);
          setSelectedDistrict(data.states[0].districts[0]);
        }
      } catch (err) {
        setDashboardError(`Could not load location data: ${err.message}`);
      }
    };
    fetchLocations();
  }, []);

  const availableDistricts = useMemo(
    () =>
      statesWithDistricts.find((s) => s.state === selectedState)?.districts ||
      [],
    [selectedState, statesWithDistricts],
  );

  useEffect(() => {
    if (
      availableDistricts.length > 0 &&
      !availableDistricts.includes(selectedDistrict)
    ) {
      setSelectedDistrict(availableDistricts[0]);
    }
  }, [selectedState, availableDistricts, selectedDistrict]);

  const handleAnalyze = async () => {
    if (!selectedState || !selectedDistrict) {
      setDashboardError("Please select a state and district.");
      return;
    }
    setDashboardLoading(true);
    setDashboardError(null);
    setSummaryData(null);
    setTrendData(null);
    setRawData(null);
    const API_BASE_URL = "http://127.0.0.1:8000/api";
    const endpoints = [
      "groundwater-summary/",
      "water-level-trend/",
      "groundwater-level/",
    ];
    const requestBody = {
      stateName: selectedState.toUpperCase(),
      districtName: selectedDistrict.toUpperCase(),
      startdate: format(dateRange.from, "yyyy-MM-dd"),
      enddate: format(dateRange.to, "yyyy-MM-dd"),
    };

    try {
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API_BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }),
        ),
      );
      const failedResponse = responses.find((res) => !res.ok);
      if (failedResponse)
        throw new Error(
          `API request failed with status ${failedResponse.status}`,
        );
      const [summary, trend, raw] = await Promise.all(
        responses.map((res) => res.json()),
      );
      if (!raw.data || raw.data.length === 0) {
        setDashboardError(
          "No groundwater data found for the selected criteria.",
        );
        setRawData([]);
        setSummaryData(null);
        setTrendData(null);
        return;
      }
      setSummaryData(summary);
      setTrendData(trend.trend_data);
      setRawData(raw.data);
      const firstValidCoord = raw.data.find((d) => d.latitude && d.longitude);
      if (firstValidCoord) {
        setMapCenter([firstValidCoord.latitude, firstValidCoord.longitude]);
        setMapZoom(9);
      }
    } catch (err) {
      setDashboardError(`Failed to fetch data. Details: ${err.message}`);
    } finally {
      setDashboardLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header view={view} setView={setView} />
      {view === "dashboard" && (
        <ControlPanel
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          dateRange={dateRange}
          setDateRange={setDateRange}
          handleAnalyze={handleAnalyze}
          loading={dashboardLoading}
          statesWithDistricts={statesWithDistricts}
          availableDistricts={availableDistricts}
        />
      )}
      {view === "dashboard" ? (
        <DashboardPage
          loading={dashboardLoading}
          error={dashboardError}
          rawData={rawData}
          summaryData={summaryData}
          trendData={trendData}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
        />
      ) : (
        <LiveMapPage
          liveRawData={liveRawData}
          liveSummaryData={liveSummaryData}
          setLiveRawData={setLiveRawData}
          setLiveSummaryData={setLiveSummaryData}
          liveError={liveError}
          setLiveError={setLiveError}
        />
      )}
    </div>
  );
}
