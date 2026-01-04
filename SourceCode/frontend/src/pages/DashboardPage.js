import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Activity,
  Radio,
  Thermometer,
  Volume2,
  Eye,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = () => {
  const [sensorData, setSensorData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trains, setTrains] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [sensorRes, alertsRes, trainsRes] = await Promise.all([
        axios.get(`${API}/sensor-data/latest`),
        axios.get(`${API}/alerts?status=active&limit=10`),
        axios.get(`${API}/trains`),
      ]);
      
      setSensorData(sensorRes.data);
      setAlerts(alertsRes.data);
      setTrains(trainsRes.data);
      
      setHistoricalData(prev => {
        const newData = [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            vibration: sensorRes.data.vibration.value,
            sound: sensorRes.data.sound.value,
            temp: sensorRes.data.temperature.value,
          },
        ].slice(-20);
        return newData;
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const analyzeIntent = async () => {
    if (!sensorData) return;
    
    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/analyze-intent`, {
        vibration: sensorData.vibration.value,
        sound_level: sensorData.sound.value,
        temperature: sensorData.temperature.value,
        visual_motion: sensorData.visual.motion_detected,
      });
      
      const result = response.data;
      
      if (result.risk_score > 70) {
        toast.error(`High Risk Detected: ${result.intent}`, {
          description: result.recommendation,
          duration: 5000,
        });
      } else if (result.risk_score > 40) {
        toast.warning(`Monitoring: ${result.intent}`, {
          description: result.recommendation,
        });
      } else {
        toast.success("System Normal", {
          description: result.recommendation,
        });
      }
    } catch (error) {
      console.error("Error analyzing intent:", error);
      toast.error("Analysis failed", {
        description: "Unable to analyze sensor data",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const haltTrain = async (trainId) => {
    try {
      await axios.post(`${API}/trains/halt/${trainId}`);
      toast.success(`Train ${trainId} Halted`, {
        description: "Emergency stop signal sent",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to halt train");
    }
  };

  const dispatchDrone = async (location, alertId) => {
    try {
      const response = await axios.post(`${API}/drone/dispatch`, { location, alert_id: alertId });
      toast.success(`Drone ${response.data.drone_id} Dispatched`, {
        description: `ETA: ${response.data.eta} minutes to ${location}`,
      });
    } catch (error) {
      toast.error("Drone dispatch failed");
    }
  };

  if (!sensorData) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="dashboard-loading">
        <Activity className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto px-6 py-8" data-testid="dashboard-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold heading-font text-white mb-2" data-testid="dashboard-title">
          Real-Time Monitoring Dashboard
        </h1>
        <p className="text-zinc-400">Live sensor data and intent analysis</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className={`glass-card border-white/10 ${sensorData.vibration.status === 'warning' ? 'border-amber-500/50' : ''}`} data-testid="vibration-sensor-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                    <Radio className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-sm text-zinc-400">Vibration</span>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  {sensorData.vibration.status}
                </Badge>
              </div>
              <p className="text-3xl font-bold mono-font text-white" data-testid="vibration-value">
                {sensorData.vibration.value}
                <span className="text-lg text-zinc-500 ml-1">{sensorData.vibration.unit}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2">Normal: 2-5g</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className={`glass-card border-white/10 ${sensorData.sound.status === 'alert' ? 'border-red-500/50 animate-pulse-glow' : ''}`} data-testid="sound-sensor-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                    <Volume2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-sm text-zinc-400">Sound Level</span>
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  {sensorData.sound.status}
                </Badge>
              </div>
              <p className="text-3xl font-bold mono-font text-white" data-testid="sound-value">
                {sensorData.sound.value}
                <span className="text-lg text-zinc-500 ml-1">{sensorData.sound.unit}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2">Normal: 40-70dB</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-white/10" data-testid="temperature-sensor-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-sm text-zinc-400">Temperature</span>
                </div>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  {sensorData.temperature.status}
                </Badge>
              </div>
              <p className="text-3xl font-bold mono-font text-white" data-testid="temperature-value">
                {sensorData.temperature.value}
                <span className="text-lg text-zinc-500 ml-1">{sensorData.temperature.unit}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2">Normal: 20-35°C</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-white/10" data-testid="visual-sensor-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                    <Eye className="w-5 h-5 text-cyan-500" />
                  </div>
                  <span className="text-sm text-zinc-400">Visual</span>
                </div>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                  {sensorData.visual.status}
                </Badge>
              </div>
              <p className="text-2xl font-bold mono-font text-white" data-testid="visual-status">
                {sensorData.visual.motion_detected ? "Motion Detected" : "No Motion"}
              </p>
              <p className="text-xs text-zinc-500 mt-2">CCTV Active</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="glass-card border-white/10" data-testid="sensor-trends-card">
            <CardHeader>
              <CardTitle className="text-xl heading-font text-white">Sensor Trends (Last 60s)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="vibGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="soundGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" style={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" style={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      color: "#fafafa",
                    }}
                  />
                  <Area type="monotone" dataKey="vibration" stroke="#3b82f6" fill="url(#vibGradient)" name="Vibration (g)" />
                  <Area type="monotone" dataKey="sound" stroke="#a855f7" fill="url(#soundGradient)" name="Sound (dB)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-zinc-400">Vibration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-sm text-zinc-400">Sound</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="glass-card border-white/10 mb-4" data-testid="intent-analysis-card">
            <CardHeader>
              <CardTitle className="text-lg heading-font text-white">AI Intent Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={analyzeIntent}
                disabled={analyzing}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                data-testid="analyze-intent-button"
              >
                {analyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Analyze Current Data
                  </>
                )}
              </Button>
              <p className="text-xs text-zinc-500 mt-3 text-center">
                Uses GPT-5.2 to classify intent and assess risk
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10" data-testid="active-trains-card">
            <CardHeader>
              <CardTitle className="text-lg heading-font text-white">Active Trains ({trains.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {trains.map((train) => (
                  <div key={train.id} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800" data-testid={`train-${train.train_id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white mono-font">{train.train_id}</span>
                      <Badge
                        variant="outline"
                        className={
                          train.status === "running"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }
                      >
                        {train.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{train.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Speed: {train.speed} km/h</span>
                      {train.status === "running" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => haltTrain(train.train_id)}
                          className="h-6 px-2 text-xs"
                          data-testid={`halt-train-${train.train_id}-button`}
                        >
                          <StopCircle className="w-3 h-3 mr-1" />
                          Halt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-card border-white/10" data-testid="active-alerts-list">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl heading-font text-white">Active Alerts</CardTitle>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              {alerts.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <Alert
                  key={alert.id}
                  className={`${
                    alert.severity === "critical"
                      ? "bg-red-500/5 border-red-500/20 animate-pulse-glow"
                      : "bg-zinc-900/50 border-zinc-800"
                  }`}
                  data-testid={`alert-${index}`}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={
                              alert.severity === "critical"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                            {alert.intent}
                          </Badge>
                          <span className="text-xs text-zinc-500 mono-font">Risk: {alert.risk_score}%</span>
                        </div>
                        <p className="text-sm text-white mb-2">{alert.description}</p>
                        <p className="text-xs text-zinc-500">{alert.location}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => dispatchDrone(alert.location, alert.id)}
                          className="bg-amber-600 hover:bg-amber-500 text-white h-7 px-2 text-xs"
                          data-testid={`dispatch-drone-${index}-button`}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Drone
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;