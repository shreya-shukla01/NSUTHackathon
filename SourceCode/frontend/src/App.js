import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import DigitalTwinPage from "./pages/DigitalTwinPage";
import Layout from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="digital-twin" element={<DigitalTwinPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;