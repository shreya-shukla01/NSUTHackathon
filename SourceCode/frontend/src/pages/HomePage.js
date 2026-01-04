import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Shield,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  Train,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/alerts?limit=5`),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-indicator">
        <div className="text-center">
          <Activity className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
          <p className="mt-4 text-zinc-400">Loading system data...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Incidents Prevented",
      value: stats?.incidents_prevented || 0,
      icon: Shield,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Active Alerts",
      value: stats?.active_alerts || 0,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Monitored Track (km)",
      value: stats?.monitored_track_km || 0,
      icon: MapPin,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Active Trains",
      value: stats?.active_trains || 0,
      icon: Train,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "System Uptime",
      value: `${stats?.system_uptime || 0}%`,
      icon: TrendingUp,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      title: "Avg Response Time",
      value: `${stats?.average_response_time?.toFixed(1) || 0}s`,
      icon: Clock,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
  ];

  return (
    <div className="max-w-[1920px] mx-auto px-6 py-8" data-testid="home-page">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold heading-font text-white mb-2" data-testid="page-title">
            Railway Safety Command Center
          </h1>
          <p className="text-lg text-zinc-400" data-testid="page-description">
            Real-time monitoring and AI-powered intent detection across India's railway network
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="glass-card border-white/10 hover:border-white/20 transition-all" data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-400 mb-2">{stat.title}</p>
                      <p className="text-4xl font-bold mono-font text-white" data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.bg} ${stat.border} border p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card border-white/10" data-testid="recent-alerts-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl heading-font text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Recent Alerts
                </CardTitle>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  {alerts.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                    <p>No active alerts. System operating normally.</p>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${
                        alert.severity === "critical"
                          ? "bg-red-500/5 border-red-500/20 animate-pulse-glow"
                          : "bg-zinc-900/50 border-zinc-800"
                      }`}
                      data-testid={`alert-item-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)} data-testid={`alert-severity-${index}`}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700" data-testid={`alert-intent-${index}`}>
                              {alert.intent}
                            </Badge>
                            <span className="text-xs text-zinc-500 mono-font">
                              Risk: {alert.risk_score}%
                            </span>
                          </div>
                          <p className="text-sm text-white mb-1 font-medium" data-testid={`alert-description-${index}`}>
                            {alert.description}
                          </p>
                          <p className="text-xs text-zinc-500">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {alert.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 mono-font">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-card border-white/10" data-testid="system-health-card">
            <CardHeader>
              <CardTitle className="text-xl heading-font text-white">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">AI Engine</span>
                    <span className="text-sm text-emerald-500 font-medium">Operational</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Sensor Network</span>
                    <span className="text-sm text-emerald-500 font-medium">98.7%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "98.7%" }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Response System</span>
                    <span className="text-sm text-emerald-500 font-medium">Active</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-medium text-white mb-3">Critical Stats</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Sabotage Blocked</span>
                      <span className="text-white font-medium mono-font">{stats?.sabotage_attempts_blocked || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Critical Alerts</span>
                      <span className="text-red-500 font-medium mono-font">{stats?.critical_alerts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Total Alerts</span>
                      <span className="text-white font-medium mono-font">{stats?.total_alerts || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;