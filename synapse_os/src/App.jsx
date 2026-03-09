import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Trends from "./pages/Trends";
import Content from "./pages/Content";
import Calendar from "./pages/Calendar";
import Approvals from "./pages/Approvals";
import AITools from "./pages/AITools";
import Sources from "./pages/Sources";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Competitors from "./pages/Competitors";

import HeyGenCreator from "./pages/HeyGenCreator";
import { ThemeProvider } from "./context/ThemeContext"; // Assuming this exists or similar globally
import { PlatformProvider } from "./context/PlatformContext";

function App() {
  return (
    <PlatformProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="trends" element={<Trends />} />
            <Route path="content" element={<Content />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="sources" element={<Sources />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="competitors" element={<Competitors />} />

            <Route path="heygen-creator" element={<HeyGenCreator />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </PlatformProvider>
  );
}

export default App;
