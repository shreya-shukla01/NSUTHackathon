import { Outlet, Link, useLocation } from "react-router-dom";
import { Shield, Home, LayoutDashboard, Cpu, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/digital-twin", label: "Digital Twin", icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <nav className="sticky top-0 z-50 glass-card border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-amber-600/20 p-2 rounded-lg border border-amber-500/30 group-hover:bg-amber-600/30 transition-colors">
                <Shield className="w-6 h-6 text-amber-500" data-testid="logo-shield-icon" />
              </div>
              <div>
                <h1 className="text-2xl font-bold heading-font text-white" data-testid="app-title">IntentGuard</h1>
                <p className="text-xs text-zinc-400 mono-font" data-testid="app-subtitle">AI Railway Safety Platform</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                        isActive
                          ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full" data-testid="system-status-indicator">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-500 font-medium">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <p>© 2025 IntentGuard. Real-time Railway Safety Monitoring.</p>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Emergency Response: +91-1234-567890</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;