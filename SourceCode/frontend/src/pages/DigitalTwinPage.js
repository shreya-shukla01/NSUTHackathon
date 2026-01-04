import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Maximize2,
  Map as MapIcon,
  Video,
  AlertTriangle,
  TrendingUp,
  Activity,
  Target,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DigitalTwinPage = () => {
  const [tracks, setTracks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [droneActive, setDroneActive] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mockAnalytics = [
      { month: "Jan", incidents: 12, prevented: 10 },
      { month: "Feb", incidents: 8, prevented: 7 },
      { month: "Mar", incidents: 15, prevented: 13 },
      { month: "Apr", incidents: 6, prevented: 5 },
      { month: "May", incidents: 10, prevented: 9 },
      { month: "Jun", incidents: 4, prevented: 4 },
    ];
    setAnalyticsData(mockAnalytics);
  }, []);

  const fetchData = async () => {
    try {
      const [tracksRes, alertsRes] = await Promise.all([
        axios.get(`${API}/digital-twin/tracks`),
        axios.get(`${API}/alerts?limit=10`),
      ]);
      setTracks(tracksRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getTrackColor = (status) => {
    switch (status) {
      case "safe":
        return "#10b981";
      case "monitoring":
        return "#f59e0b";
      case "alert":
        return "#ef4444";
      default:
        return "#3b82f6";
    }
  };

  const getRiskColor = (risk) => {
    if (risk < 30) return "#10b981";
    if (risk < 70) return "#f59e0b";
    return "#ef4444";
  };

  const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  };

  return (
    <div className="max-w-[1920px] mx-auto px-6 py-8" data-testid="digital-twin-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold heading-font text-white mb-2" data-testid="digital-twin-title">
          Digital Twin - Track Visualization
        </h1>
        <p className="text-zinc-400">Interactive 3D map with real-time track status and predictive analytics</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-card border-white/10" data-testid="safe-tracks-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Safe Tracks</span>
                <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <Target className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mono-font text-white">
                {tracks.filter((t) => t.status === "safe").length}
              </p>
              <p className="text-xs text-emerald-500 mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-white/10" data-testid="monitoring-tracks-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Monitoring</span>
                <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  <Radio className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mono-font text-white">
                {tracks.filter((t) => t.status === "monitoring").length}
              </p>
              <p className="text-xs text-amber-500 mt-1">Under observation</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-white/10" data-testid="alert-tracks-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Alert Zones</span>
                <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mono-font text-white">
                {tracks.filter((t) => t.status === "alert").length}
              </p>
              <p className="text-xs text-red-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-white/10" data-testid="drone-status-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Drone Status</span>
                <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                  <Video className="w-4 h-4 text-cyan-500" />
                </div>
              </div>
              <p className="text-2xl font-bold mono-font text-white">
                {droneActive ? "Active" : "Standby"}
              </p>
              <Button
                size="sm"
                onClick={() => setDroneActive(!droneActive)}
                className="mt-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white h-7 text-xs"
                data-testid="toggle-drone-button"
              >
                {droneActive ? "Deactivate" : "Activate"} Drone
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-card border-white/10" data-testid="map-container-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl heading-font text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-amber-500" />
                  Live Track Map
                </CardTitle>
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" data-testid="fullscreen-button">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden border border-zinc-800" data-testid="leaflet-map">
                <MapContainer
                  center={[22.5726, 79.6]}
                  zoom={5}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {tracks.map((track) => (
                    <div key={track.id}>
                      <Polyline
                        positions={[track.start, track.end]}
                        color={getTrackColor(track.status)}
                        weight={4}
                        opacity={0.8}
                        eventHandlers={{
                          click: () => setSelectedTrack(track),
                        }}
                      />
                      <Circle
                        center={track.start}
                        radius={5000}
                        pathOptions={{
                          color: getRiskColor(track.risk_level),
                          fillColor: getRiskColor(track.risk_level),
                          fillOpacity: 0.2,
                        }}
                      />
                      <Marker position={track.start} icon={createCustomIcon(getTrackColor(track.status))}>
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-sm mb-1">{track.name}</h3>
                            <p className="text-xs">Status: {track.status}</p>
                            <p className="text-xs">Risk: {track.risk_level}%</p>
                          </div>
                        </Popup>
                      </Marker>
                    </div>
                  ))}

                  {droneActive && (
                    <Marker position={[23.5, 78.5]}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm">Drone Patrol</h3>
                          <p className="text-xs">Monitoring sector</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              <div className="mt-4 flex items-center gap-4 justify-center" data-testid="map-legend">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-zinc-400">Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-xs text-zinc-400">Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-xs text-zinc-400">Alert</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card border-white/10" data-testid="track-details-card">
            <CardHeader>
              <CardTitle className="text-lg heading-font text-white">Track Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTrack ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Track Name</p>
                    <p className="text-base font-medium text-white">{selectedTrack.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Status</p>
                    <Badge
                      className={
                        selectedTrack.status === "safe"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : selectedTrack.status === "monitoring"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {selectedTrack.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Risk Level</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${selectedTrack.risk_level}%`,
                            backgroundColor: getRiskColor(selectedTrack.risk_level),
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium mono-font text-white">{selectedTrack.risk_level}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Coordinates</p>
                    <p className="text-xs mono-font text-zinc-300">
                      Start: {selectedTrack.start[0].toFixed(4)}, {selectedTrack.start[1].toFixed(4)}
                    </p>
                    <p className="text-xs mono-font text-zinc-300">
                      End: {selectedTrack.end[0].toFixed(4)}, {selectedTrack.end[1].toFixed(4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <MapIcon className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm">Click on a track to view details</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10" data-testid="drone-feed-card">
            <CardHeader>
              <CardTitle className="text-lg heading-font text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-500" />
                Drone Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {droneActive ? (
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1715199281917-5e5b20d5c038?crop=entropy&cs=srgb&fm=jpg&q=60&w=400"
                    alt="Drone View"
                    className="w-full h-48 object-cover rounded-lg border border-zinc-800"
                    data-testid="drone-feed-image"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs mono-font">
                    ALT: 150m | SPD: 25km/h
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center">
                  <div className="text-center text-zinc-500">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Drone standby</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="glass-card border-white/10" data-testid="predictive-analytics-card">
          <CardHeader>
            <CardTitle className="text-xl heading-font text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Predictive Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: 12 }} />
                <YAxis stroke="#71717a" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fafafa",
                  }}
                />
                <Bar dataKey="incidents" fill="#ef4444" name="Incidents" />
                <Bar dataKey="prevented" fill="#10b981" name="Prevented" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm text-zinc-400">Incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-sm text-zinc-400">Prevented</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10" data-testid="recent-events-card">
          <CardHeader>
            <CardTitle className="text-xl heading-font text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {alerts.slice(0, 5).map((alert, index) => (
                <div key={alert.id} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800" data-testid={`event-${index}`}>
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      className={
                        alert.severity === "critical"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-zinc-500 mono-font">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-white mb-1">{alert.description}</p>
                  <p className="text-xs text-zinc-500">{alert.location}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DigitalTwinPage;